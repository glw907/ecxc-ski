# `.ec-grid` Card Primitive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the About-only `.ec-values` two-column list into a reusable global kit primitive, `.ec-grid` (a "grid card" of parallel titled points), and prove it on the Program-philosophy section.

**Architecture:** Add `.ec-grid` to the global design-language primitives in `src/app.css`. Switch `decorateAbout` to emit `.ec-grid` and delete the now-dead About-scoped `.ec-values` CSS. Rebalance the five Program-philosophy convictions for even cell length and fewer em dashes, longest last so it lands in the auto-spanning wide cell. Update the design-language doc.

**Tech Stack:** SvelteKit · Tailwind v4 · DaisyUI v5 · OKLCH tokens. Verification is `npx svelte-check` + a headless build screenshot (no CSS unit-test harness exists in this repo).

**Spec:** `docs/superpowers/specs/2026-05-20-ecnordic-grid-card-design.md`

---

## File map

- `src/app.css` — add `.ec-grid` global primitive (beside `.ec-alert` / `.ec-chip`).
- `src/routes/[slug]/+page.svelte` — swap injected class in `decorateAbout`; delete About-scoped `.ec-values` rules; update the legend comment.
- `src/content/pages/about.md` — rebalance the five convictions.
- `docs/design-language.md` — replace the Values kit entry; update the worked-example table row.

---

### Task 1: Add the `.ec-grid` primitive to `app.css`

**Files:**
- Modify: `src/app.css` (insert after the `.ec-alert` block, which currently ends near line 314, before the `/* ─── Page-level headings ─── */` section at line 316)

- [ ] **Step 1: Add the global primitive**

Insert this block immediately before the `/* ─── Page-level headings ─────────────────────────────────── */` comment in `src/app.css`:

```css
/* ─── Grid card body — `.ec-grid` ─────────────────────────────
   A set of parallel, titled points (peers, not a sequence) inside a
   module card: convictions, activity types, ways to help. Two columns
   on desktop, one on mobile. The orphan cell of an odd-count grid spans
   the full width — both an orphan fix and a "featured point" slot for
   the longest/most-important item placed last. Cells reuse the base-200
   surface of the .ec-split panels; colour stays in the card-head icon. */
.ec-grid {
  list-style: none;
  padding: 0;
  margin-block-start: 0.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}
.ec-grid > li {
  margin: 0;
  background: var(--color-base-200);
  border-radius: 0.7rem;
  padding: 1rem 1.1rem;
  font-size: 0.9rem;
  line-height: 1.5;
}
.ec-grid > li > strong:first-child {
  display: block;
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-heading);
  margin-block-end: 0.25rem;
}
/* odd-count orphan / featured cell spans full width */
.ec-grid > li:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}
@media (max-width: 640px) {
  .ec-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx svelte-check`
Expected: no new errors attributable to `app.css` (CSS is not type-checked, but the run must stay clean).

- [ ] **Step 3: Commit**

```bash
git add src/app.css
git commit -m "Add .ec-grid card primitive to design-language CSS

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Switch `decorateAbout` to `.ec-grid` and remove dead `.ec-values` CSS

**Files:**
- Modify: `src/routes/[slug]/+page.svelte:103` (class swap)
- Modify: `src/routes/[slug]/+page.svelte:229` (legend comment)
- Modify: `src/routes/[slug]/+page.svelte:274-292` (delete `.ec-values` rules)
- Modify: `src/routes/[slug]/+page.svelte:339-343` (drop `.ec-values` from the mobile rule, keep `.ec-split`)

- [ ] **Step 1: Swap the injected class**

In the `program-philosophy` branch of `decorateAbout`, change:

```js
const body = rest.replace('<ul>', '<ul class="ec-values">');
```

to:

```js
const body = rest.replace('<ul>', '<ul class="ec-grid">');
```

- [ ] **Step 2: Update the legend comment**

In the `<style>` legend block, change the line:

```
       values   → .ec-values — compact two-column set, unnumbered
```

to:

```
       grid     → .ec-grid (global) — card body of parallel titled points
```

- [ ] **Step 3: Delete the About-scoped `.ec-values` rules**

Remove this entire block (currently lines 274-292):

```css
  /* Values: parallel convictions in a compact two-column set, no numbering */
  .static-page[data-page="about"] :global(.ec-values) {
    list-style: none;
    padding: 0;
    margin-block-start: 0.5rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.9rem 1.75rem;
  }
  .static-page[data-page="about"] :global(.ec-values li) {
    margin: 0;
    font-size: 0.95rem;
  }
  .static-page[data-page="about"] :global(.ec-values strong) {
    display: block;
    font-family: var(--font-display);
    color: var(--color-heading);
    margin-block-end: 0.1rem;
  }
```

- [ ] **Step 4: Drop `.ec-values` from the mobile collapse rule (keep `.ec-split`)**

Change the mobile media query (currently lines 339-343) from:

```css
  @media (max-width: 640px) {
    .static-page[data-page="about"] :global(.ec-split),
    .static-page[data-page="about"] :global(.ec-values) {
      grid-template-columns: 1fr;
    }
  }
```

to:

```css
  @media (max-width: 640px) {
    .static-page[data-page="about"] :global(.ec-split) {
      grid-template-columns: 1fr;
    }
  }
```

(`.ec-grid`'s own mobile collapse now lives in `app.css`.)

- [ ] **Step 5: Confirm no stray `.ec-values` references remain**

Run: `grep -rn "ec-values" src/`
Expected: no output.

- [ ] **Step 6: Type-check**

Run: `npx svelte-check`
Expected: clean (0 errors).

- [ ] **Step 7: Commit**

```bash
git add "src/routes/[slug]/+page.svelte"
git commit -m "Render Program philosophy with .ec-grid; drop scoped .ec-values

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Rebalance the Program-philosophy convictions

**Files:**
- Modify: `src/content/pages/about.md` (the `## Program philosophy` bullet list)

Rationale: even cell length, fewer em dashes (content-guide anti-pattern #1: max one per paragraph; current copy has one per bullet), longest/most-load-bearing conviction last so it lands in the wide featured cell. Meaning and voice unchanged; "volunteers, not coaches" preserved.

- [ ] **Step 1: Replace the five bullets**

Replace this exact block:

```markdown
- **Total person first.** A strong sleep schedule, good nutrition, and family and community support aren't tradeoffs against athletic ambition — they're required for it. We teach sleep, fueling, and time management as part of training, and how hard we push depends on what an athlete is carrying that week.
- **Open to any dedicated athlete.** The program is free and donation-based. Anyone who needs help affording camp, gear, or transportation can ask, no questions about family finances. We ask for consistency and hard work in return.
- **What athletics is for.** Training is a way to develop better, more engaged, healthier people. We design workouts and respond to setbacks with that in mind.
- **A lasting relationship with Nordic skiing.** Most high school athletes won't race competitively after college. We want them to keep skiing for its own sake, on skills and habits that hold up past the racing years.
- **Support the community that supports you.** Athletes do community service — trail work, helping at events and races — and we organize it so they don't have to find their own. We expect athletes to support their teammates too, at EC Nordic and on their high school ski teams.
```

with:

```markdown
- **Total person first.** A solid sleep schedule, good food, and family support aren't tradeoffs against athletic ambition. They make it possible, so we teach sleep, fueling, and time management alongside the workouts.
- **Open to any dedicated athlete.** The program is free and donation-based. Anyone who needs help affording camp, gear, or a ride can ask, no questions about family finances.
- **What athletics is for.** Training is a way to develop better, more engaged, healthier people. We design workouts and respond to setbacks with that in mind.
- **A lasting bond with skiing.** Most high school athletes won't race after college. We want them to keep skiing for its own sake, on habits that hold up past the racing years.
- **Support the community that supports you.** Athletes do community service: trail work, and helping at events and races, organized so they don't have to find their own. We expect athletes to back up their teammates too, at EC Nordic and on their high school ski teams.
```

- [ ] **Step 2: Verify em-dash count**

Run: `grep -n "—" src/content/pages/about.md`
Expected: no em dashes inside the Program-philosophy bullets (other sections may still legitimately use one).

- [ ] **Step 3: Commit**

```bash
git add src/content/pages/about.md
git commit -m "Rebalance Program philosophy convictions for grid cells

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Update the design-language doc

**Files:**
- Modify: `docs/design-language.md` (the `### Values — .ec-values` kit entry, ~lines 149-154; the worked-example table row, ~line 252)

- [ ] **Step 1: Replace the Values kit entry**

Replace the `### Values — .ec-values` section:

```markdown
### Values — `.ec-values`
A set of short, titled points (e.g. convictions, options). A **compact
two-column grid, unnumbered**: these are *parallel*, not a sequence, so a
number would assert an order that doesn't exist, and a single column runs the
page too long. Each item leads with a bold display-font term.
```

with:

```markdown
### Grid card — `.ec-grid`
A card body of short, titled points that are **peers, not a sequence** (e.g.
convictions, activity types, ways to help). A two-column grid, **unnumbered**:
a number would assert an order that doesn't exist, and a single column runs the
page too long. Each cell is a `base-200` tile (the same surface as the split
panels) leading with a bold display-font term. The **last cell of an odd-count
grid spans the full width** — both an orphan fix and a *featured* slot for the
longest or most important point, placed last. Colour stays in the card-head
icon; cells carry no per-cell icon or accent. Global in `app.css`.
```

- [ ] **Step 2: Update the worked-example table row**

In the worked-example table, change the Program-philosophy row:

```markdown
| Program philosophy | Module + values grid | `compass` (bare glyph) | primary |
```

to:

```markdown
| Program philosophy | Grid card (`.ec-grid`) | `compass` (bare glyph) | primary |
```

- [ ] **Step 3: Commit**

```bash
git add docs/design-language.md
git commit -m "Document .ec-grid card primitive in design language

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Visual verification

**Files:** none (verification only)

- [ ] **Step 1: Build the site**

Run: `npm run build`
Expected: build succeeds, output in `.svelte-kit/cloudflare/`.

- [ ] **Step 2: Serve the built assets and screenshot the About page**

Start the local preview (wrangler, port 8787 — see `start-server` skill / local-preview memory), then capture both viewports:

```bash
google-chrome --headless --screenshot=/tmp/about-desktop.png --window-size=1280,2000 http://localhost:8787/about
google-chrome --headless --screenshot=/tmp/about-mobile.png  --window-size=390,2400  http://localhost:8787/about
```

(Use `chromium`/`chromium-browser` if `google-chrome` is unavailable.)

- [ ] **Step 3: Inspect the screenshots**

Read both PNGs and confirm:
- The five convictions render as `base-200` tiles, two columns on desktop.
- The fifth ("Support the community…") spans the full width as the wide cell.
- One column on mobile.
- The head compass icon is crimson; no per-cell icons or accent rules.
- Dark mode intact if the preview is in dark mode (optional: re-shoot with `prefers-color-scheme: dark`).

- [ ] **Step 4: If anything is off, fix in the relevant task's file and re-run from Step 1.** Otherwise the feature is complete — no commit needed (verification only).

---

## Self-review

- **Spec coverage:** primitive in `app.css` (Task 1); render swap + dead-CSS removal (Task 2); content rebalance + em-dash cut + longest-last (Task 3); design-language doc kit entry + worked-example row (Task 4); svelte-check + visual verification (Task 5). All spec sections covered. Out-of-scope items (Training/Volunteers rollout, even-count featured modifier) intentionally absent.
- **Placeholder scan:** none — every code/content step shows the full text.
- **Consistency:** class name `.ec-grid` and selector `.ec-grid > li:last-child:nth-child(odd)` are identical across the spec, Task 1, and Task 4. The five-bullet replacement in Task 3 yields an odd count (5), so the spanning selector fires on the last cell as designed.
