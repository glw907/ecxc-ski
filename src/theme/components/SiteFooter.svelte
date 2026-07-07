<!-- @component
ecxc.ski's public site footer: the same hoodie-colorway band as SiteHeader, bookending the page
with a black-spruce ground and a fireweed top rule (structural-device catalogue, rebuild-waymark-2,
ported from the pre-rebuild site's own `(site)/+layout.svelte`). Four icon links (feed, JSON feed,
contact, archives) sit above a copyright line. The band colors are the header's own fixed constants,
declared again locally since Svelte scoped styles do not share custom properties across components. -->
<script lang="ts">
  const year = new Date().getFullYear();
</script>

<footer class="site-footer">
  <div class="footer-links">
    <a href="/feed.xml" aria-label="RSS feed" class="footer-icon-link">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 11a9 9 0 0 1 9 9" />
        <path d="M4 4a16 16 0 0 1 16 16" />
        <circle cx="5" cy="19" r="1" fill="currentColor" stroke="none" />
      </svg>
      <span class="footer-label">rss</span>
    </a>
    <a href="/feed.json" aria-label="JSON feed" class="footer-icon-link">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
      <span class="footer-label">json</span>
    </a>
    <a href="/contact" aria-label="Contact" class="footer-icon-link">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
      <span class="footer-label">email</span>
    </a>
    <a href="/archives" aria-label="Archives" class="footer-icon-link">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 7h18v13H3z" />
        <path d="M3 7l2-3h14l2 3" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </svg>
      <span class="footer-label">archives</span>
    </a>
  </div>
  <p class="footer-name">&copy; {year} East Community Cross Country</p>
</footer>

<style>
  .site-footer {
    --color-header: oklch(25% 0.035 175);
    --color-header-ink: oklch(78% 0.014 175);
    --color-fireweed: oklch(66% 0.21 357);
    margin-top: var(--spacing-2xl);
    padding-block: var(--spacing-l);
    text-align: center;
    background: var(--color-header);
    border-top: 2px solid var(--color-fireweed);
  }

  .footer-links {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--spacing-l);
    margin-block-end: var(--spacing-s);
  }

  .footer-icon-link {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--color-header-ink);
    text-decoration: none;
    transition: color var(--cairn-hover-transition);
  }
  .footer-icon-link:hover {
    color: var(--color-fireweed);
  }
  .footer-icon-link:focus-visible {
    outline: 2px solid var(--color-header-ink);
    outline-offset: 2px;
    border-radius: 4px;
  }

  .footer-label {
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: lowercase;
  }

  .footer-name {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-header-ink);
  }

  @media (prefers-reduced-motion: reduce) {
    .footer-icon-link {
      transition: none;
    }
  }
</style>
