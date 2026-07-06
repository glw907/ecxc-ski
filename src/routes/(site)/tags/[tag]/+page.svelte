<script lang="ts">
  import type { PageData } from './$types';
  import ArchiveList from '$lib/components/ArchiveList.svelte';
  import { SITE_TITLE } from '$lib/config';
  import { riseStyle } from '$lib/motion';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.tag} — {SITE_TITLE}</title>
  <meta name="description" content={`Posts tagged "${data.tag}".`} />
</svelte:head>

<div class="tag-page">
  <h1 class="page-title">Posts tagged &#8220;{data.tag}&#8221;</h1>
  <div class="tag-module" style={riseStyle(0)}>
    <ArchiveList posts={data.posts} />
  </div>
  <footer class="tag-footer">
    <a href="/tags/" class="back-link"><span class="ec-arr ec-arr-back">←</span> All tags</a>
  </footer>
</div>

<style>
  .tag-page {
    animation: page-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .tag-module {
    animation: module-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--rise, 0s);
  }

  .tag-footer {
    margin-block-start: 3rem;
    padding-block-start: 1.75rem;
    border-top: 1px solid var(--color-border-subtle);
  }

  @media (prefers-reduced-motion: reduce) {
    .tag-page,
    .tag-module {
      animation: none;
    }
  }
</style>
