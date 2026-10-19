# Rename 5: ECXC Brand Mark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the nav's "ECXC" text placeholder with the four-spot grid monogram and add a matching SVG favicon.

**Architecture:** One glyph geometry (a 100x100 viewBox, four rectilinear letterforms in a 2x2 grid) rendered two ways. The nav inlines the paths in `Nav.svelte` filled with `currentColor`; the favicon embeds a copy of the same paths knocked out white on a crimson rounded square. Spec: `docs/superpowers/specs/2026-06-09-ecxc-brand-mark-design.md`.

**Tech Stack:** SvelteKit, hand-authored SVG, vitest.

---

## Glyph path data (shared by both renderings)

ViewBox `0 0 100 100`. Cells are 46 square with an 8-unit gutter. Strokes are 11 units
(12 on the X's diagonals), square terminals.

```svg
<!-- E, top-left -->
<path d="M0 0H46V11H11V17.5H46V28.5H11V35H46V46H0Z" />
<!-- C, top-right -->
<path d="M54 0H100V11H65V35H100V46H54Z" />
<!-- X, bottom-left (two diagonal bars, corner-anchored) -->
<path d="M0 54H17L46 83V100H29L0 71Z M29 54H46V71L17 100H0V83Z" />
<!-- C, bottom-right -->
<path d="M54 54H100V65H65V89H100V100H54Z" />
```

These coordinates are the starting cut. Task 4 verifies them visually and may adjust
weights within the spec's limits (X diagonals up to 14 on the favicon cut only).

### Task 1: Failing test for the brand-mark deliverables

**Files:**
- Test: `src/tests/brand-mark.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf-8');

describe('brand mark', () => {
  it('ships an SVG favicon', () => {
    expect(existsSync('static/favicon.svg')).toBe(true);
  });

  it('keeps the favicon font-independent', () => {
    expect(read('static/favicon.svg')).not.toContain('<text');
  });

  it('links the SVG favicon from app.html', () => {
    expect(read('src/app.html')).toContain('favicon.svg');
  });

  it('keeps the accessible name on the logo link', () => {
    expect(read('src/lib/components/Nav.svelte')).toContain('aria-label="ECXC home"');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/tests/brand-mark.test.ts`
Expected: FAIL (favicon.svg missing, app.html still links favicon.ico, Nav has no aria-label).

### Task 2: Favicon

**Files:**
- Create: `static/favicon.svg`
- Modify: `src/app.html` (the `favicon.ico` link, line 5)

- [ ] **Step 1: Write `static/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <!-- Glyph paths are a copy of the nav mark in src/lib/components/Nav.svelte. -->
  <rect width="64" height="64" rx="14" fill="oklch(54% 0.26 18)" />
  <g transform="translate(12 12) scale(0.4)" fill="oklch(99% 0.003 18)">
    <path d="M0 0H46V11H11V17.5H46V28.5H11V35H46V46H0Z" />
    <path d="M54 0H100V11H65V35H100V46H54Z" />
    <path d="M0 54H17L46 83V100H29L0 71Z M29 54H46V71L17 100H0V83Z" />
    <path d="M54 54H100V65H65V89H100V100H54Z" />
  </g>
</svg>
```

- [ ] **Step 2: Swap the link in `src/app.html`**

Replace `<link rel="icon" href="%sveltekit.assets%/favicon.ico" />` with:

```html
<link rel="icon" type="image/svg+xml" href="%sveltekit.assets%/favicon.svg" />
```

- [ ] **Step 3: Run the test**

Run: `npx vitest run src/tests/brand-mark.test.ts`
Expected: the two favicon tests and the app.html test PASS; the Nav test still FAILS.

### Task 3: Nav mark

**Files:**
- Modify: `src/lib/components/Nav.svelte` (the `.site-logo` anchor and `.logo-ecxc` styles)

- [ ] **Step 1: Replace the placeholder span with the inline mark**

```svelte
<a href="/" class="site-logo" aria-label="ECXC home" onclick={closeMobile}>
  <!-- Four-spot grid monogram. static/favicon.svg embeds a copy of these paths. -->
  <svg class="logo-mark" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
    <path d="M0 0H46V11H11V17.5H46V28.5H11V35H46V46H0Z" />
    <path d="M54 0H100V11H65V35H100V46H54Z" />
    <path d="M0 54H17L46 83V100H29L0 71Z M29 54H46V71L17 100H0V83Z" />
    <path d="M54 54H100V65H65V89H100V100H54Z" />
  </svg>
</a>
```

- [ ] **Step 2: Replace the `.logo-ecxc` style block**

Delete the placeholder comment and `.logo-ecxc` rule; add:

```css
.site-logo { color: var(--color-primary); }
.logo-mark {
  width: 2.25rem;
  height: 2.25rem;
  display: block;
}
```

The existing `.site-logo` hover (opacity 0.75) stays.

- [ ] **Step 3: Run the full test file**

Run: `npx vitest run src/tests/brand-mark.test.ts`
Expected: all 4 PASS.

### Task 4: Visual verification and refinement

- [ ] **Step 1: Build and preview**

```bash
npm run build && (sleep infinity | npx wrangler dev --port 8787 &)
```

Render the nav and favicon (fetch `http://localhost:8787/` and `/favicon.svg`; screenshot
or rasterize the favicon at 16, 32, and 64 px) and judge against the spec: grid reads as
EC over XC, strokes hold at 32px, the favicon silhouette stays a clean crimson chip at
16px. Apply `frontend-design` judgment; thicken the favicon cut (strokes to 13 or 14)
only if 16px fuzzes. Check both themes for the nav mark.

- [ ] **Step 2: Quality gate**

Run: `npm run check` (0 errors / 0 warnings), `npm test` (exit 0), `npm run build`.

### Task 5: Pass-end ritual

Run the site-pass consolidation ritual. It covers code-simplifier over `Nav.svelte`, the
reviewer fan-out (`svelte-reviewer`, `daisyui-a11y-reviewer`), a `docs/architecture.md`
entry, the STATUS.md update with the Rename 6 starter prompt, archival of this plan and
the spec, and the final commit and push.
