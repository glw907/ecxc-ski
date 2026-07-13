import type { RequestHandler } from './$types';
import { sitemapResponse, type SitemapUrl } from '@glw907/cairn-cms/delivery';
import { site, posts, ORIGIN } from '$chassis/content';

export const prerender = true;

// The concept entries (`site.all()`) plus this site's bespoke routes: /archives, /tags, and
// /contact. None of those three are concept entries, so the site resolver cannot see them; they
// are added here by hand, same as one page per live tag. `pages/home` is EXCLUDED from `site.all()`
// below: its own permalink (/home) is now a redirect target (backlog #17), not a canonical URL, so
// the real home (`/`) is listed once, above, instead. `/waiver` is gone entirely (a 301 to
// /training now, not a live page); /training and /talkeetna are still pages-concept entries
// (excluded only from the [...path] catch-all's own prerender list, not from the site resolver),
// so `site.all()` below still surfaces them once each even though bespoke routes render them.
export const GET: RequestHandler = () => {
  const urls: SitemapUrl[] = [
    { loc: ORIGIN + '/' },
    { loc: ORIGIN + '/archives' },
    { loc: ORIGIN + '/tags' },
    { loc: ORIGIN + '/contact' },
    ...posts.allTags().map(({ tag }) => ({ loc: `${ORIGIN}/tags/${tag}` })),
    ...site
      .all()
      .filter((s) => !(s.concept === 'pages' && s.id === 'home'))
      .map((s) => ({ loc: ORIGIN + s.permalink, ...(s.date ? { lastmod: s.date } : {}) })),
  ];
  return sitemapResponse(urls);
};
