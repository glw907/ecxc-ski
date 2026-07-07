# cairn-cms DX findings (from the ecnordic 0.21 migration)

> **Historical snapshot.** This log records friction from the 2026-06 migration to cairn-cms
> 0.21, when this site was still named ecnordic and was an npm-workspaces member of
> `~/Projects/cairn`. Both of those facts changed later (the site renamed to ecxc-ski at Rename
> 6, and the meta-workspace flattened to standalone sibling repos on 2026-06-04, noted inline in
> finding 1 below); read the findings as history, not current state. The findings themselves were
> already synthesized into the cairn-cms backlog (see below) and stay here for the record. Current
> friction from the 2026-07-05 rebuild onto Waymark lives in `docs/STATUS.md`'s own "Template
> findings" section, not in this file.

Friction this migration hit in the cairn-cms consumer surface. Each entry: the symptom, where it
bit, and a concrete suggested fix. The pass-end synthesis (Plan B, final task) files these as
engine backlog items in cairn-cms.

The primary lens is SvelteKit-developer fit: cairn is a fully SvelteKit tool, so the test that
matters most is whether each step feels native to a SvelteKit developer. Record SvelteKit-fit
observations in their own section below, and rank them above cosmetic friction.

## Verdict

Working with a cairn site mostly feels native to a SvelteKit developer once the site is on the
idiomatic surface. The public routes are the high point. `createPublicRoutes` hands back
`load`/`entries` that drop into a `[...path]/+page.server.ts` unchanged, `CairnHead` is an ordinary
`<svelte:head>` component, and the four `*Response` helpers turn a feed `+server.ts` into a single
call (SvelteKit-fit findings 5 and the response half of 4). The adapter reads like typed config
(finding 2), and the `build(ctx)` slot model maps onto the named-slot mental model a Svelte
developer already has (finding 3). Where cairn still fights the SvelteKit a developer knows, four
things stand out, ranked by what they cost someone who has never seen cairn. First, the delivery
surface splits across the package root and `/delivery` with no signpost, and the `/delivery` barrel
drags a `.svelte` component into a node test (SvelteKit-fit findings 4 and 8): a wrong import path
fails with a bare "not exported" and a data-only import breaks a unit test, both unexpected for a
one-package SvelteKit library. Second, `EntryData` hands back no concept, so the catch-all `load`
re-derives it from the entry shape with a fragile date heuristic (finding 6). Third, `ContentSummary`
omits the authored summary field, so a list that shows it pays a per-entry detail re-read (finding 7).
Fourth, the build-time guarantees lean on defaults a real SvelteKit scaffold quietly overrides: a
`cairn:` token only resolves content concepts (not `+page.svelte` routes), and the dangling-token
backstop goes silent under an inherited `handleHttpError: 'warn'`, so the build stays green on a bad
link (general findings 15 and 16). None of these blocks a site, and the workarounds were short, but
each is a place a SvelteKit developer's correct instinct produces a surprise. The fixes are mostly
the scaffolder emitting the right defaults and the engine surfacing the concept and the authored
summary it already holds.

## SvelteKit fit

Does cairn feel native to a SvelteKit developer? One entry per surface as you wire it. Prompts: does
the adapter read like ordinary config; do the routes read like normal `load`/`actions`/`+server`
handlers; do the types flow without casts; do `$props`/`$app/state`/the runes behave; does
`createPublicRoutes`/`CairnHead`/`createContentRoutes` compose like a SvelteKit library should; are
the import paths and the export map obvious. Note both what flowed naturally and what fought a
SvelteKit idiom.

1. **RESOLVED 2026-06-04, kept as scaffolder guidance: a plain `npm install` could not relock the
   site lockfile at the time.** Symptom, as it stood during this migration: ecnordic was an npm
   workspace member, so running `npm install` from inside the site rewrote the workspace-root
   lockfile and left the site's own committed lockfile stale, which broke CI `npm ci`. The
   version bump needs a move-aside dance (mv the root `package.json` and `package-lock.json` aside,
   `npm install --package-lock-only --ignore-scripts`, then restore the root files). Location: the
   `^0.21.0` bump in `package.json`, Plan A Task 1. A SvelteKit developer expects a bump and a plain
   `npm install` to refresh the lockfile in place. Fix: the create-cairn-site scaffolder should
   document the relock step in the site README, or ship a small `npm run relock` script that wraps
   the move-aside so the site dev never types it by hand. Standalone (non-workspace) sites avoid this
   entirely, so the scaffolder output should not assume the workspace layout. **Update (2026-06-04):**
   the cairn meta-workspace was flattened to standalone sibling repos, so ecnordic now installs with a
   plain `npm install` and this friction is resolved. The finding stands as scaffolder guidance: do not
   assume a workspace layout.

2. **`defineAdapter`/`defineFields` read like ordinary typed config.** The adapter is a single
   `defineAdapter({...})` literal with one `defineFields([...])` per concept. A SvelteKit developer
   reads it as plain config, the same way they read a `svelte.config.js` or a route's `load`. The
   field declarations are flat data objects with a discriminated `type`, so editor support is good
   and no cast is needed at the call site. The one rough edge is that the inferred frontmatter type
   and the editor form both come from the same `defineFields` call, which is convenient but hides
   the validation behavior: the declaration looks like a form schema, so it is easy to assume it
   validates more than it does (see the lost-rules finding below). Ranked above the cosmetic
   findings because the schema declaration is the first thing a site author writes.

3. **The `build(ctx)` slot model reads naturally once the slot rules are known.** Porting the seven
   components, the new build signature flowed well. A build receives `ctx.attributes`, `ctx.slot(name)`,
   and `ctx.items(name)`, and arranges hast with `hastscript`. It never walks the stamped tree, which
   the old `build(node)` form forced. A SvelteKit developer reads `ctx.slot('title')` and
   `ctx.slot('body')` the way they read named slots in a Svelte component, so the mental model carries
   over. Two snags cost time. The engine does not export the `ComponentContext` type from the package
   root, so a site that writes a named helper (not an inline `build: (ctx) =>`) has to recover the type
   with `Parameters<ComponentDef['build']>[0]`. And the slot-versus-attribute split is implicit (see
   findings 3 and 4), so the first port emitted undefined icons until the attributes were declared. Ranked
   here because the build model is the core of a site's render code.

4. **The delivery surface splits across two import entries with no signpost.** Most delivery symbols
   live at `@glw907/cairn-cms/delivery`, but `parseSiteConfig`, `createSiteIndexes`, `buildSitemap`,
   `verifyManifest`, and the `FeedItem`/`SitemapUrl` types also resolve from the package root
   `@glw907/cairn-cms`. A few symbols a site needs (`buildLinkResolver`, `createPublicRoutes`,
   `CairnHead`, the four `*Response` helpers, `EntryData`) live only under `/delivery`. The split is
   real and load-bearing, since the root barrel pulls server code while `/delivery` stays backend-free.
   It was not discoverable from the call site though. I had to grep `src/lib/index.ts` and
   `src/lib/delivery/index.ts` to learn which entry owned which symbol, and a wrong guess fails at
   build with a bare "not exported" error rather than a hint to try the other entry. A SvelteKit
   developer reaches for one import path per package and reads the export map to disambiguate. Fix:
   document the root-versus-`/delivery` split in the delivery README with a one-line rule (data and SEO
   builders are dual-homed, the route loaders and the head component and the response helpers are
   `/delivery`-only), or re-export the `/delivery`-only public symbols from root so a site can import
   the whole public surface from one path.

5. **The catch-all `load`/`entries`, `CairnHead`, and the `*Response` feed helpers compose as plain
   SvelteKit.** `createPublicRoutes({...})` returns `entryLoad`/`entries` that drop straight into a
   `[...path]/+page.server.ts` as `load` and an `EntryGenerator`, and `entryLoad({ url })` reads the
   request URL the way a normal `load` does. `CairnHead` is an ordinary component that renders into
   `<svelte:head>`, with a `title` override prop, so swapping the inline head block for it was a
   one-line change that left the title text byte-identical. The `rssResponse`/`jsonFeedResponse`/
   `sitemapResponse`/`robotsResponse` helpers each return a `Response` with the right content type, so
   a `+server.ts` `GET` becomes a single call and the site stops hand-writing the content-type header.
   Nothing here fought the `load`/`+server`/`$props` idioms. The one gap is finding 6.

6. **`EntryData` carries no concept, so the catch-all `load` re-derives it from the entry shape.**
   ecnordic's `[...path]/+page.svelte` branches on `data.concept` (a post renders with a date header and
   tags, a page renders as a static shell), but `entryLoad` returns an `EntryData` with no concept field.
   The catch-all resolves any concept through `byPermalink`, so the concept is erased by the time the
   load returns. I recovered it with `data.entry.date ? 'posts' : 'pages'`, which holds for this site
   because posts are the only dated concept. That heuristic is fragile: a site that adds a second dated
   concept, or a dateless post, breaks the branch. A SvelteKit developer expects the loader to hand back
   the concept it just resolved, not to reconstruct it from a value's shape. Fix: `EntryData` should
   carry the resolved concept id (the descriptor id `byPermalink` matched), so a template can branch on
   it directly instead of inferring it.

7. **`ContentSummary` lacks the authored summary field, so a list that shows it must re-read the
   entry.** The engine summary carries a derived `excerpt`, not the authored `description` frontmatter
   field. ecnordic's home and archive lists render the authored `description` (the post-list card and the
   home "Earlier" list both print `post.description`), so I kept a site-local `PostListItem` interface
   (`{ id, slug, permalink, title, date, tags, description }`) and a `toItem` mapper that re-reads
   `posts.byId(s.id)!.frontmatter.description` for each summary. The typed read made the re-read painless
   (the schema makes `frontmatter.description` a required `string`, so no cast), but it is a per-entry
   `byId` lookup over a list the index already built, and it defeats the point of the cheap plain-data
   summary. A SvelteKit developer reaches for the list data the index returns and expects the field they
   author to be on it. Fix: let a descriptor nominate a frontmatter field to surface on `ContentSummary`
   (a `summaryField` knob), so a site that displays the authored summary gets it on the summary without a
   detail re-read.

8. **The `/delivery` barrel mixes a `.svelte` component with the data helpers, so a node-environment
   test that imports the content layer needs the Svelte vitest plugin.** ecnordic's content layer imports
   `createSiteIndexes` and `buildLinkResolver` from `@glw907/cairn-cms/delivery`. That barrel also
   re-exports `CairnHead.svelte`, and the export map offers no deeper entry, so importing any data helper
   drags the `.svelte` file into the module graph. The site's `vitest.config.ts` ran node-environment
   unit tests with no Svelte transform, so the content tests failed to parse `CairnHead.svelte` as JS.
   The fix was to add `@sveltejs/vite-plugin-svelte` to the vitest config, which a SvelteKit site already
   has on hand. It is a surprise though: a pure-data import pulling a component into a node test is not
   what a SvelteKit developer expects, and the failure reads as a syntax error in an engine file rather
   than a missing transform. Fix: split the head component out of the data barrel (a `/delivery/head`
   entry, or keep `CairnHead` only under the existing `/components` or `/sveltekit` entry), so importing
   the delivery data helpers stays component-free and a node test needs no Svelte plugin.

## Findings

1. **Coupled breaking changes force a big-bang migration.** 0.12 (the build signature) and 0.13
   (the adapter contract) both gate compilation, so a consumer bumps and the repo does not compile
   until the adapter and every component are ported together. Fix: a per-version `MIGRATION.md`, or a
   codemod, or a deprecation window that keeps the old members working with a warning.
2. **`splitHead` removed with no migration note, and its head markup is now the site's to rebuild.**
   The "first `##` is the title" helper is gone, replaced by the `title` slot, with no changelog
   pointer. The helper used to return `{ head, rest }`, so a card build was two lines. Now each
   component rebuilds the head row by hand: read the icon and role attributes, build the icon span,
   wrap `ctx.slot('title')` in the heading element, and assemble the `ec-head` div. ecnordic factored
   this into one local `head(ctx)` helper shared across card, grid, and passage, so the busywork lands
   once. A site with several titled components still pays the rebuild. Fix: a changelog entry naming
   the replacement, and consider an engine helper that takes a `ctx` plus a site `makeIcon` and returns
   the standard icon-plus-heading head, the way `cardShell` and `iconSpan` already factor the common
   shapes.

3. **An icon or role only reaches `ctx.attributes` when the component declares it as an attribute.**
   The render dispatch reads `dataAttr<key>`, which the stamper writes only for declared attributes.
   The first port left `icon` and `role` off the `card`/`grid`/`passage`/`panel` defs, so every icon
   came back undefined and the glyphs vanished. The fix is to declare `{ key: 'icon', type: 'icon' }`
   and `{ key: 'role', type: 'select', ... }` on each component that renders an icon. This is correct
   once you know it, but nothing in the types points at it: a build can call `ctx.attributes.icon`
   freely and get `undefined` at runtime with no compile error. Fix: document that a build may only
   read declared attributes, or have the dispatch surface a dev warning when a build reads an
   undeclared key.

4. **The alert default icon falls in a gap between the two icon paths.** The stamper applies
   `defaultIconByRole` to its special `dataIcon` marker, but a build reads `dataAttrIcon` (the declared
   attribute path), and the default is never copied there. So `:::alert{role=caution}` with no explicit
   icon arrives with `ctx.attributes.icon` undefined, and the warning glyph disappears unless the build
   hardcodes the default itself. ecnordic dropped `defaultIconByRole` from the alert def and hardcoded
   `warning` for the caution role inside `buildAlert`. That works, but it splits the default across two
   places: the engine field exists yet does nothing for a build that reads the declared attribute. Fix:
   have the stamper also write the role default to `dataAttr<iconKey>` when the component declares an
   icon attribute, so `defaultIconByRole` reaches the build and stays the single source of the default.
5. **The schema contract drops four validation rules ecnordic's old validator enforced, and there
   is no per-field custom-validator hook to restore them.** Moving from the hand-written
   `validatePostFrontmatter` to `defineFields` keeps required-and-coerce, but validate-once is
   thinner than the old validator. Each lost rule below was verified against the engine source.
   - **No real-calendar-date check.** The old validator rejected `2026-02-30`
     (`content-schema.ts:49`). validate-once does not. A `date` field coerces a JS `Date` to
     `YYYY-MM-DD` and checks non-empty only (`cairn-cms/src/lib/content/validate.ts:40-45`); the
     only date constraints available are `min`/`max` bounds
     (`cairn-cms/src/lib/content/schema.ts:76-79`). An impossible calendar date passes.
   - **No date-format check.** The old validator required `^\d{4}-\d{2}-\d{2}$` and rejected
     `5/14/26`. validate-once has no format check for `date`; a `date` field has no `pattern`
     option (`cairn-cms/src/lib/content/types.ts:53-60`). Only `text`/`textarea` carry `pattern`.
   - **No controlled-vocabulary check on `tags`.** The old validator rejected any tag outside
     `POST_TAGS` (`content-schema.ts:57-60`). validate-once treats `options` as the editor's pick
     list only; the `tags` arm coerces to a string array and never checks membership
     (`cairn-cms/src/lib/content/validate.ts:33-39`). An off-vocabulary tag committed by hand or
     a stale file passes.
   - **No at-least-one-tag requirement.** The old validator required `tags.length >= 1`
     (`content-schema.ts:54`). The plan's target posts schema does not mark `tags` as
     `required`, so an empty or absent tag list passes. (validate-once would enforce non-empty if
     `required: true` were set, per `validate.ts:36`, but membership still would not be checked.)

   The non-boolean-`draft` rejection also goes away, but that one is benign: a present non-`true`
   boolean is simply omitted (`validate.ts:31`), so a bad `draft` value cannot corrupt the file.

   The root gap is that `defineFields` has no per-field custom-validator hook. The only escape
   hatch is the `refine(data, body)` option on `defineFields`
   (`cairn-cms/src/lib/content/schema.ts:82-87`), a single cross-field function that returns
   field-keyed errors. The four lost rules could be restored there as a hand-written block, which
   puts ecnordic back to owning a validator and undercuts the single-source-of-truth goal. Fix: add
   declarative field options the schema can carry as plain data: a `calendar: true` (or implicit)
   real-date check on `date`, a `pattern` on `date`, and an `enforced` flag on a `tags` field's
   `options` so the closed vocabulary is validated, not just suggested. These keep the declaration
   serializable and avoid pushing sites back to bespoke validators.

6. **A no-title panel must drop the inline label entirely, not write an empty `[]`.** The split
   reference shape in the engine showcase and the `panel` insert template both write
   `:::panel[]{icon="hand-coins"}`. The `panel` component declares only a body slot and no title slot,
   so the empty `[]` label has nowhere to land. The directive parser keeps it as an empty paragraph in
   the body, and the render gains a stray `<p></p>` ahead of the panel content. The author has to know
   to write a bare `:::panel{icon="hand-coins"}` with no brackets at all. The colon-counting rule for
   nested fences (an outer fence needs strictly more colons than any fence it wraps) is learnable, but
   the empty-label trap is a silent one: the page still renders, it just carries an invisible empty
   paragraph that only a byte-exact snapshot catches. Fix: the insert template and the showcase should
   show the no-title form without the `[]`, and the engine should drop an empty label slot instead of
   parking it in the body so the stray paragraph never appears.

7. **The engine sanitize floor rewrites two attributes that a site's pre-0.21 output relied on.**
   The render path runs `rehype-sanitize` inside `createRenderer` before a site reconciles its own
   allowlist. With the bare default floor, an external `target="_blank"` anchor gains
   `rel="noopener noreferrer"` where the site authored `rel="noopener"` alone, and a raw `<nav>` loses
   its `aria-label`. Neither is a content change, so the directive-content rewrite is byte-clean while
   the characterization snapshot still shows these two deltas until the `sanitizeSchema` reconciliation
   runs (Plan A Task 5). The friction is sequencing: a site that ports content before the floor sees a
   red characterization gate for reasons unrelated to the content, which reads as a content bug. Fix:
   the migration guide should call out that the sanitize reconciliation and the content rewrite produce
   one combined green gate, so a site does not chase a content drift that is really an unreconciled
   floor.

8. **The site's own sanitize pass became redundant once the engine floor moved in.** ecnordic
   carried a post-render `sanitizeHtml` second pass that re-ran `rehype-sanitize` over the engine
   output and re-allowlisted the whole directive vocabulary. The engine floor (0.17+) does the same
   strip inside `createRenderer`, so the second pass was pure duplication. Reconciling it collapsed a
   64-line `sanitize.ts` processor into a 13-line `ecSanitizeSchema` extender. The extender adds one
   attribute: `ariaLabel` on `*`, for the page-toc `<nav>`. Everything else the old pass allowlisted
   turned out to be unnecessary. Fix: the migration guide should frame the engine floor as a
   replacement for any site-owned sanitize pass, and point a migrating site at its existing allowlist
   as the thing to delete rather than keep.

9. **The floor runs before the component dispatch, so a site's allowlist only covers authored raw
   HTML.** This is the insight that shrank the extender. The engine orders the pipeline as rehype-raw,
   then the sanitize floor, then the dispatch, then `rehypeAnchorRel`. The built `<section>`, `<svg>`,
   `<path>`, `role="alert"`, and `data-rise` markup is injected after the floor by trusted build code,
   so it never passes through sanitization and never needs an allowlist entry. The old second pass ran
   after the dispatch, so it had to allowlist all of that built output. A site reconciling onto the
   engine floor can drop every built-element rule and keep only what its author raw HTML uses. For
   ecnordic that was a single `ariaLabel`. Fix: the migration guide and the `sanitizeSchema` docs
   should state the ordering plainly, so a site author does not re-add section/svg/path rules the floor
   never sees.

10. **`rehypeAnchorRel` forces `rel="noopener noreferrer"` and a `sanitizeSchema` extender cannot opt
    out of it.** The hardening runs last in the rehype chain, outside the sanitize schema, so it is not
    reachable through the one extension point a site is given. Adopting the engine render means
    inheriting this. ecnordic authored `rel="noopener"` on its external `target="_blank"` anchors, and
    the engine rewrote all three to `rel="noopener noreferrer"`. This is a security improvement
    (reverse-tabnabbing prevention), so ecnordic accepts it and the characterization snapshot now pins
    the hardened form. The SvelteKit-fit note: a site that adopts `createRenderer` inherits this anchor
    rewrite with no per-site override, so a migrating site must accept the rel change as part of going
    idiomatic. Fix: the migration guide should list `rehypeAnchorRel` as a deliberate, non-optional
    output change, so a site does not read the rel delta as a content regression.

11. **`AttributeField.options` is a mutable `string[]`, so a site cannot factor a shared attribute
    with `as const`.** ecnordic hoists its repeated component fields into shared constants
    (`ICON_ATTR`, `ROLE_ATTR`, `TITLE_SLOT`, `BODY_SLOT`) to avoid restating them across seven
    component defs. Writing the whole object `as const` is the natural way to pin the discriminant
    literals (`type: 'select'`, `kind: 'inline'`) without restating each as a per-field annotation.
    But `as const` also freezes `options` into a `readonly ['primary', 'secondary']`, and
    `AttributeField.options` is a mutable `string[]`, so the constant stops being assignable and
    `npm run check` reports four errors. The workaround is to drop the whole-object `as const` and
    pin only the discriminant fields one by one (`type: 'select' as const`), which leaves `options`
    a mutable `string[]`. A SvelteKit developer reaches for `as const` on a shared config literal and
    expects it to satisfy the type, so the readonly clash reads as a surprise. Fix: widen
    `AttributeField.options` (and any sibling list field) to `readonly string[]`, so a site can write
    a shared attribute constant `as const` and have it assign cleanly.

12. **The manifest regenerate is manual wiring a site must carry, and the showcase script does not
    survive a real config chain.** Adopting the content graph means three hand-placed pieces: a copied
    `scripts/build-manifest.mjs`, a `cairn:manifest` package script, and the committed
    `src/content/.cairn/index.json` the build verifies against. The script hard-codes the glob map
    (`{ posts, pages }`), so a site adds a line per concept by hand and a forgotten concept silently
    drops from the manifest. The showcase script is the documented starting point, but it only runs
    because the showcase `cairn.config.ts` is self-contained. ecnordic's adapter imports the site's
    real render pipeline, so the plain `node` run hit four Vite-isms in a row that the showcase never
    exercises: a `.js` specifier pointing at a `.ts` source, an extensionless relative import, the
    `$lib` alias, and a `?raw` YAML import. Each surfaced as a separate `ERR_MODULE_NOT_FOUND` or
    `ERR_UNKNOWN_FILE_EXTENSION`, so the fix was iterative. ecnordic resolved it with a
    `module.registerHooks` resolve-and-load shim in the script (map `$lib`, rewrite `.js`/extensionless
    to `.ts`, serve `?raw` as a string module), which adds about twenty-five lines of Node-internals
    code the showcase never needed. A SvelteKit developer expects the same import graph that builds
    under Vite to also run under `node`, and it does not. Fix: the engine should ship the regenerate as
    a CLI that runs the adapter through the same Vite resolver the build uses (for example a thin
    `vite-node` entry), so a site gets `cairn manifest` with no per-site loader shim and no Vite-ism
    gap. The scaffolder should emit the committed empty manifest and the package script, so a new site
    starts with the graph already wired.

13. **The build backstop drops into the existing content layer cleanly and reads as one obvious
    line.** Wiring the drift check meant extending two existing imports (`buildSiteManifest` onto the
    `/delivery` line, `verifyManifest` onto the root line), adding one `?raw` import of the committed
    manifest, and placing a single `verifyManifest(buildSiteManifest(...), manifestRaw)` call after
    `createSiteIndexes`. The same `cairn`, `siteConfig`, `postsRaw`, and `pagesRaw` bindings the index
    build already used feed the verify, so there was nothing new to thread. The check is honest: a
    one-character drift in the committed manifest fails `npm run build` with a clear regenerate
    message. The one rough edge is that the backstop and the regenerate read the corpus through two
    different paths, the build through Vite's `import.meta.glob` and the script through `fs` and the
    loader shim, so a divergence between those two paths could in principle pass the build while the
    script writes a different file. A single engine-owned regenerate that shares the build's resolver
    (the finding above) would also collapse this two-path risk.

14. **Delete and rename are a one-line action registration, but a SvelteKit dev has no signpost that
    they exist.** Turning on content delete and rename meant adding two entries to the `actions`
    object (`delete: content.deleteAction`, `rename: content.renameAction`) next to the `save` that
    was already there. The runtime already exposes all four handlers off `createContentRoutes`, the
    `editLoad` already ships the link picker's `linkTargets` from the manifest, and the admin form
    already posts to named actions, so nothing else needed wiring and the gate passed first try. The
    gap is discovery. A migrating site that copied only `{ save: content.saveAction }` from the 0.10
    surface has a fully working delete and rename sitting unused on the runtime with no type error and
    no warning to flag the omission. Fix: the migration guide and the scaffolder's route stub should
    register all four actions by default, so a site opts out of delete or rename rather than forgetting
    to opt in.

15. **A `cairn:` token resolves content concepts only, not arbitrary SvelteKit routes, and nothing
    says so.** Converting the welcome post's two links, `[CrewLAB](/crewlab)` became
    `cairn:pages/crewlab` cleanly, but `[waiver](/waiver)` could not. The waiver lives at
    `src/routes/waiver/+page.svelte`, a hand-built standalone route, not a markdown page under
    `src/content/pages/`. There is no `pages/waiver` content entry, so `cairn:pages/waiver` has no
    target and the resolver throws `cairn link target not found`. The token grammar only spans the
    declared content concepts, which is correct (a route has no id in the manifest), but a SvelteKit
    developer reasonably reads `/waiver` and `/crewlab` as the same kind of internal link and expects
    both to convert. The plan itself assumed both were pages. Fix: name the constraint in the
    internal-links doc ("`cairn:` resolves posts and pages, not `+page.svelte` routes; keep an absolute
    path for a hand-built route"), and have the editor link picker only offer real content targets so a
    site author cannot mint a dangling token. Location: the `cairn:` conversion in
    `src/content/posts/2026-05-welcome.md`, Plan B Task 4.

16. **The build backstop is not fail-closed on a SvelteKit site that inherited
    `prerender.handleHttpError: 'warn'`.** A dangling `cairn:` token throws `cairn link target not
    found` while the catch-all prerenders, exactly as designed. But ecnordic's `svelte.config.js`
    carries `prerender: { handleHttpError: 'warn', handleMissingId: 'warn', handleUnseenRoutes: 'warn' }`,
    inherited from the original 907.life scaffold, so SvelteKit downgrades the prerender 500 to a warning
    and `npm run build` still exits 0. The link still fails closed (the page 500s instead of shipping a
    broken anchor), so it never reaches production, but the build does not go red, which defeats the
    "a dangling token fails the build, exit 1" guarantee the content-graph promises. The showcase has no
    `handleHttpError` override, so it gets SvelteKit's default of `'fail'` and the backstop is fatal
    there. The mismatch is a scaffold default, not engine behavior, but it silently weakens the
    backstop on any real site that copied the lenient prerender config. Fix: the create-cairn-site
    scaffolder should NOT emit `handleHttpError: 'warn'` (or should pair it with a targeted
    `handleHttpError` function that re-throws a `cairn link target not found` while tolerating other
    prerender hiccups), and the internal-links doc should call out that the build-time guarantee depends
    on `handleHttpError` staying `'fail'` for the cairn error. Ranked high: it is invisible (the build is
    green) and it erodes the headline content-graph safety property. Location: ecnordic
    `svelte.config.js`, surfaced by Plan B Task 4 Step 4.
    **RESOLVED on ecnordic (2026-06-03):** `handleHttpError` is now a function that rethrows on any
    5xx (a prerender page crash, which a dangling `cairn:` token produces) and warns on a 4xx, so the
    backstop is fatal again. Verified both ways: a dangling token fails the build with exit 1, a valid
    token builds clean. Matching on the 5xx status is more robust than matching the error text, since
    SvelteKit's `handleHttpError` message carries the `500 <path>` form, not the original throw. The
    scaffolder should emit this same `handleHttpError` shape so every site inherits the fatal backstop.

17. **No reusable-content-fragment concept, so page-fragment copy must own a public route (2026-06-04).**
    Surfaced in the site-refresh Plan 1, Task 5. The Home page wanted its welcome intro to be editable in
    `/admin`, so the copy moved out of a `WELCOME_BLURB` constant and into a routed content page at
    `src/content/pages/home.md`, rendered through cairn. That works, but `pages` is a routed concept: every
    page entry resolves at its own permalink, so the new entry also answers at `/home`, a redundant public
    URL that duplicates `/`. The site does not want a second route for this copy. It wants a fragment: a
    piece of content an editor can edit in `/admin` and that renders into a bespoke layout (here, the Home
    hero) without minting its own public route. cairn `^0.24.0` has no such concept. A concept is either a
    routed content type or it is not modeled at all, so editable page-fragment copy has only the routed
    option. The constant this replaced already anticipated the gap: `src/lib/config.ts` carried a
    `WELCOME_BLURB` comment flagging that the blurb wanted to be editable content rather than a hardcoded
    string, before Task 5 removed the constant. The redundant `/home` URL is accepted for beta and a
    launch-time `/home` -> `/` redirect is filed in `BACKLOG.md`. Fix: add a content-fragment concept to
    the engine. A fragment is editable in `/admin` and addressable by id for a site layout to pull and
    render, but it carries no permalink and generates no route, so a site can move bespoke-layout copy into
    `/admin` without a duplicate public URL.

18. **`createRenderer` has no post-rehype plugin hook, so a render pass that needs the final slug ids
    cannot live in site code (2026-06-04).** Surfaced while authoring site-refresh Plan 3, the Training
    hub. The page wants a `toc` directive: a small post-pass that reads the rendered `<h2>` slug ids and
    fills a `:::toc` placeholder, so the on-page table of contents stays in sync instead of being
    hand-maintained. The engine assigns those ids with `rehypeSlug`, which runs after the directive
    dispatch and after the sanitize floor (`rehypeRaw -> sanitize -> dispatch -> rehypeSlug -> anchorRel ->
    stringify`). A toc pass must therefore run after `rehypeSlug`, and the site has no way to add one.
    `RendererOptions` exposes `stagger`, `sanitizeSchema`, `unsafeDisableSanitize`, and `anchorRel`, none
    of which is a plugin slot. A registry `build(ctx)` sees only its own slots, never sibling slugs, so the
    toc cannot be an ordinary component. Both escape hatches fail. Mutating the returned `rehypePlugins`
    array does nothing, since `createRenderer` already composed the processor with `.use(rehypePlugins)`.
    Hand-rolling a parallel processor from the exported plugin arrays breaks cairn-token resolution,
    because the VFile resolve key the engine reads (`CAIRN_RESOLVE`) and the `remarkResolveCairnLinks`
    plugin are both unexported. The only site-only path left is an HTML-string rewrite of `renderMarkdown`
    output, which reintroduces exactly the regex HTML surgery the directive pipeline was built to remove
    (ecnordic BACKLOG #8, closed). Fix: add a post-rehype hook to `RendererOptions`, for example
    `rehypePost?: PluggableList`, appended after `rehypeSlug` and before `rehypeStringify`, so a site can
    register a pass that reads the final tree with slug ids and still flows through the engine's resolve
    and stringify. With that hook the ecnordic toc is a few lines: a `:::toc` placeholder component plus a
    rehype plugin that collects `<h2 id>` and fills it.

## Scaffolder implications

These findings read as "the site had to hand-assemble or get right by hand what the scaffolder should
emit." The `create-cairn-site` work inherits this checklist, so a fresh site starts correct instead of
discovering each gap the way ecnordic did.

- **Emit the manifest wiring whole.** The regenerate script (`scripts/build-manifest.mjs`), the
  `cairn:manifest` package script, the committed `src/content/.cairn/index.json`, and the
  `verifyManifest(buildSiteManifest(...))` backstop in the content layer are four coupled pieces a site
  must assemble and is easy to get subtly wrong (general findings 12 and 13). Scaffold all four together.
- **Emit a build that fails closed on a dangling link.** Do not ship `prerender.handleHttpError: 'warn'`
  in the scaffolded `svelte.config.js`, or pair it with a targeted handler that re-throws the cairn
  link error, so the dangling-token backstop the content-graph promises is fatal by default (finding 16).
- **Register all four admin actions by default.** The route stub should carry
  `{ save, delete, rename }` (and the `editLoad` that ships the picker targets), so a site opts out of a
  lifecycle action rather than forgetting to opt in (finding 14).
- **Import the whole public surface from one obvious place.** Scaffold the delivery imports so a site
  author does not have to learn the root-versus-`/delivery` split by trial and error, and keep the
  node-test path component-free (SvelteKit-fit findings 4 and 8).
- **Teach the single sanitize floor.** The scaffolded render wires `createRenderer(registry, {
  sanitizeSchema })` extending the engine floor, with no site-owned second pass, so a site never carries
  the redundant `sanitizeHtml` ecnordic had to delete (general findings 8 and 9).
- **State the `cairn:` link constraint in the scaffolded content README.** `cairn:` resolves posts and
  pages, not `+page.svelte` routes; a hand-built route keeps an absolute path (finding 15).
