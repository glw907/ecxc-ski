<!-- @component ecxc's home: the pre-rebuild site's own structural device (structural-device
     catalogue, rebuild-waymark-2). A hero grid pairs the welcome photo, its overlapping intro
     panel, and a recent-posts sidebar card; below it, a News & Updates section leads with the
     newest post's full body and lists everything older as compact cards. -->
<script lang="ts">
  import type { PageData } from './$types';
  import { siteConfig } from '$theme/cairn.config';

  let { data }: { data: PageData } = $props();

  // The pre-rebuild site's own default: the newest post gets the full-body lead treatment; every
  // post past this count renders as a compact "Earlier" card instead.
  const FEATURED_COUNT = 1;

  const featured = $derived(data.posts[0]);
  const recent = $derived(data.posts.slice(0, 5));
  const older = $derived(data.posts.slice(FEATURED_COUNT));

  const shortDateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const longDateFmt = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

  /** Render an ISO `YYYY-MM-DD` date as "May 14". */
  function formatShort(iso: string): string {
    return shortDateFmt.format(new Date(iso));
  }
  /** Render an ISO `YYYY-MM-DD` date as "May 14, 2026". */
  function formatLong(iso: string): string {
    return longDateFmt.format(new Date(iso));
  }
</script>

<svelte:head>
  <title>{siteConfig.siteName}</title>
  <meta name="description" content={siteConfig.description} />
</svelte:head>

<!-- The pre-rebuild site's home ran at a uniform 64rem container (matching the header/footer band),
     wider than the 44rem reading measure `.site-main` caps every other page at. Breaking out here
     reuses site.css's own wide-figure technique (a relative + translateX(-50%) recenter) rather
     than widening the shared reading column for every page. -->
<div class="home-wide">
  <div class="hero-grid">
    <!-- Welcome hero: photo with the intro panel overlapping it, so the opening reads as a
         designed moment rather than a story card. -->
    <div class="welcome-hero">
      {#if data.heroImage}
        <div class="welcome-photo">
          <img src={data.heroImage.url} alt={data.heroImage.alt} />
        </div>
      {/if}
      <div class="welcome-panel">
        <h2 class="welcome-heading">
          Welcome to East Community Cross&nbsp;Country <span class="welcome-abbr">(ECXC)</span>
        </h2>
        <div class="welcome-blurb">{@html data.welcomeHtml}</div>
        <a href="/about" class="welcome-link">Learn more <span class="arrow">&rarr;</span></a>
      </div>
    </div>

    <!-- Recent posts sidebar -->
    <div class="recent-card">
      <h2 class="section-label">Recent Posts</h2>
      {#if recent.length > 0}
        <ul class="recent-list">
          {#each recent as post (post.id)}
            <li class="recent-row">
              <a href={post.permalink} class="recent-title">{post.title}</a>
              {#if post.fields.description}
                <p class="recent-teaser">{post.fields.description}</p>
              {/if}
              <div class="recent-foot">
                {#if post.date}
                  <time class="recent-date" datetime={post.date}>{formatShort(post.date)}</time>
                {/if}
                <a href={post.permalink} class="recent-readmore" aria-label="Read more: {post.title}">
                  read more <span class="arrow">&rarr;</span>
                </a>
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="no-posts">No posts yet.</p>
      {/if}
      <a href="/archives" class="recent-more">see all posts <span class="arrow">&rarr;</span></a>
    </div>
  </div>

  {#if featured}
    <h2 class="section-label news-label">News &amp; Updates</h2>
    <section class="news-section">
      <article class="featured-post">
        {#if featured.date}
          <time class="post-date" datetime={featured.date}>{formatLong(featured.date)}</time>
        {/if}
        <h3 class="featured-title"><a href={featured.permalink}>{featured.title}</a></h3>
        <div class="post-body">{@html data.featuredHtml}</div>
        {#if featured.tags.length > 0}
          <ul class="post-tags" aria-label="Tags">
            {#each featured.tags as tag (tag)}
              <li><a href="/tags/{tag}" class="post-tag">{tag}</a></li>
            {/each}
          </ul>
        {/if}
      </article>

      {#if older.length > 0}
        <h3 class="older-heading">Earlier</h3>
        <ol class="post-list" aria-label="Earlier posts">
          {#each older as post (post.id)}
            <li class="post-entry">
              <div class="post-meta">
                {#if post.date}
                  <time class="post-date" datetime={post.date}>{formatLong(post.date)}</time>
                {/if}
                {#if post.tags.length > 0}
                  <ul class="post-tags post-tags-inline" aria-label="Tags">
                    {#each post.tags as tag (tag)}
                      <li><a href="/tags/{tag}" class="post-tag">{tag}</a></li>
                    {/each}
                  </ul>
                {/if}
              </div>
              <h3 class="post-title"><a href={post.permalink}>{post.title}</a></h3>
              {#if post.fields.description}
                <p class="post-description">{post.fields.description}</p>
              {/if}
            </li>
          {/each}
        </ol>
      {/if}
    </section>
  {/if}
</div>

<style>
  .home-wide {
    width: min(64rem, 100vw - 3rem);
    position: relative;
    left: 50%;
    transform: translateX(-50%);
  }

  /* ─── Shared label ──────────────────────────────────────── */
  .section-label {
    font-family: var(--font-display);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--color-muted);
    margin: 0 0 0.9rem;
  }

  /* ─── Hero grid ─────────────────────────────────────────── */
  .hero-grid {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 1rem;
    margin-block: 2rem 1.75rem;
    align-items: stretch;
  }

  /* ─── Welcome hero ──────────────────────────────────────── */
  .welcome-hero {
    display: flex;
    flex-direction: column;
  }
  .welcome-photo {
    overflow: hidden;
    border-radius: 12px;
    background: var(--color-base-200);
  }
  .welcome-photo img {
    width: 100%;
    height: auto;
    display: block;
  }

  /* Anchored left rather than centered: the asymmetric overlap gives the composition direction
     and leaves the photo visible on the right. */
  .welcome-panel {
    --shadow-float: 0 10px 24px -16px oklch(0% 0 0 / 0.35);
    position: relative;
    margin: -2.75rem 4.5rem 0 1rem;
    padding: 1.4rem 1.5rem 1.5rem;
    background: var(--color-base-100);
    border: 1px solid var(--color-card-border);
    border-top: 3px solid var(--color-primary);
    border-radius: 12px;
    box-shadow: var(--shadow-float);
  }
  .welcome-hero:has(> .welcome-panel:only-child) .welcome-panel {
    margin-top: 0;
  }

  .welcome-heading {
    font-family: var(--font-display);
    font-size: clamp(1.3rem, 2.6vw, 1.65rem);
    font-weight: 800;
    line-height: 1.18;
    color: var(--color-base-content);
    text-wrap: balance;
    margin: 0 0 0.75rem;
  }
  .welcome-abbr {
    color: var(--color-primary);
    white-space: nowrap;
  }

  .welcome-blurb {
    margin: 0 0 1.1rem;
  }
  .welcome-blurb :global(p) {
    font-size: 0.98rem;
    line-height: 1.55;
    color: color-mix(in oklab, var(--color-base-content) 88%, transparent);
    margin: 0 0 0.7rem;
  }
  .welcome-blurb :global(p:last-child) {
    margin-bottom: 0;
  }

  .welcome-link {
    font-family: var(--font-display);
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--color-accent);
    text-decoration: none;
    letter-spacing: 0.02em;
    transition: opacity 0.15s ease;
  }
  .welcome-link:hover {
    opacity: 0.75;
  }

  /* ─── Recent posts card ─────────────────────────────────── */
  .recent-card {
    background: color-mix(in oklab, var(--color-accent) 4%, var(--color-base-100));
    border: 1px solid var(--color-card-border);
    border-top: 3px solid var(--color-accent);
    border-radius: 12px;
    padding: 1.25rem 1.5rem 1.5rem;
    box-shadow: 0 1px 4px oklch(0% 0 0 / 0.05);
    display: flex;
    flex-direction: column;
  }
  .recent-card .section-label {
    color: var(--color-accent);
  }

  .recent-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .recent-row {
    flex: 1 1 auto;
    max-block-size: 7.75rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.15rem;
    padding-block: 0.65rem;
    border-bottom: 1px solid var(--color-card-border);
  }
  .recent-row:last-child {
    border-bottom: none;
  }

  .recent-title {
    font-family: var(--font-display);
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--color-base-content);
    line-height: 1.25;
    text-decoration: none;
    transition: color 0.15s ease;
  }
  .recent-title:hover {
    color: var(--color-primary);
  }

  .recent-teaser {
    font-size: 0.78rem;
    line-height: 1.45;
    color: var(--color-muted);
    margin: 0.15rem 0 0.25rem;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }

  .recent-foot {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
    margin-block-start: 0.1rem;
  }
  .recent-date {
    font-family: var(--font-display);
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-muted);
    line-height: 1.3;
  }
  .recent-readmore,
  .recent-more {
    font-family: var(--font-display);
    font-weight: 600;
    color: var(--color-accent);
    text-decoration: none;
    transition: opacity 0.15s ease;
  }
  .recent-readmore {
    font-size: 0.7rem;
  }
  .no-posts {
    font-size: 0.85rem;
    font-style: italic;
    color: var(--color-muted);
    margin: 0 0 0.9rem;
  }
  .recent-more {
    font-size: 0.75rem;
    letter-spacing: 0.02em;
  }
  .recent-readmore:hover,
  .recent-more:hover {
    opacity: 0.75;
  }

  /* ─── Arrow nudge, the shared hover cue ─────────────────── */
  .arrow {
    display: inline-block;
    transition: transform 0.18s ease;
  }
  a:hover .arrow {
    transform: translateX(3px);
  }

  /* ─── News section ──────────────────────────────────────── */
  .news-label {
    margin-block-start: 2rem;
  }
  .news-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .featured-post {
    background: var(--color-base-100);
    border: 1px solid var(--color-card-border);
    border-radius: 12px;
    padding: 1.75rem 2rem;
    box-shadow: 0 1px 4px oklch(0% 0 0 / 0.05);
  }
  .post-date {
    display: block;
    font-family: var(--font-display);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-muted);
    margin-block-end: 0.65rem;
  }
  .featured-title {
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 5vw, 2.2rem);
    font-weight: 700;
    line-height: 1.18;
    margin: 0 0 1.5rem;
    letter-spacing: -0.02em;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--color-card-border);
  }
  .featured-title a {
    color: var(--color-base-content);
    text-decoration: none;
    transition: color 0.15s ease;
  }
  .featured-title a:hover {
    color: var(--color-primary);
  }

  /* The featured card's body is the raw rendered HTML of the newest post (not `.prose`, which
     would bring the article's full display-face treatment into a compact home card), so it needs
     its own minimal paragraph rhythm; Tailwind's preflight otherwise zeroes every `<p>` margin. */
  .post-body :global(p) {
    margin: 0;
    line-height: 1.6;
    color: color-mix(in oklab, var(--color-base-content) 88%, transparent);
  }
  .post-body :global(p + p) {
    margin-top: 1em;
  }
  .post-body :global(a) {
    color: var(--color-primary);
    font-weight: 500;
  }

  .post-tags {
    list-style: none;
    padding: 0;
    margin: 1.5rem 0 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .post-tags-inline {
    margin-block-start: 0;
    gap: 0.1rem 0.5rem;
  }
  .post-tag {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.68rem;
    letter-spacing: 0.11em;
    text-transform: uppercase;
    color: var(--color-muted);
    padding: 0.2em 0.55em;
    border: 1px solid var(--color-card-border);
    border-radius: 2px;
    line-height: 1.6;
    text-decoration: none;
    transition: color 0.15s ease, border-color 0.15s ease;
  }
  .post-tag:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
  }

  .older-heading {
    font-family: var(--font-display);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--color-muted);
    margin: 0.5rem 0 0;
  }

  .post-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .post-entry {
    background: var(--color-base-100);
    border: 1px solid var(--color-card-border);
    border-radius: 10px;
    padding: 1.1rem 1.5rem;
    box-shadow: 0 1px 4px oklch(0% 0 0 / 0.05);
    transition: box-shadow 0.15s ease;
  }
  .post-entry:hover {
    box-shadow: 0 2px 10px -4px oklch(0% 0 0 / 0.1);
  }
  .post-title {
    font-family: var(--font-display);
    font-size: clamp(1.05rem, 3vw, 1.2rem);
    font-weight: 700;
    line-height: 1.25;
    margin: 0.3rem 0 0;
    letter-spacing: -0.01em;
  }
  .post-title a {
    color: var(--color-base-content);
    text-decoration: none;
    transition: color 0.15s ease;
  }
  .post-title a:hover {
    color: var(--color-primary);
  }
  .post-meta {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
  }
  .post-description {
    font-size: 0.88rem;
    font-style: italic;
    line-height: 1.55;
    color: var(--color-muted);
    margin: 0.35rem 0 0;
  }

  /* ─── Mobile: stack cards, shrink the panel overlap ─────── */
  @media (max-width: 600px) {
    .hero-grid {
      grid-template-columns: 1fr;
      margin-block-start: 1.1rem;
    }
    .welcome-panel {
      margin: -1.5rem 1.5rem 0 0.5rem;
      padding: 1.1rem 1.1rem 1.25rem;
    }
  }
</style>
