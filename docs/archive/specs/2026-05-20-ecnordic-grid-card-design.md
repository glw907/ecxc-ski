# EC Nordic — `.ec-grid` card primitive

**Date:** 2026-05-20
**Status:** Design approved, ready for plan
**Builds on:** `docs/design-language.md` (the kit, palette, icon rules),
`docs/superpowers/specs/2026-05-14-ecnordic-design.md` (color tokens, type scale).

## Problem

The About page's "Program philosophy" section renders its five convictions
through `.ec-values` — a compact two-column grid of bold-term + description
items. That treatment is **scoped to the About page** (`[slug]/+page.svelte`),
so the same "set of parallel titled points" shape can't be reused on the pages
that share it (Training activities, Volunteers ways-to-help).

This promotes that shape into a reusable kit primitive, the **grid card**, and
proves it on the Program-philosophy section as the worked example. Rolling it
out to other sections is deliberately **out of scope** here (later Pass 4 work).

## The primitive

A **module card whose body is a responsive grid of parallel, titled points.**

- **Meaning:** a set of points that are *peers, not a sequence* — convictions,
  activity types, ways to help. Unnumbered: numbering would assert an order
  that does not exist.
- **Cell:** a `base-200` tile (the same surface as the existing `.ec-split`
  panels, keeping it visually consistent with the kit), leading with a bold
  display-font term, then quiet body prose.
- **Layout:** two columns on desktop, one column on mobile (`max-width: 640px`).
- **Color:** lives only in the card-head wayfinding icon (role color). Cells
  are neutral `base-200` — no per-cell accent rules, no per-cell icons. The
  convictions are parallel but are not *choices weighed against each other*, so
  by the icon rules (design-language.md → "Inside a section, only to label
  parallel choices") they do not each earn a glyph.

### The wide cell

The last cell of an **odd-count** grid spans the full width, via a CSS selector
(`.ec-grid > li:last-child:nth-child(odd)`) — no per-page wiring, no extra
markup. This serves two purposes:

1. **Orphan fix:** the card reads as a finished rectangle instead of a grid
   that ran out.
2. **Featured slot:** an author places the longest or most important point last
   and it gets the wide treatment for free.

No separate "always-featured" modifier is built now (YAGNI) — the auto-span
covers every case we have. Revisit only if an *even*-count list ever needs a
featured cell.

## Implementation

### CSS — `src/app.css`

Add `.ec-grid` to the global "Design-language primitives" block, beside
`.ec-alert` / `.ec-chip`. Remove the About-scoped `.ec-values` rules from
`[slug]/+page.svelte`.

```css
/* ─── Grid card body — `.ec-grid` ─────────────────────────────
   A set of parallel, titled points (peers, not a sequence) inside a
   module card. Two columns on desktop, one on mobile. The orphan cell
   of an odd-count grid spans full width — both an orphan fix and a
   "featured point" slot for the longest/most important item placed last.
   Cells reuse the base-200 surface of the .ec-split panels. */
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

Exact spacing/sizing values are starting points; tune against the live render.
Token discipline holds: `var(--color-*)` only, no hardcoded `oklch()`, no
DaisyUI v4 short vars. Dark mode is automatic (`base-200` is themed).

### Rendering — `src/routes/[slug]/+page.svelte`

In `decorateAbout`, the `program-philosophy` branch swaps the class it injects:

```js
// before
const body = rest.replace('<ul>', '<ul class="ec-values">');
// after
const body = rest.replace('<ul>', '<ul class="ec-grid">');
```

Remove the now-dead About-scoped `.ec-values` CSS from the component's
`<style>` block (and the mobile `grid-template-columns: 1fr` rule that targeted
it). The `.ec-split` panel rules stay — they belong to the costs-volunteers
section, untouched here.

### Content — `src/content/pages/about.md`

Rebalance the five "Program philosophy" convictions so cells are closer in
length, and cut the gratuitous em dashes (each bullet currently leans on one —
content-guide anti-pattern #1, max one em dash per paragraph). Place the
longest/most-load-bearing conviction **last** so it lands in the wide featured
cell. Meaning and voice unchanged; this is tightening, not rewriting. Keep the
"volunteers, not coaches" rule and the established voice.

## Documentation

Update `docs/design-language.md`:

- Replace the `### Values — .ec-values` kit entry with `### Grid card —
  .ec-grid`, documenting the meaning, the base-200 cell, the two-column layout,
  and the wide/featured last cell.
- Update the worked-example table row for "Program philosophy" from "values
  grid" to "grid card (`.ec-grid`)".
- No icon-matrix change (compass stays the section's glyph).

## Out of scope

- Applying `.ec-grid` to Training or Volunteers (later Pass 4 rollout).
- An explicit always-featured modifier for even-count lists.
- Any palette, font, or new-content changes.

## Verification

- `npx svelte-check` clean.
- Visual check via headless screenshot of the built About page (rebuild first;
  wrangler dev serves built assets on `:8787`): confirm the five convictions
  render as `base-200` tiles, two columns desktop / one column mobile, the wide
  last cell spanning, dark mode intact, and the head compass icon in crimson.
