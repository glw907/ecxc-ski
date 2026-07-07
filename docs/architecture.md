# ecxc.ski Architecture

System architecture for the East Community Cross Country site, rebuilt 2026-07-05/06 on the
`@glw907/cairn-cms` Waymark starter template. Design decisions (color, type, the directive kit)
live in `docs/design-language.md`; current build state and the pass log live in `docs/STATUS.md`.
This file covers the stack, the chassis/theme split, routing, and deployment.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | SvelteKit + TypeScript (Svelte 5 runes) |
| Styling | Tailwind CSS v4 + DaisyUI v5 |
| CMS | `@glw907/cairn-cms` (v2 adapter idiom: `defineAdapter`/`defineConcept`/`fieldset`) |
| Markdown | cairn-cms `createRenderer`, wired with a site-owned component registry |
| Search | Pagefind (post-build static index) |
| Adapter | `@sveltejs/adapter-cloudflare` v7 |
| Contact form | SvelteKit remote function (`form()`) + Cloudflare Email Workers |
| Spam protection | Cloudflare Turnstile |
| Fonts | Nunito (display, Fontsource) + self-hosted Alegreya Sans and iA Writer Mono S (woff2) |

---

## The chassis/theme split

The site's `src/` is split at the boundary cairn-cms's showcase draws: **a theme is everything
that isn't chassis.** `src/chassis/` holds genre-free plumbing carried near-verbatim from
`@glw907/cairn-cms`'s own showcase (`content.ts`, `feed.ts`, `cairn.server.ts`, `render.ts`'s icon
wiring, `theme-toggle.ts`, and the `tokens.css`/`prose.css`/`composition.css` token/prose
foundation); `src/theme/` is ecxc's own adapter config, chrome components, and identity CSS. A
theme file reaches chassis only through the `$chassis` alias (`.ts`/`.svelte`) or a relative
`@import` (`.css`); see `src/chassis/README.md` for the full boundary and every override seam
before touching either side.

`src/theme/cairn.config.ts` is the adapter: two concepts, `posts` (dated, `routing: 'feed'`, a
`fieldset` of title/date/description/tags/draft) and `pages` (undated, title + an optional
library-picked hero `image`), a `githubApp` backend committing to `glw907/ecxc-ski`, and the
render pipeline (`render.ts`'s `renderMarkdown` plus two after-render steps, `wrapScrollableTables`
and `wrapCtaPanels`). `src/theme/site.config.yaml` carries the site name, description, the tag
vocabulary, and the primary nav menu.

---

## Routing

| Route | Source | Notes |
|---|---|---|
| `/` | `(site)/[...path]/` | Home page, a content page like any other |
| `/<slug>` | `(site)/[...path]/` | Static content pages and post permalinks resolve through one catch-all |
| `/:year/:month/:slug` | `(site)/[...path]/` | Post detail, dated per `posts`' `datePrefix: 'month'` |
| `/archives` | `(site)/archives/` | Full post list with tag-filter chips and feed links |
| `/tags`, `/tags/:tag` | `(site)/tags/`, `(site)/tags/[tag]/` | Tag index + per-tag listing |
| `/contact` | `(site)/contact/` | Contact form (the only non-prerendered public route) |
| `/waiver` | `(site)/waiver/` | Hand-built legal page, not a content page |
| `/home`, `/resources` | redirects | 301 to `/` and `/crewlab`, kept for the pre-rebuild URL set |
| `/feed.xml`, `/feed.json` | `routes/feed.xml/`, `routes/feed.json/` | RSS 2.0 + JSON Feed 1.1 |
| `/sitemap.xml`, `/robots.txt` | `routes/sitemap.xml/`, `routes/robots.txt/` | Engine-built |
| `/media/[...path]` | `routes/media/` | R2-backed media delivery |
| `/admin` | `routes/admin/` | The cairn-cms admin, mounted as one catch-all |

Canonical URLs carry no trailing slash. Nav links live in `src/theme/site.config.yaml`'s
`menus.primary`, rendered by `SiteHeader.svelte`.

**Host chrome lives in a `(site)` route group.** The public routes sit under
`src/routes/(site)/`; its `+layout.svelte` holds the public chrome (nav, footer, the theme
toggle). The root `src/routes/+layout.svelte` is a bare passthrough, so `/admin` renders standalone
with no site chrome around it.

**Posts and pages resolve through one catch-all**, not a route per concept. `src/chassis/content.ts`
globs each concept's markdown with `import.meta.glob` (Workers has no filesystem, so content ships
as string constants) and builds a `site` index via `createSiteIndexes`. `(site)/[...path]/+page.server.ts`
calls `createPublicRoutes({ site, render, ... })` once at module level and exports `entries`/`load`
from it; SvelteKit ranks the explicit routes (`/archives`, `/tags`, `/contact`, the feeds) above the
catch-all, so those keep their own handling and the catch-all serves only posts and pages.

---

## Content and rendering

**Frontmatter validation** lives in the adapter's schema (`fieldset(...)` in `cairn.config.ts`), the
single source of truth for the editor form, the save-path validator, and the inferred frontmatter
type. The delivery read path parses frontmatter but does not re-validate it.

**The directive registry** (`src/theme/markdown/components.ts`) is ecxc's own component
vocabulary, described fully in `docs/design-language.md`. Four directives reuse Waymark's starter
shapes verbatim or near-verbatim (`alert`, `cta`, `faq`, `callout`); the rest (`passage`, `aside`,
`checklist`, and the training-specific `programs`/`program`, `week`/`day`, `spectrum`/`zone` set)
are declared by this site. `createRenderer(ecxcRegistry)` (`src/theme/render.ts`) is the one
renderer the public catch-all, the feeds, and the admin editor preview all call, so the preview
always matches the published page.

**Internal links** between content use a `cairn:<concept>/<id>` token, resolved to the live
permalink at render time; a dangling token surfaces as a build-time warning, not a shipped 500.

**A committed manifest** (`src/content/.cairn/index.json`) is a build-verified projection of the
corpus (id, concept, title, permalink, outbound links per entry); a Vite plugin checks it against
the corpus at build time and fails the build on drift.

---

## Contact form

`/contact` is the only non-prerendered public route. `src/theme/contact.remote.ts` exports
`sendMessage = form(schema, handler)`, a SvelteKit remote function (`svelte.config.js` opts into
`experimental.remoteFunctions`). The Valibot schema validates name/email/message plus the Turnstile
token; the handler verifies Turnstile, builds a MIME message with `mimetext`, and sends through the
`SEND_EMAIL` binding (Cloudflare Email Routing's send-to-verified-destination mechanism, distinct
from cairn's own unrestricted `EMAIL` binding). Secrets: `TURNSTILE_SECRET_KEY`, `CONTACT_EMAIL`.

---

## Deployment

Push to `main` → GitHub Actions → `npm run build:search` (`vite build` + Pagefind indexing) →
`wrangler deploy` → live in a few minutes. `wrangler.toml`'s `main` and `[assets] directory` point
at the adapter-cloudflare output; GitHub Actions secrets: `CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_ACCOUNT_ID`.

The live domain is `ecxc.ski`, served through a Cloudflare custom domain on the `ecxc` Worker. The
repo is `glw907/ecxc-ski`; the adapter's `githubApp` backend names the same repo, since admin saves
commit through the GitHub App.

**Auth** is cairn-cms's own D1-backed magic-link store (`AUTH_DB` bound to `cairn-ecxc-auth`), no
site-owned auth code. **Observability**: `wrangler.toml` sets `observability.enabled = true`, so
cairn's structured log events (auth flow, commit pipeline, admin-guard refusals; vocabulary in
cairn-cms's `docs/reference/log-events.md`) index in Workers Logs.

**Build toolchain notes:**

- **Node 22+**, Vite 8 (Rolldown bundler). Pagefind's UI bundle is generated after the build and
  must stay in `vite.config.ts`'s `build.rollupOptions.external` alongside `cloudflare:email`, or
  the build fails with `UNRESOLVED_IMPORT`.
- **cairn owns admin CSRF**, so `svelte.config.js` sets `csrf: { checkOrigin: false }`; the engine
  guard is the single CSRF authority for `/admin` (see cairn-cms's own docs for the mechanism).
