<script lang="ts">
  import type { PageData } from './$types';
  import { CairnHead } from '@glw907/cairn-cms/delivery/head';
  import { siteConfig } from '$lib/cairn.config';

  let { data }: { data: PageData } = $props();

  const isPost = $derived(data.entry.concept === 'posts');

  const dateFmt = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  /** Render an ISO `YYYY-MM-DD` date as "14 May 2026". */
  function formatDate(iso: string): string {
    return dateFmt.format(new Date(iso));
  }
</script>

<!-- CairnHead's titleTemplate restores the site's own established browser-tab convention
     ("<page> dash-suffixed with the site name"), which the engine's bare `data.seo.title` does
     not carry; og:title and every other seo.meta entry stay untouched since the template only
     wraps <title>. -->
<CairnHead seo={data.seo} titleTemplate={(title) => `${title} — ${siteConfig.siteName}`} />

<!-- The bespoke reading surface. The `.prose` container caps the column at the measure and binds
     every element to the theme tokens (prose.css, @import-ed into theme.css). A post carries its
     date as a lead eyebrow and its tags as a trailing chip row (the pre-rebuild site's own post
     chrome, structural-device catalogue); a page carries neither. -->
<article class="prose">
  {#if data.heroImage}
    <figure class="hero">
      <img src={data.heroImage.url} alt={data.heroImage.alt} />
      {#if data.heroImage.caption}
        <figcaption>{data.heroImage.caption}</figcaption>
      {/if}
    </figure>
  {/if}
  {#if isPost && data.entry.date}
    <p class="post-date">{formatDate(data.entry.date)}</p>
  {/if}
  <h1>{data.entry.title}</h1>
  {@html data.html}
  {#if isPost && data.entry.tags.length > 0}
    <ul class="post-tags" aria-label="Tags">
      {#each data.entry.tags as tag (tag)}
        <li><a href="/tags/{tag}" class="post-tag">#{tag}</a></li>
      {/each}
    </ul>
  {/if}
</article>

<style>
  .post-date {
    font-family: var(--font-display);
    font-size: var(--text-step--1);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-muted);
    margin: 0 0 var(--spacing-2xs);
  }
  .post-tags {
    list-style: none;
    padding: 0;
    margin: var(--spacing-l) 0 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2xs);
  }
  .post-tag {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: var(--text-step--1);
    letter-spacing: 0.05em;
    color: var(--color-muted);
    padding: 0.2em 0.55em;
    border: var(--border) solid var(--color-card-border);
    border-radius: var(--radius-selector);
    text-decoration: none;
    transition: color 0.15s ease, border-color 0.15s ease;
  }
  .post-tag:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
  }
</style>
