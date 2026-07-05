<script lang="ts">
  import type { PageData } from './$types';
  import { CairnHead } from '@glw907/cairn-cms/delivery/head';
  import { siteConfig } from '$lib/cairn.config';

  let { data }: { data: PageData } = $props();
</script>

<!-- CairnHead's title override restores the site's own established browser-tab convention
     ("<page> dash-suffixed with the site name"), which the engine's bare `data.seo.title` does
     not carry; og:title and every other seo.meta entry stay untouched since the override only
     replaces <title>. -->
<CairnHead seo={data.seo} title={`${data.entry.title} — ${siteConfig.siteName}`} />

<!-- The bespoke reading surface. The `.prose` container caps the column at the measure and binds
     every element to the theme tokens (prose.css, @import-ed into theme.css). -->
<article class="prose">
  {#if data.heroImage}
    <figure class="hero">
      <img src={data.heroImage.url} alt={data.heroImage.alt} />
      {#if data.heroImage.caption}
        <figcaption>{data.heroImage.caption}</figcaption>
      {/if}
    </figure>
  {/if}
  <h1>{data.entry.title}</h1>
  {@html data.html}
</article>
