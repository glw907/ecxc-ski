# ecnordic cairn 0.21 migration, Plan A: the breaking floor

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get ecnordic compiling and rendering on `@glw907/cairn-cms ^0.21.0` with zero URL movement and no visible content change, by porting the adapter to the schema contract, porting the seven directive components to the `build(ctx)` slot model, rewriting the five directive content files to the slot syntax, reconciling the sanitize floor onto the engine's, and adopting `createSiteIndexes`.

**Architecture:** A breaking migration. The single version bump breaks the adapter (0.13 dropped `fields`/`validate` for one `schema` member) and the components (0.12 changed `build(node)` to `build(ctx)` and removed `splitHead`) at once, so the build stays red from Task 1 until the floor is restored. The cairn showcase (`../cairn-cms/examples/showcase`) is the worked reference for every target shape. ecnordic's existing characterization and snapshot tests are the TDD anchor: update each test's expected output to the new authoring, then port the code until it matches.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, `@glw907/cairn-cms ^0.21.0`, hastscript, vitest. ecnordic is an npm-workspaces member of `/home/glw907/Projects/cairn`.

**Design reference:** `docs/superpowers/specs/2026-06-02-ecnordic-cairn-0.21-migration-design.md` (approved).

---

## Conventions for every task

- Work in `/home/glw907/Projects/cairn/ecnordic-ski` on branch `main`. **Do NOT push.** A push deploys ecnordic to production. Run every gate locally; leave `main` committed and unpushed.
- Test-first: change the failing test or fixture to the new expected output, run it and watch it fail for the right reason, then port the code until it passes.
- The phase gate is `npm run check` 0 errors 0 warnings, `npm test` exit 0, and `npm run build` exit 0. The build stays red across Tasks 1 through 6; only Task 7 restores the full green gate. Each intermediate task runs its own targeted test.
- Commit specific files, never `git add -A`. Commit footer: `Co-Authored-By: Claude <noreply@anthropic.com>`. No em dashes in commit bodies or code comments; plain voice (the prose guard runs on writes).
- The content guard runs on `src/content/**/*.md`. Task 4 edits content, so its rewrites follow `docs/content-guide.md` and the controlled tag vocabulary.
- **Capture DX friction.** Every task ends by appending to `docs/cairn-dx-findings.md` any cairn-cms friction it hit (needless complexity, missing or poor docs, busywork, over-cleverness): the symptom, the file or API, and a concrete suggested fix. The seed findings are in the design spec section 5. Task 0 creates the file.
- The worked reference for every 0.21 shape is the showcase: `/home/glw907/Projects/cairn/cairn-cms/examples/showcase/src/lib/cairn.config.ts` (adapter, a `build(ctx)` component), `.../src/lib/content.ts` (createSiteIndexes), `.../scripts/build-manifest.mjs`, and `.../src/content/posts/2026-03-10-callout.md` (slot syntax).

## Reference values (verified against the live engine, 2026-06-02)

- `@glw907/cairn-cms` exports `defineAdapter`, `defineFields`, `createRenderer`, `defineRegistry`, `glyph`, `iconSpan`, `cardShell`, `strProp`, `markFirstList`, `isElement`, and the types `ComponentDef`, `IconSet`, `MakeIcon`. `splitHead` is REMOVED.
- `defineFields([{ type, name, label, required?, options?, rows? }, ...])` declares a concept schema. The field `type` values ecnordic uses: `text`, `date`, `textarea`, `tags`, `boolean`. Validate-once serves only declared fields and omits empty optional values. There is no separate `validate` member.
- A `ComponentDef` is `{ name, label, description, use?, insertTemplate?, build: (ctx) => Element, attributes?, slots? }`. `ComponentContext` is `{ attributes: Record<string, string | boolean>, slot(name): ElementContent[], items(name): ElementContent[][], node: Element }`. A slot is `{ name, label, kind, required?, help?, itemFields? }` with `kind` of `inline`, `markdown`, or `repeatable`. The slots named `title` and `body` are special; `title` is the inline `[...]` label and `body` is the directive's content.
- An attribute is `{ key, label, type, required?, default?, options?, help? }` with `type` of `text`, `select`, `icon`, or `boolean`. An `icon` attribute's value is a key into the adapter's `icons: IconSet`.
- `createRenderer(registry, { stagger?, sanitizeSchema?, unsafeDisableSanitize? })`. The sanitize floor is on by default, applied after `rehype-raw` and before the component dispatch. `sanitizeSchema` is an extend-only `(defaults: Schema) => Schema` hook.
- `createSiteIndexes(adapter, siteConfig, { posts: rawGlob, pages: rawGlob })` returns `{ site, posts, pages }`. It hard-fails on a missing glob key for a declared concept. `parseSiteConfig(yaml)` parses the YAML.
- Slot markdown syntax: `:::card[Title]{attr="value"}` then the body, then `:::`. A directive that nests another directive block uses one more colon on the outer fence (`::::split[Title]` wrapping inner `:::panel`).

## File structure

- Modify `package.json`: bump `@glw907/cairn-cms` to `^0.21.0`.
- Modify `src/lib/cairn.config.ts`: `defineAdapter` plus one `schema: defineFields([...])` per concept; drop the `validate` members and the `content-schema` import; add the `icons` member.
- Modify `src/lib/content-schema.ts`: keep the two exported frontmatter interfaces; delete the two validator functions (folded into the schema).
- Modify `src/tests/content-schema.test.ts`: drop the validator-function tests (the schema now validates); keep any interface-level assertions.
- Modify `src/lib/markdown/components.ts`: port all seven `build(node)` to `build(ctx)`; add `attributes`/`slots` to each `ComponentDef`; move `alert.defaultIconByRole` into `buildAlert`.
- Modify `src/lib/markdown/icons.ts`: re-export `ICON_PATHS` typed as `IconSet` (or leave as is and reference it as the adapter `icons`).
- Modify `src/tests/markdown/components.test.ts`, `src/tests/markdown/characterization.test.ts`, `src/tests/markdown/directives.test.ts`: update the fixture markdown to the slot syntax and the expected output to the ported build output.
- Modify the five directive content files under `src/content/pages/*.md`: rewrite to the slot syntax.
- Modify `src/lib/markdown/sanitize.ts` and `src/lib/markdown/render.ts` and `src/lib/utils.ts`: drop the site-level sanitize pass; move ecnordic's allowlist into a `sanitizeSchema` passed to `createRenderer`.
- Modify `src/tests/markdown/sanitize.test.ts`, `src/tests/markdown/sanitized-characterization.test.ts`: repoint to the engine-floor render.
- Modify `src/lib/content.ts`: collapse to `createSiteIndexes`, exporting `site`, `ORIGIN`, `SITE_DESCRIPTION`; drop the hand-rolled helpers.
- Modify `src/routes/[...path]/+page.server.ts` and `+page.svelte`: adopt `createPublicRoutes` and `<CairnHead>`.
- Modify `src/routes/+page.server.ts`, `src/routes/tags/+page.server.ts`, `src/routes/tags/[tag]/+page.server.ts`: read the engine `site` index instead of the hand-rolled helpers.
- Modify `src/routes/feed.xml/+server.ts`, `src/routes/feed.json/+server.ts`, `src/routes/sitemap.xml/+server.ts`, `src/routes/robots.txt/+server.ts`: use the response helpers.
- Create `docs/cairn-dx-findings.md`: the running DX log.

---

## Task 0: start the DX-findings log

**Files:**
- Create: `docs/cairn-dx-findings.md`

- [ ] **Step 1: Create the log with the seed findings**

Create `docs/cairn-dx-findings.md`:

```markdown
# cairn-cms DX findings (from the ecnordic 0.21 migration)

Friction this migration hit in the cairn-cms consumer surface. Each entry: the symptom, where it
bit, and a concrete suggested fix. The pass-end synthesis (Plan B, final task) files these as
engine backlog items in cairn-cms.

The primary lens is SvelteKit-developer fit: cairn is a fully SvelteKit tool, so the test that
matters most is whether each step feels native to a SvelteKit developer. Record SvelteKit-fit
observations in their own section below, and rank them above cosmetic friction.

## SvelteKit fit

Does cairn feel native to a SvelteKit developer? One entry per surface as you wire it. Prompts: does
the adapter read like ordinary config; do the routes read like normal `load`/`actions`/`+server`
handlers; do the types flow without casts; do `$props`/`$app/state`/the runes behave; does
`createPublicRoutes`/`CairnHead`/`createContentRoutes` compose like a SvelteKit library should; are
the import paths and the export map obvious. Note both what flowed naturally and what fought a
SvelteKit idiom.

## Findings

1. **Coupled breaking changes force a big-bang migration.** 0.12 (the build signature) and 0.13
   (the adapter contract) both gate compilation, so a consumer bumps and the repo does not compile
   until the adapter and every component are ported together. Fix: a per-version `MIGRATION.md`, or a
   codemod, or a deprecation window that keeps the old members working with a warning.
2. **`splitHead` removed with no migration note.** The "first `##` is the title" helper is gone,
   replaced by the `title` slot, with no changelog pointer. Fix: a changelog entry naming the
   replacement.
```

- [ ] **Step 2: Commit**

```bash
git add docs/cairn-dx-findings.md
git commit -m "docs: start the cairn-cms DX-findings log for the 0.21 migration

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 1: bump the dependency to ^0.21.0 and relock

**Files:**
- Modify: `package.json`

ecnordic is a member of the `/home/glw907/Projects/cairn` npm workspace, so a plain `npm install` from here rewrites the ROOT lock and leaves ecnordic's committed lock stale, which breaks CI `npm ci`. Install standalone with the documented move-aside relock.

- [ ] **Step 1: Edit `package.json`**

In `dependencies`, change the cairn pin:

```jsonc
"@glw907/cairn-cms": "^0.21.0",
```

- [ ] **Step 2: Relock standalone**

Temporarily move the workspace-root manifest and lock aside, relock from inside ecnordic, then restore the root files:

```bash
mv /home/glw907/Projects/cairn/package.json /home/glw907/Projects/cairn/package.json.aside
mv /home/glw907/Projects/cairn/package-lock.json /home/glw907/Projects/cairn/package-lock.json.aside
npm install --package-lock-only --ignore-scripts
mv /home/glw907/Projects/cairn/package.json.aside /home/glw907/Projects/cairn/package.json
mv /home/glw907/Projects/cairn/package-lock.json.aside /home/glw907/Projects/cairn/package-lock.json
```

Confirm `package-lock.json` (ecnordic's own) now resolves `@glw907/cairn-cms` at a `0.21.x`.

- [ ] **Step 3: Verify the install resolved (the build is expected to be red)**

Run: `node -e "console.log(require('./node_modules/@glw907/cairn-cms/package.json').version)"`
Expected: a `0.21.x`. `npm run check` is red from here until Task 7; that is expected.

- [ ] **Step 4: Capture DX friction, then commit**

Append any friction to `docs/cairn-dx-findings.md` (the workspace-member relock dance is a candidate). Then:

```bash
git add package.json package-lock.json docs/cairn-dx-findings.md
git commit -m "build: bump cairn-cms to ^0.21.0

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: port the adapter to the schema contract

**Files:**
- Modify: `src/lib/cairn.config.ts`
- Modify: `src/lib/content-schema.ts`
- Modify: `src/tests/content-schema.test.ts`

The adapter moves from `fields` plus a `validate` function to one `schema: defineFields([...])` per concept, wrapped in `defineAdapter`. The old validators enforced `required` and the post tag vocabulary; both are expressible as field declarations (`required: true`, and the `tags` field's `options`). The custom calendar-date check and the per-field error messages are dropped, because validate-once covers type and required, and the controlled `tags` vocabulary rides on the field `options`. Confirm against the real validators that nothing else load-bearing is lost; record any lost rule as a DX finding (the engine has no per-field custom validator hook).

- [ ] **Step 1: Rewrite `src/lib/cairn.config.ts`**

```ts
// ecnordic.ski's cairn adapter. The site-specific half of the CMS: which repo to commit to, the
// editable concepts and their schema, the directive component registry, and the engine render the
// editor preview mirrors. One defineFields declaration per concept is the single source of truth
// for the editor form, the validator, and the inferred frontmatter type.
import { defineAdapter, defineFields } from '@glw907/cairn-cms';
import { ecnordicRegistry } from './markdown/components.js';
import { markdownToHtml } from './utils.js';
import { ICON_PATHS } from './markdown/icons.js';
import { POST_TAGS, siteConfig, siteEmail } from './config.js';

export const cairn = defineAdapter({
  siteName: siteConfig.siteName ?? 'EC Nordic',
  content: {
    posts: {
      dir: 'src/content/posts',
      label: 'Posts',
      schema: defineFields([
        { type: 'text', name: 'title', label: 'Title', required: true },
        { type: 'date', name: 'date', label: 'Date', required: true },
        { type: 'textarea', name: 'description', label: 'Description', required: true, rows: 2 },
        { type: 'tags', name: 'tags', label: 'Tags', options: POST_TAGS },
        { type: 'boolean', name: 'draft', label: 'Draft (hidden from the live site)' },
      ]),
    },
    pages: {
      dir: 'src/content/pages',
      label: 'Pages',
      schema: defineFields([{ type: 'text', name: 'title', label: 'Title', required: true }]),
    },
  },
  backend: {
    owner: 'glw907',
    repo: 'ecnordic-ski',
    branch: 'main',
    appId: '3847496',
    installationId: '135372268',
  },
  sender: { from: siteEmail.sender ?? 'noreply@ecnordic.ski' },
  render: (md, opts) => markdownToHtml(md, opts),
  registry: ecnordicRegistry,
  icons: ICON_PATHS,
  navMenu: {
    configPath: 'src/lib/site.config.yaml',
    menuName: 'primary',
    label: 'Navigation',
    maxDepth: 2,
  },
});
```

If `markdownToHtml` does not yet take a second `opts` argument, leave its call as `(md) => markdownToHtml(md)`; Task 5 settles the render signature. Confirm the `defineFields` field shape (`rows` on a `textarea`, `options` on a `tags` field) is accepted by the 0.21 type; if a field property is rejected, that is a DX finding (the old `fields` shape did not survive verbatim), and adjust to the accepted shape.

- [ ] **Step 2: Trim `src/lib/content-schema.ts`**

Keep the two exported interfaces (`PostFrontmatter`, `PageFrontmatter`) if anything still imports them; delete `validatePostFrontmatter`, `validatePageFrontmatter`, and the now-unused `ISO_DATE`/`allowedTags`/`isoFromValue` import if nothing else uses them. Grep first: `grep -rn "validatePostFrontmatter\|validatePageFrontmatter\|PostFrontmatter\|PageFrontmatter" src/`. Remove only what is now unreferenced.

- [ ] **Step 3: Update `src/tests/content-schema.test.ts`**

The validator functions are gone, so delete the tests that call them. If the file is left empty, delete the file. If it asserts the controlled tag vocabulary, move that assertion to a small adapter test that reads `cairn.content.posts.schema` and confirms the `tags` field's `options` equals `POST_TAGS`.

Run: `npx vitest run src/tests/content-schema.test.ts` (or confirm the file is removed).
Expected: PASS (or the file no longer exists).

- [ ] **Step 4: Capture DX friction, then commit**

Append findings (validate-once narrowing, any rejected field property, any lost validator rule). Then:

```bash
git add src/lib/cairn.config.ts src/lib/content-schema.ts src/tests/content-schema.test.ts docs/cairn-dx-findings.md
git commit -m "feat: port the cairn adapter to the schema contract

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: port the seven components to the build(ctx) slot model

**Files:**
- Modify: `src/lib/markdown/components.ts`
- Modify: `src/tests/markdown/components.test.ts`, `src/tests/markdown/characterization.test.ts`, `src/tests/markdown/directives.test.ts`

Each component moves from `build(node)` plus `splitHead` to `build(ctx)` reading named slots. The slot and attribute contract per component, derived from the current builds:

| Component | attributes | slots | build target (unchanged class structure) |
|---|---|---|---|
| `card` | `icon` (icon) | `title` (inline, required), `body` (markdown) | `cardShell(CARD_CLASS, [head(icon?, title), div.section-body(body)])` |
| `passage` | `icon` (icon) | `title` (inline, required), `body` (markdown) | `section.ec-passage [head(icon?, title), div.section-body(body)]` |
| `grid` | `icon` (icon) | `title` (inline), `body` (markdown) | with title: `cardShell(CARD_CLASS, [head, div.section-body(markFirstList(body) ?? body)])`; no title (nested): the bare `markFirstList(body)` |
| `alert` | `role` (select: `caution`, required), `icon` (icon) | `title` (inline, required), `body` (markdown) | `div[role=alert].ec-alert.ec-alert-{role}` with the icon prepended to the title and the body after; default `icon` to `warning` when `role` is `caution` and no icon given |
| `cta` | `icon` (icon) | `title` (inline, required), `body` (markdown) | `section.CTA_CLASS > div.card-body.items-center.text-center [span.ec-chip(icon), title.card-title, div.section-body(body with download-link promoted)]` |
| `split` | (none) | `title` (inline, required), `body` (markdown, contains `:::panel`) | `cardShell(CARD_CLASS, [div.ec-head(title.card-title), div.section-body > div.ec-split(panels)])` |
| `panel` | `icon` (icon), `role` (select) | `body` (markdown) | `div.ec-panel [iconSpan(icon, role)?, body]` |

Decision baked in: `grid` keeps the body-markdown plus `markFirstList` shape rather than a repeatable `items` slot, to preserve the content authoring and the exact output. A repeatable-items upgrade is a recorded follow-up, not this pass.

The head helper that `splitHead` provided is rebuilt inline: a head is `h('div', { className: ['ec-head'] }, [icon?, h('div', { className: ['ec-head-text'] }, ctx.slot('title'))])`. Read the current `splitHead` output (the engine 0.10 source in `node_modules/@glw907/cairn-cms` before the bump, or the characterization snapshot) so the head markup matches exactly; the characterization test is the authority.

- [ ] **Step 1: Update the test fixtures to the slot syntax (test-first)**

In each of `components.test.ts`, `characterization.test.ts`, `directives.test.ts`, find the fixture markdown that drives each component and rewrite it to the slot syntax. The transform: drop the `## Title` heading and put the title in the inline `[Title]` label; quote attribute values; use `::::` on a fence that wraps a nested directive. Worked examples:

```
:::card{icon=flag}        ->   :::card[Title]{icon="flag"}
## Title                       Body copy.
                               :::
Body copy.
:::

:::alert{role=caution}    ->   :::alert[Heads up]{role="caution"}
## Heads up                    What to watch for.
                               :::
What to watch for.
:::

:::split                  ->   ::::split[Title]
## Title
                               :::panel[]{icon="hand-coins"}
:::panel{icon=hand-coins}      First panel.
First panel.                   :::
:::
                               :::panel[]{icon="handshake"}
:::panel{icon=handshake}       Second panel.
Second panel.                  :::
:::                            ::::
```

Update each test's EXPECTED output to the build target in the table above (keep the class structure identical to the current build; only the title and head wiring changes). Run the suite and watch the component tests fail because the code still uses `build(node)`/`splitHead`:

Run: `npx vitest run src/tests/markdown/`
Expected: FAIL (the builds do not compile against the new `ComponentContext`, or the output does not match).

- [ ] **Step 2: Rewrite `src/lib/markdown/components.ts` to `build(ctx)`**

Replace the `splitHead`/`build(node)` builds with `build(ctx)` versions following the contract table. Use `ctx.slot('title')`, `ctx.slot('body')`, and `ctx.attributes.icon` / `ctx.attributes.role`. Keep `ecGlyph`, `makeIcon`, `CARD_CLASS`, `CTA_CLASS`, and `promoteDownloadLink` as they are. Build a local `head(ctx)` helper to replace `splitHead`. Add the `attributes` and `slots` arrays to each `ComponentDef`, and rewrite each `insertTemplate` to the slot syntax. Move `alert`'s `defaultIconByRole` logic into `buildAlert` (default `icon` to `warning` when `role` is `caution` and no icon attribute is set). Drop the `defaultIconByRole` member from the `ComponentDef`.

The deterministic skeleton for the simple components (match the snapshot for exact head markup):

```ts
function head(ctx: ComponentContext, icon?: string): Element {
  const kids: ElementContent[] = [];
  if (icon) kids.push(makeIcon(icon));
  kids.push(h('div', { className: ['ec-head-text'] }, ctx.slot('title')));
  return h('div', { className: ['ec-head'] }, kids);
}

function buildCard(ctx: ComponentContext): Element {
  const icon = typeof ctx.attributes.icon === 'string' ? ctx.attributes.icon : undefined;
  return cardShell(CARD_CLASS, [head(ctx, icon), h('div', { className: ['section-body'] }, ctx.slot('body'))]);
}
```

Port `passage`, `grid`, `alert`, `cta`, `split`, `panel` the same way, each matching its current output. For `split`, the panels arrive already rendered in `ctx.slot('body')` (the dispatcher recursion renders the nested `:::panel` first), so filter the body children for `.ec-panel` exactly as the current `buildSplit` does. For `cta`, run `promoteDownloadLink(ctx.slot('body'))` before wrapping. For `alert`, prepend the glyph to the title slot's children.

- [ ] **Step 3: Run the component tests to verify they pass**

Run: `npx vitest run src/tests/markdown/`
Expected: PASS (every component characterization matches).

- [ ] **Step 4: Capture DX friction, then commit**

Append findings (the `splitHead` removal, the head-rebuild busywork, the slot-grammar discovery). Then:

```bash
git add src/lib/markdown/components.ts src/tests/markdown/ docs/cairn-dx-findings.md
git commit -m "feat: port the directive components to the build(ctx) slot model

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: rewrite the five directive content files to the slot syntax

**Files:**
- Modify: the five `src/content/pages/*.md` files that use directives (find them: `grep -rl ':::' src/content/`)

Apply the same transform as the test fixtures to the real content: drop each `## Title` heading and move it to the inline `[Title]` label; quote attribute values; add the extra colon on a fence that wraps a nested directive (`split`). The page output must stay equivalent, proven by the page render and the URL inventory.

- [ ] **Step 1: Rewrite each file, one at a time**

For each file, apply the transform and save. The content guard runs on the write, so keep the prose unchanged (only the directive fences and titles move). After each file, render-check it.

- [ ] **Step 2: Run the URL inventory and content tests**

Run: `npx vitest run src/tests/content/ tests/config/`
Expected: PASS. The `url-inventory` test confirms zero URL movement; the content test confirms each page still resolves and renders.

- [ ] **Step 3: Spot-check the rendered pages**

Run: `npm run build` and confirm exit 0, or render each page through the test harness and confirm the directive markup matches the pre-migration structure (the characterization gate). If a page's rendered structure drifts, fix the content or the component port until it matches.

- [ ] **Step 4: Capture DX friction, then commit**

```bash
git add src/content/pages/ docs/cairn-dx-findings.md
git commit -m "content: rewrite the directive pages to the slot syntax

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: reconcile the sanitize floor onto the engine

**Files:**
- Modify: `src/lib/markdown/render.ts`
- Modify: `src/lib/markdown/sanitize.ts` (repurpose to export a schema extender)
- Modify: `src/lib/utils.ts`
- Modify: `src/tests/markdown/sanitize.test.ts`, `src/tests/markdown/sanitized-characterization.test.ts`

The engine's `createRenderer` now applies a default `rehype-sanitize` floor after `rehype-raw` and before the dispatch. ecnordic's own post-render `sanitizeHtml` pass is now redundant. Move ecnordic's allowlist (free `className`, drop `style`, add `section`/`nav`/`svg`/`path`, `data-rise`/`id`/`role`/aria globally, `target`/`rel`/`download` on `a`) into a `sanitizeSchema` passed to `createRenderer`, and drop the second pass.

- [ ] **Step 1: Move the allowlist into a `sanitizeSchema` (test-first)**

In `src/tests/markdown/sanitized-characterization.test.ts`, change the expectation from "the site sanitize pass cleaned the engine output" to "the engine render already cleaned the output": render a fixture containing a directive plus a hostile `<script>` and an `<a class="download-link" style="x">` through the engine renderer alone, and assert the script is gone, the `download-link` anchor and its `target`/`rel` survive, the `data-rise` ordinal and svg/path survive, and `style` is dropped. Run it and watch it fail (the renderer does not yet carry ecnordic's allowlist).

- [ ] **Step 2: Pass `sanitizeSchema` to `createRenderer`**

In `src/lib/markdown/render.ts`, build the extend-only schema from ecnordic's current `sanitize.ts` allowlist and pass it:

```ts
import { createRenderer } from '@glw907/cairn-cms';
import { ecnordicRegistry } from './components';
import { ecSanitizeSchema } from './sanitize';

const renderer = createRenderer(ecnordicRegistry, { stagger: true, sanitizeSchema: ecSanitizeSchema });

export const remarkEcPlugins = renderer.remarkPlugins;
export const rehypeEcPlugins = renderer.rehypePlugins;
export const renderMarkdown = renderer.renderMarkdown;
```

Rewrite `src/lib/markdown/sanitize.ts` to export `ecSanitizeSchema(defaults: Schema): Schema` instead of the standalone processor. It takes the engine's default floor schema and returns it extended with ecnordic's additions (the `freeClassName` logic, `section`/`nav`/`svg`/`path` tags, the global `data-rise`/`id`/`role`/aria attributes, the `a` `target`/`rel`/`download`, the `svg`/`path` attributes, `clobberPrefix: ''`). Extend the passed `defaults`, do not rebuild from `rehype-sanitize`'s `defaultSchema`, so ecnordic's additions sit on top of the engine floor (which already admits the directive markers and `className` on anchors).

- [ ] **Step 3: Drop the second pass in `src/lib/utils.ts`**

`markdownToHtml` becomes the engine render alone:

```ts
export function markdownToHtml(md: string, opts?: Parameters<typeof renderMarkdown>[1]): Promise<string> {
  return renderMarkdown(md, opts);
}
```

Remove the `sanitizeHtml` import and call. Confirm the `render.ts` signature for the second argument; if `renderMarkdown` takes no options, drop the `opts` parameter here and in the adapter `render`.

- [ ] **Step 4: Run the sanitize tests**

Run: `npx vitest run src/tests/markdown/sanitize.test.ts src/tests/markdown/sanitized-characterization.test.ts`
Expected: PASS. If `sanitize.test.ts` tested the standalone processor, repoint it to `ecSanitizeSchema` or fold it into the characterization test.

- [ ] **Step 5: Capture DX friction, then commit**

Append the sanitize double-floor finding. Then:

```bash
git add src/lib/markdown/render.ts src/lib/markdown/sanitize.ts src/lib/utils.ts src/tests/markdown/ docs/cairn-dx-findings.md
git commit -m "refactor: extend the engine sanitize floor, drop the redundant site pass

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: adopt the idiomatic engine public surface

**Files:**
- Modify: `src/lib/content.ts`
- Modify: `src/routes/[...path]/+page.server.ts`, `src/routes/[...path]/+page.svelte`
- Modify: `src/routes/+page.server.ts`, `src/routes/tags/+page.server.ts`, `src/routes/tags/[tag]/+page.server.ts`
- Modify: `src/routes/feed.xml/+server.ts`, `src/routes/feed.json/+server.ts`, `src/routes/sitemap.xml/+server.ts`, `src/routes/robots.txt/+server.ts`
- Modify: `src/tests/content/content.test.ts`, `src/tests/content/url-inventory.test.ts` if their imports change

Replace ecnordic's hand-rolled delivery with the engine's idiomatic surface, mirroring the showcase. cairn is a fully SvelteKit tool, so this is the heart of making ecnordic a natural SvelteKit-plus-cairn site. The hand-rolled `byPermalink`, `resolvePermalink`, `contentPermalinks`, `toListItem`, `PostListItem`, `allPosts`, `postsByTag`, `allTags`, `feedItems`, `postBody`, and the manual `buildSeoMeta` head all go. The `url-inventory` test is the contract: every URL must stay put. Work the steps in order, since later steps import what `content.ts` now exports. The build stays red until Task 7; run each step's targeted test.

The worked references are the showcase routes: `../cairn-cms/examples/showcase/src/lib/content.ts`, `.../routes/[...path]/+page.server.ts` and `+page.svelte`, `.../routes/feed.xml/+server.ts`, `.../routes/sitemap.xml/+server.ts`, `.../routes/robots.txt/+server.ts`.

- [ ] **Step 1: Collapse `content.ts` to `createSiteIndexes`**

Rewrite `src/lib/content.ts` to the showcase shape:

```ts
// The site's one delivery content layer: glob the markdown, hand the adapter to createSiteIndexes,
// export the site index and the origin constants the public routes read.
import { createSiteIndexes } from '@glw907/cairn-cms/delivery';
import { parseSiteConfig } from '@glw907/cairn-cms';
import { cairn } from './cairn.config.js';
import siteYaml from './site.config.yaml?raw';
import { SITE_URL, SITE_DESCRIPTION as DESC } from './config.js';

const postsRaw = import.meta.glob('/src/content/posts/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const pagesRaw = import.meta.glob('/src/content/pages/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const siteConfig = parseSiteConfig(siteYaml);
const indexes = createSiteIndexes(cairn, siteConfig, { posts: postsRaw, pages: pagesRaw });

export const site = indexes.site;
export const ORIGIN = SITE_URL;
export const SITE_DESCRIPTION = DESC;
```

Use ecnordic's real `SITE_URL` and description constants from `./config.js` (confirm the export names; if `SITE_DESCRIPTION` does not exist there, use the site's existing description constant). If `parseSiteConfig` lives behind a different entry in 0.21, find it (`grep -rn "export.*parseSiteConfig" ../cairn-cms/src`) and record the surprise as a DX finding.

- [ ] **Step 2: Adopt `createPublicRoutes` in the catch-all**

Rewrite `src/routes/[...path]/+page.server.ts`:

```ts
import type { PageServerLoad, EntryGenerator } from './$types';
import { createPublicRoutes } from '@glw907/cairn-cms/delivery';
import { site, ORIGIN, SITE_DESCRIPTION } from '$lib/content';
import { cairn } from '$lib/cairn.config';

export const prerender = true;

const routes = createPublicRoutes({
  site,
  render: cairn.render,
  origin: ORIGIN,
  siteName: cairn.siteName,
  description: SITE_DESCRIPTION,
  feeds: { rss: ORIGIN + '/feed.xml', json: ORIGIN + '/feed.json' },
});

export const entries: EntryGenerator = () => routes.entries();
export const load: PageServerLoad = ({ url }) => routes.entryLoad({ url });
```

`entryLoad` resolves `cairn:` links and builds the SEO internally, so the manual `buildSeoMeta` and the resolver threading are gone. The returned `data` carries `entry`, `html`, `seo`, and the concept; confirm the exact `EntryData` shape against `../cairn-cms/src/lib/sveltekit/public-routes.ts`.

- [ ] **Step 3: Adopt `<CairnHead>` in the catch-all page**

In `src/routes/[...path]/+page.svelte`, replace the inline `<svelte:head>` SEO loop with `<CairnHead seo={data.seo} />` and keep ecnordic's post/page presentation (the `.post-body`, `.post-date`, `.post-tags`, `.page-title` markup), reading `data.entry`, `data.html`, and the concept branch from the new `EntryData` shape:

```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import { CairnHead } from '@glw907/cairn-cms/delivery';
  let { data }: { data: PageData } = $props();
</script>

<CairnHead seo={data.seo} />
```

Map ecnordic's current template fields (title, date, tags, html) onto the `EntryData` properties. Keep the design-system classes; only the head and the data source change.

- [ ] **Step 4: Rewire the home, tags-index, and tag routes to the engine index**

Read the post summaries from the engine `site` index instead of the hand-rolled helpers. The `site` index exposes `site.concept('posts')` (a concept index with `.all()`, `.byId()`, `.byTag()`, `.allTags()`), and each summary carries `title`, `date`, `tags`, `permalink`, `id`, `excerpt`. If `createPublicRoutes` exposes list loaders (`archiveLoad`/`tagLoad`/`tagIndexLoad`, per its `ListData`/`TagData`/`TagIndexData` types), prefer those; otherwise read `site.concept('posts')` directly.

`src/routes/+page.server.ts` (home, featured first post):

```ts
import type { PageServerLoad } from './$types';
import { site } from '$lib/content';
import { cairn } from '$lib/cairn.config';

export const load: PageServerLoad = async () => {
  const posts = site.concept('posts')?.all() ?? [];
  const first = posts[0];
  const featured = first
    ? { permalink: first.permalink, title: first.title, date: first.date, tags: first.tags, html: await cairn.render(site.concept('posts')!.byId(first.id)!.body) }
    : null;
  return { posts, featured };
};
```

`src/routes/tags/+page.server.ts`: `return { tags: site.concept('posts')?.allTags() ?? [] };`. `src/routes/tags/[tag]/+page.server.ts`: `entries()` maps `site.concept('posts')?.allTags()`, and `load` reads `site.concept('posts')?.byTag(params.tag)`, 404ing on empty. Confirm the concept-index method names against `../cairn-cms/src/lib/delivery`; if a method differs, use the real name and note any surprise as a DX finding. Update the `+page.svelte` for each only if a field name moved (the summaries carry the same fields the hand-rolled list items did).

- [ ] **Step 5: Adopt the response helpers in the feeds, sitemap, and robots**

Rewrite the four `+server.ts` routes to mirror the showcase. The feeds thread the resolver explicitly via `buildLinkResolver(site)`:

```ts
// src/routes/feed.xml/+server.ts
import type { RequestHandler } from './$types';
import { rssResponse, buildLinkResolver, type FeedItem } from '@glw907/cairn-cms/delivery';
import { site, ORIGIN, SITE_DESCRIPTION } from '$lib/content';
import { cairn } from '$lib/cairn.config';

export const prerender = true;

export const GET: RequestHandler = async () => {
  const posts = site.concept('posts');
  const toPermalink = buildLinkResolver(site);
  const resolve = (ref: Parameters<typeof toPermalink>[0]) => ORIGIN + toPermalink(ref);
  const items: FeedItem[] = await Promise.all(
    (posts?.all() ?? []).map(async (p) => ({
      title: p.title, url: ORIGIN + p.permalink, date: p.date, summary: p.excerpt,
      contentHtml: await cairn.render(posts!.byId(p.id)!.body, { resolve }), tags: p.tags,
    })),
  );
  return rssResponse({ title: cairn.siteName, description: SITE_DESCRIPTION, siteUrl: ORIGIN, feedUrl: ORIGIN + '/feed.xml' }, items);
};
```

Do `feed.json` with `jsonFeedResponse` and `buildJsonFeed` the same way (read the showcase if it has a `feed.json`; if not, mirror `buildJsonFeed`'s existing ecnordic usage with the response helper). `sitemap.xml` uses `sitemapResponse` over `site.all()`; `robots.txt` uses `robotsResponse({ sitemapUrl, disallow: ['/admin'] })`. Honor ecnordic's `FEED_MAX_ITEMS` cap by slicing the posts list if it was capped before.

- [ ] **Step 6: Run the delivery and URL tests**

Run: `npx vitest run src/tests/content/`
Expected: PASS. The `url-inventory` test is the contract: every public URL is unchanged. If a test imported a now-deleted helper (`allPosts`, `resolvePermalink`), repoint it to the engine index or the route, asserting the same URLs and the same listing order.

- [ ] **Step 7: Capture DX friction, then commit**

Append findings: the delivery-import ambiguity (bare entry versus `/delivery`), and a SvelteKit-naturalness read of `createPublicRoutes`, `CairnHead`, and the response helpers (did the catch-all, the head, and the feeds feel natural to wire, or did anything fight SvelteKit's `load`/`+server` idioms?). Then:

```bash
git add src/lib/content.ts "src/routes/[...path]/" src/routes/+page.server.ts src/routes/tags/ src/routes/feed.xml/ src/routes/feed.json/ src/routes/sitemap.xml/ src/routes/robots.txt/ src/tests/content/ docs/cairn-dx-findings.md
git commit -m "refactor: adopt the idiomatic cairn public surface

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: restore the full green gate

**Files:**
- None new; this task fixes whatever the full gate surfaces.

- [ ] **Step 1: Run the full gate**

Run: `npm run check`, then `npm test`, then `npm run build`.
Expected: `check` 0 errors 0 warnings, `npm test` exit 0, `npm run build` exit 0.

- [ ] **Step 2: Fix every failure**

Common residue: a stale import (`markdownToHtml`'s old signature, a removed `content-schema` export), a `frontmatter.description` read that the validate-once entry shape still serves (it is declared, so it should), the `entry.excerpt` derived field (confirm it still surfaces; if not, that is a DX finding and read the engine `ContentSummary` shape). Fix each until the gate is green. Do not change any URL or any rendered structure; the `url-inventory` and characterization tests guard both.

- [ ] **Step 3: Confirm zero URL movement and render agreement**

Run: `npx vitest run src/tests/content/url-inventory.test.ts src/tests/markdown/characterization.test.ts`
Expected: PASS. These two are the Phase A contract.

- [ ] **Step 4: Capture DX friction, then commit**

Stage the specific files touched (review with `git add -p`, then stage explicit paths, never `-A`):

```bash
git commit -m "fix: restore the full green gate on cairn-cms 0.21

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Verification items (no implementation task)

- **Zero URL movement.** The `url-inventory` test is green at the Phase A tip.
- **Render agreement.** The five directive pages and the component characterization tests render the pre-migration structure.
- **One sanitize floor.** The engine render alone cleans a hostile `<script>` while keeping the directive output, with no second site-level pass.
- **The adapter is the single source of truth.** `cairn.content.posts.schema` drives the editor form, the validator, and the inferred type; no separate `validate` function remains.

## Phase A gate

`npm run check` 0/0, `npm test` exit 0, `npm run build` exit 0, the `url-inventory` and characterization tests green. Do not push. Plan B (content-graph adoption) starts on this green gate.

## Self-review notes

- **Spec coverage.** Bump (Task 1), adapter contract (Task 2), component slot port (Task 3), content rewrites (Task 4), sanitize reconcile (Task 5), idiomatic public-surface adoption (Task 6: createSiteIndexes, createPublicRoutes, CairnHead, the listing routes, the response helpers), green restore (Task 7). The DX-findings deliverable is the per-task capture step plus Task 0; the synthesis is Plan B's final task.
- **Type consistency.** `defineAdapter`, `defineFields`, `ComponentContext`, `createRenderer(..., { sanitizeSchema })`, `createSiteIndexes(adapter, siteConfig, globs)`, and the preserved `content.ts` export signatures are used identically across tasks.
- **Altitude.** The deterministic shapes (adapter, content.ts, sanitize, the simple-component skeleton) carry full code. The seven component builds are contract plus the characterization snapshot as the authority, because the exact head and panel markup must match the existing snapshot rather than invented hast; the showcase and the snapshot are the worked references the porting step reads.
