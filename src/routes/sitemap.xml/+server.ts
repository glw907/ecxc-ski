import type { RequestHandler } from './$types';
import { sitemapResponse, type SitemapUrl } from '@glw907/cairn-cms/delivery';
import { site, posts, ORIGIN } from '$chassis/content';

export const prerender = true;

// The concept entries (`site.all()`) plus this site's bespoke routes: /archives, /tags, /contact,
// and /waiver. None of those four are concept entries, so the site resolver cannot see them; they
// are added here by hand, same as one page per live tag. `pages/home` is EXCLUDED from `site.all()`
// below: its own permalink (/home) is now a redirect target (backlog #17), not a canonical URL, so
// the real home (`/`) is listed once, above, instead.
export const GET: RequestHandler = () => {
  const urls: SitemapUrl[] = [
    { loc: ORIGIN + '/' },
    { loc: ORIGIN + '/archives' },
    { loc: ORIGIN + '/tags' },
    { loc: ORIGIN + '/contact' },
    { loc: ORIGIN + '/waiver' },
    ...posts.allTags().map(({ tag }) => ({ loc: `${ORIGIN}/tags/${tag}` })),
    ...site
      .all()
      .filter((s) => !(s.concept === 'pages' && s.id === 'home'))
      .map((s) => ({ loc: ORIGIN + s.permalink, ...(s.date ? { lastmod: s.date } : {}) })),
  ];
  return sitemapResponse(urls);
};
