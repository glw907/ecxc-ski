import type { PageServerLoad } from './$types';
import { buildLinkResolver } from '@glw907/cairn-cms/delivery';
import { posts, pages, site } from '$lib/content';
import { cairn, publicMediaResolver } from '$lib/cairn.config';
import { deriveHeroImage } from '$lib/hero-image';

// ECXC's home is a content entry (pages/home.md, permalink /home), not the archive front page
// Waymark ships by default: the site is mostly static pages, not a blog, so the masthead reads
// the editable welcome copy instead of the generic siteConfig.description. /home itself 301s to
// / (the redirect route), so this is the one place that entry's body actually renders. The
// composition (the hero-grid welcome panel, the recent-posts card, the News & Updates section) is
// the pre-rebuild site's own structural device, per the structural-device catalogue.
//
// The News & Updates section leads with the newest post's FULL rendered body (the pre-rebuild
// site's own choice: the home page is the front door for an announcement, not just a teaser), so
// this route reads that entry's body directly and renders it the same way the welcome copy does,
// rather than reading only the cheap ContentSummary excerpt every other post in the list uses.
export const load: PageServerLoad = async () => {
  const home = pages.byId('home');
  const resolve = buildLinkResolver(site);
  const welcomeHtml = home ? await cairn.rendering.render({ body: home.body, concept: 'pages', resolve }) : '';
  const heroImage = home ? deriveHeroImage(home.frontmatter, publicMediaResolver) : undefined;

  const allPosts = [...posts.all()].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const latest = allPosts[0];
  const latestEntry = latest ? posts.byId(latest.id) : undefined;
  const featuredHtml = latestEntry
    ? await cairn.rendering.render({ body: latestEntry.body, concept: 'posts', resolve })
    : '';

  return { posts: allPosts, featuredHtml, welcomeHtml, heroImage };
};
