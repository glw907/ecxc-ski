import type { RequestHandler } from './$types';
import { sitemapResponse, type SitemapUrl } from '@glw907/cairn-cms/delivery';
import { site, posts, ORIGIN } from '$lib/content';

export const prerender = true;

export const GET: RequestHandler = () => {
  const urls: SitemapUrl[] = [
    { loc: ORIGIN + '/' },
    { loc: ORIGIN + '/tags' },
    { loc: ORIGIN + '/contact' },
    { loc: ORIGIN + '/waiver' },
    // Content: posts carry a date (the lastmod), pages do not.
    ...site.all().map((s) =>
      s.date ? { loc: ORIGIN + s.permalink, lastmod: s.date } : { loc: ORIGIN + s.permalink },
    ),
    ...posts.allTags().map(({ tag }) => ({ loc: `${ORIGIN}/tags/${tag}` })),
  ];

  return sitemapResponse(urls);
};
