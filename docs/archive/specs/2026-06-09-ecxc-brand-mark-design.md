# ECXC Brand Mark Design

Date: 2026-06-09. Pass: Rename 5.

The rename spec fixed the concept already. The mark is a four-spot grid monogram, "EC" over
"XC", with the two C's stacking on the right column, colored from the existing theme tokens,
and free of abstract motifs. This spec settles the grid geometry, the letterform weight, and
the scaling strategy from a 32px favicon up to the nav.

## Approaches considered

1. **Bare glyph grid (chosen for the nav).** Four custom rectilinear letterforms in a tight
   2x2 arrangement with no containers. The gutters between cells read as a thin cross of
   negative space. That cross emerges from the grid itself, so it stays inside the
   no-abstract-motifs rule. The mark is light enough to sit beside text nav links.
2. **Four letter tiles.** Each letter knocked out of its own filled square. It reads like an
   app icon, and in the 56px header next to 2px rules it is too heavy.
3. **One chip everywhere.** The favicon chip reused verbatim in the nav. A solid crimson
   square in the header fights the site's light structural style.

The favicon presents the option-1 glyphs knocked out white on a crimson rounded square,
because a tab icon needs to carry its own contrast. One geometry, two presentations.

## Geometry

All values are unitless viewBox coordinates on a 100 by 100 glyph grid.

- Two rows, two columns. Cells are 46 square with an 8-unit gutter, so the grid fills the
  viewBox exactly (46 + 8 + 46 = 100).
- Layout: E top-left, C top-right, X bottom-left, C bottom-right.
- Strokes are 11 units, drawn as filled rectilinear paths with square terminals and sharp
  corners. The X's two diagonals are 12 units so they optically match the straight strokes.
- E is a full-height left stem with three full-width arms. C is a full-height left stem with
  full-width top and bottom arms, open on the right. The two C's are identical paths.

## Color

- **Nav:** glyphs fill with `currentColor`; the logo link sets `color: var(--color-primary)`,
  so each theme supplies its own crimson. Hover keeps the existing 0.75 opacity transition.
- **Favicon:** a static asset, so tokens are unavailable. Tile `oklch(54% 0.26 18)` (the
  light-theme primary), glyphs `oklch(99% 0.003 18)` (primary-content). White on crimson
  reads in both light and dark tab bars without a media query.

## Scaling and deliverables

- **Nav mark** in `Nav.svelte`: inline SVG replacing the `.logo-ecxc` text span, rendered at
  2.25rem (36px) square inside the 3.5rem header.
- **Favicon** at `static/favicon.svg`: viewBox 0 0 64 64, rounded square of radius 14, glyph
  grid inset 12 units on each side. `src/app.html` swaps its dead `favicon.ico` reference for
  `<link rel="icon" type="image/svg+xml" href="%sveltekit.assets%/favicon.svg" />`.
- The same path data serves both. The favicon embeds a copy because a static asset cannot
  import from `src/`; a comment in each file names the other as its twin.
- Four letters at 16px is the hard case. If the standard cut fuzzes there, the favicon may
  take a heavier cut (strokes up to 14 units) of the same geometry. Judge by rendered
  appearance during implementation; the nav cut never changes.

## Accessibility

The logo link carries `aria-label="ECXC home"` and the SVG is `aria-hidden="true"`, so the
mark replaces the placeholder text without losing the accessible name.
