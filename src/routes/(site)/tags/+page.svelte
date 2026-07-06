<script lang="ts">
  import type { PageData } from './$types';
  import { tagUrl } from '$lib/utils';
  import { SITE_TITLE } from '$lib/config';
  import { riseStyle } from '$lib/motion';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Tags — {SITE_TITLE}</title>
  <meta name="description" content="Browse posts by tag." />
</svelte:head>

<div class="tags-page">
  <h1 class="page-title">Tags</h1>
  <ul class="tags-list" aria-label="All tags" style={riseStyle(0)}>
    {#each data.tags as { tag, count }}
      <li>
        <a href={tagUrl(tag)} class="tag-entry">
          <span class="tag-name">{tag}</span>
          <span class="tag-count">{count}</span>
        </a>
      </li>
    {/each}
  </ul>
</div>

<style>
  .tags-page {
    animation: page-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .tags-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 1.25rem;
    animation: module-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--rise, 0s);
  }

  .tag-entry {
    font-family: var(--font-display);
    font-size: 0.92rem;
    font-weight: 400;
    color: var(--color-tag);
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .tag-entry:hover {
    color: var(--color-heading);
  }

  .tag-count {
    font-size: 0.65em;
    font-weight: 400;
    color: var(--color-muted);
    vertical-align: super;
    margin-inline-start: 0.1em;
  }

  @media (prefers-reduced-motion: reduce) {
    .tags-page,
    .tags-list {
      animation: none;
    }
  }
</style>
