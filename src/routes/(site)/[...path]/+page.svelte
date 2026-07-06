<script lang="ts">
  import type { PageData } from './$types';
  import { CairnHead } from '@glw907/cairn-cms/delivery/head';
  import { SITE_TITLE } from '$lib/config';
  import { formatDate, tagUrl } from '$lib/utils';
  import { riseStyle } from '$lib/motion';

  let { data }: { data: PageData } = $props();
</script>

<CairnHead seo={data.seo} title={`${data.title} — ${SITE_TITLE}`} />

{#if data.concept === 'posts'}
  <article class="post">
    <header>
      <time class="post-date" datetime={data.date}>{formatDate(data.date)}</time>
      <h1 class="page-title">{data.title}</h1>
    </header>

    <div class="post-module" style={riseStyle(0)}>
      <div class="post-body">
        {@html data.html}
      </div>

      {#if data.tags.length}
        <ul class="post-tags">
          {#each data.tags as tag (tag)}
            <li class="post-tag"><a href={tagUrl(tag)}>#{tag}</a></li>
          {/each}
        </ul>
      {/if}
    </div>
  </article>

  <a href="/" class="back-link"><span class="ec-arr ec-arr-back">←</span> Home</a>
{:else}
  <article class="static-page" data-page={data.slug}>
    <h1 class="page-title">{data.title}</h1>

    <div class="post-body">
      {@html data.html}
    </div>
  </article>
{/if}

<style>
  /* Post presentation rules, copied from the old post +page.svelte. */
  .post {
    animation: page-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .post-module {
    animation: module-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--rise, 0s);
  }
  @media (prefers-reduced-motion: reduce) {
    .post,
    .post-module {
      animation: none;
    }
  }

  /* ─── Static content page shell ─────────────────────────── */
  .static-page {
    max-width: 46rem;
    animation: page-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .static-page :global(.page-title) {
    position: relative;
    margin-block-end: 1.6rem;
    padding-block-end: 0.9rem;
    animation: page-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .static-page :global(.page-title)::after {
    content: "";
    position: absolute;
    inset-inline-start: 0;
    inset-block-end: 0;
    inline-size: 2.5rem;
    block-size: 3px;
    border-radius: 2px;
    background: var(--color-primary);
  }

  /* The lede's visual rules (size, weight, the measure rules) live in app.css so the
     editor's preview frame, which links only that sheet, renders them too. The scoped
     half is just the entrance. */
  .static-page :global(.post-body > p:first-child) {
    animation: page-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.06s both;
  }

  /* ─── About: worked example of the ECXC design language ──────
     The page is built from a small, reusable kit (see the Pass-4 design
     spec). Each primitive maps to a DaisyUI component so it's idiomatic
     and portable; the scoped CSS here only tunes spacing and the one
     custom primitive (the icon chip):

       module   → DaisyUI .card (subtle: border + shadow-sm)
       caution  → .ec-alert.ec-alert-caution: subtle alert, amber chrome
       grid     → .ec-grid (global): card body of parallel titled points
       action   → DaisyUI .btn.btn-primary
       icon     → .ec-icon bare glyph (default); .ec-chip tile = one focal accent

     Color encodes salience, never decoration:
       fireweed   = the action: links, buttons, the CTA card
       mid spruce = ambient accents: icons, eyebrows, edges
       amber      = caution  ─────────────────────────────────────────── */

  /* A decorated page orchestrates its own entrance per module (below), so the
     shared whole-page rise would double the transform, so let the cascade carry
     it. (About and training both decorate; plain pages keep the page rise.) */
  .static-page:is([data-page="about"], [data-page="training"], [data-page="crewlab"]) {
    animation: none;
  }

  /* The staggered entrance: each module rises in on its own delay so the page resolves
     as one top-to-bottom cascade continuing the title (0s) and lede (0.06s) above it.
     The delay comes from the engine's data-rise ordinal (mapped just below), not an
     inline style, so the sanitize floor can drop `style`. The module rhythm itself
     (1.4rem, the band's 1.1rem tier) lives in app.css so the preview frame gets it. */
  .static-page :global(.ec-card),
  .static-page :global(.ec-passage),
  .static-page :global(.ec-alert) {
    animation: module-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  /* Training's only alert sits inside a section band, which carries the entrance. */
  .static-page[data-page="training"] :global(.ec-band .ec-alert) {
    animation: none;
  }
  /* A training section band is a top-level module: it carries a data-rise ordinal and
     rises as one unit. Its inner modules ride that entrance, so they don't animate
     again (the override below beats the .ec-card rule on specificity). */
  .static-page[data-page="training"] :global(.ec-band) {
    animation: module-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .static-page[data-page="training"] :global(.ec-band .ec-card) {
    animation: none;
  }
  /* data-rise ordinal → cascade delay (0.16 + n*0.04s). The engine stamps the index on
     each top-level module; past the enumerated set a module holds the final step. */
  .static-page :global([data-rise]) { animation-delay: 0.64s; }
  .static-page :global([data-rise="0"]) { animation-delay: 0.16s; }
  .static-page :global([data-rise="1"]) { animation-delay: 0.20s; }
  .static-page :global([data-rise="2"]) { animation-delay: 0.24s; }
  .static-page :global([data-rise="3"]) { animation-delay: 0.28s; }
  .static-page :global([data-rise="4"]) { animation-delay: 0.32s; }
  .static-page :global([data-rise="5"]) { animation-delay: 0.36s; }
  .static-page :global([data-rise="6"]) { animation-delay: 0.40s; }
  .static-page :global([data-rise="7"]) { animation-delay: 0.44s; }
  .static-page :global([data-rise="8"]) { animation-delay: 0.48s; }
  .static-page :global([data-rise="9"]) { animation-delay: 0.52s; }
  .static-page :global([data-rise="10"]) { animation-delay: 0.56s; }
  .static-page :global([data-rise="11"]) { animation-delay: 0.60s; }
  @keyframes module-rise {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: none; }
  }

  @keyframes page-rise {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .static-page,
    .static-page :global(.page-title),
    .static-page :global(.post-body > p:first-child),
    .static-page :global(.ec-card),
    .static-page :global(.ec-passage),
    .static-page :global(.ec-alert),
    .static-page[data-page="training"] :global(.ec-band) {
      animation: none;
    }
  }
</style>
