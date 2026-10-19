# Global Component Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the reusable `.ec-*` component styles out of the page-scoped route block into the global stylesheet so every component renders the same on every page, fix the Volunteers page, and add gloss footnotes to About and Volunteers.

**Architecture:** `src/app.css` becomes the single home for every `.ec-*` component, global and unscoped. The route's scoped `<style>` keeps only page-shell rules and the entrance cascade. The cascade and module margin broaden from three named pages to all static pages.

**Tech Stack:** SvelteKit, Tailwind v4, DaisyUI v5, plain CSS in `src/app.css`, Vitest snapshot tests, deployed to Cloudflare Workers.

---

## Background the implementer needs

The design spec is at `docs/superpowers/specs/2026-06-05-global-component-layer-design.md`. Read it first.

Two files hold the styles:

- `src/app.css` is the global stylesheet. Most `.ec-*` components already live here.
- `src/routes/[...path]/+page.svelte` has a scoped `<style>` block. Some component rules are stranded there behind page selectors like `[data-page="about"]` or `:is([data-page="about"], [data-page="training"], [data-page="crewlab"])`. Scoped Svelte rules that target rendered markup use `:global(...)`.

This is CSS refactoring. CSS is not unit-testable, so each task uses two checks:

1. **The regression guard (automated).** Moving a CSS rule must not change any HTML. The Vitest characterization snapshots render every page's HTML, so they stay green if and only if the markup is unchanged. The guard for a CSS-only task is:
   - `npm run check` then expect `0 ERRORS`.
   - `npx vitest run` then expect `Tests 54 passed (54)` with no `-u` needed.
   - `npm run build` then expect `done`.
   If a CSS-only task changes a snapshot, something is wrong. Stop and investigate.

2. **The visual check (human, between tasks).** A specificity shift can change appearance without changing HTML, so a human reviews the named pages in a browser. Build and serve first:
   - `npm run build`
   - `sleep infinity | npx wrangler dev --port 8787` (run in the background; the `sleep infinity` keeps the dev server from exiting on stdin EOF). View at `http://localhost:8787`.
   - Rebuild after each change, then hard-refresh.

The content tasks (the footnotes) do change HTML, so they update snapshots with `npx vitest run -u` and must pass prose-guard, the hook that rejects banned words and em dashes in `src/content/**/*.md`.

Commit specific files, never `git add -A`. End commit messages with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Do not push; the user pushes to `main` because it deploys live.

---

## File structure

- `src/app.css`: gains the lifted global component rules.
- `src/routes/[...path]/+page.svelte`: loses the lifted rules, broadens the cascade, and drops the dead `.page-section` rules.
- `src/content/pages/about.md`: gains two gloss asides and two footnote daggers.
- `src/content/pages/volunteers.md`: gains two gloss asides and two footnote daggers.

---

## Task 1: Lift the head row and the section-body reset to global

The head row (`.ec-head`) and the first-child margin reset are scoped to three pages. Lift them so Volunteers' grid head gets the icon-and-title row. The `h2` sizing needs a `.post-body` prefix to keep beating `.post-body h2` (both set font-size at equal specificity; the scoped form wins today only on its page selectors).

**Files:**
- Modify: `src/app.css` (add rules near the existing `.ec-icon` block)
- Modify: `src/routes/[...path]/+page.svelte` (remove the scoped rules)

- [ ] **Step 1: Add the global rules to `src/app.css`**

Add this block after the `.ec-icon-secondary { ... }` rule:

```css
/* ─── Component head row: `.ec-head` ─────────────────────────
   The icon-and-title row shared by card, grid, passage, and cta heads. Global so it
   renders the same on every page; the `.post-body` prefix on the title keeps it above
   `.post-body h2` on specificity. */
.ec-head {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-block-end: 0.5rem;
}
.ec-head .ec-glyph {
  inline-size: 1.6rem;
  block-size: 1.6rem;
}
.post-body .ec-head h2,
.post-body .ec-cta h2 {
  margin: 0;
  font-size: 1.3rem;
}
.post-body .section-body > :first-child {
  margin-block-start: 0;
}
```

- [ ] **Step 2: Remove the scoped versions from `src/routes/[...path]/+page.svelte`**

Delete these four rules from the `<style>` block (the head-row group and the section-body reset):

```css
  .static-page:is([data-page="about"], [data-page="training"], [data-page="crewlab"]) :global(.ec-head) {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    /* heading breathes from its body; the innermost step of the page's
       vertical rhythm (0.5 → 0.9 → 1.4rem, each ~1.5× the last) */
    margin-block-end: 0.5rem;
  }
  .static-page:is([data-page="about"], [data-page="training"], [data-page="crewlab"]) :global(.ec-head h2),
  .static-page:is([data-page="about"], [data-page="training"], [data-page="crewlab"]) :global(.ec-cta h2) {
    margin: 0;
    font-size: 1.3rem;
  }
  /* Bare header glyph: a touch larger than inline so it anchors the title */
  .static-page:is([data-page="about"], [data-page="training"], [data-page="crewlab"]) :global(.ec-head .ec-glyph) {
    inline-size: 1.6rem;
    block-size: 1.6rem;
  }
  .static-page:is([data-page="about"], [data-page="training"], [data-page="crewlab"]) :global(.section-body > :first-child) {
    margin-block-start: 0;
  }
```

- [ ] **Step 3: Run the regression guard**

Run: `npm run check && npx vitest run 2>&1 | grep -E 'Tests +[0-9]' && npm run build 2>&1 | tail -1`
Expected: `0 ERRORS`, `Tests 54 passed (54)`, `done`.

- [ ] **Step 4: Visual check (human)**

Build and serve, then confirm at `localhost:8787`:
- `/about`, `/crewlab`, `/training`: card and section heads look identical to before (icon beside the title, same size).
- `/volunteers`: the "Help out" grid heading now shows its icon-and-title row instead of a bare heading.

- [ ] **Step 5: Commit**

```bash
git add src/app.css "src/routes/[...path]/+page.svelte"
git commit -m "Lift the .ec-head row to the global stylesheet

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Lift the split and panel styles to global

`split` and `panel` are scoped to About. Volunteers uses them for its three coach bios and renders them unstyled. Lift them. The `p` and `strong` rules get a `.post-body` prefix to stay above the prose rules.

**Files:**
- Modify: `src/app.css`
- Modify: `src/routes/[...path]/+page.svelte`

- [ ] **Step 1: Add the global rules to `src/app.css`**

Add after the head-row block from Task 1:

```css
/* ─── Split + panel: `.ec-split` / `.ec-panel` ───────────────
   Two or more labelled panels laid side by side, each with its own icon. Global so
   every page that uses `split` gets the layout (About and Volunteers today). */
.ec-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.9rem;
  margin-block-start: 0.25rem;
}
.ec-panel {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  background: var(--color-base-200);
  border-radius: 0.75rem;
  padding: 1.1rem 1.2rem;
}
.ec-panel .ec-icon {
  margin-block-start: 0.1rem;
}
.ec-panel .ec-glyph {
  inline-size: 1.5rem;
  block-size: 1.5rem;
}
.post-body .ec-panel p {
  margin: 0;
}
.post-body .ec-panel strong {
  display: block;
  font-family: var(--font-display);
  font-size: 1.02rem;
  margin-block-end: 0.3rem;
  color: var(--color-heading);
}
@media (max-width: 640px) {
  .ec-split {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Remove the scoped versions from `src/routes/[...path]/+page.svelte`**

Delete the about-scoped split/panel rules:

```css
  /* Paired info: two labelled panels, each with its own icon */
  .static-page[data-page="about"] :global(.ec-split) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.9rem;
    margin-block-start: 0.25rem;
  }
  .static-page[data-page="about"] :global(.ec-panel) {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    background: var(--color-base-200);
    border-radius: 0.75rem;
    padding: 1.1rem 1.2rem;
  }
  .static-page[data-page="about"] :global(.ec-panel .ec-icon) {
    margin-block-start: 0.1rem;
  }
  .static-page[data-page="about"] :global(.ec-panel .ec-glyph) {
    inline-size: 1.5rem;
    block-size: 1.5rem;
  }
  .static-page[data-page="about"] :global(.ec-panel p) {
    margin: 0;
  }
  .static-page[data-page="about"] :global(.ec-panel strong) {
    display: block;
    font-family: var(--font-display);
    font-size: 1.02rem;
    margin-block-end: 0.3rem;
    color: var(--color-heading);
  }
```

Then delete the about-scoped mobile rule lower in the file:

```css
  @media (max-width: 640px) {
    .static-page[data-page="about"] :global(.ec-split) {
      grid-template-columns: 1fr;
    }
  }
```

- [ ] **Step 3: Run the regression guard**

Run: `npm run check && npx vitest run 2>&1 | grep -E 'Tests +[0-9]' && npm run build 2>&1 | tail -1`
Expected: `0 ERRORS`, `Tests 54 passed (54)`, `done`.

- [ ] **Step 4: Visual check (human)**

At `localhost:8787`:
- `/about`: the "Costs & volunteers" split looks identical to before (two base-200 panels side by side, single column on a narrow window).
- `/volunteers`: the three coach bios now render as base-200 panels with their runner icons, instead of plain stacked text.

- [ ] **Step 5: Commit**

```bash
git add src/app.css "src/routes/[...path]/+page.svelte"
git commit -m "Lift split and panel styles to the global stylesheet

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Lift the CTA button margin and the passage padding to global

Two small scoped rules remain: the CTA button top margin and the passage inline padding. Lift both.

**Files:**
- Modify: `src/app.css`
- Modify: `src/routes/[...path]/+page.svelte`

- [ ] **Step 1: Add the global rules to `src/app.css`**

Add after the split/panel block:

```css
/* The CTA button keeps a small top margin; the titled prose passage gets a hair of
   inline padding so its text aligns with the bordered modules above and below. */
.ec-cta .btn {
  margin-block-start: 0.5rem;
}
.ec-passage {
  padding-inline: 0.25rem;
}
```

- [ ] **Step 2: Remove the scoped versions from `src/routes/[...path]/+page.svelte`**

Delete the crewlab-scoped passage padding:

```css
  /* A titled prose passage carries the section head + body at full page width,
     with no card border/wash. Prose is the kit's default (see design doc). */
  .static-page[data-page="crewlab"] :global(.ec-passage) {
    padding-inline: 0.25rem;
  }
```

And delete the scoped CTA button rule:

```css
  /* Single call to act */
  .static-page:is([data-page="about"], [data-page="training"], [data-page="crewlab"]) :global(.ec-cta .btn) {
    margin-block-start: 0.5rem;
  }
```

- [ ] **Step 3: Run the regression guard**

Run: `npm run check && npx vitest run 2>&1 | grep -E 'Tests +[0-9]' && npm run build 2>&1 | tail -1`
Expected: `0 ERRORS`, `Tests 54 passed (54)`, `done`.

- [ ] **Step 4: Visual check (human)**

At `localhost:8787`: `/crewlab` and `/about` CTAs and the About "Why we started" passage look the same as before (the passage gains a barely-perceptible 4px inset, which is the intended consistency).

- [ ] **Step 5: Commit**

```bash
git add src/app.css "src/routes/[...path]/+page.svelte"
git commit -m "Lift the cta button and passage rules to the global stylesheet

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Generalize the entrance cascade and module margin to all static pages

The cascade rule gives `.ec-card`, `.ec-passage`, and `.ec-alert` the 1.4rem module margin and the rise animation, but only on three pages. Broaden it to all static pages so Volunteers' modules animate and gain the margin. Training keeps its in-band alert on the light-module tier with a small override (the Helmets alert sits inside a band, which was unified to 1.1rem with no separate entrance).

**Files:**
- Modify: `src/routes/[...path]/+page.svelte`

- [ ] **Step 1: Broaden the cascade selector**

Replace this rule:

```css
  .static-page:is([data-page="about"], [data-page="training"], [data-page="crewlab"]) :global(.ec-card),
  .static-page[data-page="crewlab"] :global(.ec-passage),
  .static-page[data-page="about"] :global(.ec-alert) {
    margin-block-start: 1.4rem;
    animation: module-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
```

with:

```css
  .static-page :global(.ec-card),
  .static-page :global(.ec-passage),
  .static-page :global(.ec-alert) {
    margin-block-start: 1.4rem;
    animation: module-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  /* Training's only alert sits inside a section band, which carries the entrance and
     keeps light modules on the 1.1rem tier. Hold it there instead of the 1.4rem rule. */
  .static-page[data-page="training"] :global(.ec-band .ec-alert) {
    margin-block-start: 1.1rem;
    animation: none;
  }
```

- [ ] **Step 2: Broaden the reduced-motion block**

Find the reduced-motion block near the end of the `<style>` (it lists the same three scoped selectors). It currently ends:

```css
    .static-page:is([data-page="about"], [data-page="training"], [data-page="crewlab"]) :global(.ec-card),
    .static-page[data-page="crewlab"] :global(.ec-passage),
    .static-page[data-page="about"] :global(.ec-alert),
    .static-page[data-page="training"] :global(.ec-band) {
      animation: none;
    }
```

Replace those four selector lines with:

```css
    .static-page :global(.ec-card),
    .static-page :global(.ec-passage),
    .static-page :global(.ec-alert),
    .static-page[data-page="training"] :global(.ec-band) {
      animation: none;
    }
```

- [ ] **Step 3: Run the regression guard**

Run: `npm run check && npx vitest run 2>&1 | grep -E 'Tests +[0-9]' && npm run build 2>&1 | tail -1`
Expected: `0 ERRORS`, `Tests 54 passed (54)`, `done`.

- [ ] **Step 4: Visual check (human)**

At `localhost:8787`:
- `/volunteers`: on load, the coach split and the "Help out" grid now rise in on the entrance cascade and carry a 1.4rem top margin (they were flush and static before).
- `/training`: the Helmets alert is unchanged (still on the 1.1rem rhythm, no separate animation; the band carries the entrance).
- `/about`: the "Why we started" passage now rises in with the cascade, matching the other modules.
- `/crewlab`: unchanged.

- [ ] **Step 5: Commit**

```bash
git add "src/routes/[...path]/+page.svelte"
git commit -m "Generalize the entrance cascade and module margin to all static pages

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Remove the dead `.page-section` rules

`.page-section` is referenced only inside the route's `<style>`. No markup, content, or component emits the class (the directive system replaced the old `decorate*` markup). Remove the rules.

**Files:**
- Modify: `src/routes/[...path]/+page.svelte`

- [ ] **Step 1: Delete the dead rules**

Delete this block from the `<style>`:

```css
  /* ─── Base card (used as-is on training, volunteers, resources) ─── */
  .static-page :global(.page-section) {
    margin-block-start: 1rem;
    padding: 1.5rem 1.75rem;
    background: var(--color-base-100);
    border: 1px solid var(--color-border-subtle);
    border-radius: 12px;
    box-shadow: 0 1px 4px oklch(0% 0 0 / 0.05);
  }
  .static-page :global(.page-section h2) {
    font-size: 1.25rem;
    margin-block: 0 0.75rem;
  }
  .static-page :global(.section-body > :first-child) {
    margin-block-start: 0;
  }
  .static-page :global(.page-section h3) {
    font-size: 1.02rem;
    margin-block: 1.2rem 0.2rem;
    color: var(--color-heading);
  }
```

Note: the `.static-page :global(.section-body > :first-child)` line is in this block too, and it is now redundant with the global `.post-body .section-body > :first-child` added in Task 1. Removing it here is correct.

- [ ] **Step 2: Run the regression guard**

Run: `npm run check && npx vitest run 2>&1 | grep -E 'Tests +[0-9]' && npm run build 2>&1 | tail -1`
Expected: `0 ERRORS`, `Tests 54 passed (54)`, `done`.

- [ ] **Step 3: Visual check (human)**

At `localhost:8787`: spot-check `/about`, `/crewlab`, `/training`, `/volunteers`. Nothing should change (the class was unused).

- [ ] **Step 4: Commit**

```bash
git add "src/routes/[...path]/+page.svelte"
git commit -m "Remove the dead .page-section rules

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Add gloss footnotes to About

Add two glosses with the footnote pattern (an `aside` with `id="gloss-..."` and a daggered link). The footnote CSS is already general (`a[href^="#gloss-"]` and `[id^="gloss-"]`), so this is content only. Place each aside right after the block that introduces the term, the way Training places the Spenst gloss after the schedule.

**Files:**
- Modify: `src/content/pages/about.md`

- [ ] **Step 1: Gloss the Anchorage clubs**

In the "Why we started" passage, the sentence reads `...the most storied Nordic ski clubs in the country, APU Nordic and Alaska Winter Stars, whose athletes...`. Add a dagger after `Alaska Winter Stars`.

Replace `APU Nordic and Alaska Winter Stars, whose athletes` with:

```markdown
APU Nordic and Alaska Winter Stars[†](#gloss-anchorage-clubs), whose athletes
```

Then add this aside immediately after the `:::passage[Why we started] ... :::` block:

```markdown
:::aside[APU Nordic & Alaska Winter Stars]{id="gloss-anchorage-clubs"}
Anchorage's two storied cross-country ski clubs. Both run year-round professional coaching and have a long record of developing skiers who reach the national level and beyond.
:::
```

- [ ] **Step 2: Gloss Junior Nationals and the Arctic Winter Games**

In the "Who can join" card, the sentence reads `Athletes aiming at Junior Nationals or Arctic Winter Games team selections train alongside...`. Add a dagger after `Arctic Winter Games`.

Replace `Athletes aiming at Junior Nationals or Arctic Winter Games team selections` with:

```markdown
Athletes aiming at Junior Nationals or Arctic Winter Games[†](#gloss-jn-awg) team selections
```

Then add this aside immediately after the closing `::::` of the "Who can join" card:

```markdown
:::aside[Junior Nationals & Arctic Winter Games]{id="gloss-jn-awg"}
Junior Nationals is the U.S. national championship for junior cross-country skiers. The Arctic Winter Games is a circumpolar youth sports festival held in even years. Team Alaska selects athletes for both from in-state race results.
:::
```

- [ ] **Step 3: Build and update snapshots**

Run: `npm run build 2>&1 | tail -1 && npx vitest run -u 2>&1 | grep -E 'Snapshots|Tests +[0-9]'`
Expected: `done`, the About snapshots update, `Tests 54 passed (54)`.

- [ ] **Step 4: Visual check (human)**

At `localhost:8787/about`: each glossed term shows a small azure superscript dagger, the matching aside below carries the same dagger, and clicking the dagger scrolls to the aside.

- [ ] **Step 5: Commit**

```bash
git add src/content/pages/about.md src/tests/markdown/__snapshots__/characterization.test.ts.snap src/tests/markdown/__snapshots__/sanitized-characterization.test.ts.snap
git commit -m "Gloss the Anchorage clubs and the youth championships on About

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Add gloss footnotes to Volunteers

Gloss the two acronyms in the coach bios that an outsider needs expanded.

**Files:**
- Modify: `src/content/pages/volunteers.md`

- [ ] **Step 1: Gloss NSAA**

In Geoff's bio, the sentence reads `...he's spent 13 years coaching NSAA's Junior Nordic program...`. Add a dagger after `NSAA's`.

Replace `13 years coaching NSAA's Junior Nordic program` with:

```markdown
13 years coaching NSAA's[†](#gloss-nsaa) Junior Nordic program
```

- [ ] **Step 2: Gloss APU**

In Geoff's bio, the sentence reads `...the youngest now racing and training with the APU Nordic Elite Team.`. Add a dagger after `APU`.

Replace `training with the APU Nordic Elite Team` with:

```markdown
training with the APU[†](#gloss-apu) Nordic Elite Team
```

- [ ] **Step 3: Add both asides**

The coach bios are three `:::panel ... :::` blocks inside one `::::split[This summer's coaches] ... ::::`. Add the two asides immediately after the closing `::::` of that split:

```markdown
:::aside[NSAA]{id="gloss-nsaa"}
The Nordic Skiing Association of Anchorage, the nonprofit that grooms Anchorage's cross-country ski trails and runs community programs, including the Junior Nordic youth program.
:::

:::aside[APU]{id="gloss-apu"}
Alaska Pacific University. Its APU Nordic program is one of the country's top cross-country ski clubs.
:::
```

- [ ] **Step 4: Build and update snapshots**

Run: `npm run build 2>&1 | tail -1 && npx vitest run -u 2>&1 | grep -E 'Snapshots|Tests +[0-9]'`
Expected: `done`, the Volunteers snapshots update, `Tests 54 passed (54)`.

- [ ] **Step 5: Visual check (human)**

At `localhost:8787/volunteers`: the NSAA and APU mentions carry daggers, and the two asides sit below the coach panels with matching daggers.

- [ ] **Step 6: Commit**

```bash
git add src/content/pages/volunteers.md src/tests/markdown/__snapshots__/characterization.test.ts.snap src/tests/markdown/__snapshots__/sanitized-characterization.test.ts.snap
git commit -m "Gloss NSAA and APU on the Volunteers page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Final pass, simplify, and ready for ship

**Files:**
- Possibly modify: `src/app.css`, `src/routes/[...path]/+page.svelte` (only if the simplifier finds refinements)

- [ ] **Step 1: Full page-by-page visual review (human)**

Build and serve. Walk every content page at `localhost:8787` and confirm the design language is consistent: `/about`, `/crewlab`, `/training`, `/volunteers`, plus a spot-check of `/` (Home), `/contact`, and `/archives` to confirm the functional pages are unaffected. The three reference pages (About, CrewLAB, Training) should look as they did before this plan, except for the two intended minor changes on About: the passage's 4px inset and its new entrance animation. Volunteers should now match the others (styled panels, styled grid head, module rhythm, entrance).

- [ ] **Step 2: Run the code-simplifier over the CSS changes**

Dispatch the `code-simplifier:code-simplifier` subagent over the working-tree diff of `src/app.css` and `src/routes/[...path]/+page.svelte`. Tell it to refine for clarity only, change no visual result or specificity, and that the `.post-body`-prefixed selectors are deliberate. Apply any refinements it returns.

- [ ] **Step 3: Run the full gate**

Run: `npm run check && npx vitest run 2>&1 | grep -E 'Tests +[0-9]' && npm run build 2>&1 | tail -1`
Expected: `0 ERRORS`, `Tests 54 passed (54)`, `done`.

- [ ] **Step 4: Commit any simplifier refinements**

```bash
git add src/app.css "src/routes/[...path]/+page.svelte"
git commit -m "Simplify the consolidated component styles

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 5: Stop for the human to ship**

Do not push. Tell the user the plan is complete and ask them to push to `main` when ready (it deploys live), then smoke-test the site.

---

## Self-review

**Spec coverage.** Spec section 1 (lift component rules) maps to Tasks 1 through 3. Section 2 (generalize the cascade and margin) maps to Task 4. Section 3 (gloss footnotes) maps to Tasks 6 and 7. Section 4 (remove dead rules) maps to Task 5. Verification maps to the per-task visual checks and Task 8. No spec section is unaddressed.

**Placeholder scan.** Every CSS and content step shows the exact text to add or remove. The gloss asides carry final copy, not a candidate list. No "TBD" or "handle edge cases".

**Name consistency.** The anchor ids used in the daggers match the aside ids: `#gloss-anchorage-clubs`, `#gloss-jn-awg`, `#gloss-nsaa`, `#gloss-apu`. The global selectors added in Tasks 1 through 3 (`.ec-head`, `.ec-split`, `.ec-panel`, `.ec-cta .btn`, `.ec-passage`) match the class names emitted by the directive components in `src/lib/markdown/components.ts`.
