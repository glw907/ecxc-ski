# ecnordic cairn 0.21 migration, Plan B: content-graph adoption

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adopt the cairn content-graph on ecnordic: a committed, build-verified manifest of the corpus, a build resolver so `cairn:` internal links resolve to live permalinks on the page and in the feeds, the admin delete and rename actions plus the link picker, and the one post's two internal links converted to `cairn:` tokens.

**Architecture:** Additive on Plan A's green floor. Plan A made ecnordic idiomatic: the catch-all runs on `createPublicRoutes`, so `entryLoad` resolves `cairn:` links on every page automatically, and the feeds already thread `buildLinkResolver(site)`. So the resolver is wired; this plan adds the committed manifest and its build backstop (a git-committed JSON projection the build regenerates and verifies, so a raw-git content edit cannot ship a stale graph), registers the admin delete and rename actions, and converts the post's two links to `cairn:` tokens to prove the path end to end. The showcase (`../cairn-cms/examples/showcase`) is the worked reference.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, `@glw907/cairn-cms ^0.21.0`, vitest. ecnordic is an npm-workspaces member of `/home/glw907/Projects/cairn`.

**Design reference:** `docs/superpowers/specs/2026-06-02-ecnordic-cairn-0.21-migration-design.md` (approved). Plan A (`2026-06-02-ecnordic-cairn-0.21-plan-a-breaking-floor.md`) must be green first.

---

## Conventions for every task

- Work in `/home/glw907/Projects/cairn/ecnordic-ski` on branch `main`. **Do NOT push.** A push deploys ecnordic to production.
- Test-first where a behavior changes; the manifest and resolver are proven by the build (a dangling token fails it).
- Gate before each commit: `npm run check` 0/0, `npm test` exit 0, `npm run build` exit 0.
- Commit specific files, never `git add -A`. Footer: `Co-Authored-By: Claude <noreply@anthropic.com>`. No em dashes in commit bodies or code comments; plain voice.
- The content guard runs on `src/content/**/*.md`. Task 4 edits the post, so honor `docs/content-guide.md`.
- **Capture DX friction** in `docs/cairn-dx-findings.md` per task, as in Plan A. Task 5 is the synthesis.
- Reference: `/home/glw907/Projects/cairn/cairn-cms/examples/showcase/scripts/build-manifest.mjs`, `.../src/lib/content.ts` (the `verifyManifest(buildSiteManifest(...))` line), and `.../src/routes/admin/(app)/[concept]/[id]/+page.server.ts` (the actions export).

## Reference values (verified against the live engine, 2026-06-02)

- The adapter's `manifestPath` defaults to `src/content/.cairn/index.json` (ecnordic does not set it, so the default holds). The runtime in `src/lib/cairn.server.ts` is `composeRuntime(cairn, [], urlPolicyFrom(siteConfig))`, and `content = createContentRoutes(runtime)` already exposes `saveAction`, `deleteAction`, `renameAction`, and `editLoad`.
- `buildSiteManifest(adapter, siteConfig, globs)` builds the manifest from the corpus; `verifyManifest(built, committedRaw)` throws on drift. `buildLinkResolver(site)` returns a resolver from a `SiteIndex`. The render option that resolves `cairn:` links is `resolve` (the second argument to `renderMarkdown`, threaded by `markdownToHtml(md, opts)` from Plan A). Confirm the exact option name from the showcase or `../cairn-cms/src/lib/render`.
- `cairn:<concept>/<id>` is the token. ecnordic's pages have ids `crewlab` and `waiver` (the filename stems), so the tokens are `cairn:pages/crewlab` and `cairn:pages/waiver`.
- The build backstop: an unresolved token throws at build (`cairn link target not found`, exit 1).

## File structure

- Create `scripts/build-manifest.mjs`: the manifest regenerate script (copy and adapt the showcase).
- Modify `package.json`: add the `cairn:manifest` script.
- Create `src/content/.cairn/index.json`: the committed manifest (generated).
- Modify `src/lib/content.ts`: the `verifyManifest` build backstop, the `buildLinkResolver`, and thread the resolver through `render`.
- Modify `src/routes/admin/(app)/[concept]/[id]/+page.server.ts`: register `delete` and `rename`.
- Modify `src/content/posts/2026-05-welcome.md`: convert the two page links to `cairn:` tokens.

---

## Task 1: the manifest regenerate script and the committed manifest

**Files:**
- Create: `scripts/build-manifest.mjs`
- Modify: `package.json`
- Create: `src/content/.cairn/index.json`

- [ ] **Step 1: Copy and adapt the showcase script**

Read `/home/glw907/Projects/cairn/cairn-cms/examples/showcase/scripts/build-manifest.mjs`. Copy it to `scripts/build-manifest.mjs` and adapt the globs and the config path to ecnordic (`src/content/posts/*.md`, `src/content/pages/*.md`, `src/lib/site.config.yaml`, the `cairn.config` import). It imports `buildSiteManifest` from the package dist and writes the sorted JSON to `src/content/.cairn/index.json`.

- [ ] **Step 2: Add the package script**

In `package.json` `scripts`, add:

```jsonc
"cairn:manifest": "node scripts/build-manifest.mjs",
```

- [ ] **Step 3: Generate the manifest**

Run: `npm run cairn:manifest`
Expected: it writes `src/content/.cairn/index.json` with one entry per post and page (six entries: one post, five pages), each carrying id, concept, title, permalink, draft, and an empty `links` array (no `cairn:` tokens exist yet).

- [ ] **Step 4: Capture DX friction, then commit**

Append the "manifest adoption is manual wiring" finding (the script, the glob map, the committed file). Then:

```bash
git add scripts/build-manifest.mjs package.json src/content/.cairn/index.json docs/cairn-dx-findings.md
git commit -m "feat: add the content manifest and its regenerate script

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: the manifest build backstop

**Files:**
- Modify: `src/lib/content.ts`

The build regenerates the manifest and fails if the committed file drifted, so a raw-git edit cannot ship a stale graph. The resolver is already wired (Plan A: `entryLoad` resolves on every page, the feeds thread `buildLinkResolver`), so this task only adds the verify backstop, mirroring the showcase `content.ts`.

- [ ] **Step 1: Add the verify backstop**

In `src/lib/content.ts`, after the `createSiteIndexes` call, add:

```ts
import { buildSiteManifest } from '@glw907/cairn-cms/delivery';
import { verifyManifest } from '@glw907/cairn-cms';
import manifestRaw from '/src/content/.cairn/index.json?raw';

// Fail the build if the committed manifest drifted from the corpus. Regenerate with
// `npm run cairn:manifest`.
verifyManifest(buildSiteManifest(cairn, siteConfig, { posts: postsRaw, pages: pagesRaw }), manifestRaw);
```

This reuses the `siteConfig`, `postsRaw`, and `pagesRaw` already in `content.ts` from Plan A. Confirm those bindings still exist (Plan A's collapse kept them); if the collapse inlined them, lift them back to module bindings so the verify call can read them, mirroring the showcase.

- [ ] **Step 2: Run the build**

Run: `npm run build`
Expected: exit 0. The manifest matches the corpus (no drift). No `cairn:` token exists yet, so nothing resolves or fails.

- [ ] **Step 3: Run the gate, then commit**

Run `npm run check` (0/0) and `npm test` (exit 0). Capture any manifest-wiring DX friction. Then:

```bash
git add src/lib/content.ts docs/cairn-dx-findings.md
git commit -m "feat: verify the content manifest at build

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: register the delete and rename actions

**Files:**
- Modify: `src/routes/admin/(app)/[concept]/[id]/+page.server.ts`

The admin edit route registers only `save` today, so the delete and rename controls the engine `EditPage` ships would 404. Register both, mirroring the showcase.

- [ ] **Step 1: Extend the actions export**

```ts
import { content } from '$lib/cairn.server.js';

export const load = content.editLoad;
export const actions = { save: content.saveAction, delete: content.deleteAction, rename: content.renameAction };
```

`editLoad` already ships the picker's `linkTargets` from the manifest, so the link picker works once the manifest exists (Task 1). No further wiring is needed for the picker.

- [ ] **Step 2: Verify the build and the gate**

Run: `npm run build` (exit 0), `npm run check` (0/0), `npm test` (exit 0). The route compiles with the two added actions.

- [ ] **Step 3: Capture DX friction, then commit**

```bash
git add "src/routes/admin/(app)/[concept]/[id]/+page.server.ts" docs/cairn-dx-findings.md
git commit -m "feat: register the delete and rename admin actions

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: convert the post's internal links to cairn tokens

**Files:**
- Modify: `src/content/posts/2026-05-welcome.md`
- Modify: `src/content/.cairn/index.json` (regenerated)

The welcome post links to two pages with absolute paths (`/crewlab`, `/waiver`). Convert them to `cairn:pages/crewlab` and `cairn:pages/waiver`, which resolve to the live permalinks at build and survive a future slug change. This proves the resolver and the build backstop end to end.

- [ ] **Step 1: Edit the link targets**

In `src/content/posts/2026-05-welcome.md`, change `[CrewLAB](/crewlab)` to `[CrewLAB](cairn:pages/crewlab)` and `[waiver](/waiver)` to `[waiver](cairn:pages/waiver)`. The content guard runs on the write. That paragraph carries a pre-existing em dash; if the guard blocks the write on it, fix the em dash to a period or a comma per `docs/content-guide.md` (a legitimate content fix), since the link change is the task and the file must save.

- [ ] **Step 2: Regenerate the manifest**

Run: `npm run cairn:manifest`
Expected: the welcome post's entry now carries two `links` (`{ concept: 'pages', id: 'crewlab' }` and `{ concept: 'pages', id: 'waiver' }`).

- [ ] **Step 3: Prove the build resolves the tokens**

Run: `npm run build`
Expected: exit 0. The prerendered post renders `<a href="/crewlab">CrewLAB</a>` and `<a href="/waiver">waiver</a>` (the live permalinks), and the feeds render the absolute URLs. Confirm no literal `cairn:` token remains in the built output (`grep -r "cairn:pages" .svelte-kit/cloudflare` returns nothing).

- [ ] **Step 4: Prove the backstop fails on a dangling token**

Temporarily change one token to `cairn:pages/does-not-exist`, run `npm run cairn:manifest` then `npm run build`, and confirm the build fails with a target-not-found error (exit 1). Revert the token, regenerate, and confirm the build goes green again. This proves the fail-closed backstop.

- [ ] **Step 5: Run the gate, then commit**

Run `npm run check` (0/0) and `npm test` (exit 0); confirm the `url-inventory` test is still green (the rendered links point at the same URLs, so no URL moved). Then:

```bash
git add src/content/posts/2026-05-welcome.md src/content/.cairn/index.json docs/cairn-dx-findings.md
git commit -m "content: link the welcome post to pages through cairn tokens

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: synthesize the DX findings into the engine backlog

**Files:**
- Modify: `docs/cairn-dx-findings.md` (final pass)
- Create/modify: cairn-cms engine backlog entries

The migration captured DX friction task by task. This task turns the findings into actionable engine backlog items where the fix happens, in cairn-cms.

- [ ] **Step 1: Review, dedupe, and rank by SvelteKit fit**

Read `docs/cairn-dx-findings.md` end to end, including the "SvelteKit fit" section. Merge duplicates, drop anything that turned out to be a non-issue on closer inspection, and make sure each remaining finding has a concrete suggested fix. Rank them by how much they cost a SvelteKit developer who has never seen cairn: a surface that fights a SvelteKit idiom (a handler that cannot be a plain `load`, a type that needs a cast, a concept with no SvelteKit analog, a doc that assumes cairn-internal knowledge) ranks above cosmetic friction. Write a one-paragraph verdict at the top: does working with a cairn site feel native and comfortable to a SvelteKit developer, and where does it not yet.

- [ ] **Step 2: File the findings as cairn-cms backlog items**

For each finding, file an engine backlog item in cairn-cms. Use the cairn-cms backlog mechanism (check `/home/glw907/Projects/cairn/cairn-cms/docs/STATUS.md` and any `BACKLOG.md` for the format; if cairn-cms has no backlog file, record them as a single section in `cairn-cms/docs/STATUS.md` under a "DX backlog from the ecnordic migration" heading, or use the `log-issue` skill). Each item names the symptom, the consumer-facing surface, the suggested fix, and a note that ecnordic's migration is the evidence. Keep ecnordic's `docs/cairn-dx-findings.md` as the source record.

- [ ] **Step 3: Note the scaffolder implications**

The findings that read as "the site had to hand-assemble what the scaffolder should emit" (the manifest wiring, the resolver threading, the sanitize extension, the delivery imports) are the scaffolder's checklist. Add a short "scaffolder implications" section to the findings file listing them, so the `create-cairn-site` work inherits the list.

- [ ] **Step 4: Commit**

```bash
git add docs/cairn-dx-findings.md
git commit -m "docs: synthesize the cairn-cms DX findings from the ecnordic migration

Co-Authored-By: Claude <noreply@anthropic.com>"
```

Commit the cairn-cms backlog entries separately in the cairn-cms repo, following its own conventions.

---

## Verification items (no implementation task)

- **Links resolve.** The welcome post's two `cairn:` tokens render as the live page permalinks on the page and as absolute URLs in the feeds, with no literal token in the built output.
- **The backstop fails closed.** A dangling token fails the build with exit 1.
- **The lifecycle controls work.** The admin edit route registers `save`, `delete`, and `rename`, and the link picker reads the manifest's targets.
- **Zero URL movement.** The `url-inventory` test is green; converting a link's source token does not move any URL.

## Pass-end consolidation (after Task 5)

This is an ecnordic site-pass, so the `site-pass` pass-end ritual applies once both plans are green: the code-simplifier over the changed code, `svelte-check`, the `docs/STATUS.md` update (the migration done, the cairn pin now `^0.21.0`, the DX findings filed), plan archival, and the backlog close-out. **The commit stays local; the push and the live deploy and the live `/admin` smoke (delete, rename, the picker against the real Worker) are a human fast-follow**, since a push deploys ecnordic to production.

## Self-review notes

- **Spec coverage.** Manifest (Task 1), build backstop plus resolver (Task 2), lifecycle actions and the picker (Task 3), the `cairn:` link conversion with the backstop proof (Task 4), the DX synthesis (Task 5). Phase B's link-integrity gate is the build (a dangling token fails it).
- **Type consistency.** `buildSiteManifest`, `verifyManifest`, `buildLinkResolver`, the `render(md)` resolver threading, and the `content.editLoad`/`saveAction`/`deleteAction`/`renameAction` handlers are used identically to Plan A and the showcase.
- **Dependency on Plan A.** This plan assumes Plan A landed `markdownToHtml(md, opts)` with the `opts` passthrough and the engine-floor render. If Plan A dropped the `opts` parameter (the render option did not exist), this plan's Task 2 adds it back to thread the resolver.
