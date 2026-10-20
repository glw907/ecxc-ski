# ecnordic Pass 1b: the delivery surface design

## Context

This is the detail design for Pass 1b of the cairn-cms 0.10 migration. The parent roadmap is
`2026-05-31-ecnordic-cairn-0.10-migration-design.md`, which split Pass 1 into a 1a catch-up and a
1b delivery surface. Pass 1a landed on 2026-06-01: ecnordic runs on `@glw907/cairn-cms@^0.10.0`, the
adapter and editor use `render`, and the YAML declares the month-dated posts URL policy. Pass 1b
replaces ecnordic's hand-rolled public delivery with the engine's, so ecnordic becomes the first
idiomatic cairn delivery site. No reference delivery wiring ships in cairn-cms today, so this pass
also seeds the pattern the scaffolder template and 907-life's follow-on will copy.

## What the engine actually ships

The parent spec assumed a `byPermalink` resolver and a route factory from the engine. The shipped
0.10 does not have those. It exposes data helpers instead, and the site composes them:

- `fromGlob(record)` turns a Vite `?raw` eager glob into `RawFile[]`.
- `createContentIndex(rawFiles, descriptor)` returns a `ContentIndex` with `all`, `byId`, `byTag`,
  `allTags`, and `adjacent`. The descriptor comes from `runtime.concepts`, so the YAML URL policy
  drives the index.
- Each `ContentSummary` already carries its computed `permalink`, `excerpt`, `wordCount`, `draft`,
  `date`, and `tags`. A `ContentEntry` adds `frontmatter` and the raw `body`.
- `buildRssFeed`, `buildJsonFeed`, `buildSitemap`, `buildRobots`, and `buildSeoMeta` produce the
  feed, sitemap, robots, and SEO documents from plain inputs.

Because every summary carries its permalink, the reverse map from a URL back to an entry is a few
lines of site code over `index.all()`. The catch-all is cheap to build. It is site code now, not an
engine import.

## Goal

Serve every public URL through the engine's content model with no live URL moved and no rendered
body changed. Adopt the catch-all route, the byPermalink resolver, the engine feeds, a new sitemap
and robots file, and the full SEO head. Delete the hand-rolled `posts.ts`, `pages.ts`, and `feed.ts`.

## Architecture

### The content layer (`src/lib/content.ts`)

One new module is the only place that reads content off disk. It replaces `posts.ts`, `pages.ts`,
and `feed.ts`.

It globs each concept's markdown, runs it through `fromGlob`, and builds a `ContentIndex` per
concept from the `runtime.concepts` descriptors. It exposes the per-concept indexes (posts, pages),
a `resolvePermalink(path)` that returns `{ concept, entry }` or `undefined`, and thin list helpers
the home and tag routes need (`allPosts`, `allTags`, `postsByTag`) that wrap `all`, `allTags`, and
`byTag`.

`resolvePermalink` builds a `Map<permalink, { concept, id }>` once across both concepts from
`index.all()`, then looks the path up and returns the resolved `ContentEntry`. This map is the
byPermalink resolver. It is the single unit every route depends on, and it can be understood and
tested without reading any route.

### The catch-all route (`src/routes/[...path]/`)

`+page.server.ts` resolves `params.path` through `resolvePermalink`, returns a 404 on a miss,
renders the entry's raw `body` through `runtime.render`, and returns `{ concept, entry, html, seo }`.
Its `entries()` enumerates every permalink from the content layer, so prerendering stays exhaustive
and deterministic. The site stays SSG, the cairn idiom.

SvelteKit gives an explicit route precedence over `[...path]`, so `/contact`, `/waiver`,
`/feed.xml`, `/feed.json`, `/healthz`, `/tags`, `/tags/[tag]`, and the home page keep their own
routes. The catch-all serves only what is left, which is posts and pages.

`+page.svelte` branches on `data.concept`. A post renders its date, body, and tag chips the way the
current post page does. A page renders title and body the way the current page does. One file holds
both presentations, dispatched on the concept, which folds the two existing content `+page.svelte`
files into the single route.

### Feeds, sitemap, robots, SEO

`/feed.xml` and `/feed.json` get rewritten to call `buildRssFeed` and `buildJsonFeed` over
`allPosts`. Each post maps to a `FeedItem` carrying its rendered body as `contentHtml`, so the
feeds stay full-content. The hand-rolled XML and JSON string building goes away. The feed bytes will
differ from today's, since the builders own the format. Valid feeds that emit are the gate, not a
byte match.

A new `/sitemap.xml` calls `buildSitemap` over every public URL: post and page permalinks, the tag
index and per-tag pages, the home page, and the static public pages (contact, waiver). A new
`/robots.txt` calls `buildRobots({ sitemapUrl, disallow: ['/admin'] })`.

SEO uses `buildSeoMeta`, rendered into the catch-all's `<svelte:head>`. It emits the title,
description, canonical URL from `SITE_URL` plus the permalink, the `og` and `article` tags, and the
feed links. This enriches the head beyond today's title and description. It adds tags rather than
moving them, and changes no URL and no body. The richer head is the idiomatic baseline and the right
seed for the scaffolder reference. It uses only data ecnordic already holds, with no new share-image
asset.

### Deletions and what stays

Delete `src/lib/posts.ts`, `src/lib/pages.ts`, `src/lib/feed.ts`, and the two replaced route folders
`src/routes/[year]/[month]/[slug]/` and `src/routes/[slug]/`. Keep `content-schema.ts` (the
adapter's frontmatter validators), `config.ts`, and `utils.ts`, since `markdownToHtml` is still the
renderer the adapter's `render` calls. The tag routes stay and re-point at the content layer. Prune
the now-dead post and page types from `types.ts`.

## Data flow

A request for `/2026/05/welcome` falls through to `[...path]`. The load calls `resolvePermalink`,
which finds the posts entry whose computed permalink is `/2026/05/welcome`, renders its body, builds
the SEO head, and returns the data. The build prerenders this URL because `entries()` listed it.
A request for `/about` flows the same way to the pages concept. The home, tag, feed, sitemap, and
robots routes read the same content layer through their list helpers.

## Testing and verification

- **Zero-URL-movement gate.** Capture the current site's full URL set from `posts.ts` and `pages.ts`
  before deleting them. Assert the catch-all's `entries()` permalink set equals that captured set.
  This is the contract: the pass is not done unless the URL inventory is identical.
- **Resolver round-trip.** `resolvePermalink` maps a sample of known post and page URLs to the right
  entries, and returns `undefined` for an unknown path.
- **Feeds and sitemap.** Each emits and parses as a valid document, and covers every non-draft post.
- **Build and smoke.** The build is green. A `wrangler dev` smoke confirms a post, a page, both
  feeds, and the sitemap serve, and that the admin editor still loads.

## Out of scope

- The component conversion to typed attributes and slots. That is Pass 2.
- Pagination on the home and tag pages. ecnordic's post count does not need it, so the engine's
  `paginate` stays unused for now.
- Prev and next links on posts. The index exposes `adjacent`, but the current site has no such links,
  so the pass does not add them.
- Any visual or design change to a rendered page.

## Decisions locked

- Routing is the catch-all `[...path]` plus a site-built byPermalink resolver, the idiomatic cairn
  delivery model. The YAML URL policy stays the single source of truth.
- SEO adopts the full `buildSeoMeta` head, not a minimal match of today's head.
- Feeds adopt the engine builders, with valid emitting feeds as the gate rather than byte parity.
- The content layer is one module that owns all content reads and the resolver.
