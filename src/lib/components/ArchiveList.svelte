<script lang="ts">
  import type { PostListItem } from '$lib/content';
  import { formatShortDate, tagUrl } from '$lib/utils';

  let { posts }: { posts: PostListItem[] } = $props();

  const byYear = $derived(
    posts.reduce<Record<string, PostListItem[]>>((acc, post) => {
      const year = post.date.slice(0, 4);
      (acc[year] ??= []).push(post);
      return acc;
    }, {})
  );

  const years = $derived(Object.keys(byYear).sort((a, b) => Number(b) - Number(a)));
</script>

<div class="archive">
  {#each years as year}
    <section class="archive-year">
      <h3 class="year-heading">{year}</h3>
      <ol class="year-list">
        {#each byYear[year] as post}
          <li class="archive-entry">
            <time class="entry-date" datetime={post.date}>{formatShortDate(post.date)}</time>
            <div class="entry-content">
              <a class="entry-title" href={post.permalink}>
                {post.title}
              </a>
              {#if post.tags.length > 0}
                <span class="entry-tags">
                  {#each post.tags as tag}
                    <a href={tagUrl(tag)} class="entry-tag">{tag}</a>
                  {/each}
                </span>
              {/if}
            </div>
          </li>
        {/each}
      </ol>
    </section>
  {/each}
</div>

<style>
  .archive {
    margin-block-start: 2.5rem;
  }

  .archive-year + .archive-year {
    margin-block-start: 2.25rem;
  }

  .year-heading {
    font-family: var(--font-display);
    font-size: 0.88rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--color-heading);
    margin-block-end: 0.75rem;
  }

  .year-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .archive-entry {
    display: flex;
    align-items: baseline;
    gap: 1.25rem;
    padding-block: 0.55rem;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .archive-entry:last-child {
    border-bottom: none;
  }

  .entry-date {
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    color: var(--color-muted);
    white-space: nowrap;
    width: 4.5rem;
    flex-shrink: 0;
  }

  .entry-content {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.15rem 0.65rem;
    min-width: 0;
  }

  .entry-title {
    font-size: 0.975rem;
    color: var(--color-heading);
    text-decoration: none;
    transition: color 0.15s ease;
    line-height: 1.4;
  }

  .entry-title:hover {
    color: var(--color-muted);
  }

  .entry-tags {
    display: flex;
    gap: 0.45rem;
    align-items: baseline;
  }

  .entry-tag {
    font-family: var(--font-display);
    font-size: 0.68rem;
    font-weight: 400;
    color: var(--color-muted);
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .entry-tag::before {
    content: "#";
    color: var(--color-faint);
    margin-inline-end: 0.06em;
  }

  .entry-tag:hover {
    color: var(--color-body);
  }
</style>
