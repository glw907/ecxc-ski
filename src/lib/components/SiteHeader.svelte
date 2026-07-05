<!-- @component
ecxc.ski's public site header: an owned, copy-in chrome component on the Waymark token layer (see
theme.css). A sticky band over a translucent `base-100` with a hairline bottom, carrying the
wordmark on the left and the primary nav plus the theme toggle on the right. Every colour and size
reads a DaisyUI role utility or a cairn token, never a literal. The current route's nav link gets
`aria-current="page"` and the accent colour. The inner content caps at `--container-measure`, the
same width as the article and home reading column (`.site-main`), so the wordmark's left edge lines
up with the body copy below it. The layout is no-JS-first responsive: the wordmark carries
`white-space: nowrap` so it can only wrap the row, not its letters, and both the outer row and the
nav itself carry `flex-wrap`, so a nav that outgrows the space beside the wordmark drops to its own
full-width line below it. Nav links carry a 44px-class touch target so a wrapped nav stays tappable
on a phone.

The theme toggle (Task 4 of the rebuild-from-Waymark plan) is Waymark's own inherited mechanism,
copied from examples/showcase/src/lib/components/SiteHeader.svelte verbatim: it sets `data-theme` on
`<html>` between `cairn` (light) and `cairn-dark`, and persists the choice to a `cairn-site-theme`
cookie (path `/`, a year) so it survives a reload; the inline script in `app.html` reads that same
cookie before first paint, so a returning visitor's choice never flashes the system default first.
With no stored choice, `data-theme` stays unset and theme.css's own `prefers-color-scheme` block
follows the OS setting, live, with no JS at all. The two theme NAMES stay `cairn`/`cairn-dark`;
ecxc-theme.css recolors what those names carry rather than declaring new ones, so this toggle needs
no change of its own.
-->
<script lang="ts">
  import { page } from '$app/state';
  import { browser } from '$app/environment';
  import { extractMenu } from '@glw907/cairn-cms';
  import { siteConfig } from '$lib/cairn.config';
  import SearchModal from './SearchModal.svelte';

  const nav = extractMenu(siteConfig, 'primary', 2);

  /**
   * Whether a nav item points at the page being viewed. The home link matches only the exact root;
   * a deeper link matches its own path or anything nested under it (and strips a `#fragment`
   * before comparing, in case a menu entry ever links an in-page anchor).
   */
  function isCurrent(href: string): boolean {
    const target = href.split('#')[0];
    const path = page.url.pathname;
    if (target === '/') return path === '/';
    return path === target || path.startsWith(`${target}/`);
  }

  /** The two explicit theme choices; theme.css defines both as named DaisyUI themes. */
  type Theme = 'cairn' | 'cairn-dark';

  /**
   * Resolves the theme the button should show: `<html>`'s live `data-theme` if the visitor (or the
   * head script) already set one, otherwise the current system scheme, so the icon is correct on
   * first paint even before any explicit choice exists. Never called during SSR (`browser` guards
   * every call site), so `document`/`window` are always safe to read here.
   */
  function resolveTheme(): Theme {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'cairn' || attr === 'cairn-dark') return attr;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'cairn-dark' : 'cairn';
  }

  let theme = $state<Theme>(browser ? resolveTheme() : 'cairn');

  /** Flips the explicit theme, writes it to `<html>` and the persistence cookie. */
  function toggleTheme(): void {
    const next: Theme = theme === 'cairn-dark' ? 'cairn' : 'cairn-dark';
    document.documentElement.setAttribute('data-theme', next);
    document.cookie = `cairn-site-theme=${next}; path=/; max-age=31536000; samesite=lax`;
    theme = next;
  }
</script>

<header class="site-header sticky top-0 z-20 border-b border-card-border">
  <div class="mx-auto flex max-w-measure flex-wrap items-center justify-between gap-m px-m py-xs">
    <a
      href="/"
      class="whitespace-nowrap font-display text-step-1 font-semibold tracking-tight text-base-content no-underline"
    >
      {siteConfig.siteName}
    </a>

    <!-- The nav and the search trigger share one wrapping flex group (the showcase/907 shape), so a
         future theme toggle (Task 4's job) has a slot to join without reworking this layout. -->
    <div class="flex flex-wrap items-center gap-s">
      <nav class="site-nav flex flex-wrap items-center gap-s text-step--1" aria-label="Primary">
        {#each nav as item (item.url ?? item.label)}
          {@const current = item.url ? isCurrent(item.url) : false}
          <a
            href={item.url}
            aria-current={current ? 'page' : undefined}
            class="inline-flex min-h-11 items-center px-xs no-underline {current
              ? 'font-semibold text-primary'
              : 'font-medium text-muted hover:text-base-content'}"
          >
            {item.label}
          </a>
        {/each}
      </nav>

      <SearchModal />

      <button
        type="button"
        onclick={toggleTheme}
        aria-label={theme === 'cairn-dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        class="theme-toggle inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-field text-muted hover:text-base-content"
      >
        {#if theme === 'cairn-dark'}
          <!-- Sun: shown while dark is active, click to switch to light. -->
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path
              d="M12 3v2M12 19v2M5.64 5.64l1.42 1.42M16.94 16.94l1.42 1.42M3 12h2M19 12h2M5.64 18.36l1.42-1.42M16.94 7.06l1.42-1.42"
            />
          </svg>
        {:else}
          <!-- Moon: shown while light is active, click to switch to dark. -->
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.4 14.9A8.5 8.5 0 1 1 9.6 4.1a7 7 0 0 0 10.8 10.8z" />
          </svg>
        {/if}
      </button>
    </div>
  </div>
</header>

<style>
  /* The translucent band reads a color-mix a Tailwind utility cannot express cleanly. Scoped to
     this component; the consistent focus ring matches the rest of the chrome. */
  .site-header {
    background: color-mix(in oklab, var(--color-base-100) 88%, transparent);
    backdrop-filter: saturate(1.4) blur(8px);
  }
  .site-nav a {
    letter-spacing: 0.01em;
    border-radius: 2px;
    transition: color 0.15s;
  }
  .site-nav a:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  .theme-toggle {
    transition: color 0.15s;
  }
  .theme-toggle:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    .site-nav a,
    .theme-toggle {
      transition: none;
    }
  }
</style>
