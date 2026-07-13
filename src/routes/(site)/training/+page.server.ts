// The Training route is bespoke, not the [...path] catch-all, since it hosts a live
// registration form (RegistrationForm.svelte) that posts through a remote function and so
// cannot prerender. It still loads the 'training' pages-concept entry through the same
// createPublicRoutes surface the catch-all uses ([...path]/+page.server.ts), wired from the
// identical deps (site, cairn.rendering.render, the media resolver), so admin edits to the
// page's editorial content stay live here and the entry's rendered html/seo/hero shape
// matches every other content page exactly.
import type { PageServerLoad } from './$types';
import { createPublicRoutes } from '@glw907/cairn-cms/delivery';
import { site, ORIGIN, SITE_DESCRIPTION } from '$chassis/content';
import { cairn, publicMediaResolver, mediaEnabled, siteConfig } from '$theme/cairn.config';

export const prerender = false;

const routes = createPublicRoutes({
  site,
  render: cairn.rendering.render,
  origin: ORIGIN,
  siteName: siteConfig.siteName,
  description: SITE_DESCRIPTION,
  feeds: { rss: ORIGIN + '/feed.xml', json: ORIGIN + '/feed.json' },
  resolveMedia: publicMediaResolver,
  assetsEnabled: mediaEnabled,
});

export const load: PageServerLoad = async ({ url }) => {
  return routes.entryLoad({ url });
};
