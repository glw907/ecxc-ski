<!-- @component
ECXC's Talkeetna Camp page: the 'talkeetna' pages-concept entry's editorial content, rendered
identically to the Training page's own template (see that file's @component note for why this
route carries its own copy of the catch-all's page-entry markup and `.page-title` style rather
than importing it), with the on-page camp registration form below.
-->
<script lang="ts">
  import type { PageData } from './$types';
  import { CairnHead } from '@glw907/cairn-cms/delivery/head';
  import { siteConfig } from '$theme/cairn.config';
  import RegistrationForm from '$theme/components/RegistrationForm.svelte';

  let { data }: { data: PageData } = $props();
</script>

<!-- Same title-suffix mechanism as [...path]/+page.svelte: CairnHead's titleTemplate restores
     the site's own established browser-tab convention (a page title dash-suffixed with the
     site name). -->
<CairnHead seo={data.seo} titleTemplate={(title) => `${title} — ${siteConfig.siteName}`} />

<article class="prose">
  {#if data.heroImage}
    <figure class="hero">
      <img src={data.heroImage.url} alt={data.heroImage.alt} />
      {#if data.heroImage.caption}
        <figcaption>{data.heroImage.caption}</figcaption>
      {/if}
    </figure>
  {/if}
  <h1 class="page-title">{data.entry.title}</h1>
  {@html data.html}
</article>

<div class="mt-2xl">
  <RegistrationForm variant="camp" />
</div>

<style>
  /* Duplicated from [...path]/+page.svelte's own :global(.page-title) rule; see the
     @component note above for why this route carries its own copy. */
  :global(.page-title) {
    position: relative;
    padding-block-end: var(--spacing-2xs);
  }
  :global(.page-title)::after {
    content: '';
    position: absolute;
    inset-inline-start: 0;
    inset-block-end: 0;
    inline-size: 2.5rem;
    block-size: 3px;
    border-radius: var(--radius-field);
    background: var(--color-primary);
  }
</style>
