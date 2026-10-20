# ecnordic migration to cairn-cms 0.21: design

## 1. Why this document exists

ecnordic-ski runs `@glw907/cairn-cms ^0.10.0`. The engine is now `0.21.0`. This document is the
approved design for moving ecnordic onto `^0.21.0` in full, including the content-graph layer, and
for treating the migration as the first real DX audit of the engine.

ecnordic is the first consumer site to traverse the whole 0.21 surface, so it is the proving ground
for the `create-cairn-site` scaffolder that comes later. The migration has two ranked goals. The
first is ecnordic running on 0.21 end to end as a **completely idiomatic cairn site**, deployed and
proven. The second is a structured cairn-cms DX-improvement report, captured task by task and
harvested into the engine backlog at pass-end. The second goal is why "migrate ecnordic first" pays
for itself: it de-risks every later site and feeds the scaffolder.

**The north star: cairn is a fully SvelteKit tool.** Working with cairn should feel easy and natural
to a SvelteKit developer. ecnordic is the reference for that, so it adopts the engine's idiomatic
public surface wholesale (`createPublicRoutes`, `CairnHead`, the response helpers) rather than keeping
its bespoke hand-rolled delivery. Blast radius is not a constraint here; an idiomatic result is the
goal. ecnordic should end up looking like what the scaffolder would emit. The DX audit's yardstick is
whether each step feels natural to a SvelteKit developer; a step that does not is a finding.

This design supersedes the Pass 2 and Pass 3 portions of the prior
`2026-05-31-ecnordic-cairn-0.10-migration-design.md`. Pass 1 (the 0.6-to-0.10 catch-up and the
delivery surface) already landed. The old Pass 2 (component conversion) and Pass 3 (the reference
doc) are absorbed and widened here, because three breaking engine changes landed after that design
was written: the schema-source-of-truth adapter contract (0.13), the `build(ctx)` slot model (0.12),
and the render-safety sanitize floor (0.17).

## 2. What ecnordic looks like today

The exploration recorded the current state. The load-bearing facts:

- **Dependency:** `^0.10.0`, resolved to `0.10.0`. The 0.10 catch-up is done. The adapter uses
  `render` (not `renderPreview`), and `src/lib/site.config.yaml` declares the posts URL policy
  (`permalink: /:year/:month/:slug`, `datePrefix: month`).
- **Adapter (`src/lib/cairn.config.ts`):** the OLD `fields`/`validate` contract. Two concepts.
  `posts` declares `title`, `date`, `description`, `tags`, `draft` and a `validatePostFrontmatter`.
  `pages` declares `title` and a `validatePageFrontmatter`. The validators (`src/lib/content-schema.ts`)
  spread the whole raw frontmatter through, so any extra key survives today.
- **Components (`src/lib/markdown/components.ts`):** seven directive components (`card`, `grid`,
  `alert`, `cta`, `split`, `panel`, `passage`), each a `ComponentDef` with the OLD `build(node)`
  signature. Every build leans on `splitHead` and the "first `##` heading is the title" convention,
  plus `strProp`, `glyph`, `iconSpan`, `cardShell`, `markFirstList`. `alert` carries a bespoke
  `defaultIconByRole` key the typed `ComponentDef` does not have.
- **Render (`src/lib/markdown/render.ts`, `src/lib/utils.ts`):** `createRenderer(registry, { stagger: true })`,
  then `markdownToHtml(md) = sanitizeHtml(await renderMarkdown(md))`. The site owns a `rehype-sanitize`
  floor (`src/lib/markdown/sanitize.ts`) that frees `className`, drops `style`, and adds
  `section`/`nav`/`svg`/`path` plus `data-rise`/`role`/aria.
- **Delivery (`src/lib/content.ts`):** one content layer that hand-rolls two `createContentIndex`
  calls and a `byPermalink` map, importing delivery primitives from the bare `@glw907/cairn-cms`
  entry. The public catch-all `[...path]` route, the RSS and JSON feeds, the sitemap, and robots all
  use engine builders. SEO is built inline in the catch-all via `buildSeoMeta`.
- **Content:** one post (`2026-05-welcome.md`, month-dated) and five pages, five of which use
  directives. The post links to two pages with absolute paths (`/crewlab`, `/waiver`). No `cairn:`
  tokens exist yet.
- **Reads of frontmatter:** only declared keys are read (`title`, `date`, `tags`, `description`,
  `draft`), plus the engine-derived `entry.excerpt`. No custom undeclared keys.

## 3. The 0.21 target shape

The cairn showcase (`examples/showcase` in the engine repo) wires the exact target shape. ecnordic
mirrors it. The confirmed 0.21 API:

- **Adapter:** `defineAdapter({ ... })` with each concept carrying one `schema: defineFields([...])`
  member. No separate `validate`. A field is `{ type, name, label, required?, options? }`. `defineFields`
  infers the frontmatter type, and validate-once serves only declared fields and omits empty optional
  values.
- **Content layer:** `createSiteIndexes(adapter, siteConfig, { posts: rawGlob, pages: rawGlob })`
  returns `{ site, posts, pages }`, one typed index per concept plus a site resolver. It hard-fails
  on a missing glob key for a declared concept.
- **Manifest:** `buildSiteManifest(adapter, siteConfig, globs)` plus `verifyManifest(built, committedRaw)`
  is the build backstop, and `scripts/build-manifest.mjs` (run as `npm run cairn:manifest`) regenerates
  the committed `src/content/.cairn/index.json`. The adapter's optional `manifestPath` defaults to that
  path.
- **Renderer:** `createRenderer(registry, { sanitizeSchema?, unsafeDisableSanitize? })`. The sanitize
  floor is on by default, after `rehype-raw` and before the component dispatch. `sanitizeSchema` is an
  extend-only `(defaults) => Schema` hook.
- **Component:** `ComponentDef.build: (ctx: ComponentContext) => Element`. `ctx.attributes` is the
  declared attribute values, `ctx.slot(name)` returns a named slot's rendered children, and
  `ctx.items(name)` returns a repeatable slot's items. The component declares `attributes` and `slots`.
  The slots `title` and `body` are special. Icons ride on an adapter `icons: IconSet` plus an attribute
  of `type: 'icon'`. The build constructs hast with `hastscript`'s `h()`. The old head-sniffing helper
  `splitHead` is removed; the surviving helpers (`glyph`, `iconSpan`, `cardShell`, `strProp`,
  `markFirstList`, `isElement`, `MakeIcon`) stay available.
- **Slot markdown syntax:** `::::card[Title]{attr="value"}`, the body markdown inside, and a nested
  `:::slotName` block for a repeatable or named slot. The inline `[Title]` is the `title` slot.
- **Admin route:** `load = routes.editLoad` and `actions = { save, delete, rename }`. The link picker's
  `linkTargets` ride on `editLoad` once the manifest exists.

## 4. Scope

### In scope (all-in, two phases)

**Phase A: the breaking floor.** Everything required to compile and render on 0.21 with no URL
movement and no visible content change.

1. Bump `^0.10.0` to `^0.21.0`, standalone relock (the workspace-member move-aside procedure).
2. Adapter contract port: `defineAdapter` plus one `schema: defineFields([...])` per concept; fold the
   two validators into field declarations (`required`, and the post `tags` vocabulary via the tags
   field's `options`).
3. Component slot port: the seven `build(node)` components to `build(ctx)`, each reading named slots
   and attributes instead of `splitHead`; `alert.defaultIconByRole` moves into `build()`; icons move to
   the `IconSet` plus icon-attribute model.
4. Content rewrite: the five directive pages to the `::::name[Title]{attrs}` plus nested `:::slot`
   syntax.
5. Sanitize reconcile: drop ecnordic's site-level `rehype-sanitize` pass and extend the engine floor
   via `createRenderer(registry, { sanitizeSchema })` to admit ecnordic's vocabulary (svg, path,
   `data-rise`, role, aria, section, nav).
6. Public-surface adoption (the idiomatic rewrite). Replace ecnordic's hand-rolled delivery with the
   engine's surface, mirroring the showcase: `content.ts` collapses to `createSiteIndexes` exporting
   `site`, `ORIGIN`, and `SITE_DESCRIPTION`; the `[...path]` catch-all uses `createPublicRoutes({ site,
   render, origin, siteName, description, feeds })` for `entries` and `entryLoad`; the catch-all page
   uses `<CairnHead seo={data.seo} />`; the home, tags-index, and tag routes read the engine `site`
   index (or the `createPublicRoutes` list loaders) instead of `allPosts`/`postsByTag`/`allTags`; and
   the feeds, sitemap, and robots routes use the `rssResponse`/`jsonFeedResponse`/`sitemapResponse`/
   `robotsResponse` helpers, with the feeds threading `buildLinkResolver(site)` exactly as the showcase
   does. The hand-rolled `byPermalink`, `resolvePermalink`, `toListItem`, `PostListItem`, and the manual
   `buildSeoMeta` head go away. The `url-inventory` test guards that every URL stays put across the
   rewrite.

Phase A gate: the `url-inventory` and URL-policy tests green (zero URL movement), the five directive
pages render equivalently, `npm run check` 0/0, `npm test` and `npm run build` exit 0.

**Phase B: content-graph adoption.** Additive on the green floor.

7. Manifest: add `scripts/build-manifest.mjs` and the `cairn:manifest` script; wire
   `verifyManifest(buildSiteManifest(...))` into `content.ts`; commit the initial manifest.
8. Resolver: resolve `cairn:` links wherever a body renders to HTML, the catch-all page and both
   feeds.
9. Lifecycle: register `delete` and `rename` actions on the admin `[concept]/[id]` route; the link
   picker `linkTargets` arrive through `editLoad`.
10. Internal links: convert the welcome post's two absolute page links to `cairn:pages/crewlab` and
    `cairn:pages/waiver`.

Phase B gate: a dangling `cairn:` link fails the build; the two converted links resolve to the live
permalinks on the page and in the feeds; URLs still stable; the full gate green.

### Out of scope

- The live deploy and the live `/admin` smoke. A push deploys ecnordic to production, so the deploy
  and the interactive smoke of delete, rename, and the picker against the real Worker stay a human
  fast-follow.
- Declaring per-post SEO fields (image, robots, author). Adopting `createPublicRoutes`/`entryLoad`
  brings the SEO head consumer (0.14) in by default, and ecnordic's `<CairnHead>` renders whatever
  `entryLoad` resolves. ecnordic declares none of those fields today, so they stay absent; adding them
  is a later content decision, not this migration.
- The component reference doc (`generateComponentReference`). It is a one-command follow-up, recorded
  as a backlog item rather than a task here.

## 5. The DX-findings deliverable

The pass produces a structured cairn-cms DX-improvement report. The mechanism keeps it cheap and
honest:

- A running `docs/cairn-dx-findings.md` in ecnordic. Each task ends with a "capture friction" step.
  Anything needlessly complex, undocumented or poorly documented, busywork, or overly clever earns one
  entry. An entry records the symptom, the file or API where it bit, and a concrete suggested fix.
- A final synthesis task reads the findings file and files engine backlog items in cairn-cms, so the
  improvements land where the fix happens.

**The primary lens is SvelteKit-developer fit.** cairn is a fully SvelteKit tool, so the test that
matters most is whether each step feels native to a SvelteKit developer. The findings file carries a
dedicated "SvelteKit fit" section, and every task evaluates its surface against the SvelteKit a
developer already knows: does the adapter feel like ordinary config, do the routes read like normal
`load`/`actions`/`+server` handlers, do the types flow without casts, do `$props`/`$app/state`/the
runes work as expected, does `createPublicRoutes`/`CairnHead`/`createContentRoutes` compose the way a
SvelteKit library should, are the import paths and the export map obvious. Anywhere cairn fights a
SvelteKit idiom (a handler that cannot be a plain `load`, a type that needs a cast, a concept with no
SvelteKit analog, a doc that assumes cairn-internal knowledge) is a first-class finding, ranked above
cosmetic friction. The synthesis ranks findings by how much they cost a SvelteKit developer who has
never seen cairn.

Seed findings already visible from planning, to be confirmed or refined during execution:

1. **Coupled breaking changes force a big-bang migration.** 0.12 (the build signature) and 0.13 (the
   adapter contract) both gate compilation, so a consumer bumps and the repo does not compile until the
   adapter and every component are ported together. There is no codemod, no deprecation window, and no
   per-version `MIGRATION.md`.
2. **`splitHead` removed with no migration note.** ecnordic imported `splitHead` for the "first `##` is
   the title" convention. It is gone in 0.21, replaced by the `title` slot, with no changelog entry
   pointing a consumer at the replacement.
3. **Sanitize double-floor.** The engine added a default floor in 0.17. A site that already owned a
   floor now sanitizes twice, with no guidance to drop its own pass and extend the engine schema
   instead.
4. **Delivery import ambiguity.** ecnordic imports delivery primitives from the bare
   `@glw907/cairn-cms` entry, but the delivery surface is the `/delivery` subpath. Which entry exports
   what is not obvious from the docs.
5. **Validate-once narrows silently.** The old validators spread raw frontmatter; the new contract
   serves only declared keys. A read-but-undeclared key degrades to `undefined` with no loud failure at
   migration time.
6. **Manifest adoption is manual wiring.** A regenerate script, a build-time verify call, a committed
   generated file, and a glob map, all hand-assembled and easy to get subtly wrong. This is exactly what
   the scaffolder should emit.

## 6. Committed architecture decisions

- **One spec, two plan files.** Phase A and Phase B have distinct verification surfaces (render
  agreement, then link integrity), so they are two plan files executed back to back in the clean
  session. Phase B starts only on Phase A's green gate. This matches the plan-size-by-efficacy rule and
  isolates the high-blast-radius component port.
- **Single sanitize floor.** Drop ecnordic's site-level pass and extend the engine floor through
  `sanitizeSchema`. One floor, in the engine, matching the model the scaffolder template will teach.
  This is also finding #3.
- **Mirror the showcase, including the public surface.** The showcase adapter, content layer, public
  routes (`createPublicRoutes`, `CairnHead`, the response helpers), manifest script, and admin route are
  the reference. ecnordic's files should read like the showcase's, since the scaffolder will template
  from the same shape. ecnordic's hand-rolled delivery is replaced, not merely re-pointed.
- **A bespoke listing page keeps its presentation, not its plumbing.** ecnordic's home, tags, and
  per-tag pages keep their design-system markup and their routes, but read the engine `site` index (or
  the `createPublicRoutes` list loaders) instead of the hand-rolled `content.ts` helpers. The
  presentation is ecnordic's; the data path is the engine's.
- **No push, no deploy in the pass.** The clean session runs every gate locally and leaves `main`
  committed and unpushed. The deploy and the live admin smoke are a human fast-follow.
- **Render equivalence, not strict byte-identity, is the Phase A gate.** The sanitize reconcile can
  legitimately shift exact output, so the gate is the URL-stability tests plus a structural
  render-agreement check on the five directive pages, not a byte diff.

## 7. Risks

- **The component port is a rewrite, not a tweak.** Seven builds move off `splitHead` and the heading
  convention to named slots. The risk is a visual regression on the five directive pages. The mitigation
  is the render-agreement check per page and the per-component slot mapping carried in Plan A.
- **Custom validator logic.** The two validators may carry logic beyond `required` and the tag
  vocabulary. If a validator does cross-field or format checks `defineFields` cannot express, the port
  needs a decision (drop it, or find the engine's escape hatch). Plan A's adapter task confirms this
  against the real validators and records any gap as a finding.
- **The directive slot grammar.** The content rewrite depends on the exact slot syntax the engine
  parses. The plan derives it from the showcase corpus and the engine grammar, and proves it by
  rendering, rather than assuming it.
- **`entry.excerpt` and the direct `frontmatter.description` read.** Both must survive the validate-once
  entry shape. Plan A confirms them against 0.21 before relying on them.

## 8. Pass structure and handoff

The migration runs as an ecnordic site-pass in a clean session, subagent-driven. The two plan files are
`Plan A` (the breaking floor) and `Plan B` (content-graph adoption), written from this spec. The
handoff is pre-baked while context is warm: both plans committed to ecnordic `main`, the ecnordic
`STATUS.md` immediate-next-action naming Plan A and the method, and the resume prompt provided. The
clean session honors ecnordic's own `CLAUDE.md`, the content guard, and the prose guard, and does not
push.
