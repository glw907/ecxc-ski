<!-- @component ECXC's full post archive: every post, newest first, grouped by year. -->
<script lang="ts">
  import type { PageData } from './$types';
  import PostList from '$lib/components/PostList.svelte';
  import { siteConfig } from '$lib/cairn.config';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Archives — {siteConfig.siteName}</title>
  <meta name="description" content="Every post at ecxc.ski, newest first." />
</svelte:head>

<section class="pb-xl pt-l">
  <h1 class="m-0 mb-l font-display text-step-5 font-semibold leading-tight tracking-tight">Archives</h1>
  <PostList posts={data.posts} labels={data.labels} />
</section>
