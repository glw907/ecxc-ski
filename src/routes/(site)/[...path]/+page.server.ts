import type { PageServerLoad, EntryGenerator } from './$types';
import { createPublicRoutes } from '@glw907/cairn-cms/delivery';
import { site, ORIGIN, SITE_DESCRIPTION } from '$lib/content';
import { cairn, publicMediaResolver, siteConfig } from '$lib/cairn.config';

export const prerender = true;

const routes = createPublicRoutes({
  site,
  render: cairn.rendering.render,
  origin: ORIGIN,
  siteName: siteConfig.siteName,
  description: SITE_DESCRIPTION,
  feeds: { rss: ORIGIN + '/feed.xml', json: ORIGIN + '/feed.json' },
  // The same resolver the render path uses, so a frontmatter hero (once adopted) resolves at
  // delivery. Body media: references resolve through cairn.rendering.render above.
  resolveMedia: publicMediaResolver,
});

export const entries: EntryGenerator = () => routes.entries();

export const load: PageServerLoad = async ({ url }) => {
  const data = await routes.entryLoad({ url });
  // EntryData carries no concept; a dated entry is a post, an undated one a page.
  const concept = data.entry.date ? 'posts' : 'pages';
  return {
    concept,
    slug: data.entry.slug,
    title: data.entry.title,
    date: data.entry.date ?? '',
    tags: data.entry.tags,
    html: data.html,
    seo: data.seo,
  };
};
