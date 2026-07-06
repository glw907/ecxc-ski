import type { RequestHandler } from './$types';
import { sitemapResponse, type SitemapUrl } from '@glw907/cairn-cms/delivery';
import { site, posts } from '$lib/content';
import { SITE_URL } from '$lib/config';

export const prerender = true;

export const GET: RequestHandler = () => {
  const urls: SitemapUrl[] = [
    { loc: SITE_URL + '/' },
    { loc: SITE_URL + '/tags' },
    { loc: SITE_URL + '/contact' },
    { loc: SITE_URL + '/waiver' },
    // Content: posts carry a date (the lastmod), pages do not.
    ...site.all().map((s) =>
      s.date ? { loc: SITE_URL + s.permalink, lastmod: s.date } : { loc: SITE_URL + s.permalink },
    ),
    ...posts.allTags().map(({ tag }) => ({ loc: `${SITE_URL}/tags/${tag}` })),
  ];

  return sitemapResponse(urls);
};
