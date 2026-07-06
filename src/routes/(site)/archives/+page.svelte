<script lang="ts">
  import type { PageData } from './$types';
  import ArchiveList from '$lib/components/ArchiveList.svelte';
  import { tagUrl } from '$lib/utils';
  import { SITE_TITLE } from '$lib/config';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Archives — {SITE_TITLE}</title>
  <meta name="description" content="Browse every post by tag or by year." />
</svelte:head>

<h1 class="page-title">Archives</h1>

{#if data.tags.length > 0}
  <nav class="tag-index" aria-label="Tags">
    {#each data.tags as { tag, count }}
      <a href={tagUrl(tag)} class="tag-chip">{tag} <span class="tag-count">{count}</span></a>
    {/each}
  </nav>
{/if}

<ArchiveList posts={data.posts} />

<div class="feeds">
  <a href="/feed.xml">RSS</a>
  <a href="/feed.json">JSON</a>
  <a href="/contact">Email</a>
</div>

<style>
  .tag-index {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-block: 1.5rem 0.5rem;
  }
  .tag-chip {
    font-family: var(--font-display);
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-body);
    background: var(--color-base-200);
    border-radius: 999px;
    padding: 0.25rem 0.7rem;
    text-decoration: none;
    transition: color 0.15s ease;
  }
  .tag-chip:hover { color: var(--color-primary); }
  .tag-count { color: var(--color-muted); }
  .feeds {
    display: flex;
    gap: 1.25rem;
    margin-block-start: 2rem;
    font-family: var(--font-display);
    font-size: 0.78rem;
  }
  .feeds a { color: var(--color-spruce-accent); text-decoration: none; }
  .feeds a:hover { opacity: 0.75; }
</style>
