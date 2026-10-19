# Pass 7 — Conformance & Hardening Sweep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the ecnordic.ski codebase exemplar-idiomatic for stable 2026 Svelte 5 / SvelteKit / Tailwind v4 / DaisyUI v5 / TypeScript, changing how the code reads but not a single rendered pixel.

**Architecture:** Three tracks over the existing codebase — type/structure hardening, a Tailwind v4 / DaisyUI v5 audit, and an MCP-verified Svelte 5 idiom check. The render pipeline, content layer, and five directive pages are frozen; this pass only tightens code. The existing 31 tests plus an all-surfaces AE=0 screenshot diff are the regression guard.

**Tech Stack:** SvelteKit 2 (Svelte 5 runes), TypeScript 6, Tailwind v4 + DaisyUI v5, Vitest 4, unified/remark/rehype, adapter-cloudflare v7, Pagefind. Reference of record: the Svelte MCP (`mcp.svelte.dev`).

**Scope note:** A prior scan found **zero Svelte-4 residue** (no `export let`, `$:`, `on:`, `<slot>`, `createEventDispatcher`) — the hookify rules have held the line. So Track C is *verification + targeted tightening*, not a rewrite. The concrete type debt is concentrated in `rehype-ec-primitives.ts` (hast-property casts) and `SearchModal.svelte` (`as any`).

---

## File map

- `src/lib/markdown/rehype-ec-primitives.ts` — add a typed `strProp` accessor; replace ~8 `as string` casts. (Refactor; guarded by existing directive tests.)
- `src/lib/components/SearchModal.svelte` — replace `as any` on the Pagefind dynamic import with a minimal local interface.
- `src/lib/components/*.svelte`, `src/routes/**/*.svelte` — Track C verification; targeted edits only if the MCP confirms a non-idiom.
- `src/app.css`, component `class=` lists — Track B audit; edits only on real findings.
- `docs/STATUS.md`, `BACKLOG.md`, `ROADMAP.md` — pass-end bookkeeping.
- `scripts/shot.mjs` (create, throwaway) — headless screenshot helper for the AE=0 gate.

---

## Task 1: Prerequisite — Svelte MCP live + baseline screenshots

**Files:**
- Create: `scripts/shot.mjs`

- [ ] **Step 1: Confirm the Svelte MCP is active**

Run: `/mcp` in the session and confirm the `svelte` server is connected (approve it if prompted). Then sanity-check a docs pull:

Ask the MCP `list_sections`, then `get_documentation` for "snippets". Expected: real Svelte 5 docs returned. If the server is not connected, stop and resolve that first — Tasks 4 depend on it.

- [ ] **Step 2: Write the screenshot helper**

```javascript
// scripts/shot.mjs — throwaway; headless screenshots for the AE=0 regression gate.
// Usage: node scripts/shot.mjs <outdir>   (server must be running on :8787)
import { chromium } from 'playwright'; // falls back below if not installed
import { mkdirSync } from 'node:fs';

const out = process.argv[2] ?? 'shots';
mkdirSync(out, { recursive: true });
const routes = [
  ['home', '/'], ['about', '/about'], ['training', '/training'],
  ['crewlab', '/crewlab'], ['resources', '/resources'], ['volunteers', '/volunteers'],
  ['contact', '/contact'], ['tags', '/tags'], ['tags-announcements', '/tags/announcements'],
  ['post', '/2026/05/14-welcome'], ['waiver', '/waiver'],
];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 2000 } });
for (const [name, path] of routes) {
  await page.goto(`http://localhost:8787${path}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
}
await browser.close();
console.log(`wrote ${routes.length} shots to ${out}/`);
```

If `playwright` is not installed, use the project's existing chromium headless method instead (`chromium --headless --screenshot=...` per route); the AE comparison in Task 5 is the same either way.

- [ ] **Step 3: Build, serve, capture baseline**

Run:
```bash
npm run build && npx pagefind --site .svelte-kit/cloudflare
# serve the built worker on :8787 (background; pipe sleep to keep stdin open)
( npx wrangler dev --port 8787 & sleep infinity ) &
sleep 8
node scripts/shot.mjs shots/baseline
```
Expected: `wrote 11 shots to shots/baseline/`. Keep `shots/baseline/` for Task 5. Do not commit `shots/` or `scripts/shot.mjs` (add to a local ignore or delete at pass end).

- [ ] **Step 4: Confirm clean working tree before edits**

Run: `git status --short`
Expected: only the pre-existing uncommitted infra files; no source changes yet.

---

## Task 2: Type/structure hardening — `strProp` accessor

**Files:**
- Modify: `src/lib/markdown/rehype-ec-primitives.ts`
- Guard: `src/tests/markdown/directives.test.ts` (existing, unchanged)

- [ ] **Step 1: Confirm the guard is green**

Run: `npx vitest run src/tests/markdown`
Expected: PASS (18 tests). These assert the emitted HTML (icons, roles, classes), so they cover the refactor.

- [ ] **Step 2: Add the typed accessor**

In `src/lib/markdown/rehype-ec-primitives.ts`, after the `isElement` helper (line ~7), add:

```typescript
// hast Properties values are PropertyValue (string | number | boolean | array | null).
// Directive markers (dataIcon/dataRole/dataPrimitive) are always stamped as strings;
// this reads them back with that guarantee instead of casting at each call site.
function strProp(node: Element, name: string): string | undefined {
  const value = node.properties?.[name];
  return typeof value === 'string' ? value : undefined;
}
```

- [ ] **Step 3: Replace every hast-property cast with `strProp`**

Replace each occurrence (lines ~27, 28, 80, 83, 112, 125, 126, 159):

```typescript
// before:  const icon = node.properties?.dataIcon as string | undefined;
const icon = strProp(node, 'dataIcon');
// before:  const role = node.properties?.dataRole as string | undefined;
const role = strProp(node, 'dataRole');
// before:  const role = node.properties?.dataRole as string;       (required-role sites)
const role = strProp(node, 'dataRole');
// before:  switch (node.properties?.dataPrimitive as string) {
switch (strProp(node, 'dataPrimitive')) {
```

For sites that previously used a non-optional `as string` (e.g. line ~83, ~112), `strProp` returns `string | undefined`; handle the undefined branch with the existing default (e.g. `?? 'warning'` for the caution icon) or a guard, matching current behavior. Do not introduce new defaults that change output.

- [ ] **Step 4: Verify no behavior change**

Run: `npx vitest run src/tests/markdown && npm run check`
Expected: 18 directive tests PASS, svelte-check 0/0. If any directive test fails, the refactor changed output — fix the undefined-handling to match prior behavior.

- [ ] **Step 5: Commit**

```bash
git add src/lib/markdown/rehype-ec-primitives.ts
git commit -m "$(cat <<'EOF'
Type hast property reads in rehype-ec-primitives via strProp

Replace ~8 `as string` casts on node.properties with a single typed
accessor that narrows PropertyValue to string. Pure refactor; the 18
directive tests are unchanged and green.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Type/structure hardening — SearchModal vendor import

**Files:**
- Modify: `src/lib/components/SearchModal.svelte`

- [ ] **Step 1: Define a minimal Pagefind UI type and drop `as any`**

In `SearchModal.svelte`'s `<script lang="ts">`, add near the top:

```typescript
interface PagefindUIOptions {
  element: string;
  showSubResults?: boolean;
  placeholder?: string;
}
interface PagefindUIModule {
  PagefindUI: new (options: PagefindUIOptions) => unknown;
}
```

Then change the dynamic import (line ~31) from:

```typescript
// @ts-ignore
const { PagefindUI } = await import(/* @vite-ignore */ '/pagefind/pagefind-ui.js') as any;
```
to:
```typescript
// pagefind UI bundle is generated post-build by `npx pagefind`; no module exists at compile time.
const { PagefindUI } = (await import(/* @vite-ignore */ '/pagefind/pagefind-ui.js')) as unknown as PagefindUIModule;
```

Keep `/* @vite-ignore */`. Keep the existing options object passed to `new PagefindUI({...})`.

- [ ] **Step 2: Verify**

Run: `npm run check && npm run build`
Expected: svelte-check 0/0; build clean (the import stays external per `vite.config.ts`).

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/SearchModal.svelte
git commit -m "$(cat <<'EOF'
Type the Pagefind dynamic import in SearchModal

Replace `as any` with a minimal local PagefindUIModule interface. The
bundle is still generated post-build and imported externally; only the
compile-time type is tightened.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Tailwind v4 / DaisyUI v5 audit + Svelte 5 idiom verification

This task is audit-driven: each step is a check with an exact command. Make an edit **only** when a check finds a real deviation; if a check is clean, record it and move on. Verify each idiom question against the Svelte MCP before changing.

**Files:** any `*.svelte` / `src/app.css` with a confirmed finding.

- [ ] **Step 1: DaisyUI v4 short-var scan**

Run: `grep -rnE "var\(--(p|s|a|n|b1|b2|b3|bc|pc|sc|ac|nc)\)" src --include="*.svelte" --include="*.css"`
Expected: no matches. Any match is a v4 holdover — replace with the v5 token (e.g. `--color-base-100`) per `rules/design-system.md`. Re-run until clean.

- [ ] **Step 2: Hardcoded color scan**

Run: `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgb\(|rgba\(" src --include="*.svelte" --include="*.css" | grep -v "var(--"`
Expected: no raw hex/rgb in rule values (oklch + tokens only). Fix any by adding/using an `@theme` token in `src/app.css`. (Bare `R,G,B` triplets inside `var()` composition are fine.)

- [ ] **Step 3: Tailwind v3 utility-name scan**

Run: `grep -rnE "class=\"[^\"]*(flex-shrink-|flex-grow-|overflow-ellipsis|decoration-clone|decoration-slice)" src --include="*.svelte"`
Expected: no matches (v4 renamed these to `shrink-`/`grow-`/`text-ellipsis`/`box-decoration-*`). Note: `flex-shrink: 0` inside `<style>` CSS blocks is plain CSS and is NOT a finding. Fix only utility classes.

- [ ] **Step 4: Arbitrary-value scan**

Run: `grep -rnE "class=\"[^\"]*\[[0-9]" src --include="*.svelte"`
Expected: no matches. For any hit, replace with a theme token/scale value if one exists; leave it only if genuinely one-off and justified (add a short comment).

- [ ] **Step 5: Svelte 5 idiom verification (MCP-backed)**

For each component in `src/lib/components/` and `src/routes/**/*.svelte`, verify against the MCP (`get_documentation` for "snippets", "$effect", "$props", "$bindable"):
- Snippet props typed as `Snippet` from `'svelte'` (check `children` props especially).
- `$effect` used only for genuine side effects (not derived state — that should be `$derived`).
- `$bindable()` only where two-way binding is actually consumed.
- No `$state` that is never reassigned (should be `const`).

Run this scan to seed the review:
```bash
grep -rn "children\b" src --include="*.svelte" | grep -v "@render\|Snippet"   # untyped children?
grep -rn "\$effect(" src --include="*.svelte"                                  # justify each
```
Make a targeted edit only where the MCP confirms a non-idiom. Most are expected to already be correct.

- [ ] **Step 6: Verify and commit findings (if any)**

Run: `npm run check && npx vitest run && npm run build`
Expected: 0/0, all tests pass, clean build.

If Steps 1–5 produced edits:
```bash
git add <only the changed files>
git commit -m "$(cat <<'EOF'
Tighten Tailwind v4 / DaisyUI v5 / Svelte 5 idiom

<one line per concrete fix; e.g. "shrink-0 over flex-shrink-0 in X">

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```
If Steps 1–5 found nothing, record "audit clean — no edits" in the pass notes and skip the commit.

---

## Task 5: Pass-end — regression gate + bookkeeping

**Files:**
- Modify: `docs/STATUS.md`, `BACKLOG.md`, `ROADMAP.md`

- [ ] **Step 1: Full gates**

Run: `npm run check && npx vitest run && npm run build && npx pagefind --site .svelte-kit/cloudflare`
Expected: svelte-check 0/0; 31+ tests pass; clean build.

- [ ] **Step 2: AE=0 regression — the core gate**

With the built site served on :8787 (as in Task 1 Step 3):
```bash
node scripts/shot.mjs shots/after
for f in shots/baseline/*.png; do
  name=$(basename "$f")
  ae=$(compare -metric AE "shots/baseline/$name" "shots/after/$name" /dev/null 2>&1)
  echo "$name: AE=$ae"
done
```
Expected: **AE=0 for every one of the 11 surfaces.** Pass 7 changes no rendered pixel. A non-zero AE means a refactor leaked into output — find and revert the offending change before continuing.

- [ ] **Step 3: code-simplifier over the pass's changes**

Dispatch the `code-simplifier` agent scoped to the files changed this pass (`rehype-ec-primitives.ts`, `SearchModal.svelte`, any Task 4 edits). Apply refinements, then re-run Step 1 gates.

- [ ] **Step 4: Update STATUS, BACKLOG, ROADMAP**

In `docs/STATUS.md`: mark Pass 7 as the conformance sweep (done), renumber the old kit-rollout goal to Pass 8, update "Current state" to note the codebase is MCP-verified idiomatic and the strProp/SearchModal hardening landed.

In `BACKLOG.md`: log the deferred remote-functions spike (`/log-issue` format, `#feature` `#ecnordic`, dated 2026-05-24) referencing the spec.

In `ROADMAP.md`: record the "Idiomatic 2026 Exemplar" initiative (Pass 7 done, Pass 8 next, Pass 9 deferred), linking the spec.

- [ ] **Step 5: Clean up throwaway artifacts**

Run: `rm -rf scripts/shot.mjs shots/` and confirm `git status` shows no stray files.

- [ ] **Step 6: Commit bookkeeping**

```bash
git add docs/STATUS.md BACKLOG.md ROADMAP.md
git commit -m "$(cat <<'EOF'
Close Pass 7 (conformance sweep); renumber kit rollout to Pass 8

Codebase verified idiomatic against the Svelte MCP; type hardening
landed; all surfaces AE=0. Log deferred remote-functions spike.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

Do not push — pushing to `main` deploys. Pass 7 is no-visual-change, but leave the push/deploy decision to the user (or run `/ship` explicitly).

---

## Self-review notes

- **Spec coverage:** Track A → Tasks 2–3; Track B → Task 4 Steps 1–4; Track C → Task 4 Step 5; MCP-as-reference → Task 1 Step 1 + Task 4 Step 5; AE=0 gate → Task 5 Step 2; deferred remote functions → Task 5 Step 4. Kit rollout is intentionally **out** (it is Pass 8).
- **Granularity:** audit steps are checks-with-commands, not pre-written fixes, because the scan showed the codebase is already largely idiomatic — pre-writing fixes for deviations that may not exist would be placeholder fiction. Each fix is gated by a concrete command and the AE=0 guard.
- **Type consistency:** `strProp(node, name): string | undefined` is used identically across Task 2; `PagefindUIModule`/`PagefindUIOptions` defined and used only in Task 3.
