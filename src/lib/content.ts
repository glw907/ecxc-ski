// The site's one delivery content layer. Everything public (home, tags, feeds, sitemap,
// the catch-all route) reads content through here. It globs the markdown and hands the
// adapter to createSiteIndexes, which builds the typed per-concept indexes and the site
// resolver, and exposes a link resolver for the cairn: tokens the renderer threads.
//
// The committed manifest is verified by the cairnManifest() Vite plugin in vite.config.ts. It
// runs outside the prerender lifecycle, so a stale manifest fails the build red regardless of the
// inherited handleHttpError policy. Regenerate the manifest with `npm run cairn:manifest`.
import {
  createSiteIndexes,
  buildLinkResolver,
  type FeedItem,
} from '@glw907/cairn-cms/delivery';
import { cairn } from './cairn.config.js';
import { SITE_URL, SITE_DESCRIPTION as DESC, FEED_MAX_ITEMS, siteConfig } from './config.js';

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

const indexes = createSiteIndexes(cairn, siteConfig, { posts: postsRaw, pages: pagesRaw });

export const site = indexes.site;
export const posts = indexes.posts;
export const pages = indexes.pages;
export const ORIGIN = SITE_URL;
export const SITE_DESCRIPTION = DESC;

/** A post as the home and archive lists render it: the engine summary plus the authored
 *  description (ContentSummary carries a derived excerpt, not the authored summary field). */
export interface PostListItem {
  id: string;
  slug: string;
  permalink: string;
  title: string;
  date: string;
  tags: string[];
  description: string;
}

/** Map a post entry to a PostListItem, re-reading the authored description from the typed entry. */
function toItem(s: { id: string }): PostListItem {
  const e = posts.byId(s.id)!;
  return {
    id: e.id,
    slug: e.slug,
    permalink: e.permalink,
    title: e.title,
    date: e.date ?? '',
    tags: e.tags,
    description: e.frontmatter.description ?? '',
  };
}

/** All non-draft posts, newest first, as the home and archive lists consume them. */
export function postList(): PostListItem[] {
  return posts.all().map(toItem);
}

/** Non-draft posts carrying the given tag, newest first, as list items. */
export function postListByTag(tag: string): PostListItem[] {
  return posts.byTag(tag).map(toItem);
}

/** The resolver the home featured render and the feeds thread so cairn: links resolve. */
export const linkResolver = buildLinkResolver(site);

/** Posts as feed entries, newest first, capped at FEED_MAX_ITEMS (0 means all). Both feed routes
 *  render from this one list so they never drift apart. The summary is the authored description
 *  re-read from the entry, not the derived excerpt, to match the old feed. */
export function feedItems(): Promise<FeedItem[]> {
  const all = posts.all();
  const capped = FEED_MAX_ITEMS > 0 ? all.slice(0, FEED_MAX_ITEMS) : all;
  return Promise.all(
    capped.map(async (p) => {
      const entry = posts.byId(p.id)!;
      return {
        title: p.title,
        url: SITE_URL + p.permalink,
        date: p.date,
        summary: entry.frontmatter.description ?? '',
        contentHtml: await cairn.render(entry.body, { resolve: linkResolver }),
        tags: p.tags,
      };
    }),
  );
}
