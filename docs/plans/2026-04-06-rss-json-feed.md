# RSS + JSON Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add RSS 2.0 and JSON Feed 1.1 endpoints, extract all site-specific values into a config module, add URL construction helpers, update all existing hardcoded patterns, add footer icon links, and install a hookify rule to prevent future drift.

**Architecture:** New `src/lib/config.ts` holds all site constants. `src/lib/utils.ts` gains `postUrl()`, `tagUrl()`, and `formatShortDate()` helpers. `src/lib/feed.ts` is a shared data layer that fetches and renders all feed items. Two SvelteKit server routes (`feed.xml`, `feed.json`) are thin formatters over that shared layer. The footer in `+layout.svelte` gets icon links and feed autodiscovery. A hookify rule catches future hardcoding.

**Tech Stack:** SvelteKit 2 · Svelte 5 · TypeScript · RSS 2.0 · JSON Feed 1.1

**Prerequisite:** Pass 6 (Tagging) should be complete before Task 4 so that `tagUrl()` can replace inline tag URL constructions throughout the codebase. Tasks 1–3 and 5–9 are independent of Pass 6.

---

## File Map

**New files:**
- `src/lib/config.ts` — all site constants (`SITE_URL`, `SITE_TITLE`, `SITE_DESCRIPTION`, `SITE_AUTHOR`, `SITE_LOCALE`, `FEED_MAX_ITEMS`, `HOMEPAGE_FEATURED_COUNT`)
- `src/lib/feed.ts` — `FeedItem` type + `getFeedItems()` shared data layer
- `src/routes/feed.xml/+server.ts` — RSS 2.0 endpoint
- `src/routes/feed.json/+server.ts` — JSON Feed 1.1 endpoint
- `.claude/hookify.site-constants.local.md` — hookify rule

**Modified files:**
- `src/lib/utils.ts` — add `postUrl()`, `tagUrl()`, `formatShortDate()`; update `formatDate()` to use `SITE_LOCALE`
- `src/routes/+layout.svelte` — `<svelte:head>` autodiscovery, expanded footer with icons, `SITE_TITLE`
- `src/routes/+page.svelte` — use `HOMEPAGE_FEATURED_COUNT`, `postUrl()`, `tagUrl()`
- `src/routes/[year]/[month]/[day]/[slug]/+page.svelte` — use `SITE_TITLE` in `<title>`
- `src/lib/components/ArchiveList.svelte` — use `postUrl()`, `formatShortDate()` from utils
- `src/routes/archives/+page.md` — use `tagUrl()` (if Pass 6 complete)
- `src/routes/tags/+page.svelte` — use `tagUrl()` (if Pass 6 complete)

---

### Task 1: Site config module

**Files:**
- Create: `src/lib/config.ts`

- [ ] **Step 1: Create `src/lib/config.ts`**

```typescript
export const SITE_URL              = 'https://907.life';
export const SITE_TITLE            = '907.life';
export const SITE_DESCRIPTION      = 'A personal blog by Geoffrey L. Wright';
export const SITE_AUTHOR           = 'Geoffrey L. Wright';
export const SITE_LOCALE           = 'en-US';
export const FEED_MAX_ITEMS        = 20;  // 0 = include all posts
export const HOMEPAGE_FEATURED_COUNT = 1;
```

- [ ] **Step 2: Run svelte-check**

```bash
npm run check
```

Expected: `0 ERRORS 0 WARNINGS`

- [ ] **Step 3: Commit**

```bash
git add src/lib/config.ts
git commit -m "Add site config module with all site constants

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Utils helpers — postUrl, tagUrl, formatShortDate, SITE_LOCALE

**Files:**
- Modify: `src/lib/utils.ts`

- [ ] **Step 1: Replace `src/lib/utils.ts` with the updated version**

```typescript
import { SITE_LOCALE } from '$lib/config';
import type { PostSummary } from '$lib/types';

/**
 * Format an ISO date string (YYYY-MM-DD) as a human-readable date.
 * Parses as UTC to avoid timezone-shift on bare YYYY-MM-DD strings.
 */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString(SITE_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Format an ISO date string (YYYY-MM-DD) as a short date (e.g. "Mar 6").
 * Parses as UTC to avoid timezone-shift on bare YYYY-MM-DD strings.
 */
export function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString(SITE_LOCALE, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Returns the canonical relative URL for a post, e.g. /2026/03/06/early-march/ */
export function postUrl(post: Pick<PostSummary, 'year' | 'month' | 'day' | 'slug'>): string {
  return `/${post.year}/${post.month}/${post.day}/${post.slug}/`;
}

/** Returns the canonical relative URL for a tag page, e.g. /tags/alaska/ */
export function tagUrl(tag: string): string {
  return `/tags/${tag}/`;
}
```

- [ ] **Step 2: Run svelte-check**

```bash
npm run check
```

Expected: `0 ERRORS 0 WARNINGS`

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils.ts
git commit -m "Add postUrl, tagUrl, formatShortDate helpers; use SITE_LOCALE in date formatters

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Wire config constants into existing code

Updates `[slug]/+page.svelte` (page title), `+page.svelte` (homepage featured count), and `ArchiveList.svelte` (remove component-local `formatShortDate`). Does not touch `+layout.svelte` — that gets a full redesign in Task 8.

**Files:**
- Modify: `src/routes/[year]/[month]/[day]/[slug]/+page.svelte`
- Modify: `src/routes/+page.svelte`
- Modify: `src/lib/components/ArchiveList.svelte`

- [ ] **Step 1: Update `src/routes/[year]/[month]/[day]/[slug]/+page.svelte` — use SITE_TITLE in page title**

In the `<script>` block, add the import:
```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import { formatDate } from '$lib/utils';
  import { SITE_TITLE } from '$lib/config';

  let { data }: { data: PageData } = $props();
</script>
```

Update the `<svelte:head>` block:
```svelte
<svelte:head>
  <title>{data.post.title} — {SITE_TITLE}</title>
  {#if data.post.description}
    <meta name="description" content={data.post.description} />
  {/if}
</svelte:head>
```

- [ ] **Step 2: Update `src/routes/+page.svelte` — use HOMEPAGE_FEATURED_COUNT**

In the `<script>` block, add the import:
```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import { formatDate } from '$lib/utils';
  import { HOMEPAGE_FEATURED_COUNT } from '$lib/config';

  let { data }: { data: PageData } = $props();
</script>
```

Update the "Earlier" section (the `{#if data.posts.length > 1}` block):
```svelte
  {#if data.posts.length > HOMEPAGE_FEATURED_COUNT}
    <h3 class="older-heading">Earlier</h3>
    <ol class="post-list" aria-label="Earlier posts">
      {#each data.posts.slice(HOMEPAGE_FEATURED_COUNT) as post}
```

- [ ] **Step 3: Update `src/lib/components/ArchiveList.svelte` — remove local formatShortDate, import from utils**

Remove the local `formatShortDate` function from the `<script>` block and import it from utils instead. The full updated `<script>` block:

```svelte
<script lang="ts">
  import type { PostSummary } from '$lib/types';
  import { formatShortDate } from '$lib/utils';

  let { posts }: { posts: PostSummary[] } = $props();

  const byYear = $derived(
    posts.reduce<Record<string, PostSummary[]>>((acc, post) => {
      (acc[post.year] ??= []).push(post);
      return acc;
    }, {})
  );

  const years = $derived(Object.keys(byYear).sort((a, b) => Number(b) - Number(a)));
</script>
```

- [ ] **Step 4: Run svelte-check**

```bash
npm run check
```

Expected: `0 ERRORS 0 WARNINGS`

- [ ] **Step 5: Commit**

```bash
git add "src/routes/[year]/[month]/[day]/[slug]/+page.svelte" src/routes/+page.svelte src/lib/components/ArchiveList.svelte
git commit -m "Wire config constants into existing code (SITE_TITLE, HOMEPAGE_FEATURED_COUNT, formatShortDate)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Wire URL helpers into existing templates

Replace all inline post URL construction with `postUrl()` and all inline tag URL construction with `tagUrl()`.

**Note:** Tag URL substitutions in `archives/+page.md` and `tags/+page.svelte` assume Pass 6 (Tagging) has been completed. If Pass 6 is not yet done, skip those files — they'll be addressed when Pass 6 runs.

**Files:**
- Modify: `src/routes/+page.svelte`
- Modify: `src/lib/components/ArchiveList.svelte`
- Modify: `src/routes/[year]/[month]/[day]/[slug]/+page.svelte`
- Modify: `src/routes/archives/+page.md` (if Pass 6 complete)
- Modify: `src/routes/tags/+page.svelte` (if Pass 6 complete)

- [ ] **Step 1: Update `src/routes/+page.svelte` — postUrl and tagUrl**

Add imports to the `<script>` block:
```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import { formatDate, postUrl, tagUrl } from '$lib/utils';
  import { HOMEPAGE_FEATURED_COUNT } from '$lib/config';

  let { data }: { data: PageData } = $props();
</script>
```

Replace the featured post link (around line 13):
```svelte
        <a href={postUrl(data.featured)}>{data.featured.title}</a>
```

Replace the featured post tags block:
```svelte
      {#if data.featured.tags.length > 0}
        <ul class="post-tags" aria-label="Tags">
          {#each data.featured.tags as tag}
            <li><a href={tagUrl(tag)} class="post-tag">{tag}</a></li>
          {/each}
        </ul>
      {/if}
```

Replace the post list link and tags (in the `{#each data.posts...}` block):
```svelte
          <h2 class="post-title">
            <a href={postUrl(post)}>{post.title}</a>
          </h2>
```

```svelte
          {#if post.tags.length > 0}
            <ul class="post-tags" aria-label="Tags">
              {#each post.tags as tag}
                <li><a href={tagUrl(tag)} class="post-tag">{tag}</a></li>
              {/each}
            </ul>
          {/if}
```

- [ ] **Step 2: Update `src/lib/components/ArchiveList.svelte` — postUrl**

Add import to the `<script>` block (already updated in Task 3):
```svelte
<script lang="ts">
  import type { PostSummary } from '$lib/types';
  import { formatShortDate, postUrl } from '$lib/utils';
  ...
```

Replace the archive entry link:
```svelte
            <a class="entry-title" href={postUrl(post)}>
              {post.title}
            </a>
```

- [ ] **Step 3: Update `src/routes/[year]/[month]/[day]/[slug]/+page.svelte` — tagUrl**

Add `tagUrl` to imports:
```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import { formatDate, tagUrl } from '$lib/utils';
  import { SITE_TITLE } from '$lib/config';

  let { data }: { data: PageData } = $props();
</script>
```

Replace the tags block:
```svelte
  {#if data.post.tags.length > 0}
    <ul class="post-tags" aria-label="Tags">
      {#each data.post.tags as tag}
        <li><a href={tagUrl(tag)} class="post-tag">{tag}</a></li>
      {/each}
    </ul>
  {/if}
```

- [ ] **Step 4: Update `src/routes/archives/+page.md` — tagUrl (Pass 6 only)**

If Pass 6 is complete, the archives page has a tags section with inline `/tags/{tag}/`. Add the import and replace with `tagUrl`:

In the `<script lang="ts">` block, add:
```svelte
  import { tagUrl } from '$lib/utils';
```

Replace all occurrences of `href="/tags/{tag}/"` with `href={tagUrl(tag)}`.

- [ ] **Step 5: Update `src/routes/tags/+page.svelte` — tagUrl (Pass 6 only)**

If Pass 6 is complete, add the import and replace inline tag URLs:

```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import { tagUrl } from '$lib/utils';

  let { data }: { data: PageData } = $props();
</script>
```

Replace `href="/tags/{tag}/"` with `href={tagUrl(tag)}`.

- [ ] **Step 6: Run svelte-check**

```bash
npm run check
```

Expected: `0 ERRORS 0 WARNINGS`

- [ ] **Step 7: Verify in dev server**

```bash
npm run dev
```

Open http://localhost:5173/. Confirm post title links work and tag badges link to `/tags/{tag}/`. Open http://localhost:5173/archives — confirm year list and (if Pass 6 done) tag list renders. Kill with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add src/routes/+page.svelte src/lib/components/ArchiveList.svelte \
  "src/routes/[year]/[month]/[day]/[slug]/+page.svelte" \
  src/routes/archives/+page.md src/routes/tags/+page.svelte 2>/dev/null || true
git add -u
git commit -m "Replace inline URL construction with postUrl() and tagUrl() helpers

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Feed data layer

**Files:**
- Create: `src/lib/feed.ts`

- [ ] **Step 1: Create `src/lib/feed.ts`**

```typescript
import { getAllPosts, getPost } from '$lib/posts';
import { FEED_MAX_ITEMS, SITE_URL } from '$lib/config';
import { postUrl } from '$lib/utils';

export interface FeedItem {
  title: string;
  /** Absolute URL: SITE_URL + postUrl(post) */
  url: string;
  /** ISO date string from frontmatter, e.g. "2026-03-06" */
  date: string;
  description: string;
  /** Full rendered HTML from getPost() */
  html: string;
  tags: string[];
}

/**
 * Fetches all feed items, newest-first. Respects FEED_MAX_ITEMS (0 = all).
 * Renders full HTML for each post via getPost().
 */
export async function getFeedItems(): Promise<FeedItem[]> {
  let posts = getAllPosts();
  if (FEED_MAX_ITEMS > 0) {
    posts = posts.slice(0, FEED_MAX_ITEMS);
  }

  return Promise.all(
    posts.map(async (post) => {
      const detail = await getPost(post.year, post.month, post.day, post.slug);
      return {
        title: post.title,
        url: SITE_URL + postUrl(post),
        date: post.date,
        description: post.description,
        html: detail?.html ?? '',
        tags: post.tags
      };
    })
  );
}
```

- [ ] **Step 2: Run svelte-check**

```bash
npm run check
```

Expected: `0 ERRORS 0 WARNINGS`

- [ ] **Step 3: Commit**

```bash
git add src/lib/feed.ts
git commit -m "Add feed data layer (FeedItem type + getFeedItems)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: RSS 2.0 endpoint

**Files:**
- Create: `src/routes/feed.xml/+server.ts`

- [ ] **Step 1: Create `src/routes/feed.xml/+server.ts`**

```typescript
import type { RequestHandler } from './$types';
import { getFeedItems } from '$lib/feed';
import { SITE_TITLE, SITE_URL, SITE_DESCRIPTION } from '$lib/config';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toRFC822(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toUTCString();
}

export const GET: RequestHandler = async () => {
  const items = await getFeedItems();

  const itemsXml = items.map((item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
      <pubDate>${toRFC822(item.date)}</pubDate>
      <description>${escapeXml(item.description)}</description>
      <content:encoded><![CDATA[${item.html}]]></content:encoded>
      ${item.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    ${items.length > 0 ? `<lastBuildDate>${toRFC822(items[0].date)}</lastBuildDate>` : ''}
    ${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'max-age=3600'
    }
  });
};
```

- [ ] **Step 2: Run svelte-check**

```bash
npm run check
```

Expected: `0 ERRORS 0 WARNINGS`

- [ ] **Step 3: Verify in dev server**

```bash
npm run dev
```

Open http://localhost:5173/feed.xml. Expected: valid RSS XML with `<channel>` and `<item>` elements, post titles and links visible, `<content:encoded>` blocks with CDATA-wrapped HTML. Kill with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/routes/feed.xml/
git commit -m "Add RSS 2.0 feed at /feed.xml

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: JSON Feed 1.1 endpoint

**Files:**
- Create: `src/routes/feed.json/+server.ts`

- [ ] **Step 1: Create `src/routes/feed.json/+server.ts`**

```typescript
import type { RequestHandler } from './$types';
import { getFeedItems } from '$lib/feed';
import { SITE_TITLE, SITE_URL, SITE_DESCRIPTION, SITE_AUTHOR } from '$lib/config';

export const GET: RequestHandler = async () => {
  const items = await getFeedItems();

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: SITE_TITLE,
    home_page_url: SITE_URL,
    feed_url: `${SITE_URL}/feed.json`,
    description: SITE_DESCRIPTION,
    authors: [{ name: SITE_AUTHOR }],
    items: items.map((item) => ({
      id: item.url,
      url: item.url,
      title: item.title,
      date_published: item.date + 'T00:00:00Z',
      summary: item.description,
      content_html: item.html,
      ...(item.tags.length > 0 && { tags: item.tags })
    }))
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': 'max-age=3600'
    }
  });
};
```

- [ ] **Step 2: Run svelte-check**

```bash
npm run check
```

Expected: `0 ERRORS 0 WARNINGS`

- [ ] **Step 3: Verify in dev server**

```bash
npm run dev
```

Open http://localhost:5173/feed.json. Expected: valid JSON with `version`, `title`, `items` array. Each item has `id`, `url`, `title`, `date_published`, `content_html`. Kill with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/routes/feed.json/
git commit -m "Add JSON Feed 1.1 at /feed.json

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Footer icon links + feed autodiscovery

Redesigns the footer with three icon links (RSS, JSON Feed, mail) and adds `<link rel="alternate">` autodiscovery tags to `<head>`. Also applies `SITE_TITLE` to the footer text. This replaces the plain `"907.life"` text footer.

**Files:**
- Modify: `src/routes/+layout.svelte`

- [ ] **Step 1: Replace `src/routes/+layout.svelte` with the updated version**

```svelte
<script lang="ts">
  import '../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import SearchModal from '$lib/components/SearchModal.svelte';
  import { SITE_TITLE } from '$lib/config';

  let { children } = $props();
  let searchOpen = $state(false);
</script>

<svelte:head>
  <link rel="alternate" type="application/rss+xml" title={SITE_TITLE} href="/feed.xml" />
  <link rel="alternate" type="application/feed+json" title={SITE_TITLE} href="/feed.json" />
</svelte:head>

<Nav onSearchOpen={() => { searchOpen = true; }} />
<SearchModal bind:open={searchOpen} />

<main class="container mx-auto px-4 max-w-3xl py-8">
  {@render children()}
</main>

<footer class="container mx-auto px-4 max-w-3xl py-8 mt-8 border-t border-base-200 text-center">
  <div class="footer-links">
    <a href="/feed.xml" aria-label="RSS feed" class="footer-icon-link">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">
        <path d="M4 11a9 9 0 0 1 9 9"/>
        <path d="M4 4a16 16 0 0 1 16 16"/>
        <circle cx="5" cy="19" r="1" fill="currentColor" stroke="none"/>
      </svg>
    </a>
    <a href="/feed.json" aria-label="JSON feed" class="footer-icon-link">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    </a>
    <a href="/about#contact" aria-label="Contact" class="footer-icon-link">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">
        <rect width="20" height="16" x="2" y="4" rx="2"/>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    </a>
  </div>
  <p class="footer-name">{SITE_TITLE}</p>
</footer>

<style>
  .footer-links {
    display: flex;
    justify-content: center;
    gap: 1.25rem;
    margin-block-end: 0.75rem;
  }

  .footer-icon-link {
    display: flex;
    align-items: center;
    color: oklch(60% 0.008 230);
    transition: color 0.2s ease;
  }

  .footer-icon-link:hover {
    color: oklch(35% 0.012 230);
  }

  .footer-name {
    font-size: 0.75rem;
    color: oklch(62% 0.008 230);
    margin: 0;
  }
</style>
```

- [ ] **Step 2: Run svelte-check**

```bash
npm run check
```

Expected: `0 ERRORS 0 WARNINGS`

- [ ] **Step 3: Verify in dev server**

```bash
npm run dev
```

Open http://localhost:5173/. Scroll to footer — confirm three icon links render. Hover over each — confirm color brightens. Click the RSS icon — confirm it navigates to `/feed.xml`. Kill with Ctrl+C.

Verify autodiscovery in browser dev tools: open any page, inspect `<head>` — confirm two `<link rel="alternate">` tags are present.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "Add footer icon links (RSS, JSON Feed, contact) and feed autodiscovery

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: Hookify site-constants rule

**Files:**
- Create: `.claude/hookify.site-constants.local.md`

- [ ] **Step 1: Create `.claude/hookify.site-constants.local.md`**

```markdown
---
name: site-constants
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.(svelte|ts)$
  - field: new_text
    operator: regex_match
    pattern: 907\.life|Geoffrey L\. Wright|'en-US'|\.(year|month|day|slug)\}\/\{|posts\.slice\(1\)|\/tags\/\{
---

**Hardcoded site-specific value or structural pattern detected.**

This value should come from `src/lib/config.ts` or a helper in `src/lib/utils.ts`:

| Detected | Use instead |
|---|---|
| `907.life` / `https://907.life` | `SITE_TITLE` / `SITE_URL` from `$lib/config` |
| `Geoffrey L. Wright` | `SITE_AUTHOR` from `$lib/config` |
| `'en-US'` | `SITE_LOCALE` from `$lib/config` |
| `.year}/{...month}/{...` (post URL) | `postUrl(post)` from `$lib/utils` |
| `/tags/{tag}/` inline | `tagUrl(tag)` from `$lib/utils` |
| `posts.slice(1)` | `posts.slice(HOMEPAGE_FEATURED_COUNT)` — import `HOMEPAGE_FEATURED_COUNT` from `$lib/config` |

**Exception:** If you're editing `src/lib/config.ts`, these values belong here — no action needed.

**Adapting for a new site:** Update the constants in `src/lib/config.ts` and the `pattern`
line in this hookify rule to match the new site's values.
```

- [ ] **Step 2: Test that the rule loads**

```bash
/hookify list
```

Expected: `site-constants` appears in the list with `enabled: true`.

- [ ] **Step 3: Verify the rule fires**

Make a test edit to any `.svelte` file that contains `907.life` (e.g., temporarily add a comment `<!-- 907.life test -->`). Expected: hookify fires with the site-constants message. Revert the test edit immediately.

- [ ] **Step 4: Commit**

```bash
git add .claude/hookify.site-constants.local.md
git commit -m "Add hookify site-constants rule to catch hardcoded site values

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| `src/lib/config.ts` with all constants | Task 1 |
| `SITE_LOCALE` in config | Task 1 |
| `FEED_MAX_ITEMS` (0 = all) | Task 1, Task 5 |
| `HOMEPAGE_FEATURED_COUNT` | Task 1, Task 3 |
| `postUrl()` helper | Task 2 |
| `tagUrl()` helper | Task 2 |
| `formatShortDate()` in utils | Task 2 |
| `formatDate()` uses `SITE_LOCALE` | Task 2 |
| `SITE_TITLE` in post `<title>` tag | Task 3 |
| `HOMEPAGE_FEATURED_COUNT` in `+page.svelte` | Task 3 |
| `formatShortDate` from utils in ArchiveList | Task 3 |
| `postUrl()` in `+page.svelte` (×2) | Task 4 |
| `postUrl()` in ArchiveList | Task 4 |
| `tagUrl()` in all tag href locations | Task 4 |
| `FeedItem` type + `getFeedItems()` | Task 5 |
| RSS 2.0 at `/feed.xml` | Task 6 |
| JSON Feed 1.1 at `/feed.json` | Task 7 |
| Footer icon links (RSS, JSON Feed, mail) | Task 8 |
| Feed autodiscovery `<link rel="alternate">` | Task 8 |
| `SITE_TITLE` in layout footer | Task 8 |
| Hookify `site-constants` rule | Task 9 |

**Type consistency:**
- `FeedItem` defined in Task 5; used in Task 6 (`escapeXml(item.title)`) and Task 7 (`item.date + 'T00:00:00Z'`) — consistent
- `postUrl()` takes `Pick<PostSummary, 'year' | 'month' | 'day' | 'slug'>` — `PostSummary` satisfies this; `PostDetail` (extends PostBase) also satisfies it
- `getFeedItems()` imported identically in Tasks 6 and 7: `import { getFeedItems } from '$lib/feed'`
- Config imports use named exports — consistent across all tasks
