import type { RequestHandler } from './$types';
import { sitemapResponse, type SitemapUrl } from '@glw907/cairn-cms/delivery';
import { site, posts, ORIGIN } from '$lib/content';

export const prerender = true;

// The engine's sitemap surface only sees concept-derived routes (site.all(), posts.allTags()),
// so a site-owned route with no concept behind it is invisible to it; this site hand-lists
// each one, the same answer 907.life's rebuild landed on for the identical gap.
export const GET: RequestHandler = () => {
  const urls: SitemapUrl[] = [
    { loc: ORIGIN + '/' },
    { loc: ORIGIN + '/archives' },
    { loc: ORIGIN + '/tags' },
    { loc: ORIGIN + '/contact' },
    { loc: ORIGIN + '/waiver' },
    // Content: posts carry a date (the lastmod), pages do not. /home is excluded: it 301s to
    // / (backlog #17's launch redirect), so its own URL is never a canonical sitemap target.
    ...site.all()
      .filter((s) => s.permalink !== '/home')
      .map((s) =>
        s.date ? { loc: ORIGIN + s.permalink, lastmod: s.date } : { loc: ORIGIN + s.permalink },
      ),
    ...posts.allTags().map(({ tag }) => ({ loc: `${ORIGIN}/tags/${tag}` })),
  ];

  return sitemapResponse(urls);
};
