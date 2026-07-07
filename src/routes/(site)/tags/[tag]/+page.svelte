<!-- @component One tag's posts, newest first, grouped by year. -->
<script lang="ts">
  import type { PageData } from './$types';
  import PostList from '$theme/components/PostList.svelte';
  import { siteConfig } from '$theme/cairn.config';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.label} — {siteConfig.siteName}</title>
  <meta name="description" content={`Posts tagged "${data.label}" at ecxc.ski.`} />
</svelte:head>

<section class="pb-xl pt-l">
  <h1 class="m-0 mb-l font-display text-step-5 font-semibold leading-tight tracking-tight">
    Tagged &ldquo;{data.label}&rdquo;
  </h1>
  <PostList posts={data.posts} labels={data.labels} />
  <p class="mt-l">
    <a href="/tags/" class="all-tags-link">&larr; All tags</a>
  </p>
</section>

<style>
  /* The same underline-reveal device the bare body links and the FAQ pointer use: the resting
     accent color is the only cue until hover fades in the underline, transitioned rather than
     Tailwind's own instant `hover:underline` toggle. */
  .all-tags-link {
    color: var(--color-primary);
    text-decoration-line: underline;
    text-decoration-color: transparent;
    transition: text-decoration-color var(--cairn-hover-transition);
  }
  .all-tags-link:hover {
    text-decoration-color: currentColor;
  }
</style>
