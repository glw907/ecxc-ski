<!-- @component
A dated list of posts, grouped by year (newest year first). Shared by `/archives` (every post) and
a `/tags/[tag]` detail page (one tag's posts), so both read the same row markup through `PostRow`. -->
<script lang="ts">
  import type { ContentSummary } from '@glw907/cairn-cms/delivery';
  import PostRow from './PostRow.svelte';

  let {
    posts,
    labels,
  }: {
    posts: ContentSummary[];
    /** Tag value to its curated display label, passed through to each row. */
    labels: Record<string, string>;
  } = $props();

  const byYear = $derived.by(() => {
    const groups = new Map<string, ContentSummary[]>();
    for (const post of posts) {
      const year = post.date?.slice(0, 4) ?? 'Undated';
      const group = groups.get(year);
      if (group) group.push(post);
      else groups.set(year, [post]);
    }
    return [...groups].sort(([a], [b]) => b.localeCompare(a));
  });
</script>

<div class="post-list">
  {#each byYear as [year, group] (year)}
    <section class="post-list__year">
      <h2 class="post-list__year-heading">{year}</h2>
      {#each group as post (post.id)}
        <PostRow {post} {labels} />
      {/each}
    </section>
  {/each}
</div>

<style>
  .post-list__year + .post-list__year {
    margin-top: var(--spacing-l);
  }
  .post-list__year-heading {
    margin: 0 0 var(--spacing-2xs);
    font-size: var(--text-step--1);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
    color: var(--color-muted);
  }
</style>
