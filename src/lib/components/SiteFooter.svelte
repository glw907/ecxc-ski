<!-- @component
ecxc.ski's public site footer: an owned, copy-in chrome component on the Waymark token layer. It
sits on `base-200` over a top hairline and carries the wordmark, a footer nav (the feeds plus the
admin link), and a fine-print line. Every colour and size reads a DaisyUI role utility or a cairn
token. The inner content caps at `--container-measure`, matching the header and the article/home
reading column, so the footer's left edge lines up with the body copy above it.
-->
<script lang="ts">
  import { siteConfig } from '$lib/cairn.config';

  /** A footer-nav entry: the visible label and the path it links to. */
  type NavItem = { label: string; href: string };

  const nav: NavItem[] = [
    { label: 'Feed', href: '/feed.xml' },
    { label: 'JSON Feed', href: '/feed.json' },
    { label: 'Admin', href: '/admin' },
  ];
</script>

<footer class="site-footer mt-2xl border-t border-base-300 bg-base-200">
  <div class="mx-auto flex max-w-measure flex-wrap items-center justify-between gap-m px-m py-xl">
    <a href="/" class="font-display text-step-1 font-semibold tracking-tight text-muted no-underline">
      {siteConfig.siteName}
    </a>

    <nav class="site-nav flex flex-wrap items-center gap-s text-step--1" aria-label="Footer">
      {#each nav as item (item.href)}
        <a href={item.href} class="inline-flex min-h-11 items-center text-muted no-underline hover:text-base-content">
          {item.label}
        </a>
      {/each}
    </nav>

    <p class="w-full border-t border-card-border pt-s text-step--1 text-muted">
      {siteConfig.description}
    </p>
  </div>
</footer>

<style>
  .site-nav a {
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
