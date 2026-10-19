# RSS + JSON Feed Design

**Date:** 2026-04-06
**Pass:** 7

---

## Overview

Add RSS 2.0 and JSON Feed 1.1 endpoints to 907.life, plus a site config module that
centralizes all values that would need to change when adapting this site to a new blog.
This pass also consolidates existing hardcoded values and structural patterns into
constants and helpers, and adds a hookify rule to prevent future drift.

---

## 1. Site Config Module

New file: `src/lib/config.ts`

```ts
export const SITE_URL             = 'https://907.life';
export const SITE_TITLE           = '907.life';
export const SITE_DESCRIPTION     = 'A personal blog by Geoffrey L. Wright';
export const SITE_AUTHOR          = 'Geoffrey L. Wright';
export const SITE_LOCALE          = 'en-US';
export const FEED_MAX_ITEMS       = 20;   // 0 = include all posts
export const HOMEPAGE_FEATURED_COUNT = 1;
```

**Adapt-for-new-site:** Change these constants and the `site-constants` hookify rule
patterns when using this codebase as a starting point for a new blog.

---

## 2. Utils Updates

**`src/lib/utils.ts`** — add two helpers and consolidate date formatting:

### `postUrl(post: PostSummary): string`
Returns the canonical relative URL for a post: `/${post.year}/${post.month}/${post.day}/${post.slug}/`

Replaces inline URL construction currently in:
- `src/routes/+page.svelte` (×2 — featured post and list)
- `src/lib/components/ArchiveList.svelte`
- `src/lib/feed.ts` (new — uses it for absolute URLs)

### `tagUrl(tag: string): string`
Returns the canonical relative URL for a tag page (format TBD in Pass 6).
Established now so Pass 6 uses the helper from the start rather than inlining.

### `formatShortDate(iso: string): string`
Move from `ArchiveList.svelte` (where it is currently component-local) into `utils.ts`.
Uses `SITE_LOCALE` instead of the hardcoded `'en-US'`. Format: `{ month: 'short', day: 'numeric' }`.

Update `formatDate()` to use `SITE_LOCALE` instead of hardcoded `'en-US'`.

---

## 3. Existing Code Updates

All values that belong in config, currently hardcoded:

| File | Hardcoded value | Replace with |
|---|---|---|
| `src/routes/+layout.svelte` | `"907.life"` in footer | `SITE_TITLE` |
| `src/routes/[year]/[month]/[day]/[slug]/+page.svelte` | `— 907.life` in `<title>` | `SITE_TITLE` |
| `src/routes/+page.svelte` | `posts[0]` / `posts.slice(1)` | `HOMEPAGE_FEATURED_COUNT` |
| `src/routes/+page.svelte` (×2) | inline post URL construction | `postUrl(post)` |
| `src/lib/components/ArchiveList.svelte` | inline post URL construction | `postUrl(post)` |
| `src/lib/components/ArchiveList.svelte` | local `formatShortDate` | `formatShortDate` from utils |
| `src/lib/utils.ts` | `'en-US'` locale | `SITE_LOCALE` |

---

## 4. Feed Data Layer

New file: `src/lib/feed.ts`

### `FeedItem` type

```ts
export interface FeedItem {
  title: string;
  url: string;        // absolute URL: SITE_URL + postUrl(post)
  date: string;       // ISO date string (YYYY-MM-DD)
  description: string;
  html: string;       // full rendered HTML from getPost()
  tags: string[];
}
```

### `getFeedItems(): Promise<FeedItem[]>`

1. Calls `getAllPosts()` — returns non-draft posts, newest-first
2. Slices to `FEED_MAX_ITEMS` (skipped when `FEED_MAX_ITEMS === 0`)
3. Calls `getPost()` for each post to get rendered HTML
4. Builds absolute URL as `SITE_URL + postUrl(post)`
5. Returns `FeedItem[]`

No other logic. Filtering and sorting are handled by `getAllPosts()`; serialization is
handled by the route formatters.

---

## 5. Feed Routes

### RSS 2.0 — `src/routes/feed.xml/+server.ts`

Returns `Response` with `Content-Type: application/rss+xml; charset=utf-8`.

Feed-level elements:
- `<title>` — `SITE_TITLE`
- `<link>` — `SITE_URL`
- `<description>` — `SITE_DESCRIPTION`
- `<lastBuildDate>` — RFC 822 date of most recent item

Per-item elements:
- `<title>` — post title
- `<link>` — absolute post URL
- `<guid isPermaLink="true">` — absolute post URL
- `<pubDate>` — RFC 822 formatted date
- `<description>` — frontmatter description (one sentence)
- `<content:encoded>` — full HTML, CDATA-wrapped (uses `content` namespace)
- `<category>` — one per tag

### JSON Feed 1.1 — `src/routes/feed.json/+server.ts`

Returns `Response` with `Content-Type: application/feed+json; charset=utf-8`.

Feed-level fields:
```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "SITE_TITLE",
  "home_page_url": "SITE_URL",
  "feed_url": "SITE_URL/feed.json",
  "description": "SITE_DESCRIPTION",
  "author": { "name": "SITE_AUTHOR" }
}
```

Per-item fields:
- `id` — absolute post URL
- `url` — absolute post URL
- `title` — post title
- `date_published` — ISO 8601 datetime (date + `T00:00:00Z`)
- `summary` — frontmatter description
- `content_html` — full rendered HTML
- `tags` — array of tag strings

---

## 6. Footer + Feed Discovery

**`src/routes/+layout.svelte`** — two changes:

### Feed autodiscovery (in `<svelte:head>`)
```html
<link rel="alternate" type="application/rss+xml" title="{SITE_TITLE}" href="/feed.xml" />
<link rel="alternate" type="application/feed+json" title="{SITE_TITLE}" href="/feed.json" />
```

### Footer icon links
Three icon links replace the current plain `907.life` text:

| Icon | Link | aria-label |
|---|---|---|
| RSS lozenge SVG | `/feed.xml` | "RSS feed" |
| JSON curly-brace SVG | `/feed.json` | "JSON feed" |
| Envelope SVG | `/about/#contact` | "Contact" |

Styling: icons centered inline, muted color (`oklch(60% 0.008 230)`), hover brightens.
`SITE_TITLE` displayed as text alongside or below the icons.

---

## 7. Hookify Rule: `site-constants`

**Trigger:** edit of `.svelte` or `.ts` files, excluding `src/lib/config.ts` itself.

**Catches — literal config values** (string literals that should come from `config.ts`):
- `907.life` (site title/domain)
- `https://907.life` (full site URL)
- `Geoffrey L. Wright` (author name)

**Catches — structural patterns** (inline constructions that should use a helper):
- Post URL construction: `.year}/{` + `.month}/{` pattern → use `postUrl()`
- Tag URL construction: similar inline tag path pattern → use `tagUrl()`
- Date locale: `'en-US'` as a string literal → use `SITE_LOCALE`
- Homepage featured slice: `posts.slice(1)` or `posts[0]` as literals → use `HOMEPAGE_FEATURED_COUNT`

**Rule message:**
> This value should come from `src/lib/config.ts` or a helper in `src/lib/utils.ts`.
> When adapting this site to a new project, update the constants in `config.ts` and
> the patterns in this hookify rule to match the new site's values.

---

## File Map

**New files:**
- `src/lib/config.ts` — site constants
- `src/lib/feed.ts` — `FeedItem` type + `getFeedItems()`
- `src/routes/feed.xml/+server.ts` — RSS 2.0 endpoint
- `src/routes/feed.json/+server.ts` — JSON Feed 1.1 endpoint
- `.claude/hookify.site-constants.local.md` — hookify rule

**Modified files:**
- `src/lib/utils.ts` — add `postUrl()`, `tagUrl()`, `formatShortDate()`; update `formatDate()` to use `SITE_LOCALE`
- `src/routes/+layout.svelte` — feed autodiscovery links + expanded footer
- `src/routes/+page.svelte` — use `postUrl()`, `HOMEPAGE_FEATURED_COUNT`
- `src/routes/[year]/[month]/[day]/[slug]/+page.svelte` — use `SITE_TITLE` in `<title>`
- `src/lib/components/ArchiveList.svelte` — use `postUrl()`, `formatShortDate()` from utils
