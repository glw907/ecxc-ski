<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { PRIMARY_NAV } from '$lib/config';

  let { onSearchOpen }: { onSearchOpen: () => void } = $props();

  let dark = $state(browser && document.documentElement.getAttribute('data-theme') === 'ecxc-dark');
  let mobileOpen = $state(false);

  function toggleTheme() {
    dark = !dark;
    const theme = dark ? 'ecxc-dark' : 'ecxc';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    document.cookie = `theme=${theme}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
  }

  function isActive(href: string): boolean {
    const p = $page.url.pathname;
    if (href === '/') return p === '/';
    return p.startsWith(href);
  }

  function closeMobile() {
    mobileOpen = false;
  }

</script>

{#snippet searchButton()}
  <button onclick={onSearchOpen} class="nav-icon" aria-label="Search">
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  </button>
{/snippet}

{#snippet themeButton()}
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
        <path d="M12 2v2"/><path d="M12 20v2"/>
        <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
        <path d="M2 12h2"/><path d="M20 12h2"/>
        <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
      </svg>
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
      </svg>
    {/if}
  </button>
{/snippet}

<header class="site-header">
  <nav class="nav-inner">
    <a href="/" class="site-logo" aria-label="ECXC home" onclick={closeMobile}>
      <!-- Tile mark: EC over XC, one Nunito ExtraBold letter knocked out of
           each rounded tile (the classic tile solution: square containers
           carry the grid, letters keep their natural proportions).
           Generator: docs/design/build-mark.py; selection record:
           docs/design/brand-exploration.html. static/favicon.svg embeds a
           copy of these tile paths on a spruce field. -->
      <svg class="logo-mark" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
        <path d="M5 0L4.02 0.1L3.09 0.38L2.22 0.84L1.46 1.46L0.84 2.22L0.38 3.09L0.1 4.02L0 5L0 43L0.1 43.98L0.38 44.91L0.84 45.78L1.46 46.54L2.22 47.16L3.09 47.62L4.02 47.9L5 48L43 48L43.98 47.9L44.91 47.62L45.78 47.16L46.54 46.54L47.16 45.78L47.62 44.91L47.9 43.98L48 43L48 5L47.9 4.02L47.62 3.09L47.16 2.22L46.54 1.46L45.78 0.84L44.91 0.38L43.98 0.1L43 0ZM15.52 41.49L14.11 41.24L13.63 41.04L13.01 40.63L12.52 40.09L12.15 39.43L11.91 38.66L11.82 38.08L11.79 10.54L11.91 9.34L12.05 8.81L12.38 8.12L13.01 7.37L13.63 6.96L14.36 6.68L15.52 6.51L33.14 6.5L34.06 6.59L34.98 6.93L35.54 7.4L35.94 8.03L36.16 8.8L36.18 9.95L36.01 10.78L35.66 11.46L35.14 11.98L34.46 12.33L33.84 12.48L33.14 12.53L19.18 12.53L19.18 20.71L32.03 20.71L32.97 20.8L33.9 21.15L34.56 21.76L34.96 22.62L35.1 23.73L34.96 24.83L34.56 25.69L33.9 26.31L32.97 26.66L32.03 26.74L19.18 26.74L19.18 35.47L33.14 35.47L34.26 35.61L34.82 35.81L35.42 36.24L35.76 36.67L36.01 37.19L36.16 37.79L36.2 38.73L36.12 39.39L35.86 40.14L35.42 40.73L34.82 41.16L34.06 41.41L33.39 41.49Z" />
        <path d="M57 0L56.02 0.1L55.09 0.38L54.22 0.84L53.46 1.46L52.84 2.22L52.38 3.09L52.1 4.02L52 5L52 43L52.1 43.98L52.38 44.91L52.84 45.78L53.46 46.54L54.22 47.16L55.09 47.62L56.02 47.9L57 48L95 48L95.98 47.9L96.91 47.62L97.78 47.16L98.54 46.54L99.16 45.78L99.62 44.91L99.9 43.98L100 43L100 5L99.9 4.02L99.62 3.09L99.16 2.22L98.54 1.46L97.78 0.84L96.91 0.38L95.98 0.1L95 0ZM78.26 42.01L76.47 41.89L74.77 41.64L73.16 41.27L70.91 40.48L69.53 39.8L68.24 39.01L67.05 38.12L65.46 36.58L64.11 34.82L63.34 33.52L62.68 32.13L62.15 30.66L61.56 28.3L61.32 26.63L61.2 24.88L61.22 22.63L61.4 20.69L61.73 18.86L62.22 17.12L62.86 15.48L63.63 13.97L64.54 12.57L65.59 11.29L66.77 10.13L68.08 9.1L69.52 8.22L71.08 7.47L72.77 6.86L74.57 6.41L76.48 6.11L78.49 5.98L80.45 6.01L82.98 6.32L85.48 6.93L87.36 7.65L89.28 8.73L89.75 9.14L90.12 9.59L90.39 10.08L90.61 10.77L90.7 11.46L90.67 11.98L90.34 13.12L89.91 13.81L89.32 14.39L88.62 14.77L87.97 14.93L87.27 14.92L86.71 14.78L84.39 13.68L82.79 13.17L81.14 12.87L79.45 12.77L77.36 12.91L75.95 13.21L74.27 13.87L72.83 14.8L71.64 16L70.69 17.46L70 19.18L69.64 20.63L69.39 22.8L69.39 25.14L69.64 27.3L70.15 29.22L70.69 30.51L71.13 31.28L72.2 32.62L73.17 33.46L73.89 33.93L75.51 34.65L76.88 35.01L78.38 35.2L79.72 35.23L81.07 35.13L82.44 34.9L83.82 34.53L86.94 33.2L87.51 33.1L88.04 33.11L88.54 33.21L89.14 33.45L89.66 33.81L90.1 34.28L90.44 34.82L90.67 35.42L90.81 36.58L90.71 37.24L90.47 37.9L89.84 38.79L88.73 39.61L86.99 40.51L84.96 41.22L82.75 41.72L80.52 41.98Z" />
        <path d="M5 52L4.02 52.1L3.09 52.38L2.22 52.84L1.46 53.46L0.84 54.22L0.38 55.09L0.1 56.02L0 57L0 95L0.1 95.98L0.38 96.91L0.84 97.78L1.46 98.54L2.22 99.16L3.09 99.62L4.02 99.9L5 100L43 100L43.98 99.9L44.91 99.62L45.78 99.16L46.54 98.54L47.16 97.78L47.62 96.91L47.9 95.98L48 95L48 57L47.9 56.02L47.62 55.09L47.16 54.22L46.54 53.46L45.78 52.84L44.91 52.38L43.98 52.1L43 52ZM12.44 93.92L11.54 93.79L10.93 93.57L10.23 93.13L9.68 92.54L9.31 91.87L9.12 91.1L9.12 90.48L9.33 89.65L9.94 88.59L19.62 75.76L10.08 63.01L9.62 61.94L9.53 61.11L9.66 60.32L10.08 59.46L10.64 58.87L11.15 58.52L11.93 58.21L12.59 58.09L13.45 58.09L14.2 58.22L14.88 58.47L15.51 58.87L16.29 59.58L16.91 60.33L24 70.15L31.08 60.33L32.18 59.11L32.8 58.64L33.28 58.39L33.81 58.21L34.56 58.09L35.46 58.09L36.13 58.21L36.73 58.42L37.27 58.73L37.73 59.13L38.09 59.59L38.35 60.1L38.5 60.67L38.49 61.7L38.09 62.78L28.39 75.76L38.34 89.02L38.8 90.06L38.9 90.89L38.76 91.68L38.33 92.54L37.79 93.13L37.27 93.48L36.47 93.79L35.79 93.91L34.91 93.91L34.18 93.78L33.5 93.52L32.88 93.12L32.25 92.56L31.44 91.64L23.99 81.42L16.73 91.42L15.94 92.4L15.15 93.12L14.35 93.6L13.47 93.86Z" />
        <path d="M57 52L56.02 52.1L55.09 52.38L54.22 52.84L53.46 53.46L52.84 54.22L52.38 55.09L52.1 56.02L52 57L52 95L52.1 95.98L52.38 96.91L52.84 97.78L53.46 98.54L54.22 99.16L55.09 99.62L56.02 99.9L57 100L95 100L95.98 99.9L96.91 99.62L97.78 99.16L98.54 98.54L99.16 97.78L99.62 96.91L99.9 95.98L100 95L100 57L99.9 56.02L99.62 55.09L99.16 54.22L98.54 53.46L97.78 52.84L96.91 52.38L95.98 52.1L95 52ZM78.26 94.01L76.47 93.89L74.77 93.64L72.39 93.04L70.91 92.48L69.53 91.8L68.24 91.01L67.05 90.12L65.46 88.58L64.11 86.82L63.34 85.52L62.68 84.13L62.15 82.66L61.56 80.3L61.32 78.63L61.2 76.88L61.22 74.63L61.4 72.69L61.73 70.86L62.22 69.12L62.86 67.48L63.63 65.97L64.54 64.57L65.59 63.29L66.77 62.13L68.08 61.1L69.52 60.22L71.08 59.47L72.77 58.86L74.57 58.41L76.48 58.11L78.49 57.98L80.45 58.01L82.98 58.32L85.48 58.93L87.36 59.65L89.28 60.73L89.75 61.14L90.12 61.59L90.39 62.08L90.61 62.77L90.7 63.46L90.67 63.98L90.34 65.12L89.91 65.81L89.32 66.39L88.62 66.77L87.97 66.93L87.27 66.92L86.71 66.78L84.39 65.68L82.79 65.17L81.14 64.87L79.45 64.77L77.36 64.91L75.95 65.21L74.27 65.87L72.83 66.8L71.64 68L70.69 69.46L70 71.18L69.64 72.63L69.39 74.8L69.39 77.14L69.64 79.3L70.15 81.22L70.69 82.51L71.13 83.28L72.2 84.62L73.17 85.46L73.89 85.93L75.51 86.65L76.88 87.01L78.38 87.2L79.72 87.23L81.07 87.13L82.44 86.9L83.82 86.53L86.94 85.2L87.51 85.1L88.04 85.11L88.54 85.21L89.14 85.45L89.66 85.81L90.1 86.28L90.44 86.82L90.67 87.42L90.81 88.58L90.71 89.24L90.47 89.9L89.84 90.79L88.73 91.61L86.99 92.51L84.96 93.22L82.75 93.72L80.52 93.98Z" />
      </svg>
    </a>

    <!-- Desktop links -->
    <div class="desktop-links">
      {#each PRIMARY_NAV as link}
        <a
          href={link.url ?? '#'}
          class="nav-link"
          class:active={isActive(link.url ?? '')}
          aria-current={isActive(link.url ?? '') ? 'page' : undefined}
        >{link.label}</a>
      {/each}
      <div class="nav-icons">
        {@render searchButton()}
        {@render themeButton()}
      </div>
    </div>

    <!-- Mobile right side: icons + hamburger -->
    <div class="mobile-right">
      {@render searchButton()}
      {@render themeButton()}
      <button
        class="hamburger"
        onclick={() => { mobileOpen = !mobileOpen; }}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
      >
        {#if mobileOpen}
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <line x1="4" x2="20" y1="12" y2="12"/>
            <line x1="4" x2="20" y1="6" y2="6"/>
            <line x1="4" x2="20" y1="18" y2="18"/>
          </svg>
        {/if}
      </button>
    </div>
  </nav>

  <!-- Mobile dropdown -->
  {#if mobileOpen}
    <div class="mobile-menu">
      {#each PRIMARY_NAV as link}
        <a
          href={link.url ?? '#'}
          class="mobile-link"
          class:active={isActive(link.url ?? '')}
          aria-current={isActive(link.url ?? '') ? 'page' : undefined}
          onclick={closeMobile}
        >{link.label}</a>
      {/each}
    </div>
  {/if}
</header>

<style>
  /* The hoodie colorway: black-spruce band, fireweed mark and accents. */
  .site-header {
    position: sticky;
    top: 0;
    z-index: 30;
    background: var(--color-header);
    border-bottom: 2px solid var(--color-fireweed);
  }

  .nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 64rem;
    margin-inline: auto;
    padding-inline: 1rem;
    height: 3.75rem;
  }

  .site-logo {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: var(--color-fireweed);
    transition: opacity 0.2s ease;
  }
  /* 0.85 keeps the mark above the 3:1 non-text contrast bar on the spruce band. */
  .site-logo:hover { opacity: 0.85; }

  .logo-mark {
    width: 2.9rem;
    height: 2.9rem;
    display: block;
  }

  /* Desktop nav */
  .desktop-links {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .nav-link {
    font-family: var(--font-display);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: var(--color-header-ink);
    text-decoration: none;
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    transition: color 0.15s ease, background 0.15s ease;
  }
  .nav-link:hover { color: var(--color-header-ink-strong); }
  .nav-link.active {
    color: var(--color-fireweed);
    background: color-mix(in oklab, var(--color-header-ink-strong) 8%, transparent);
  }

  .nav-icons {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .nav-icon {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    padding: 0.4rem;
    cursor: pointer;
    color: var(--color-header-ink);
    transition: color 0.2s ease;
  }
  .nav-icon:hover { color: var(--color-header-ink-strong); }

  /* Mobile */
  .mobile-right {
    display: none;
    align-items: center;
    gap: 0.1rem;
  }

  .hamburger {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    padding: 0.4rem;
    cursor: pointer;
    color: var(--color-header-ink);
    transition: color 0.2s ease;
  }
  .hamburger:hover { color: var(--color-header-ink-strong); }

  .mobile-menu {
    display: flex;
    flex-direction: column;
    background: var(--color-header);
    border-top: 1px solid color-mix(in oklab, var(--color-header-ink) 25%, transparent);
    padding: 0.5rem 1rem 1rem;
    max-width: 64rem;
    margin-inline: auto;
  }

  /* Generous padding-block: each row is a thumb target, so it clears the
     ~44px comfortable-tap bar. */
  .mobile-link {
    font-family: var(--font-display);
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-header-ink);
    text-decoration: none;
    padding-block: 0.8rem;
    border-bottom: 1px solid color-mix(in oklab, var(--color-header-ink) 25%, transparent);
    transition: color 0.15s ease;
  }
  .mobile-link:last-child { border-bottom: none; }
  .mobile-link:hover { color: var(--color-header-ink-strong); }
  .mobile-link.active { color: var(--color-fireweed); }

  @media (max-width: 639px) {
    .desktop-links { display: none; }
    .mobile-right { display: flex; }
    /* Wider hit areas where fingers replace pointers. */
    .nav-icon, .hamburger { padding: 0.65rem; }
  }
</style>
