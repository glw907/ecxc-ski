import type { PageServerLoad } from './$types';
import { extractVocabulary } from '@glw907/cairn-cms';
import { buildLinkResolver } from '@glw907/cairn-cms/delivery';
import { posts, pages, site } from '$lib/content';
import { cairn, siteConfig } from '$lib/cairn.config';

export const prerender = true;

// ECXC's home is a content entry (pages/home.md, permalink /home), not the archive front page
// Waymark ships by default: the site is mostly static pages, not a blog, so the masthead reads
// the editable welcome copy instead of the generic siteConfig.description. /home itself 301s to
// / (the redirect route), so this is the one place that entry's body actually renders. The home
// reads its tag-filter options from the site's own committed vocabulary (the {value,label} list),
// so the control labels the slugs editors curate rather than the raw frontmatter tokens.
export const load: PageServerLoad = async () => {
  const home = pages.byId('home');
  const welcomeHtml = home
    ? await cairn.rendering.render({ body: home.body, concept: 'pages', resolve: buildLinkResolver(site) })
    : '';
  return { posts: posts.all(), vocabulary: extractVocabulary(siteConfig), welcomeHtml };
};
