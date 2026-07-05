<!-- @component
ecxc.ski's public site header: an owned, copy-in chrome component on the Waymark token layer (see
theme.css). A sticky band over a translucent `base-100` with a hairline bottom, carrying the
wordmark on the left and the primary nav (read from site.config.yaml's `primary` menu, so the
`/admin/nav` editor stays the one place that manages it) on the right. Every colour and size reads
a DaisyUI role utility or a cairn token, never a literal. The current route's nav link gets
`aria-current="page"` and the accent colour. The inner content caps at `--container-measure`, the
same width as the article and home reading column (`.site-main`), so the wordmark's left edge lines
up with the body copy below it. The layout is no-JS-first responsive: the wordmark carries
`white-space: nowrap` so it can only wrap the row, not its letters, and both the outer row and the
nav itself carry `flex-wrap`, so a nav that outgrows the space beside the wordmark drops to its own
full-width line below it. Nav links carry a 44px-class touch target so a wrapped nav stays tappable
on a phone.
-->
<script lang="ts">
  import { page } from '$app/state';
  import { extractMenu } from '@glw907/cairn-cms';
  import { siteConfig } from '$lib/cairn.config';

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
</script>

<header class="site-header sticky top-0 z-20 border-b border-card-border">
  <div class="mx-auto flex max-w-measure flex-wrap items-center justify-between gap-m px-m py-xs">
    <a
      href="/"
      class="whitespace-nowrap font-display text-step-1 font-semibold tracking-tight text-base-content no-underline"
    >
      {siteConfig.siteName}
    </a>

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
  @media (prefers-reduced-motion: reduce) {
    .site-nav a {
      transition: none;
    }
  }
</style>
