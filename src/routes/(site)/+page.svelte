<!-- @component ecxc's home: a masthead over a composed front page, the newest post given a lead
     treatment above the archive index. Token-backed throughout: DaisyUI role utilities and cairn
     token arbitrary-value utilities for the markup, a scoped `<style>` only for the lead card, the
     index grid, and the hairlines a utility cannot express. -->
<script lang="ts">
  import type { PageData } from './$types';
  import { siteConfig } from '$lib/cairn.config';

  let { data }: { data: PageData } = $props();

  /** The home list, newest first. The canonical `date` is the dated-concept index's normalized
   *  top-level field; an undated post sorts to the end. */
  const entries = $derived([...data.posts].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')));

  // The archive grows past this count before the tag filter earns its place; below it a narrowing
  // control adds chrome with nothing to narrow. Do not lower this to make a smaller archive show it.
  const TAG_FILTER_MIN_ENTRIES = 12;

  let selected = $state('');

  const filtered = $derived(selected ? entries.filter((p) => p.tags?.includes(selected)) : entries);

  const inUse = $derived(new Set(entries.flatMap((p) => p.tags ?? [])));
  const tagOptions = $derived(data.vocabulary.filter((entry) => inUse.has(entry.value)));

  const featured = $derived(selected === '' ? filtered[0] : undefined);
  const rest = $derived(selected === '' ? filtered.slice(1) : filtered);

  const dateFmt = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  /** Render an ISO `YYYY-MM-DD` date as a short tabular label, e.g. "15 Jan 2026". */
  function formatDate(iso: string): string {
    return dateFmt.format(new Date(iso));
  }
</script>

<svelte:head>
  <title>{siteConfig.siteName}</title>
  <meta name="description" content={siteConfig.description} />
</svelte:head>

<section class="mx-auto max-w-measure pb-xl pt-l">
  <h1 class="m-0 mb-s font-display text-step-5 font-semibold leading-tight tracking-tight">
    {siteConfig.siteName}
  </h1>
  <!-- The welcome copy is pages/home.md's rendered body, so the editor's usual save/publish flow
       is what keeps this current, the same as any other content page. -->
  <div class="prose max-w-[38rem] text-step-1 leading-snug text-muted">
    {@html data.welcomeHtml}
  </div>
</section>

<section class="listing" aria-label="Writing">
  {#if featured}
    <article class="lead" data-cairn-post>
      <p class="m-0 mb-2xs text-step--1 font-semibold uppercase tracking-eyebrow text-muted">Latest</p>
      {#if featured.date}
        <div class="lead__date">{formatDate(featured.date)}</div>
      {/if}
      <h2 class="lead__title">
        <a href={featured.permalink}>{featured.title}</a>
      </h2>
      {#if featured.fields.description}
        <p class="lead__excerpt">{featured.fields.description}</p>
      {/if}
      <a href={featured.permalink} class="lead__link">
        Read the post<span aria-hidden="true"> &rarr;</span>
      </a>
    </article>
  {/if}

  <div class="index">
    <div class="index__head">
      <p class="m-0 text-step--1 font-semibold uppercase tracking-eyebrow text-muted">Archive</p>
      <span class="index__count">{rest.length} {rest.length === 1 ? 'entry' : 'entries'}</span>
    </div>

    {#if entries.length > TAG_FILTER_MIN_ENTRIES && tagOptions.length > 0}
      <div class="tag-filter" role="group" aria-label="Filter by tag">
        <button
          type="button"
          class="tag-filter__option"
          aria-pressed={selected === ''}
          onclick={() => (selected = '')}
        >
          All
        </button>
        {#each tagOptions as option (option.value)}
          <button
            type="button"
            class="tag-filter__option"
            aria-pressed={selected === option.value}
            onclick={() => (selected = option.value)}
          >
            {option.label}
          </button>
        {/each}
      </div>
    {/if}

    {#each rest as post (post.id)}
      <article class="entry" class:entry--undated={!post.date} data-cairn-post>
        {#if post.date}
          <div class="entry__date">{formatDate(post.date)}</div>
        {/if}
        <div>
          <h2 class="entry__title">
            <a href={post.permalink}>{post.title}</a>
          </h2>
          {#if post.fields.description}
            <p class="entry__excerpt">{post.fields.description}</p>
          {/if}
        </div>
      </article>
    {/each}
  </div>
</section>

<style>
  .listing {
    border-top: var(--border) solid var(--color-base-300);
    padding-top: var(--spacing-s);
    margin-bottom: var(--spacing-2xl);
  }

  .lead {
    padding-bottom: var(--spacing-l);
    margin-bottom: var(--spacing-l);
    border-bottom: var(--border) solid var(--color-card-border);
  }
  .lead__date {
    margin-bottom: var(--spacing-3xs);
    font-size: var(--text-step--1);
    color: var(--color-muted);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.01em;
  }
  .lead__title {
    margin: 0 0 var(--spacing-2xs);
    font-family: var(--font-display);
    font-weight: 600;
    font-size: var(--text-step-4);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-tight);
  }
  .lead__title a {
    color: inherit;
    text-decoration: none;
  }
  .lead__title a:hover {
    color: var(--color-primary);
  }
  .lead__excerpt {
    margin: 0 0 var(--spacing-s);
    max-width: 38rem;
    font-size: var(--text-step-1);
    line-height: var(--leading-snug);
    color: var(--color-muted);
  }
  .lead__link {
    display: inline-flex;
    align-items: center;
    font-weight: 600;
    color: var(--color-primary);
    text-decoration: none;
  }
  .lead__link:hover {
    text-decoration: underline;
  }
  .lead__link:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: 2px;
  }

  .index__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: var(--spacing-xs);
  }
  .index__count {
    font-size: var(--text-step--1);
    color: var(--color-muted);
    font-variant-numeric: tabular-nums;
  }

  .tag-filter {
    --tag-filter-radius: 999px;
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2xs);
    padding: var(--spacing-s) 0;
  }
  .tag-filter__option {
    font-size: var(--text-step--1);
    line-height: var(--leading-snug);
    padding: 0.25rem 0.7rem;
    border: var(--border) solid var(--color-card-border);
    border-radius: var(--tag-filter-radius);
    background: transparent;
    color: var(--color-muted);
    cursor: pointer;
  }
  .tag-filter__option:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  .tag-filter__option:hover {
    color: var(--color-base-content);
  }
  .tag-filter__option[aria-pressed='true'] {
    border-color: var(--color-primary);
    color: var(--color-primary-content);
    background: var(--color-primary);
  }

  .entry {
    display: grid;
    grid-template-columns: 7.5rem 1fr;
    gap: var(--spacing-m);
    align-items: start;
    padding: var(--spacing-m) 0;
    border-bottom: var(--border) solid var(--color-card-border);
  }
  .entry--undated {
    grid-template-columns: 1fr;
  }

  .entry__date {
    padding-top: 0.5rem;
    font-size: var(--text-step--1);
    color: var(--color-muted);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.01em;
  }

  .entry__title {
    margin: 0 0 0.35rem;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: var(--text-step-2);
    line-height: var(--leading-snug);
    letter-spacing: var(--tracking-tight);
  }
  .entry__title a {
    color: inherit;
    text-decoration: none;
  }
  .entry__title a:hover {
    color: var(--color-primary);
  }

  .entry__excerpt {
    margin: 0;
    font-size: var(--text-step-0);
    line-height: var(--leading-snug);
    color: var(--color-muted);
  }

  @media (max-width: 34rem) {
    .entry {
      grid-template-columns: 1fr;
      gap: 0.4rem;
    }
    .entry__date {
      padding-top: 0;
    }
  }
</style>
