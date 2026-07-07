<!-- @component ECXC's full post archive: every post, newest first, grouped by year. -->
<script lang="ts">
  import type { PageData } from './$types';
  import PostList from '$theme/components/PostList.svelte';
  import { siteConfig } from '$theme/cairn.config';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Archives — {siteConfig.siteName}</title>
  <meta name="description" content="Every post at ecxc.ski, newest first." />
</svelte:head>

<section class="pb-xl pt-l">
  <h1 class="m-0 mb-s font-display text-step-5 font-semibold leading-tight tracking-tight">Archives</h1>
  {#if data.tags.length > 0}
    <nav class="tag-chips" aria-label="Filter by tag">
      {#each data.tags as { tag, label, count } (tag)}
        <a href="/tags/{tag}" class="tag-chip">{label} <span class="tag-chip__count">{count}</span></a>
      {/each}
    </nav>
  {/if}
  <PostList posts={data.posts} labels={data.labels} />
  <p class="feed-links">
    <a href="/feed.xml">RSS</a>
    <a href="/feed.json">JSON</a>
    <a href="/contact">Email</a>
  </p>
</section>

<style>
  /* The tag-filter chip row (restored, Task 4 of the chassis-restructure plan): each tag a rounded
     pill on the muted surface, its post count in the quieter ink, linking into /tags/[tag]. */
  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2xs);
    margin: 0 0 var(--spacing-l);
  }
  .tag-chip {
    display: inline-flex;
    align-items: baseline;
    gap: 0.35em;
    font-family: var(--font-display);
    font-size: var(--text-step--1);
    font-weight: 600;
    color: var(--color-base-content);
    background: var(--color-base-200);
    border-radius: 999px;
    padding: 0.3rem 0.8rem;
    text-decoration: none;
    transition: color var(--cairn-hover-transition);
  }
  .tag-chip:hover {
    color: var(--color-primary);
  }
  .tag-chip__count {
    color: var(--color-muted);
    font-variant-numeric: tabular-nums;
  }

  /* The in-page feed links (restored): the same three destinations the site footer already
     carries as icons, offered again here as plain text links at the foot of the full listing. */
  .feed-links {
    display: flex;
    gap: var(--spacing-m);
    margin: var(--spacing-l) 0 0;
    font-family: var(--font-display);
    font-size: var(--text-step--1);
    font-weight: 600;
  }
  .feed-links a {
    color: var(--color-accent);
    text-decoration-line: underline;
    text-decoration-color: transparent;
    transition: text-decoration-color var(--cairn-hover-transition);
  }
  .feed-links a:hover {
    text-decoration-color: currentColor;
  }
</style>
