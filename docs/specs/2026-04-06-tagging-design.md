# Tagging Feature Design

**Date:** 2026-04-06  
**Status:** Approved  
**Scope:** Pass 5.5 — tag browsing for 907.life

---

## Goal

Make tags first-class navigation. Readers can see what topics a post covers, click a tag badge to browse all posts with that tag, and discover the full tag landscape from the archives page or a dedicated tag index.

---

## Routes

| URL | Description |
|-----|-------------|
| `/tags/` | Tag index — all tags with post counts |
| `/tags/[tag]/` | Tag page — year-grouped posts filtered by tag |

Both routes are pre-rendered (inherited from `+layout.server.ts`). The tag route requires `entries()` to enumerate all unique tags at build time.

---

## Data Layer

### `getAllTags()` — new function in `src/lib/posts.ts`

Returns all unique tags across non-draft posts, sorted alphabetically, with counts:

```ts
export function getAllTags(): { tag: string; count: number }[] 
```

Implementation: call `getAllPosts()`, flatten all `tags` arrays, count occurrences, sort by tag name.

### `getPostsByTag(tag: string): Post[]` — new function in `src/lib/posts.ts`

Returns all non-draft posts with the given tag, sorted newest-first:

```ts
export function getPostsByTag(tag: string): Post[]
```

Implementation: filter `getAllPosts()` by tag inclusion.

---

## New Files

### `src/routes/tags/+page.server.ts`

```ts
export const load = () => ({ tags: getAllTags() });
```

### `src/routes/tags/+page.svelte`

Title: "Tags — 907.life". Renders all tags as `badge badge-ghost badge-md` links to `/tags/{tag}/`, each showing `{tag} ({count})`. Wrapping flex row, consistent with archives page aesthetic.

### `src/routes/tags/[tag]/+page.server.ts`

```ts
export function entries() {
  return getAllTags().map(({ tag }) => ({ tag }));
}

export const load = ({ params }) => ({
  tag: params.tag,
  posts: getPostsByTag(params.tag)
});
```

404s if tag has no posts (handled via `error(404)`).

### `src/routes/tags/[tag]/+page.svelte`

Title: `"{tag}" posts — 907.life`. Heading: `Posts tagged "{tag}"`. Renders posts using `ArchiveList` component (reused from archives page) — same year-grouped format. Link back to `/tags/`.

---

## Modified Files

### `src/lib/posts.ts`

Add `getAllTags()` and `getPostsByTag()`. No changes to existing functions.

### `src/routes/archives/+page.md`

Add a tags block above the `ArchiveList`. Renders all tags as `badge badge-ghost badge-sm` links, wrapping flex row, matching the live Hugo site's layout.

### Tag rendering in homepage and post detail

Change `<li class="post-tag">{tag}</li>` to `<a href="/tags/{tag}/" class="badge badge-ghost badge-sm">{tag}</a>` in:
- `src/routes/+page.svelte`
- `src/routes/[year]/[month]/[day]/[slug]/+page.svelte`

The `.post-tag` class in `app.css` can be removed or kept for scoped overrides — check before removing.

---

## Design Details

**Badge style:** `badge badge-ghost badge-sm` throughout (consistent with existing usage). Tag index uses `badge-md` for larger tap targets.

**Tag URLs:** lowercase, as-is from frontmatter. No slug normalization needed — existing tags are already clean (`alaska`, `music`, `books`, etc.).

**Counts:** shown inline in badge text: `alaska (3)`. Same format as live Hugo site.

**Archives tags block:** positioned between the page `h1` and the `ArchiveList`. Heading: "Tags" (matches live site). Flex row, wrapping, `gap-2`.

---

## What Is Not In Scope

- Tag filtering on the homepage (separate feature if needed)
- Tag RSS feeds
- Tag descriptions or metadata pages
- Tag cloud with size weighting
- Case normalization (not needed — frontmatter tags are already clean)

---

## File Map

**New files:**
- `src/routes/tags/+page.server.ts`
- `src/routes/tags/+page.svelte`
- `src/routes/tags/[tag]/+page.server.ts`
- `src/routes/tags/[tag]/+page.svelte`

**Modified files:**
- `src/lib/posts.ts` — add `getAllTags()`, `getPostsByTag()`
- `src/routes/archives/+page.md` — add tags block
- `src/routes/+page.svelte` — tags as links
- `src/routes/[year]/[month]/[day]/[slug]/+page.svelte` — tags as links
