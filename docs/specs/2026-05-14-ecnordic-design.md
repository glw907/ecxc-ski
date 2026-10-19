# ECN Nordic — Design Spec (Pass 3)

**Date:** 2026-05-14  
**Status:** Approved — implement from this document

---

## Design Direction

**Aesthetic:** Community notice board meets outdoor program guide. Warm, approachable, confident. Feels made by people who love the sport, not an agency. The ECN crimson appears as a bold accent — used with intention, not scattered.

**The one thing people remember:** The training schedule is always right there. You don't hunt for it.

---

## Color System

### Light theme (`ecn`)

All values `oklch()`. No hex, no `rgb()`.

#### Custom tokens (`@theme` block in `src/app.css`)

| Token | Value | Notes |
|-------|-------|-------|
| `--color-heading` | `oklch(18% 0.025 15)` | Near-black, crimson undertone |
| `--color-body` | `oklch(28% 0.015 15)` | Dark charcoal |
| `--color-muted` | `oklch(50% 0.012 20)` | Secondary text |
| `--color-faint` | `oklch(65% 0.008 20)` | Placeholder, disabled |
| `--color-border` | `oklch(82% 0.008 20)` | Standard divider |
| `--color-border-subtle` | `oklch(90% 0.005 20)` | Light divider |
| `--color-surface` | `oklch(94% 0.010 55)` | Card / elevated surface |
| `--color-link` | `oklch(43% 0.20 15)` | ECN crimson |
| `--color-link-hover` | `oklch(33% 0.22 15)` | Darker crimson |
| `--color-tag` | `oklch(42% 0.18 15)` | Tag text (crimson) |
| `--color-tag-hash` | `oklch(64% 0.006 20)` | Tag `#` prefix |
| `--color-focus-ring` | `oklch(55% 0.14 15 / 0.15)` | Focus outline |
| `--color-success` | `oklch(42% 0.012 145)` | Form success |
| `--color-error` | `oklch(45% 0.02 25)` | Form error |
| `--color-error-bg` | `oklch(96% 0.008 25)` | Error background |
| `--color-error-border` | `oklch(85% 0.015 25)` | Error border |
| `--color-highlight` | `oklch(75% 0.10 15 / 0.25)` | Text highlight |
| `--color-training-bg` | `oklch(96% 0.012 55)` | Training schedule widget background |
| `--color-training-accent` | `oklch(43% 0.20 15)` | Training widget accent bar |

#### DaisyUI theme overrides (`@plugin "daisyui/theme"`)

| Token | Value |
|-------|-------|
| `--color-base-100` | `oklch(97% 0.007 55)` — warm off-white |
| `--color-base-200` | `oklch(92% 0.010 55)` — warm surface |
| `--color-base-300` | `oklch(86% 0.012 55)` — warm border |
| `--color-base-content` | `oklch(18% 0.025 15)` |
| `--color-primary` | `oklch(43% 0.22 15)` — ECN crimson |
| `--color-primary-content` | `oklch(97% 0.004 15)` |
| `--color-secondary` | `oklch(26% 0.09 255)` — deep navy |
| `--color-secondary-content` | `oklch(94% 0.005 255)` |
| `--color-accent` | `oklch(55% 0.18 15)` — lighter crimson |
| `--color-accent-content` | `oklch(97% 0.004 15)` |
| `--color-neutral` | `oklch(28% 0.015 230)` |
| `--color-neutral-content` | `oklch(90% 0.006 230)` |

### Dark theme (`ecn-dark`)

#### Custom tokens

| Token | Value |
|-------|-------|
| `--color-heading` | `oklch(92% 0.008 25)` |
| `--color-body` | `oklch(80% 0.010 25)` |
| `--color-muted` | `oklch(58% 0.008 25)` |
| `--color-faint` | `oklch(42% 0.006 255)` |
| `--color-border` | `oklch(26% 0.020 255)` |
| `--color-border-subtle` | `oklch(20% 0.015 255)` |
| `--color-surface` | `oklch(17% 0.020 255)` |
| `--color-link` | `oklch(70% 0.18 15)` |
| `--color-link-hover` | `oklch(80% 0.20 15)` |
| `--color-tag` | `oklch(65% 0.14 15)` |
| `--color-tag-hash` | `oklch(42% 0.008 255)` |
| `--color-focus-ring` | `oklch(55% 0.10 15 / 0.20)` |
| `--color-success` | `oklch(62% 0.012 145)` |
| `--color-error` | `oklch(65% 0.02 25)` |
| `--color-error-bg` | `oklch(18% 0.012 25)` |
| `--color-error-border` | `oklch(30% 0.018 25)` |
| `--color-highlight` | `oklch(50% 0.12 15 / 0.35)` |
| `--color-training-bg` | `oklch(17% 0.022 255)` |
| `--color-training-accent` | `oklch(62% 0.20 15)` |

#### DaisyUI dark theme overrides

| Token | Value |
|-------|-------|
| `--color-base-100` | `oklch(13% 0.022 255)` — deep navy-black |
| `--color-base-200` | `oklch(17% 0.022 255)` |
| `--color-base-300` | `oklch(22% 0.025 255)` |
| `--color-base-content` | `oklch(90% 0.008 25)` |
| `--color-primary` | `oklch(62% 0.22 15)` — brighter crimson for dark |
| `--color-primary-content` | `oklch(12% 0.015 15)` |
| `--color-secondary` | `oklch(42% 0.14 255)` |
| `--color-secondary-content` | `oklch(92% 0.005 255)` |
| `--color-accent` | `oklch(70% 0.18 15)` |
| `--color-accent-content` | `oklch(12% 0.010 15)` |
| `--color-neutral` | `oklch(22% 0.020 255)` |
| `--color-neutral-content` | `oklch(80% 0.008 25)` |

---

## Typography

### Fonts

| Role | Font | Source | Weights |
|------|------|---------|---------|
| Display (headings) | **Nunito** | Google Fonts | 600, 700, 800 |
| Body | **Alegreya Sans** | Self-hosted (already in `static/fonts/`) | 400, 500, 700 |
| Mono | **iA Writer Mono S** | Self-hosted (already in `static/fonts/`) | 400, 700 |

Add to `src/app.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&display=swap" rel="stylesheet">
```

Update `@theme` in `src/app.css`:
```css
--font-body: 'Alegreya Sans', system-ui, sans-serif;
--font-display: 'Nunito', system-ui, sans-serif;
--font-mono: 'iA Writer Mono S', ui-monospace, monospace;
```

### Type scale

| Element | Size | Weight | Font | Notes |
|---------|------|--------|------|-------|
| Site logo "ECN" | 1.7rem | 800 | Nunito | crimson (`var(--color-primary)`) |
| Site logo "Nordic" | 1rem | 600 | Nunito | muted |
| Featured post title | `clamp(1.8rem, 5vw, 2.5rem)` | 700 | Nunito | heading color |
| Post list title | `clamp(1.05rem, 3vw, 1.3rem)` | 700 | Nunito | heading color |
| Static page h1 | `clamp(1.75rem, 4.5vw, 2.25rem)` | 800 | Nunito | heading color |
| Body text | 1.05rem | 400 | Alegreya Sans | 1.58 line-height |
| Nav links | 0.75rem | 600 | Nunito | uppercase, 0.07em tracking |
| Training day label | 0.7rem | 700 | Nunito | uppercase, wide tracking |
| Post date | 0.72rem | 400 | Alegreya Sans | uppercase, muted |

---

## Components

### Nav

- Sticky, `z-30`, `bg-base-100`
- **Bottom border: `2px solid var(--color-primary)`** — the signature ECN crimson line
- Height: 56px (`h-14`)
- Max width: `max-w-3xl`, centered
- Logo: "ECN" in Nunito 800, `var(--color-primary)` + " Nordic" in Nunito 600, `var(--color-muted)`
- Nav links: Nunito 600, 0.75rem, uppercase, `var(--color-muted)` → `var(--color-body)` on hover
- Active link: `var(--color-primary)` color + `border-bottom: 2px solid var(--color-primary)`, `padding-bottom: 2px`
- Active detection: `page.url.pathname` check in Svelte (use `$page` store)
- Icons: search + theme toggle, same muted style
- **Mobile (< 640px):** Hamburger menu — nav links collapse, icon opens a dropdown. Logo + icons always visible.

### Training Schedule Widget (homepage, top of page)

A static section immediately below the nav. Shows the recurring weekly training pattern.

```
┌─────────────────────────────────────────────────────┐
│  ▌ WEEKLY TRAINING                                  │
│                                                     │
│  MON    WED    FRI                                  │
│  [day]  [day]  [day]                               │
│                                                     │
│  Usually Mon · Wed · Fri — check calendar for changes │
└─────────────────────────────────────────────────────┘
```

- Background: `var(--color-training-bg)` (warm tinted)
- Left accent bar: 3px solid `var(--color-training-accent)` (crimson)
- Day labels: Nunito 800, uppercase, large (1.1rem)
- Day names spelled out: Nunito 600, muted, small (0.7rem)
- Sub-note: Alegreya Sans italic, muted, 0.875rem — wording: "Usually Mon · Wed · Fri — check the calendar for any changes"
- Padding: comfortable, compact — not a huge block
- Full width of content column, subtle border

### Homepage Posts Section

Below the training widget:

1. **Featured post** — iA Writer Quattro S title (large), full post body, tags. Separated from older posts by a border.
2. **Earlier posts** — compact list with date + title + description.

No visual changes needed here beyond the font swap to Nunito for titles.

### Calendar Page

- `h1` "Calendar" in Nunito 800
- ICS subscribe: `btn btn-sm btn-outline btn-primary` (crimson outline)
- Schedule-x calendar widget: unchanged
- Event list: each item gets a left-aligned date stamp in crimson, event title in Nunito 700

```
┌───────────────────────────────────────┐
│ NOV 22  Early Season Camp             │
│         Kincaid Park, Anchorage       │
│                                       │
│ DEC 6   Kincaid Classic               │
│         Kincaid Park, Anchorage       │
└───────────────────────────────────────┘
```

- Date: Nunito 700, 0.8rem, uppercase, `var(--color-primary)`, fixed width (≈5ch)
- Title: Nunito 700, body size
- Location: Alegreya Sans, 0.875rem, muted

### Footer

Minimal changes — update font to Nunito for labels, keep current icon + link structure.

### Static Pages (`[slug]`)

`h1` bumped to `clamp(1.75rem, 4.5vw, 2.25rem)`, Nunito 800. Rest unchanged.

### Post Detail (`[year]/[month]/[slug]`)

Post title: Nunito 700, `clamp(1.75rem, 4.5vw, 2.25rem)`. Body: Alegreya Sans (unchanged).

---

## Implementation Order

1. `src/app.html` — add Nunito Google Fonts link
2. `src/app.css` — update `@theme` font vars, replace all color tokens
3. `src/lib/components/Nav.svelte` — Nunito logo, active detection, mobile hamburger, crimson border
4. `src/routes/+layout.svelte` — add training schedule widget above `<main>`, footer font update
5. `src/routes/+page.svelte` — title font swap (Nunito vars), no structural changes needed
6. `src/routes/calendar/+page.svelte` — event list redesign, button style
7. `src/routes/[slug]/+page.svelte` — h1 size
8. `src/routes/[year]/[month]/[slug]/+page.svelte` — post title font size

---

## Constraints

- No hex, no `rgb()` — `oklch()` throughout
- No hardcoded `oklch()` in components — define new tokens in `@theme`, reference via `var(--color-*)`
- No DaisyUI v4 short vars (`--bc`, `--p`, etc.)
- Training schedule is static content in the layout/homepage — no new data layer
- Mobile nav is in scope
