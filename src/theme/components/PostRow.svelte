<!-- @component
One dated post row: the date, the linked title, and its tags, each tag linking to `/tags/<tag>`.
Shared by the `/archives` full listing and a `/tags/[tag]` detail page. -->
<script lang="ts">
  import type { ContentSummary } from '@glw907/cairn-cms/delivery';

  let {
    post,
    labels,
  }: {
    post: ContentSummary;
    /** Tag value to its curated display label; a tag missing from the map falls back to its raw value. */
    labels: Record<string, string>;
  } = $props();

  // No `year` field: every row already sits under a year heading (PostList groups by year), so
  // repeating it here would be redundant.
  const dateFmt = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

  /** Render an ISO `YYYY-MM-DD` date as a short label, e.g. "May 14". */
  function formatDate(iso: string): string {
    return dateFmt.format(new Date(iso));
  }
</script>

<article class="row" class:row--undated={!post.date}>
  {#if post.date}
    <div class="row__date">{formatDate(post.date)}</div>
  {/if}
  <div>
    <h3 class="row__title"><a href={post.permalink}>{post.title}</a></h3>
    {#if post.tags.length > 0}
      <p class="row__tags">
        {#each post.tags as tag (tag)}
          <a href="/tags/{tag}" class="row__tag">{labels[tag] ?? tag}</a>
        {/each}
      </p>
    {/if}
  </div>
</article>

<style>
  .row {
    display: grid;
    grid-template-columns: 7.5rem 1fr;
    gap: var(--spacing-m);
    align-items: start;
    padding: var(--spacing-s) 0;
    border-bottom: var(--border) solid var(--color-card-border);
  }
  .row--undated {
    grid-template-columns: 1fr;
  }

  .row__date {
    padding-top: 0.35rem;
    font-size: var(--text-step--1);
    color: var(--color-muted);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.01em;
  }

  .row__title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: var(--text-step-1);
    line-height: var(--leading-snug);
    letter-spacing: var(--tracking-tight);
  }
  .row__title a {
    color: inherit;
    text-decoration: none;
    transition: color var(--cairn-hover-transition);
  }
  .row__title a:hover {
    color: var(--color-primary);
  }

  .row__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin: 0.3rem 0 0;
  }
  .row__tag {
    font-size: var(--text-step--1);
    color: var(--color-muted);
    text-decoration: none;
    transition: color var(--cairn-hover-transition);
  }
  .row__tag:hover {
    color: var(--color-base-content);
  }

  @media (max-width: 34rem) {
    .row {
      grid-template-columns: 1fr;
      gap: 0.3rem;
    }
    .row__date {
      padding-top: 0;
    }
  }
</style>
