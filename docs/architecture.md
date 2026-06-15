# ecxc.ski Architecture

System architecture for the East Community Cross Country site. Design decisions (color,
type, the kit primitives) live in `docs/design-language.md`; current build state and
the pass log live in `docs/STATUS.md`. This file covers the stack, routing, content
pipeline, and deployment.

---

## Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | SvelteKit + TypeScript (Svelte 5 runes) | First-class Cloudflare support |
| Styling | Tailwind CSS v4 + DaisyUI v5 | CSS-first config, no `tailwind.config.js` |
| Markdown | cairn-cms `createRenderer` (remark + rehype) | Inline container directives → kit HTML, engine sanitize floor (see below) |
| Search | Pagefind | Post-build static index, zero runtime JS cost |
| Adapter | `@sveltejs/adapter-cloudflare` v7 | Workers output, form actions work natively |
| Contact form | SvelteKit remote function (`form()`) + Cloudflare Email Workers (`send_email`) | Type-safe boundary, declarative validation; experimental (Pass 9) |
| Spam protection | Cloudflare Turnstile | Server-verified on form submit |
| Fonts | Alegreya Sans + iA Writer Mono S (woff2, self-hosted) | Set in `src/app.css` `@font-face` + `@theme` |

There is **no mdsvex**: content `.md` is read as raw strings and rendered by the
custom pipeline, not compiled as Svelte components. There is **no calendar**; that
feature (the `/calendar` route, `events` content, `@schedule-x/*`) was removed.
Scheduling lives in CrewLAB and the site has a `/crewlab` content page instead.

---

## Routing

| Route | Source | Notes |
|---|---|---|
| `/` | `+page.svelte` | Featured (most recent) post in full, then a recent-posts list |
| `/:year/:month/:slug` | `[...path]/` | Post detail, resolved through the content layer |
| `/<slug>` | `[...path]/` | Static content page (about, training, volunteers, crewlab, resources) |
| `/contact` | `contact/` | Contact form (the only non-prerendered route) |
| `/waiver` | `waiver/` | Static Svelte page |
| `/tags`, `/tags/:tag` | `tags/`, `tags/[tag]/` | Tag index + per-tag listing |
| `/feed.xml`, `/feed.json` | `feed.xml/`, `feed.json/` | RSS 2.0 + JSON Feed 1.1, built by the engine |
| `/sitemap.xml`, `/robots.txt` | `sitemap.xml/`, `robots.txt/` | Engine-built sitemap and robots |

Nav links live in `src/lib/components/Nav.svelte`.

**Post and page URLs** come from the cairn-cms content layer, not a route folder. One
catch-all `[...path]` route resolves an incoming path to a post or page through the engine's
`createPublicRoutes`, which reads the `site` index built in `src/lib/content.ts`. The engine
computes each entry's permalink from the YAML URL policy in `src/lib/site.config.yaml`: posts
carry a `month` date prefix, so `2026-05-welcome.md` (frontmatter `date: 2026-05-14`) serves
at `/2026/05/welcome`; pages serve at `/<slug>`. Canonical URLs carry no trailing slash. The
`url-inventory` test pins this set against the old filename-derived URLs, so neither the Pass 1b
cutover nor the 0.21 migration moved a live URL. SvelteKit ranks the explicit routes above the
catch-all, so `/tags`, `/contact`, the feeds, and the rest keep their own routes; the catch-all
serves only posts and pages.

**Host chrome lives in a `(site)` route group.** The public routes (`+page`, `[...path]`, `archives`,
`contact`, `tags`, `waiver`, and the `+page.server`/`+layout.server` that go with them) sit under
`src/routes/(site)/`. That group's `+layout.svelte` holds the public chrome: the `app.css` import, the
Nav, the SearchModal, the width-constrained `<main>`, the footer, and the feed-discovery `<svelte:head>`
links. The root `src/routes/+layout.svelte` is a bare `{@render children()}` passthrough. A group folder
changes no URL, so the public pages keep their paths, and `/admin` (outside the group) renders standalone
with no site nav or footer around it. cairn-cms 0.33.0 added a dev-only guard that logs a console error
if the root layout wraps the admin in host chrome; the bare root layout keeps it quiet. The `prerender =
true` default moved into the group with the public routes, so it scopes to public pages. `/admin` and
`/healthz` keep their own `prerender = false`, and the feed, sitemap, and robots endpoints keep their own
`prerender = true`.

---

## Content Pipeline

### Content layer: `src/lib/content.ts`

As of the cairn-cms 0.21 migration, the content layer is the engine's idiomatic surface, not
a hand-rolled set of helpers. It globs each concept's markdown with `import.meta.glob` (`?raw`,
`eager: true`), because Cloudflare Workers has no filesystem and all markdown ships as string
constants, then hands the raw globs to `createSiteIndexes(cairn, siteConfig, { posts, pages })`.
That returns `{ site, posts, pages }`: one typed index per concept plus a `site` resolver that
maps a permalink to its entry across both concepts. The module exports `site`, `ORIGIN`, and
`SITE_DESCRIPTION`. The same `cairn`, `siteConfig`, `postsRaw`, and `pagesRaw` bindings also feed
the manifest backstop (see Content graph below). `createSiteIndexes` hard-fails on a missing glob
key for a declared concept, so every concept the adapter declares must be globbed here.

The catch-all reads `site` through `createPublicRoutes`; the home, tags-index, and tag routes read
`site.concept('posts')` (`.all()`, `.allTags()`, `.byTag()`, `.byId()`); the feeds map the same
concept index and thread `buildLinkResolver(site)`; the sitemap and robots use the engine response
helpers. The home and archive lists show the authored `description`, which the engine `ContentSummary`
does not carry (it carries a derived `excerpt`), so a small site-local mapper re-reads
`posts.byId(id).frontmatter.description`; the schema makes that a required `string`, so the read needs
no cast. `/tags/[tag]/` stays explicit and fully prerendered: its `entries()` enumerates every tag,
and a tag with no posts 404s.

### Catch-all presentation: `src/routes/[...path]/`

`+page.server.ts` builds `createPublicRoutes({ site, render, origin, siteName, description, feeds })`
once at module level and exports `entries` and `load` from it. `entryLoad({ url })` resolves the path
through the `site` index, renders the body (resolving any `cairn:` link), and builds the SEO model
internally, so the old inline `buildSeoMeta` is gone. `EntryData` carries no concept, so the load
re-derives it as `data.entry.date ? 'posts' : 'pages'` (posts are the only dated concept). `+page.svelte`
renders `<CairnHead seo={data.seo} />` for the head and branches on the derived concept: the post branch
reproduces the post markup, the page branch the page markup with `data-page={data.slug}`. The post and
page markup and the page route's scoped `<style>` block carried over verbatim, so rendering and the
animation cascade did not change.

### Frontmatter validation: the schema contract

As of 0.21, validation lives in the adapter's schema, not in a hand-written validator. Each concept in
`src/lib/cairn.config.ts` carries one `schema: defineFields([...])` (wrapped by `defineAdapter`), which
is the single source of truth for the editor form, the validator, and the inferred frontmatter type. The
posts schema declares `title` (required), `date` (required), `description` (required), `tags` (with the
controlled `POST_TAGS` as `options`), and `draft` (boolean); pages declare `title` (required). The old
`validatePostFrontmatter`/`validatePageFrontmatter` functions are deleted.

This validate-once contract is thinner than the old validators: it enforces required-and-coerce on the
declared fields and omits empty optional values, but it does not check a real calendar date, a date
format, the closed `tags` vocabulary as a hard constraint (the `options` drive the editor pick list, not
a commit-time rejection), or an at-least-one-tag minimum. Those four dropped rules are recorded in the DX
findings (`docs/cairn-dx-findings.md`) and the cairn-cms backlog; restoring them is an engine change
(declarative field options), not a site-local re-add. The validator runs on the admin **save** path. The
delivery read path parses frontmatter but does not re-validate, so a hand-committed post with a missing
declared field is not a build-time failure (BACKLOG #16); the `url-inventory` test still catches a date
that disagrees with its filename.

### Content graph: the manifest and `cairn:` links

A committed manifest at `src/content/.cairn/index.json` is a build-verified projection of the corpus: one
entry per post and page with its id, concept, title, permalink, draft flag, and outbound `cairn:` links.
The `cairnManifest()` Vite plugin (`@glw907/cairn-cms/vite`, wired in `vite.config.ts`) owns the build-time
check. It evaluates the manifest through a nested Vite SSR load in `buildStart`, so a build fails if the
committed manifest drifted from the corpus (a raw-git content edit cannot ship a stale graph). The check
runs outside the prerender lifecycle, so the drift is fatal regardless of the `handleHttpError` policy. The
shipped `cairn-manifest` bin (run as `npm run cairn:manifest`) regenerates the manifest, reading its options
off the same plugin instance. This replaced the old hand-rolled `scripts/build-manifest.mjs` plus in-graph
`verifyManifest` call at cairn-cms 0.33.0.

Internal links between content use the `cairn:<concept>/<id>` token rather than a hardcoded path, so a link
survives a future slug change. The welcome post links to the CrewLAB page as `cairn:pages/crewlab`, which
the render resolver rewrites to the live `/crewlab` permalink on the page and to the absolute URL in the
feeds. The token resolves content concepts only (posts and pages), not `+page.svelte` routes, so the
post's `/waiver` link stays an absolute path (the waiver is a hand-built route, not a content page). A
dangling token throws `cairn link target not found` at prerender. The build still carries
`prerender.handleHttpError: 'warn'` in `svelte.config.js`, so a dangling token downgrades to a warning at
prerender (the broken link never ships, since the page 500s, but the build exits 0). The manifest-drift
check is now fatal; the dangling-token check stays a warning (DX finding 16, BACKLOG).

The admin edit route (`src/routes/admin/(app)/[concept]/[id]/+page.server.ts`) registers `save`, `delete`,
and `rename` actions off the engine runtime, and `editLoad` ships the editor link picker's targets from the
manifest.

### Directive render pipeline: `src/lib/markdown/`

As of 0.21, the render pipeline is the engine's `createRenderer`, not a site-owned unified
processor. `render.ts` calls `createRenderer(ecxcRegistry, { stagger: true, sanitizeSchema:
ecSanitizeSchema })` once and re-exports its `renderMarkdown`; `markdownToHtml(md, opts)` in
`utils.ts` is a thin delegate that threads the optional `resolve` (the `cairn:` link resolver)
through. The directive components live in
`components.ts` as `ComponentDef`s with the `build(ctx)` slot model: each reads `ctx.slot('title')`,
`ctx.slot('body')`, and declared `ctx.attributes` (an `icon` attribute of `type: 'icon'`, a `role`
select), and arranges kit markup with `hastscript`. A local `head(ctx)` helper rebuilds the
icon-plus-heading row the removed `splitHead` used to return. A caution alert with no explicit icon
defaults to the `warning` glyph inside `buildAlert`. The icon path data is the adapter's
`icons: ICON_PATHS` (`icons.ts`), an `IconSet`.

**Picker metadata (cairn 0.56.2).** Each `ComponentDef` also declares the optional picker fields the
0.56.2 component system reads: an `icon` glyph and a `group` for the insert catalog, a structured
`preview` sample that opts the guided form into the two-pane live preview (the configured component
rendered through this site's own pipeline), and `hidden` on the four nested-only components
(`panel/program/day/zone`), which keeps them out of the top-level catalog while leaving them
round-trip-editable. The `href` attribute carries a `pattern`, so a mistyped program link is caught
in the form.

**Sanitize: one engine floor, extended.** The engine applies `rehype-sanitize` by default inside
`createRenderer`, after `rehype-raw` and before the component dispatch, so the built directive markup
(`<section>`, `<svg>`, `<path>`, `role="alert"`, `data-rise`) is injected by trusted build code after
the floor and never needs an allowlist entry. The site's old post-render second sanitize pass was pure
duplication and is gone; `sanitize.ts` now exports `ecSanitizeSchema(defaults)`, a 13-line extend-only
hook that adds only what authored raw HTML uses (an `aria-label` on `*`, for the page-toc `<nav>`). The
directive vocabulary is documented in `docs/design-language.md`; the pipeline is pinned by tests in
`src/tests/markdown/`, including the characterization snapshots that render each content file.

---

## Kit as CSS contract (markdown pages + Svelte component pages)

The design-language kit is two layers, and only one is markdown-coupled: **style**
lives once in `src/app.css` (`@theme` tokens + global classes like `.page-title`,
`.post-body`, `.post-tags`, `.back-link`), and **markup** is built by whichever tool
fits the surface. Markdown prose gets kit markup from the engine's `createRenderer`,
which dispatches the directive `ComponentDef`s in `components.ts` (`{@html}`,
prerendered); the interactive/data-driven shells (contact form, tag cloud,
archive list, post chrome) are Svelte components. The two markup builders are not unified: Svelte can't mount inside `{@html}`, and
recompiling markdown→Svelte would add client JS for no gain. **The class-name contract
is the shared interface**; Svelte pages consume the global CSS directly rather than
re-implementing primitives as `<Card>`/etc. components (that path was rejected, because
it would create two definitions of one primitive and invite drift).

**Shared entrance cascade.** The per-module rise delay is one function, `riseStyle(idx)`
in `src/lib/motion.ts` (`0.16 + idx*0.04s`, two decimals), imported by both the
directive component builders and every component page. Its keyframes (`page-rise`, `module-rise`) live
globally in `app.css`. Each page scopes its own `.X` / `.X-module` animation rules and
its own `prefers-reduced-motion` reset (no global animation-disabling rule, to avoid
reaching into unrelated components); the duplication of that small per-surface block is
intentional: only the scope selector differs. The catch-all `[...path]` page carries the
private copies of the keyframes it inherited verbatim from the old `[slug]` route (deferred
dedup, `BACKLOG.md`).

---

## Contact Form

`/contact` is the only non-prerendered route. As of Pass 9 the form is a **SvelteKit
remote function** (`form()`), not a `+page.server.ts` action. See the verdict below.

`src/lib/contact.remote.ts` exports `sendMessage = form(schema, handler)`. The Valibot
schema validates `name`/`email`/`message` (plus `cf-turnstile-response`, injected by the
widget); on a schema miss the handler never runs and `fields.allIssues()` carries the
messages back. The handler uses `getRequestEvent()` for `platform.env` +
`getClientAddress()`, then: validate Turnstile → build a message with `mimetext` → send
via the Email Workers `send_email` binding to `contact@ecnordic.ski`. Turnstile/mail
failures surface inline via `invalid(...)` (a form-level issue) rather than throwing to
`+error.svelte`. `verifyTurnstile` only runs when `platform.env.TURNSTILE_SECRET_KEY` is
present, so dev skips it gracefully. Secrets: `TURNSTILE_SECRET_KEY`, `CONTACT_EMAIL`.

`ContactForm.svelte` spreads `{...sendMessage}` and reads `fields.*.as(...)`, `pending`,
and `result`, with no hand-written `use:enhance` or `FormState` interface. `prerender = false`
lives in `src/routes/contact/+page.ts` and is **load-bearing**: a prerendered static page
405s on the no-JS POST fallback.

### Remote-functions verdict (Pass 9 spike): **DEFER (adopt later)**

The spike works end-to-end on adapter-cloudflare: build generates the
`/_app/remote/<hash>/sendMessage` endpoint, CSRF origin-checks it, schema validation +
inline issues + value repopulation work, and **both** the JS-enhanced path (single-flight
result) and the no-JS full-reload fallback succeed (verified locally via `wrangler dev`).
The ergonomics are a real win over the action: one source of truth for field
types/validation, declarative Valibot schema replacing hand-rolled checks, and built-in
progressive enhancement.

**Why DEFER, not ADOPT site-wide:** the feature requires `kit.experimental.remoteFunctions`
and is officially "subject to change without notice" (no stable date as of 2026-05). The
core team frames it as *additive*; `load`/form actions are not deprecated. Keep the
contact form on remote functions as the live proving ground (low blast radius, degrades
cleanly), but do **not** migrate other surfaces until the API stabilizes. Re-evaluate when
SvelteKit ships the feature stable (tracked: BACKLOG #13).

---

## Search

`npx pagefind --site .svelte-kit/cloudflare` runs post-build, generating a static index
under `.svelte-kit/cloudflare/pagefind/`. `SearchModal.svelte` wraps the Pagefind JS API.
The bundle does not exist at compile time, so it is imported dynamically and kept external
(listed in `vite.config.ts`); a local `PagefindUIModule` interface types the import without
`@ts-ignore`.

---

## Theme

Cookie-based (`theme` cookie). `hooks.server.ts` injects `data-theme` into the SSR HTML;
an inline script in `app.html` resolves cookie → localStorage → `prefers-color-scheme`
so there's no flash. The nav toggle writes both cookie and localStorage. DaisyUI is
configured with `ecxc --default` and `ecxc-dark --prefersdark` (renamed from `ecn`/`ecn-dark`
in Rename 4.5). See `docs/design-language.md`.

### Content drafting system (2026-06-09)

Site prose is produced through a generative system modeled on cairn's admin design system:
`docs/content-guide.md` carries load-bearing rules, container word budgets, and per-type recipes;
`docs/content-briefs/` holds one durable brief per page (facts, audience questions, next step,
container plan); `docs/coach-voice-corpus.md` is the exemplar library, with a First-party gold
section that harvests Geoff's edit diffs. Drafting is reply-stance (each section answers an
imagined reader's question; facts are reference, not a checklist) with a humanize audit pass
before landing; the archived spec's amendment records why fact-coverage drafting failed.
`content-review` reports the four hard gates plus findings; scores only on request. The
characterization snapshots pin page HTML, so any content edit regenerates them (`vitest run -u`).

### Brand mark (Rename 5, 2026-06-09)

The ECXC mark is a four-spot grid monogram, "EC" over "XC", drawn as four rectilinear SVG
paths on a 100x100 viewBox (46-unit cells, 8-unit gutters, 11-unit strokes, 12 on the X's
diagonals). One geometry, two presentations: `Nav.svelte` inlines the paths at 2.25rem
filled with `currentColor` so each theme supplies its own primary crimson, and
`static/favicon.svg` embeds a copy knocked out white on a crimson rounded square (hardcoded
`oklch()` mirroring the light theme's primary tokens, since a static asset cannot read CSS
variables). A glyph-sync test in `src/tests/brand-mark.test.ts` pins the duplication.
Spec: `docs/superpowers/archive/specs/2026-06-09-ecxc-brand-mark-design.md`. Safari ignores
SVG favicons; the PNG fallback is backlog #30.

---

## Deployment

Push to `main` → GitHub Actions (`.github/workflows`) → `npm run build` + `npx pagefind
--site .svelte-kit/cloudflare` + `npx wrangler deploy` → live in ~2 min.

`wrangler.toml` `main` and `[assets] directory` both point at `.svelte-kit/cloudflare/`
(adapter-cloudflare v7 output path); Pagefind indexes the prerendered HTML there.
GitHub Actions secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

The repo is `glw907/ecxc-ski` (renamed from `ecnordic-ski` in Rename 6, 2026-06-09; GitHub
redirects the old name). The cairn `backend.repo` in `src/lib/cairn.config.ts` names the same
repo, since admin saves commit through the GitHub App; the App installation survived the rename.

### Domain and email routing

The live domain is `ecxc.ski`, served by the `ecxc` Worker through a Cloudflare custom
domain (Rename 4, 2026-06-08). The old `ecnordic.ski` 301-redirects to `ecxc.ski` with the
path and query preserved.

The redirect is a Page Rule forwarding URL, not a dynamic Single Redirect. The deploy API
token can edit Workers, DNS, Page Rules, and Email Routing, but not the Rulesets API, so the
dynamic-redirect phase is out of reach. The Page Rule (`*ecnordic.ski/*` → `https://ecxc.ski/$2`)
needs a request that reaches the edge, so the apex keeps a proxied `AAAA 100::` placeholder.
A Worker custom domain outranks a Page Rule, so the old Worker and its `ecnordic.ski` custom
domain were removed first; the redirect runs on the placeholder record alone.

Magic-link mail signs from `noreply@ecxc.ski`, so Email Routing is enabled on the `ecxc.ski`
zone (the `send_email` binding requires the sender domain to have Email Routing active). The
old `ecnordic.ski` zone keeps its own Email Routing for the `contact@ecnordic.ski` contact-form
destination, which is unchanged.

### Build toolchain notes

- **The site declares a thin dependency surface.** cairn-cms owns the markdown pipeline and
  the magic-link auth store. `createRenderer` bundles remark, rehype, and unified, so the site
  declares none of them. Auth state lives in the `AUTH_DB` D1 in cairn's own `editor`,
  `magic_token`, and `session` tables, provisioned from the engine's shipped
  `migrations/0000_auth.sql`. The `AUTH_DB` binding points at `cairn-ecxc-auth` as of Rename 3
  (2026-06-08); the schema was re-applied to the fresh database and the `geoff@907.life` owner
  re-seeded. The prior `cairn-ecnordic-auth` store is decommissioned at the Rename 4 cutover
  once magic-link login is confirmed on `ecxc.ski`. The earlier better-auth and drizzle dependencies, the generated
  drizzle migration, and the `mint-session.mjs` smoke helper were removed in the 0.34 upgrade,
  once cairn owned auth end to end.
- **cairn owns admin CSRF, so `svelte.config.js` sets `csrf: { checkOrigin: false }`.** As of cairn 0.35
  the engine guard is the single CSRF authority for `/admin`. It validates a `__Host-cairn_csrf`
  double-submit token on every admin form POST, tolerates a missing `Origin` (so a privacy browser can
  sign in), and restores the strict `Origin` check for the site's own non-admin POSTs. The framework's
  global check has to be off for that, hence the config line. SvelteKit has deprecated `checkOrigin` in
  favour of `csrf.trustedOrigins`, which is an allowlist, not an off switch, so it is not a drop-in
  replacement; revisit when cairn's upgrade guide moves off `checkOrigin`.
- **cairn's structured log events flow to Workers Logs.** `wrangler.toml` sets
  `observability.enabled = true` (Pass 0.37, engine `^0.37.1`), so the engine's JSON diagnostic
  records (auth flow, commit pipeline, admin-guard refusals) index in the Cloudflare dashboard
  and stream in `wrangler tail`. Event vocabulary: cairn's `docs/reference/log-events.md`. A
  successful magic-link send shows `auth.link.requested` then `auth.token.minted` with no
  `auth.link.send_failed`; the vocabulary has no send-success event.
- **The admin mounts as one catch-all route (cairn `^0.50.0`, 2026-06-11).** The former
  eighteen-file `src/routes/admin/**` shim tree is gone. `src/lib/cairn.server.ts` composes the
  runtime once and exports `admin = createCairnAdmin(runtime)`; the `/admin/[...path]` route
  pair re-exports `admin.load`/`admin.actions` and mounts `CairnAdmin`. Engine releases that add
  admin actions or views no longer touch this repo. The `App.Locals.editor` declaration ships
  from `@glw907/cairn-cms/ambient` (one import in `app.d.ts`); the site keeps its own
  `Platform` block. Floors raised with the crossing: svelte `^5.56.3`, kit `^2.12`.
- **Node 24** is the build runtime (`.nvmrc`, `engines.node >=22`, CI). wrangler ≥4.93
  requires Node ≥22.
- **Vite 8 uses the Rolldown bundler**, which resolves absolute dynamic imports eagerly.
  Pagefind's UI bundle (`/pagefind/pagefind-ui.js`) is generated *after* the build, so it
  must stay in `build.rollupOptions.external` in `vite.config.ts` (with `cloudflare:email`)
  or the build fails with `UNRESOLVED_IMPORT`.
