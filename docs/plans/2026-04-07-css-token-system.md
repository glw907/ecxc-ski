# CSS Token System + Dark Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 102 hardcoded oklch values with semantic CSS tokens, add dark mode with theme persistence, and enforce token usage via hookify.

**Architecture:** Define color tokens in Tailwind v4's `@theme` block (generates both CSS vars and utility classes). Light values are defaults; dark overrides in `[data-theme="dim"]`. Theme persistence via cookie + hooks.server.ts for flash-free SSR.

**Tech Stack:** SvelteKit, Tailwind CSS v4, DaisyUI v5, oklch color space

**Spec:** `docs/superpowers/specs/2026-04-07-css-token-system-design.md`

---

### Task 1: Define color tokens in app.css

**Files:**
- Modify: `src/app.css`

- [ ] **Step 1: Add color tokens to @theme block**

Add all 17 color tokens after the existing font tokens in the `@theme` block. These are the silk (light) defaults:

```css
@theme {
  --font-body: 'Spectral', Georgia, serif;
  --font-display: 'Outfit', system-ui, sans-serif;
  --font-mono: 'Monaspace Neon', ui-monospace, monospace;
  --default-font-family: 'Spectral', Georgia, serif;
  --default-mono-font-family: 'Monaspace Neon', ui-monospace, monospace;

  /* Color tokens — silk (light) defaults */
  --color-heading: oklch(18% 0.01 230);
  --color-body: oklch(28% 0.01 230);
  --color-muted: oklch(55% 0.008 230);
  --color-faint: oklch(68% 0.008 230);
  --color-border: oklch(82% 0.006 230);
  --color-border-subtle: oklch(90% 0.004 230);
  --color-surface: oklch(93.5% 0.005 230);
  --color-link: oklch(32% 0.015 230);
  --color-link-hover: oklch(22% 0.02 230);
  --color-tag: oklch(50% 0.012 230);
  --color-tag-hash: oklch(68% 0.008 230);
  --color-focus-ring: oklch(62% 0.012 230 / 0.12);
  --color-success: oklch(42% 0.012 145);
  --color-error: oklch(45% 0.02 25);
  --color-error-bg: oklch(96% 0.008 25);
  --color-error-border: oklch(85% 0.015 25);
  --color-highlight: oklch(85% 0.06 80 / 0.35);
}
```

- [ ] **Step 2: Add dim (dark) theme overrides**

Add a `[data-theme="dim"]` block after the existing `[data-theme="silk"]` block:

```css
[data-theme="dim"] {
  --color-base-content: oklch(80% 0.012 61);
  --color-heading: oklch(88% 0.01 230);
  --color-body: oklch(78% 0.01 230);
  --color-muted: oklch(58% 0.008 230);
  --color-faint: oklch(45% 0.008 230);
  --color-border: oklch(32% 0.012 230);
  --color-border-subtle: oklch(28% 0.008 230);
  --color-surface: oklch(26% 0.012 230);
  --color-link: oklch(72% 0.015 230);
  --color-link-hover: oklch(82% 0.02 230);
  --color-tag: oklch(60% 0.012 230);
  --color-tag-hash: oklch(45% 0.008 230);
  --color-focus-ring: oklch(58% 0.008 230 / 0.2);
  --color-success: oklch(62% 0.012 145);
  --color-error: oklch(65% 0.02 25);
  --color-error-bg: oklch(26% 0.012 25);
  --color-error-border: oklch(35% 0.015 25);
  --color-highlight: oklch(45% 0.08 80 / 0.4);
}
```

- [ ] **Step 3: Add body transition for smooth theme switching**

Add `transition` to the existing `body` rule:

```css
body {
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 1.58;
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

- [ ] **Step 4: Build and verify tokens resolve**

Run: `npm run build 2>&1 | tail -5`

Expected: Build succeeds with `✔ done`

- [ ] **Step 5: Commit**

```bash
git add src/app.css
git commit -m "Add color token definitions in @theme with dim overrides"
```

---

### Task 2: Migrate app.css hardcoded values to tokens

**Files:**
- Modify: `src/app.css`

Replace every hardcoded `oklch()` value in the style rules (not the `@theme` or `[data-theme]` blocks) with `var(--color-*)` references. Here is the complete mapping for each rule:

- [ ] **Step 1: Migrate shared post chrome**

```css
.post-date {
  /* ... unchanged properties ... */
  color: var(--color-muted);
}

.post-tag {
  /* ... */
  color: var(--color-muted);
  /* ... */
  border: 1px solid var(--color-border);
}

.post-tag:hover {
  color: var(--color-body);
  border-color: var(--color-muted);
}

.page-title {
  /* ... */
  color: var(--color-heading);
}

.back-link {
  /* ... */
  color: var(--color-muted);
}

.back-link:hover {
  color: var(--color-body);
}
```

- [ ] **Step 2: Migrate post body styles**

```css
.post-body {
  /* ... */
  color: var(--color-body);
}

.post-body h2 {
  /* ... */
  color: var(--color-heading);
}
.post-body h3 {
  /* ... */
  color: var(--color-heading);
}

.post-body blockquote {
  border-left: 2px solid var(--color-border);
  /* ... */
  color: var(--color-muted);
}

.post-body li.task-list-item input[type="checkbox"] {
  /* ... */
  border: 1px solid var(--color-faint);
}
.post-body li.task-list-item input[type="checkbox"]:checked {
  background: var(--color-border);
  border-color: var(--color-muted);
}
.post-body li.task-list-item input[type="checkbox"]:checked::after {
  /* ... */
  color: var(--color-body);
}

.post-body code {
  /* ... */
  background: var(--color-surface);
  /* ... */
  color: var(--color-body);
  border: 1px solid var(--color-border);
}

.post-body pre {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  /* ... */
}
.post-body pre code {
  /* ... */
  color: var(--color-heading);
}

.post-body th {
  /* ... */
  color: var(--color-muted);
  border-bottom: 2px solid var(--color-muted);
}
.post-body td {
  /* ... */
  border-bottom: 1px solid var(--color-border);
  /* ... */
  color: var(--color-body);
}

.post-body a {
  color: var(--color-link);
  /* ... */
}
.post-body a:hover {
  color: var(--color-link-hover);
  text-decoration-color: var(--color-muted);
}
.post-body a:active {
  color: var(--color-heading);
  text-decoration-color: var(--color-muted);
}

.post-body hr {
  /* ... */
  border-top: 1px solid var(--color-border-subtle);
}
```

- [ ] **Step 3: Verify no hardcoded oklch remains in style rules**

Run: `grep -n 'oklch' src/app.css | grep -v '@theme' | grep -v 'data-theme'`

Expected: Only the `@theme` block and `[data-theme]` blocks contain oklch values. Zero results from style rules.

- [ ] **Step 4: Build and verify**

Run: `npm run build 2>&1 | tail -5`

Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/app.css
git commit -m "Migrate app.css style rules to color tokens"
```

---

### Task 3: Migrate component files to tokens

**Files:**
- Modify: `src/lib/components/Nav.svelte`
- Modify: `src/lib/components/ContactForm.svelte`
- Modify: `src/lib/components/ArchiveList.svelte`

- [ ] **Step 1: Migrate Nav.svelte**

Replace all 7 hardcoded oklch values in the `<style>` block:

```
oklch(18% 0.01 230) → var(--color-heading)     [.logo-primary, .nav-link:active]
oklch(62% 0.008 230) → var(--color-muted)       [.logo-secondary]
oklch(52% 0.008 230) → var(--color-muted)       [.nav-link, .nav-icon]
oklch(28% 0.01 230)  → var(--color-body)         [.nav-link:hover, .nav-icon:hover]
```

- [ ] **Step 2: Migrate ContactForm.svelte**

Replace all 14 hardcoded oklch values in the `<style>` block:

```
oklch(88% 0.005 230)        → var(--color-border-subtle)  [.contact-section border]
oklch(18% 0.01 230)         → var(--color-heading)        [.contact-heading]
oklch(22% 0.01 230)         → var(--color-heading)        [.field-input color]
oklch(98% 0.002 230)        → var(--color-surface)        [.field-input bg]
oklch(82% 0.006 230)        → var(--color-border)         [.field-input border]
oklch(62% 0.012 230)        → var(--color-muted)          [.field-input:focus border]
oklch(62% 0.012 230 / 0.12) → var(--color-focus-ring)     [.field-input:focus shadow]
oklch(98% 0.002 230)        → var(--color-surface)        [.submit-btn color]
oklch(28% 0.01 230)         → var(--color-body)           [.submit-btn bg]
oklch(20% 0.01 230)         → var(--color-heading)        [.submit-btn:hover bg]
oklch(42% 0.012 145)        → var(--color-success)        [.form-success]
oklch(45% 0.02 25)          → var(--color-error)          [.form-error color]
oklch(96% 0.008 25)         → var(--color-error-bg)       [.form-error bg]
oklch(85% 0.015 25)         → var(--color-error-border)   [.form-error border]
```

- [ ] **Step 3: Migrate ArchiveList.svelte**

Replace all 5 hardcoded oklch values in the `<style>` block:

```
oklch(58% 0.008 230)  → var(--color-muted)          [.year-heading, .entry-date]
oklch(92% 0.003 230)  → var(--color-border-subtle)  [.archive-entry border]
oklch(22% 0.01 230)   → var(--color-heading)         [.entry-title]
oklch(40% 0.025 230)  → var(--color-muted)           [.entry-title:hover]
```

- [ ] **Step 4: Build and verify**

Run: `npm run build 2>&1 | tail -5`

Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/Nav.svelte src/lib/components/ContactForm.svelte src/lib/components/ArchiveList.svelte
git commit -m "Migrate Nav, ContactForm, ArchiveList to color tokens"
```

---

### Task 4: Migrate route files to tokens

**Files:**
- Modify: `src/routes/+page.svelte`
- Modify: `src/routes/+layout.svelte`
- Modify: `src/routes/[year]/[month]/[day]/[slug]/+page.svelte`
- Modify: `src/routes/tags/[tag]/+page.svelte`

- [ ] **Step 1: Migrate +page.svelte (homepage)**

Replace all 9 hardcoded oklch values in the `<style>` block:

```
oklch(82% 0.006 230)  → var(--color-border)         [.featured-post border]
oklch(88% 0.005 230)  → var(--color-border-subtle)  [.featured-title border]
oklch(18% 0.01 230)   → var(--color-heading)         [.featured-title a]
oklch(38% 0.04 230)   → var(--color-muted)           [.featured-title a:hover]
oklch(58% 0.008 230)  → var(--color-muted)           [.older-heading]
oklch(90% 0.004 230)  → var(--color-border-subtle)  [.post-entry border]
oklch(20% 0.01 230)   → var(--color-heading)         [.post-title a]
oklch(40% 0.025 230)  → var(--color-muted)           [.post-title a:hover]
oklch(48% 0.008 230)  → var(--color-muted)           [.post-description]
```

- [ ] **Step 2: Migrate +layout.svelte (footer)**

Replace all 3 hardcoded oklch values in the `<style>` block:

```
oklch(60% 0.008 230)  → var(--color-muted)  [.footer-icon-link]
oklch(35% 0.012 230)  → var(--color-body)    [.footer-icon-link:hover]
oklch(62% 0.008 230)  → var(--color-muted)  [.footer-name]
```

- [ ] **Step 3: Migrate [slug]/+page.svelte (post detail)**

Replace all 3 hardcoded oklch values in the `<style>` block:

```
oklch(88% 0.005 230)  → var(--color-border-subtle)  [.post-header border, .post-footer border]
oklch(18% 0.01 230)   → var(--color-heading)         [.post-title]
```

- [ ] **Step 4: Migrate tags/[tag]/+page.svelte**

Replace the 1 hardcoded oklch value in the `<style>` block:

```
oklch(88% 0.005 230)  → var(--color-border-subtle)  [.tag-footer border]
```

- [ ] **Step 5: Build and verify**

Run: `npm run build 2>&1 | tail -5`

Expected: Build succeeds

- [ ] **Step 6: Verify zero hardcoded oklch in migrated files**

Run: `grep -rn 'oklch' src/ --include='*.svelte' --include='*.css' | grep -v '@theme' | grep -v 'data-theme' | grep -v 'node_modules'`

Expected: Only `SearchModal.svelte` results (migrated in next task) and any overlay alpha values that stay hardcoded.

- [ ] **Step 7: Commit**

```bash
git add src/routes/+page.svelte src/routes/+layout.svelte "src/routes/[year]/[month]/[day]/[slug]/+page.svelte" "src/routes/tags/[tag]/+page.svelte"
git commit -m "Migrate route files to color tokens"
```

---

### Task 5: Migrate SearchModal to tokens

**Files:**
- Modify: `src/lib/components/SearchModal.svelte`

The SearchModal has two areas: scoped `<style>` and pagefind overrides injected via `{@html}` in `<svelte:head>`. Both need migration.

- [ ] **Step 1: Migrate scoped styles**

Replace hardcoded oklch values in the `<style>` block. The overlay backdrop `oklch(20% 0.008 230 / 0.25)` stays hardcoded (one-off effect). The box-shadow values `oklch(20% 0.01 230 / 0.1)` and `oklch(20% 0.01 230 / 0.04)` also stay hardcoded.

```
oklch(82% 0.006 230)  → var(--color-border)  [.search-panel border]
oklch(68% 0.008 230)  → var(--color-faint)   [.search-close color]
oklch(28% 0.01 230)   → var(--color-body)     [.search-close:hover]
oklch(82% 0.006 230)  → var(--color-border)  [scrollbar thumb]
```

- [ ] **Step 2: Migrate pagefind override styles**

Replace hardcoded oklch values inside the `{@html}` template string. These use `!important` and that stays:

```
oklch(16% 0.01 230)        → var(--color-heading)        [--pagefind-ui-primary]
oklch(28% 0.01 230)        → var(--color-body)            [--pagefind-ui-text]
oklch(82% 0.006 230)       → var(--color-border)          [--pagefind-ui-border, input border]
oklch(93.5% 0.005 230)     → var(--color-surface)         [--pagefind-ui-tag, input bg]
oklch(55% 0.008 230)       → var(--color-muted)           [input:focus border, .message, .excerpt, .button color]
oklch(68% 0.008 230)       → var(--color-faint)           [.search-clear]
oklch(90% 0.004 230)       → var(--color-border-subtle)  [.result border]
oklch(16% 0.01 230)        → var(--color-heading)         [.result-link]
oklch(32% 0.015 230)       → var(--color-link)            [.result-link:hover]
oklch(85% 0.06 80 / 0.35)  → var(--color-highlight)      [mark background]
oklch(55% 0.008 230)       → var(--color-muted)           [.button:hover color, border]
oklch(16% 0.01 230)        → var(--color-heading)         [.button:hover color]
```

- [ ] **Step 3: Build and verify**

Run: `npm run build 2>&1 | tail -5`

Expected: Build succeeds

- [ ] **Step 4: Verify remaining hardcoded oklch**

Run: `grep -rn 'oklch' src/ --include='*.svelte' --include='*.css' | grep -v '@theme' | grep -v 'data-theme'`

Expected: Only overlay/shadow alpha values in SearchModal (backdrop, box-shadow) — these are intentionally hardcoded.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/SearchModal.svelte
git commit -m "Migrate SearchModal to color tokens"
```

---

### Task 6: Theme infrastructure — app.html + hooks.server.ts

**Files:**
- Modify: `src/app.html`
- Create: `src/hooks.server.ts`

- [ ] **Step 1: Update app.html**

Change `data-theme="silk"` to `data-theme=""` and add the inline theme init script:

```html
<!doctype html>
<html lang="en" data-theme="">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script>
      (function() {
        var saved = document.cookie.match(/(?:^|; )theme=([^;]*)/);
        var theme = saved ? saved[1] : null;
        if (!theme) {
          theme = localStorage.getItem('theme');
        }
        if (!theme) {
          theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dim' : 'silk';
        }
        document.documentElement.setAttribute('data-theme', theme);
      })();
    </script>
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 2: Create hooks.server.ts**

```typescript
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const theme = event.cookies.get('theme') ?? '';
  return resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace('data-theme=""', `data-theme="${theme}"`),
  });
};
```

- [ ] **Step 3: Build and verify**

Run: `npm run build 2>&1 | tail -5`

Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/app.html src/hooks.server.ts
git commit -m "Add theme infrastructure: inline init script + server hook"
```

---

### Task 7: Theme toggle in Nav

**Files:**
- Modify: `src/lib/components/Nav.svelte`

- [ ] **Step 1: Add theme toggle state and logic**

Add to the `<script>` block:

```typescript
import { browser } from '$app/environment';

let { onSearchOpen }: { onSearchOpen: () => void } = $props();

let dark = $state(browser && document.documentElement.getAttribute('data-theme') === 'dim');

function toggleTheme() {
  dark = !dark;
  const theme = dark ? 'dim' : 'silk';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  document.cookie = `theme=${theme}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
}
```

- [ ] **Step 2: Add toggle button to nav markup**

Add a theme toggle button after the search button inside `.nav-icons` (create a `.nav-icons` wrapper around the search and theme buttons):

Replace the existing search button area with:

```svelte
<div class="nav-icons">
  <button
    onclick={onSearchOpen}
    class="nav-icon"
    aria-label="Search"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  </button>
  <button
    onclick={toggleTheme}
    class="nav-icon"
    aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
  >
    {#if dark}
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2"/>
        <path d="M12 20v2"/>
        <path d="m4.93 4.93 1.41 1.41"/>
        <path d="m17.66 17.66 1.41 1.41"/>
        <path d="M2 12h2"/>
        <path d="M20 12h2"/>
        <path d="m6.34 17.66-1.41 1.41"/>
        <path d="m19.07 4.93-1.41 1.41"/>
      </svg>
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
      </svg>
    {/if}
  </button>
</div>
```

- [ ] **Step 3: Add nav-icons styles**

Add to the `<style>` block:

```css
.nav-icons {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
```

- [ ] **Step 4: Build and verify**

Run: `npm run build 2>&1 | tail -5`

Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/Nav.svelte
git commit -m "Add theme toggle with cookie persistence"
```

---

### Task 8: Hookify rule for hardcoded oklch enforcement

**Files:**
- Create: `.claude/hookify.hardcoded-oklch.local.md`

- [ ] **Step 1: Create the hookify rule**

```markdown
---
name: hardcoded-oklch
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.(svelte|css)$
  - field: new_text
    operator: regex_match
    pattern: (?<!--)oklch\([^)]+\)
---

**Hardcoded oklch() value detected. Use a design token instead.**

All colors should reference CSS custom properties defined in the `@theme` block in `src/app.css`.

**Allowed exceptions:**
- `oklch()` inside `@theme { }` — token definitions
- `oklch()` inside `[data-theme="..."] { }` — theme overrides
- `oklch()` with alpha for one-off overlay/shadow effects

**Use tokens like:**
- `var(--color-heading)` for titles and strong text
- `var(--color-body)` for body prose
- `var(--color-muted)` for secondary/quiet text
- `var(--color-border)` for borders and rules
- `var(--color-surface)` for code/input backgrounds

If you need a new color role, add a token to the `@theme` block in `src/app.css` and its dim override in `[data-theme="dim"]`.

Full token reference: `docs/superpowers/specs/2026-04-07-css-token-system-design.md`
```

- [ ] **Step 2: Commit**

```bash
git add .claude/hookify.hardcoded-oklch.local.md
git commit -m "Add hookify rule to enforce color token usage"
```

---

### Task 9: Visual verification with Playwright

**Files:** None (verification only)

- [ ] **Step 1: Build with pagefind**

Run:
```bash
npm run build && npx pagefind --site .svelte-kit/cloudflare
```

Expected: Build succeeds, pagefind indexes posts.

- [ ] **Step 2: Start dev server**

Run: `npx wrangler dev` (background)

- [ ] **Step 3: Screenshot homepage in both themes**

Use Playwright to capture screenshots:

```bash
npx playwright screenshot --browser chromium --viewport-size '800,900' --wait-for-timeout 1000 "http://localhost:8787/" /tmp/verify-silk-home.png
```

For dark mode, use a Node script:
```javascript
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 900 } });
  await page.goto('http://localhost:8787/');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dim');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/verify-dim-home.png', fullPage: true });
  await browser.close();
})();
```

Note: Playwright must be installed as a dev dependency (`npm install --save-dev playwright`) for the Node API. The CLI (`npx playwright screenshot`) works without it but can't switch themes.

- [ ] **Step 4: Compare silk screenshots against live site**

The silk (light) theme should match the current live site at https://907.life. Key areas to check:
- Code block borders and backgrounds visible
- Table row separator lines visible
- Inline code has border and background
- Tags have borders
- Links are the correct blue-grey

- [ ] **Step 5: Review dim screenshots for contrast**

Dark mode is net-new. Check:
- Text readable against dark background
- Code blocks have visible contrast
- Borders visible but not harsh
- Search modal (open it) readable

- [ ] **Step 6: Run svelte-check**

Run: `npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -20`

Expected: No errors (warnings OK)

- [ ] **Step 7: Remove playwright dev dependency if added**

If playwright was added to package.json for verification, remove it:
```bash
npm uninstall playwright
```

- [ ] **Step 8: Final commit if any fixes were needed**

If visual verification revealed issues, commit the fixes:
```bash
git add -A
git commit -m "Fix visual issues found during theme verification"
```

---

### Task 10: Update project docs

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/STATUS.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update architecture.md**

Add a "Color Token System" section to the Design System area:

```markdown
**Color tokens:** 17 semantic tokens defined in `@theme` (generates both CSS vars and
Tailwind utilities). Light (silk) values are defaults; `[data-theme="dim"]` overrides for
dark mode. Tokens use `--color-*` namespace to avoid collision with DaisyUI slots.
Full token table in `docs/superpowers/specs/2026-04-07-css-token-system-design.md`.

**Theme persistence:** Cookie-based (`theme` cookie) with `hooks.server.ts` SSR injection.
Inline `<script>` in app.html reads cookie → localStorage → prefers-color-scheme as
fallback chain. No flash on any path.
```

Update the hookify rules table to include the new rule:

```markdown
| `hardcoded-oklch` | Edit `.svelte`/`.css` | Raw `oklch()` outside `@theme` or `[data-theme]` blocks |
```

- [ ] **Step 2: Update CLAUDE.md hookify table**

Add to the Code Quality Rules table:

```markdown
| `hardcoded-oklch` | Edit `.svelte`/`.css` | Raw `oklch()` values (use `var(--color-*)` tokens) |
```

- [ ] **Step 3: Update STATUS.md**

Mark this as a completed pass and update the current state.

- [ ] **Step 4: Commit**

```bash
git add docs/architecture.md docs/STATUS.md CLAUDE.md
git commit -m "Update docs for CSS token system and dark mode"
```
