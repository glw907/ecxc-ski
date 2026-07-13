// The Talkeetna Camp route, bespoke for the same reason as /training's own +page.server.ts
// (a live registration form that cannot prerender): see that file's header comment for the
// full rationale. This loads the 'talkeetna' pages-concept entry through the identical
// createPublicRoutes wiring.
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
