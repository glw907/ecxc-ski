<!-- @component ECXC's tag index: every tag in use, each linking to its own posts. -->
<script lang="ts">
  import type { PageData } from './$types';
  import { siteConfig } from '$theme/cairn.config';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Tags — {siteConfig.siteName}</title>
  <meta name="description" content="Browse every post at ecxc.ski by tag." />
</svelte:head>

<section class="pb-xl pt-l">
  <h1 class="m-0 mb-l font-display text-step-5 font-semibold leading-tight tracking-tight">Tags</h1>
  <ul class="tag-index">
    {#each data.tags as { tag, label, count } (tag)}
      <li>
        <a href="/tags/{tag}" class="tag-index__link">
          <span>{label}</span>
          <span class="tag-index__count">{count}</span>
        </a>
      </li>
    {/each}
  </ul>
</section>

<style>
  .tag-index {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2xs) var(--spacing-m);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tag-index__link {
    display: inline-flex;
    align-items: baseline;
    gap: 0.35em;
    font-size: var(--text-step-1);
    color: var(--color-base-content);
    text-decoration: none;
    transition: color var(--cairn-hover-transition);
  }
  .tag-index__link:hover {
    color: var(--color-primary);
  }
  .tag-index__count {
    font-size: var(--text-step--1);
    color: var(--color-muted);
    font-variant-numeric: tabular-nums;
  }
</style>
