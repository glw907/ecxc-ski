<!-- @component One tag's posts, newest first, grouped by year. -->
<script lang="ts">
  import type { PageData } from './$types';
  import PostList from '$lib/components/PostList.svelte';
  import { siteConfig } from '$lib/cairn.config';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.label} · {siteConfig.siteName}</title>
  <meta name="description" content={`Posts tagged "${data.label}" at ecxc.ski.`} />
</svelte:head>

<section class="pb-xl pt-l">
  <h1 class="m-0 mb-l font-display text-step-5 font-semibold leading-tight tracking-tight">
    Tagged &ldquo;{data.label}&rdquo;
  </h1>
  <PostList posts={data.posts} labels={data.labels} />
  <p class="mt-l">
    <a href="/tags/" class="text-primary hover:underline">&larr; All tags</a>
  </p>
</section>
