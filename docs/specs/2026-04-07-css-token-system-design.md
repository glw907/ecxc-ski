# CSS Token System + Dark Mode

Design spec for migrating hardcoded oklch values to CSS custom properties,
adding dark mode support, and enforcing token usage via hookify.

## Problem

102 hardcoded `oklch()` values scattered across 9 files. No dark mode
support despite DaisyUI dim theme being available. No enforcement against
future hardcoded values. A previous partial migration attempt left the
codebase in an inconsistent state — this spec replaces it with an atomic
approach.

## Approach

Define semantic color tokens in Tailwind v4's `@theme` block under the
`--color-*` namespace. This generates both CSS custom properties (usable
via `var()`) and Tailwind utility classes (e.g., `text-heading`,
`bg-surface`) from a single definition.

Light values are the `@theme` defaults. Dark overrides live in a
`[data-theme="dim"]` selector. Theme persistence uses cookies for SSR
injection (no flash) plus localStorage for the inline init script.

## Token Definitions

All tokens use the `--color-*` namespace. Defined in `@theme` with silk
(light) defaults. Overridden in `[data-theme="dim"]` for dark mode.

### UI Chrome (hue 230)

| Token | Role | Silk | Dim |
|---|---|---|---|
| `--color-heading` | Titles, strong text | `oklch(18% 0.01 230)` | `oklch(88% 0.01 230)` |
| `--color-body` | Body prose | `oklch(28% 0.01 230)` | `oklch(78% 0.01 230)` |
| `--color-muted` | Secondary text, dates | `oklch(55% 0.008 230)` | `oklch(58% 0.008 230)` |
| `--color-faint` | Tertiary, close buttons | `oklch(68% 0.008 230)` | `oklch(45% 0.008 230)` |
| `--color-border` | Borders, rules | `oklch(82% 0.006 230)` | `oklch(32% 0.012 230)` |
| `--color-border-subtle` | Faint dividers | `oklch(90% 0.004 230)` | `oklch(28% 0.008 230)` |
| `--color-surface` | Code bg, input bg | `oklch(93.5% 0.005 230)` | `oklch(26% 0.012 230)` |
| `--color-link` | Links | `oklch(32% 0.015 230)` | `oklch(72% 0.015 230)` |
| `--color-link-hover` | Link hover | `oklch(22% 0.02 230)` | `oklch(82% 0.02 230)` |
| `--color-tag` | Tag text | `oklch(50% 0.012 230)` | `oklch(60% 0.012 230)` |
| `--color-tag-hash` | Tag # prefix | `oklch(68% 0.008 230)` | `oklch(45% 0.008 230)` |
| `--color-focus-ring` | Focus indicators | `oklch(62% 0.012 230 / 0.12)` | `oklch(58% 0.008 230 / 0.2)` |

### Semantic Colors

| Token | Role | Silk | Dim |
|---|---|---|---|
| `--color-success` | Form success | `oklch(42% 0.012 145)` | `oklch(62% 0.012 145)` |
| `--color-error` | Form error text | `oklch(45% 0.02 25)` | `oklch(65% 0.02 25)` |
| `--color-error-bg` | Error background | `oklch(96% 0.008 25)` | `oklch(26% 0.012 25)` |
| `--color-error-border` | Error border | `oklch(85% 0.015 25)` | `oklch(35% 0.015 25)` |
| `--color-highlight` | Search mark bg | `oklch(85% 0.06 80 / 0.35)` | `oklch(45% 0.08 80 / 0.4)` |

New tokens can be added to `@theme` + the dim override block as needed.

## app.css Structure

```
@import "tailwindcss";
@plugin "daisyui" {
  themes: silk --default, dim --prefersdark;
}

@font-face declarations (unchanged)

@theme {
  --font-body / --font-display / --font-mono (existing)
  --color-heading through --color-highlight (silk defaults)
}

@plugin "daisyui/theme" {
  name: "silk";
  default: true;
  color-scheme: light;
  --color-base-content: oklch(22% 0.012 61);
}

@plugin "daisyui/theme" {
  name: "dim";
  prefersdark: true;
  color-scheme: dark;
  --color-base-content: oklch(80% 0.012 61);
  --color-heading through --color-highlight   /* dark overrides */
}

body { ... }

Shared post chrome (.post-date, .post-tags, etc.)
  — all using var(--color-*) references

Post body (.post-body)
  — all using var(--color-*) references
```

**Important:** Theme overrides MUST use `@plugin "daisyui/theme"`, not raw
`[data-theme="..."]` blocks. Raw blocks don't inherit the built-in theme's
variables (base-100, base-200, etc.), so backgrounds/surfaces won't change.

## Theme Infrastructure

### Theme initialization (app.html)

Inline `<script>` in `<head>`, runs before paint:

1. Read `theme` cookie
2. If no cookie, check `prefers-color-scheme: dark` — use dim if true, silk otherwise
3. Set `data-theme` attribute on `<html>`

This eliminates flash-of-wrong-theme on both first visit and return visits.

### Server-side injection (hooks.server.ts)

New file. Reads the `theme` cookie from the request and injects the
correct `data-theme` attribute into the SSR HTML via `transformPageChunk`.
Falls back to empty `data-theme` (the inline script handles it client-side).

```typescript
export const handle = async ({ event, resolve }) => {
  const theme = event.cookies.get('theme') ?? '';
  return resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace('data-theme=""', `data-theme="${theme}"`),
  });
};
```

### Theme toggle (Nav.svelte)

Toggle button in the nav icon group (already exists in committed code as
a moon/sun icon). On click:

1. Toggle between silk and dim
2. Set `data-theme` attribute on `<html>`
3. Write `theme` cookie (max-age 1 year, SameSite=Lax, path=/)
4. Write to localStorage (backup for inline script)

### app.html changes

Change `data-theme="silk"` to `data-theme=""` so the server hook and
inline script can set it. The inline script is the fallback when there's
no cookie (first visit).

## Migration

### Scope

Replace all 102 hardcoded `oklch()` values across 9 files with
`var(--color-*)` references. Done as a single atomic commit.

| File | Count |
|---|---|
| `src/app.css` | 34 |
| `src/lib/components/SearchModal.svelte` | 26 |
| `src/lib/components/ContactForm.svelte` | 14 |
| `src/routes/+page.svelte` | 9 |
| `src/lib/components/Nav.svelte` | 7 |
| `src/lib/components/ArchiveList.svelte` | 5 |
| `src/routes/+layout.svelte` | 3 |
| `src/routes/[year]/[month]/[day]/[slug]/+page.svelte` | 3 |
| `src/routes/tags/[tag]/+page.svelte` | 1 |

### SearchModal special case

The pagefind overrides use `!important` and inject styles via
`{@html}` in `<svelte:head>`. These will reference `var(--color-*)`
tokens. Since pagefind's CSS loads globally, the token references will
resolve against the current theme automatically.

### Mapping guide

Each hardcoded value maps to its semantic token. Example mappings:

- `oklch(18% 0.01 230)` / `oklch(16% 0.01 230)` -> `var(--color-heading)`
- `oklch(28% 0.01 230)` / `oklch(26% 0.018 230)` -> `var(--color-body)`
- `oklch(55% 0.008 230)` / `oklch(52% 0.008 230)` -> `var(--color-muted)`
- `oklch(82% 0.006 230)` / `oklch(87% 0.008 230)` -> `var(--color-border)`
- `oklch(93.5% 0.005 230)` -> `var(--color-surface)`
- `oklch(42% 0.012 145)` -> `var(--color-success)`
- `oklch(45% 0.02 25)` -> `var(--color-error)`

Values that are close but not identical (e.g., `16%` vs `18%` lightness
for headings) collapse into one token. The token value is the canonical
one; minor variations are intentional consolidation, not bugs.

### Values that stay hardcoded

- Overlay backgrounds with alpha (e.g., `oklch(20% 0.008 230 / 0.25)`
  on the search modal backdrop) — these are one-off effects, not
  semantic roles. They can be tokenized later if needed.
- The `body` transition property in app.css (`transition: background-color
  0.3s ease, color 0.3s ease`) should be added to support smooth theme
  switching.

## Hookify Rule

New file: `.claude/hookify.hardcoded-oklch.local.md`

**Trigger:** Edit of `.svelte` or `.css` files.

**Detects:** Raw `oklch()` values outside of `@theme { }` blocks and
`[data-theme="..."] { }` override blocks.

**Allows:**
- `oklch()` inside `@theme { }` (token definitions)
- `oklch()` inside `[data-theme] { }` (theme overrides)
- `oklch()` in overlay/backdrop alpha values (flagged but not blocked)

**Message:** "Use a design token (`var(--color-*)`) instead of a hardcoded
oklch value. Define new tokens in the `@theme` block in `app.css`."

The existing `oklch-colors` rule (catches hex/rgb/hsl) remains unchanged.
Together they enforce the full color pipeline.

## Verification

After migration, take Playwright screenshots of:

1. Homepage — both silk and dim themes
2. A post with code blocks and tables — both themes
3. Search modal open — both themes
4. Contact form with error/success states — both themes

Compare against the live site (silk only) to confirm no regression in
light mode. Dark mode is net-new so review visually for contrast and
readability.

## Files Created or Modified

**New files:**
- `src/hooks.server.ts` — theme cookie injection

**Modified files:**
- `src/app.css` — token definitions, dim overrides, var() migration
- `src/app.html` — empty data-theme, inline theme script
- `src/lib/components/SearchModal.svelte` — var() migration
- `src/lib/components/ContactForm.svelte` — var() migration
- `src/lib/components/Nav.svelte` — var() migration, theme toggle logic
- `src/lib/components/ArchiveList.svelte` — var() migration
- `src/routes/+page.svelte` — var() migration
- `src/routes/+layout.svelte` — var() migration
- `src/routes/[year]/[month]/[day]/[slug]/+page.svelte` — var() migration
- `src/routes/tags/[tag]/+page.svelte` — var() migration
- `.claude/hookify.hardcoded-oklch.local.md` — new hookify rule
