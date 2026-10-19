# ecnordic Pass 1b: delivery surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ecnordic's hand-rolled public delivery (posts.ts, pages.ts, feed.ts, the explicit post and page route folders) with the engine's content model: one content layer, a catch-all `[...path]` route behind a byPermalink resolver, engine-built feeds, a sitemap and robots file, and full SEO heads, with no live URL moved and no rendered body changed.

**Architecture:** A new `src/lib/content.ts` is the single module that reads content off disk. It builds a `ContentIndex` per concept from the engine's `createContentIndex`, using descriptors derived with `normalizeConcepts(cairn.content, urlPolicyFrom(siteConfig))` (the same inputs the runtime uses, so identical descriptors, without importing the heavier `/sveltekit` chain). Every consumer (home, tags, feeds, sitemap, the catch-all) reads that one layer. The catch-all resolves an incoming path to a content entry through a `permalink` to `{concept, id}` map built from each summary's precomputed `permalink`.

**Tech Stack:** SvelteKit 2, Svelte 5 (runes), TypeScript, `@glw907/cairn-cms@^0.10.0`, vitest, `@sveltejs/adapter-cloudflare`.

**Design reference:** `docs/superpowers/specs/2026-06-01-ecnordic-pass-1b-delivery-design.md`.

---

## Conventions for every task

- ecnordic deploys on push to `main`. These tasks commit locally; nobody pushes until the pass is verified and the user asks.
- Run `npm run check` (svelte-check, 0 errors and 0 warnings) and `npm test` (vitest, exit 0) before each commit. `npm test` must EXIT 0, not merely show passing assertions.
- Commit specific files, never `git add -A` over the whole tree. Commit footer: `Co-Authored-By: Claude <noreply@anthropic.com>`. No em dashes in commit bodies; plain voice.
- The repo content guard runs on `src/content/**`. This pass touches no content files, so it does not enter into it.
- The canonical URL for content carries no trailing slash (`trailingSlash` is unset, so SvelteKit's default `never` applies). The engine `permalink` matches this. The old `postUrl`/`tagUrl` helpers added a trailing slash that redirected to canonical; switching to `permalink` removes that redirect and moves no canonical URL.

## Reference values (verified against the live tree)

- Posts resolve to `/:year/:month/:slug` with `datePrefix: month`. The one current post is `2026-05-welcome.md` at `/2026/05/welcome` (id `2026-05-welcome`, slug `welcome`, date `2026-05-14`).
- Pages resolve to `/:slug`: `about`, `crewlab`, `resources`, `training`, `volunteers` at `/about` and so on.
- `ContentSummary` fields: `id, slug, permalink, title, date?, updated?, tags, excerpt, wordCount, draft`. `ContentEntry` adds `frontmatter` and raw `body`.
- Config exports (from `src/lib/config.ts`): `SITE_URL`, `SITE_TITLE`, `SITE_DESCRIPTION`, `SITE_AUTHOR`, `SITE_LOCALE`, `FEED_MAX_ITEMS` (default 20), `HOMEPAGE_FEATURED_COUNT` (default 1), `WELCOME_BLURB`.
- `buildSeoMeta` returns `{ title, meta: {name?,property?,content}[], links: {rel,type?,href,title?}[], jsonLd }`. Its `title` is bare, with no site suffix. The catch-all keeps the site's existing `<title>` format (page title, a separator glyph, then the site name, as written in `app.html` and today's pages and reproduced in the Task 6 code) and renders `meta`, `links`, and `jsonLd` from the builder.

---

## Task 1: The content layer (`src/lib/content.ts`)

**Files:**
- Create: `src/lib/content.ts`
- Test: `src/tests/content/content.test.ts`

This is the one module that reads content and owns the resolver. Build it first; it is additive, so the site keeps compiling.

- [ ] **Step 1: Write the failing test**

```ts
// src/tests/content/content.test.ts
import { describe, it, expect } from 'vitest';
import {
  allPosts,
  allTags,
  postsByTag,
  resolvePermalink,
  contentPermalinks,
} from '$lib/content';

describe('content layer', () => {
  it('lists posts with the frontmatter description and the engine permalink', () => {
    const posts = allPosts();
    const welcome = posts.find((p) => p.id === '2026-05-welcome');
    expect(welcome).toBeDefined();
    expect(welcome!.permalink).toBe('/2026/05/welcome');
    expect(welcome!.slug).toBe('welcome');
    expect(welcome!.date).toBe('2026-05-14');
    expect(typeof welcome!.description).toBe('string');
    expect(welcome!.description.length).toBeGreaterThan(0);
  });

  it('resolves a post permalink to its entry', () => {
    const hit = resolvePermalink('/2026/05/welcome');
    expect(hit?.concept).toBe('posts');
    expect(hit?.entry.id).toBe('2026-05-welcome');
    expect(typeof hit?.entry.body).toBe('string');
  });

  it('resolves a page permalink to its entry', () => {
    const hit = resolvePermalink('/about');
    expect(hit?.concept).toBe('pages');
    expect(hit?.entry.id).toBe('about');
  });

  it('returns undefined for an unknown path', () => {
    expect(resolvePermalink('/no/such/path')).toBeUndefined();
  });

  it('lists every content permalink for prerender and the sitemap', () => {
    const all = contentPermalinks();
    expect(all).toContain('/2026/05/welcome');
    expect(all).toContain('/about');
    expect(all).toContain('/training');
  });

  it('exposes tags with counts and posts by tag', () => {
    expect(allTags()).toContainEqual({ tag: 'announcements', count: 1 });
    expect(postsByTag('announcements').some((p) => p.id === '2026-05-welcome')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/tests/content/content.test.ts`
Expected: FAIL, cannot resolve `$lib/content` (module does not exist yet).

- [ ] **Step 3: Write `src/lib/content.ts`**

```ts
// The site's one delivery content layer. Everything public (home, tags, feeds, sitemap,
// the catch-all route) reads content through here. It builds a per-concept ContentIndex
// from the engine, using descriptors derived from the same inputs the runtime uses.
import {
  fromGlob,
  createContentIndex,
  normalizeConcepts,
  urlPolicyFrom,
  type ContentEntry,
  type ContentIndex,
} from '@glw907/cairn-cms';
import { cairn } from './cairn.config.js';
import { siteConfig } from './config.js';
import { markdownToHtml } from './utils.js';

export type ConceptId = 'posts' | 'pages';

/** A post as the home, archive, and tag lists consume it: summary fields plus the
 *  authored frontmatter description (ContentSummary carries a derived excerpt, not it). */
export interface PostListItem {
  id: string;
  slug: string;
  permalink: string;
  title: string;
  date: string;
  tags: string[];
  description: string;
}

const concepts = normalizeConcepts(cairn.content, urlPolicyFrom(siteConfig));
const postDesc = concepts.find((c) => c.id === 'posts')!;
const pageDesc = concepts.find((c) => c.id === 'pages')!;

const postsRaw = import.meta.glob('/src/content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
const pagesRaw = import.meta.glob('/src/content/pages/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const postsIndex: ContentIndex = createContentIndex(fromGlob(postsRaw), postDesc);
const pagesIndex: ContentIndex = createContentIndex(fromGlob(pagesRaw), pageDesc);

// permalink to {concept, id}, built once across both concepts. The byPermalink resolver.
const byPermalink = new Map<string, { concept: ConceptId; id: string }>();
for (const s of postsIndex.all()) byPermalink.set(s.permalink, { concept: 'posts', id: s.id });
for (const s of pagesIndex.all()) byPermalink.set(s.permalink, { concept: 'pages', id: s.id });

function toListItem(id: string): PostListItem {
  const entry = postsIndex.byId(id)!;
  return {
    id: entry.id,
    slug: entry.slug,
    permalink: entry.permalink,
    title: entry.title,
    date: entry.date ?? '',
    tags: entry.tags,
    description: (entry.frontmatter.description as string) ?? '',
  };
}

/** All non-draft posts, newest first (the index already sorts), as list items. */
export function allPosts(): PostListItem[] {
  return postsIndex.all().map((s) => toListItem(s.id));
}

/** A post's raw markdown body by id, for the home featured render and the feeds. */
export function postBody(id: string): string {
  return postsIndex.byId(id)?.body ?? '';
}

/** Non-draft posts carrying the given tag, newest first. */
export function postsByTag(tag: string): PostListItem[] {
  return postsIndex.byTag(tag).map((s) => toListItem(s.id));
}

/** Every tag across non-draft posts, with counts. */
export function allTags(): { tag: string; count: number }[] {
  return postsIndex.allTags();
}

/** Resolve a request path (with leading slash, no trailing slash) to its entry. */
export function resolvePermalink(
  path: string,
): { concept: ConceptId; entry: ContentEntry } | undefined {
  const hit = byPermalink.get(path);
  if (!hit) return undefined;
  const index = hit.concept === 'posts' ? postsIndex : pagesIndex;
  const entry = index.byId(hit.id);
  return entry ? { concept: hit.concept, entry } : undefined;
}

/** Every content permalink (posts and pages), for the catch-all entries() and the sitemap. */
export function contentPermalinks(): string[] {
  return [...byPermalink.keys()];
}

/** The site's renderer. Same function the adapter's render uses. */
export function render(md: string): Promise<string> {
  return markdownToHtml(md);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/tests/content/content.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Gate and commit**

Run `npm run check` (0/0) and `npm test` (exit 0), then:

```bash
git add src/lib/content.ts src/tests/content/content.test.ts
git commit -m "feat: add the engine-backed content layer

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Rewrite the feeds on the engine builders

**Files:**
- Modify: `src/routes/feed.xml/+server.ts`
- Modify: `src/routes/feed.json/+server.ts`

The feeds stop reading `src/lib/feed.ts` and build from the content layer through `buildRssFeed` and `buildJsonFeed`. The feed bytes change, since the builders own the format. Valid feeds that emit are the gate.

- [ ] **Step 1: Rewrite `src/routes/feed.xml/+server.ts`**

```ts
import type { RequestHandler } from './$types';
import { buildRssFeed, type FeedItem } from '@glw907/cairn-cms';
import { allPosts, postBody, render } from '$lib/content';
import { SITE_TITLE, SITE_URL, SITE_DESCRIPTION, SITE_AUTHOR, FEED_MAX_ITEMS } from '$lib/config';

export const prerender = true;

export const GET: RequestHandler = async () => {
  const posts = FEED_MAX_ITEMS > 0 ? allPosts().slice(0, FEED_MAX_ITEMS) : allPosts();
  const items: FeedItem[] = await Promise.all(
    posts.map(async (p) => ({
      title: p.title,
      url: SITE_URL + p.permalink,
      date: p.date,
      summary: p.description,
      contentHtml: await render(postBody(p.id)),
      tags: p.tags,
    })),
  );

  const xml = buildRssFeed(
    {
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      siteUrl: SITE_URL,
      feedUrl: SITE_URL + '/feed.xml',
      author: { name: SITE_AUTHOR },
    },
    items,
  );

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
```

- [ ] **Step 2: Rewrite `src/routes/feed.json/+server.ts`**

```ts
import type { RequestHandler } from './$types';
import { buildJsonFeed, type FeedItem } from '@glw907/cairn-cms';
import { allPosts, postBody, render } from '$lib/content';
import { SITE_TITLE, SITE_URL, SITE_DESCRIPTION, SITE_AUTHOR, FEED_MAX_ITEMS } from '$lib/config';

export const prerender = true;

export const GET: RequestHandler = async () => {
  const posts = FEED_MAX_ITEMS > 0 ? allPosts().slice(0, FEED_MAX_ITEMS) : allPosts();
  const items: FeedItem[] = await Promise.all(
    posts.map(async (p) => ({
      title: p.title,
      url: SITE_URL + p.permalink,
      date: p.date,
      summary: p.description,
      contentHtml: await render(postBody(p.id)),
      tags: p.tags,
    })),
  );

  const json = buildJsonFeed(
    {
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      siteUrl: SITE_URL,
      feedUrl: SITE_URL + '/feed.json',
      author: { name: SITE_AUTHOR },
    },
    items,
  );

  return new Response(json, {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' },
  });
};
```

- [ ] **Step 3: Verify both feeds emit valid documents**

Run: `npm run build`
Expected: build succeeds and prerenders `/feed.xml` and `/feed.json`.

Run: `node -e "const fs=require('node:fs'); const x=fs.readFileSync('.svelte-kit/cloudflare/feed.xml','utf8'); if(!x.includes('<rss')) throw new Error('no rss'); JSON.parse(fs.readFileSync('.svelte-kit/cloudflare/feed.json','utf8')); console.log('feeds valid');"`
Expected: prints `feeds valid` (the RSS contains `<rss` and the JSON parses).

- [ ] **Step 4: Gate and commit**

Run `npm run check` (0/0) and `npm test` (exit 0), then:

```bash
git add src/routes/feed.xml/+server.ts src/routes/feed.json/+server.ts
git commit -m "feat: build the feeds with the engine feed builders

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Add the sitemap and robots routes

**Files:**
- Create: `src/routes/sitemap.xml/+server.ts`
- Create: `src/routes/robots.txt/+server.ts`

Both are new and additive. The sitemap lists every public URL; robots disallows `/admin` and points at the sitemap.

- [ ] **Step 1: Write `src/routes/sitemap.xml/+server.ts`**

```ts
import type { RequestHandler } from './$types';
import { buildSitemap, type SitemapUrl } from '@glw907/cairn-cms';
import { allPosts, allTags, contentPermalinks } from '$lib/content';
import { SITE_URL } from '$lib/config';

export const prerender = true;

export const GET: RequestHandler = () => {
  const lastmodByPermalink = new Map(allPosts().map((p) => [p.permalink, p.date]));

  const urls: SitemapUrl[] = [
    { loc: SITE_URL + '/' },
    { loc: SITE_URL + '/tags' },
    { loc: SITE_URL + '/contact' },
    { loc: SITE_URL + '/waiver' },
    ...contentPermalinks().map((path) => {
      const lastmod = lastmodByPermalink.get(path);
      return lastmod ? { loc: SITE_URL + path, lastmod } : { loc: SITE_URL + path };
    }),
    ...allTags().map(({ tag }) => ({ loc: `${SITE_URL}/tags/${tag}` })),
  ];

  return new Response(buildSitemap(urls), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
```

- [ ] **Step 2: Write `src/routes/robots.txt/+server.ts`**

```ts
import type { RequestHandler } from './$types';
import { buildRobots } from '@glw907/cairn-cms';
import { SITE_URL } from '$lib/config';

export const prerender = true;

export const GET: RequestHandler = () => {
  return new Response(buildRobots({ sitemapUrl: SITE_URL + '/sitemap.xml', disallow: ['/admin'] }), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
```

- [ ] **Step 3: Verify both emit**

Run: `npm run build`
Expected: build succeeds and prerenders `/sitemap.xml` and `/robots.txt`.

Run: `node -e "const fs=require('node:fs'); const s=fs.readFileSync('.svelte-kit/cloudflare/sitemap.xml','utf8'); if(!s.includes('<urlset')||!s.includes('/2026/05/welcome')) throw new Error('bad sitemap'); const r=fs.readFileSync('.svelte-kit/cloudflare/robots.txt','utf8'); if(!r.includes('Disallow: /admin')||!r.includes('Sitemap:')) throw new Error('bad robots'); console.log('sitemap+robots ok');"`
Expected: prints `sitemap+robots ok`.

- [ ] **Step 4: Gate and commit**

Run `npm run check` (0/0) and `npm test` (exit 0), then:

```bash
git add src/routes/sitemap.xml/+server.ts src/routes/robots.txt/+server.ts
git commit -m "feat: add the sitemap and robots routes

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Migrate the home route to the content layer

**Files:**
- Modify: `src/routes/+page.server.ts`
- Modify: `src/routes/+page.svelte`

The home stops importing `posts.ts`. It reads the content layer and links by `permalink`. The featured post renders through the content layer.

- [ ] **Step 1: Rewrite `src/routes/+page.server.ts`**

```ts
import type { PageServerLoad } from './$types';
import { allPosts, postBody, render } from '$lib/content';

export const load: PageServerLoad = async () => {
  const posts = allPosts();
  const first = posts[0];
  const featured = first
    ? {
        permalink: first.permalink,
        title: first.title,
        date: first.date,
        tags: first.tags,
        html: await render(postBody(first.id)),
      }
    : null;
  return { posts, featured };
};
```

- [ ] **Step 2: Update `src/routes/+page.svelte` to link by permalink**

In `src/routes/+page.svelte`, change the import line to drop `postUrl` (keep `tagUrl`, `formatDate`, `formatShortDate`):

```ts
  import { formatDate, formatShortDate, tagUrl } from '$lib/utils';
```

Then replace every `href={postUrl(post)}` with `href={post.permalink}` and `href={postUrl(data.featured)}` with `href={data.featured.permalink}`. There are three such href attributes: the recent-posts list item, the featured-post title, and the earlier-posts list item. Change only the `href` values; leave all markup, classes, and the `{post.title}`, `{post.description}`, `{post.tags}`, and date bindings exactly as they are.

- [ ] **Step 3: Verify the home renders unchanged**

Run: `npm run check`
Expected: 0 errors, 0 warnings (the `PageData` types now flow from the new load).

Run: `npm run build`
Expected: build succeeds; the home page prerenders.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+page.server.ts src/routes/+page.svelte
git commit -m "feat: read the home page from the content layer

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Migrate the tag routes and ArchiveList

**Files:**
- Modify: `src/routes/tags/+page.server.ts`
- Modify: `src/routes/tags/[tag]/+page.server.ts`
- Modify: `src/lib/components/ArchiveList.svelte`

The tag index, the per-tag page, and the archive list stop importing `posts.ts` and read the content layer. The archive groups by year derived from the date, and links by `permalink`.

- [ ] **Step 1: Rewrite `src/routes/tags/+page.server.ts`**

```ts
import type { PageServerLoad } from './$types';
import { allTags } from '$lib/content';

export const load: PageServerLoad = () => {
  return { tags: allTags() };
};
```

- [ ] **Step 2: Rewrite `src/routes/tags/[tag]/+page.server.ts`**

```ts
import type { PageServerLoad } from './$types';
import { allTags, postsByTag } from '$lib/content';
import { error } from '@sveltejs/kit';

export function entries() {
  return allTags().map(({ tag }) => ({ tag }));
}

export const load: PageServerLoad = ({ params }) => {
  const posts = postsByTag(params.tag);
  if (posts.length === 0) error(404, 'Tag not found');
  return { tag: params.tag, posts };
};
```

- [ ] **Step 3: Update `src/lib/components/ArchiveList.svelte`**

Change the script block to take `PostListItem[]`, group by the year parsed from the date, and link by `permalink`:

```svelte
<script lang="ts">
  import type { PostListItem } from '$lib/content';
  import { formatShortDate, tagUrl } from '$lib/utils';

  let { posts }: { posts: PostListItem[] } = $props();

  const byYear = $derived(
    posts.reduce<Record<string, PostListItem[]>>((acc, post) => {
      const year = post.date.slice(0, 4);
      (acc[year] ??= []).push(post);
      return acc;
    }, {})
  );

  const years = $derived(Object.keys(byYear).sort((a, b) => Number(b) - Number(a)));
</script>
```

Then in the markup, change `href={postUrl(post)}` to `href={post.permalink}`. Leave every class and the rest of the markup unchanged.

- [ ] **Step 4: Verify**

Run: `npm run check`
Expected: 0 errors, 0 warnings.

Run: `npm run build`
Expected: build succeeds; the tag pages prerender.

- [ ] **Step 5: Commit**

```bash
git add src/routes/tags/+page.server.ts "src/routes/tags/[tag]/+page.server.ts" src/lib/components/ArchiveList.svelte
git commit -m "feat: read the tag pages and archive from the content layer

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Cut over to the catch-all route and delete the old surface

**Files:**
- Create: `src/routes/[...path]/+page.server.ts`
- Create: `src/routes/[...path]/+page.svelte`
- Test: `src/tests/content/url-inventory.test.ts`
- Delete: `src/routes/[year]/[month]/[slug]/` (folder), `src/routes/[slug]/` (folder)
- Delete: `src/lib/posts.ts`, `src/lib/pages.ts`, `src/lib/feed.ts`
- Modify: `src/lib/utils.ts` (remove now-dead helpers), `src/lib/types.ts` (remove dead types)

This task makes the catch-all the live content route. Write the zero-URL-movement test first; it is the contract. The catch-all is shadowed by the more specific old routes until they are deleted in this same task, so the cutover is one atomic change.

- [ ] **Step 1: Write the zero-URL-movement test**

```ts
// src/tests/content/url-inventory.test.ts
// The contract: the catch-all serves exactly the URLs the old explicit routes did.
// The "expected" set is rebuilt the OLD way, from raw filenames, independent of the engine.
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { contentPermalinks } from '$lib/content';

function expectedUrls(): string[] {
  const urls: string[] = [];
  for (const f of readdirSync('src/content/posts')) {
    if (!f.endsWith('.md')) continue;
    const stem = f.replace(/\.md$/, '');
    const [year, month, ...slug] = stem.split('-');
    urls.push(`/${year}/${month}/${slug.join('-')}`);
  }
  for (const f of readdirSync('src/content/pages')) {
    if (!f.endsWith('.md')) continue;
    urls.push(`/${f.replace(/\.md$/, '')}`);
  }
  return urls.sort();
}

describe('zero URL movement', () => {
  it('the catch-all serves exactly the old explicit-route URL set', () => {
    expect([...contentPermalinks()].sort()).toEqual(expectedUrls());
  });
});
```

- [ ] **Step 2: Run it to verify it passes against the current content**

Run: `npx vitest run src/tests/content/url-inventory.test.ts`
Expected: PASS. The engine's date-derived permalinks equal the filename-derived URLs for every existing file. If it fails, a file's frontmatter date disagrees with its filename prefix; stop and report that file. Do not change content to make it pass.

- [ ] **Step 3: Read the old page presentation before deleting it**

Run: `cat "src/routes/[slug]/+page.svelte"`
The page presentation has a large scoped `<style>` block that is load-bearing. It defines the `.static-page` shell, the lede and page-title treatment, and a set of rules keyed on `data-page="about"`, `data-page="training"`, and `data-page="crewlab"` that drive the decorated pages' layout and their animation cascade. The catch-all MUST carry this whole block and MUST render the `data-page` attribute, so its load returns `slug` (Step 4) and its page branch sets `data-page={data.slug}` (Step 5). Dropping either would change every page's rendering.

- [ ] **Step 4: Write `src/routes/[...path]/+page.server.ts`**

```ts
import { error } from '@sveltejs/kit';
import { buildSeoMeta } from '@glw907/cairn-cms';
import type { PageServerLoad, EntryGenerator } from './$types';
import { resolvePermalink, contentPermalinks, render } from '$lib/content';
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION } from '$lib/config';

export const prerender = true;

export const entries: EntryGenerator = () =>
  contentPermalinks().map((p) => ({ path: p.replace(/^\//, '') }));

export const load: PageServerLoad = async ({ params }) => {
  const hit = resolvePermalink('/' + params.path);
  if (!hit) error(404, 'Not found');

  const { concept, entry } = hit;
  const html = await render(entry.body);
  const description =
    (entry.frontmatter.description as string) || entry.excerpt || SITE_DESCRIPTION;

  const seo = buildSeoMeta({
    title: entry.title,
    description,
    canonicalUrl: SITE_URL + entry.permalink,
    siteName: SITE_TITLE,
    type: concept === 'posts' ? 'article' : 'website',
    ...(concept === 'posts' && entry.date ? { published: entry.date } : {}),
    feeds: { rss: SITE_URL + '/feed.xml', json: SITE_URL + '/feed.json' },
  });

  return {
    concept,
    slug: entry.slug,
    title: entry.title,
    date: entry.date ?? '',
    tags: entry.tags,
    html,
    seo,
  };
};
```

- [ ] **Step 5: Write `src/routes/[...path]/+page.svelte`**

This folds the old post and page presentations into one file, dispatched on `data.concept`. The two branches reproduce the old post markup (from `src/routes/[year]/[month]/[slug]/+page.svelte`) and the old page markup (from `src/routes/[slug]/+page.svelte`) unchanged. The `<title>` keeps its current format; the rest of the head comes from `data.seo`.

```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import { SITE_TITLE } from '$lib/config';
  import { formatDate, tagUrl } from '$lib/utils';
  import { riseStyle } from '$lib/motion';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.title} — {SITE_TITLE}</title>
  {#each data.seo.meta as m}
    {#if m.name}
      <meta name={m.name} content={m.content} />
    {:else if m.property}
      <meta property={m.property} content={m.content} />
    {/if}
  {/each}
  {#each data.seo.links as l}
    <link rel={l.rel} type={l.type} href={l.href} title={l.title} />
  {/each}
  {@html `<script type="application/ld+json">${JSON.stringify(data.seo.jsonLd)}</` + 'script>'}
</svelte:head>

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

  <a href="/" class="back-link">← Home</a>
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

  /* PAGE PRESENTATION: paste the ENTIRE contents of the old
     src/routes/[slug]/+page.svelte <style> block here, verbatim, below this
     comment. That block defines the .static-page shell, the lede and
     page-title rules, every data-page scoped rule for the decorated pages,
     and the @keyframes page-rise and module-rise the post rules above
     reference. The old post component defined no keyframes of its own, so
     pasting the page block introduces no duplicate keyframe. */
</style>
```

The page branch sets `data-page={data.slug}` (Step 4 returns `slug`), so the pasted `data-page` rules match the same `about`, `training`, and `crewlab` values they do today. Copy both style blocks from the existing source files, which are still present at this step (they are deleted in Step 6).

- [ ] **Step 6: Delete the old routes and the hand-rolled libs**

```bash
git rm -r "src/routes/[year]" "src/routes/[slug]"
git rm src/lib/posts.ts src/lib/pages.ts src/lib/feed.ts
```

- [ ] **Step 7: Remove now-dead helpers and types**

In `src/lib/utils.ts`, remove `postUrl` (nothing imports it now) and the feed-only date helpers `toRFC822` and `toISODateTime` (the engine builders format dates internally). Keep `tagUrl`, `formatDate`, `formatShortDate`, `parseUtcDate`, `isoFromValue`, and `markdownToHtml`. Remove the `import type { PostSummary } from '$lib/types'` line if `postUrl` was its only user.

In `src/lib/types.ts`, remove `PostBase`, `PostSummary`, `PostDetail`, `Post`, and `StaticPage` if nothing imports them anymore. Confirm with: `grep -rn "from '\$lib/types'" src` and `grep -rn "PostSummary\|PostDetail\|StaticPage" src`. Remove only the types with zero remaining references. If a type still has a reference, leave it.

- [ ] **Step 8: Verify the full type check, the suite, and the build**

Run: `npm run check`
Expected: 0 errors, 0 warnings. No dangling imports of `posts.ts`, `pages.ts`, `feed.ts`, or `postUrl`.

Run: `npm test`
Expected: PASS, exit 0, including `url-inventory` and `content`.

Run: `npm run build`
Expected: build succeeds. The catch-all prerenders every post and page; the old routes are gone.

- [ ] **Step 9: Confirm the catch-all serves the canonical URLs in the build output**

Run: `node -e "const fs=require('node:fs'); for (const p of ['2026/05/welcome.html','about.html','training.html']) { if(!fs.existsSync('.svelte-kit/cloudflare/'+p)) throw new Error('missing '+p); } console.log('catch-all URLs prerendered');"`
Expected: prints `catch-all URLs prerendered`.

- [ ] **Step 10: Commit**

```bash
git add src/routes src/lib/content.ts src/lib/utils.ts src/lib/types.ts src/tests/content/url-inventory.test.ts
git commit -m "feat: serve posts and pages through the catch-all route

Replace the explicit post and page route folders and the hand-rolled
posts.ts, pages.ts, and feed.ts with the catch-all over the content layer.
The URL inventory test guards that no canonical URL moved.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Full gate and live verification

**Files:** none (verification only)

- [ ] **Step 1: Type check, suite, build**

Run: `npm run check` (0 errors, 0 warnings), `npm test` (exit 0), `npm run build` (succeeds).

- [ ] **Step 2: Confirm the full public URL inventory is present**

Run: `node -e "const fs=require('node:fs'); const out='.svelte-kit/cloudflare'; const want=['index.html','about.html','crewlab.html','resources.html','training.html','volunteers.html','2026/05/welcome.html','tags.html','contact.html','waiver.html','feed.xml','feed.json','sitemap.xml','robots.txt']; const miss=want.filter(p=>!fs.existsSync(out+'/'+p)); if(miss.length) throw new Error('missing: '+miss.join(', ')); console.log('all public URLs present');"`
Expected: prints `all public URLs present`. Every prior URL still resolves, and the sitemap, robots, and feeds are new and present.

- [ ] **Step 3: Local admin and delivery smoke against a real Worker**

Run: `npx wrangler dev` (or the repo's documented admin dev command). Then load, in a browser:
- `/2026/05/welcome` renders the post with its date, body, and tags, and the page source shows the `og:` and canonical meta and the `ld+json` block.
- `/about` renders the page.
- `/feed.xml`, `/feed.json`, `/sitemap.xml`, `/robots.txt` each serve.
- `/admin` still loads (the auth surface is untouched).

Do not create or save content through the live GitHub backend from this smoke; a real save commits to `main` and deploys. This pass changed no admin or auth code, so the editor load is a regression check only.

- [ ] **Step 4: Confirm the catch-all 404s an unknown path**

In the browser or with curl against `wrangler dev`, confirm `/no/such/path` returns 404, not a rendered page.

---

## Self-review notes

- **Spec coverage.** The content layer (Task 1) is the spec's single content module and byPermalink resolver. Feeds (Task 2), sitemap and robots (Task 3), and the full `buildSeoMeta` head (Task 6) are the spec's delivery builders. The catch-all cutover (Task 6) is the spec's `[...path]` route, and it deletes `posts.ts`, `pages.ts`, `feed.ts`, and the two old route folders. The zero-URL-movement gate (Task 6, Step 1) is the spec's contract, rebuilt independently from filenames. Home (Task 4) and tags (Task 5) move onto the content layer so the deletions are safe.
- **Order and green builds.** Each task leaves the site compiling. The content layer lands first as an additive module. Feeds, sitemap, home, and tags move off `posts.ts`/`pages.ts`/`feed.ts` before Task 6 deletes them. The catch-all is shadowed by the more specific old routes until Task 6 removes them in the same task that adds it, so the cutover is atomic.
- **No rendered-output change.** The post and page markup is copied verbatim into the catch-all branches, and the page branch carries the old page route's full scoped `<style>` block plus its `data-page={data.slug}` attribute, so the decorated pages keep their layout and animation cascade. The list pages keep the frontmatter `description` (the content layer surfaces it, rather than the derived excerpt). The `<title>` keeps its existing format. The head gains `og`, canonical, and `ld+json`, the intended SEO adoption.
- **Trailing slash.** Canonical URLs carry no trailing slash, which the engine permalink matches. Internal links move from the old trailing-slash `postUrl` to `permalink`, which removes a redirect and moves no canonical URL.
- **Out of scope.** The seven components stay on the heading convention (Pass 2). No pagination, no prev or next links.
