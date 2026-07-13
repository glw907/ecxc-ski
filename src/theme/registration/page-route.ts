// The Training and Talkeetna Camp routes are both bespoke, not the [...path] catch-all, since
// each hosts a live registration form (RegistrationForm.svelte) that posts through a remote
// function and so cannot prerender. They still load their pages-concept entry through the same
// createPublicRoutes wiring the catch-all uses (wired from the identical deps: site,
// cairn.rendering.render, the media resolver), so admin edits to either page's editorial content
// stay live and the entry's rendered html/seo/hero shape matches every other content page
// exactly. Shared here so the two routes carry one copy of that wiring instead of two.
import { createPublicRoutes } from '@glw907/cairn-cms/delivery';
import { site, ORIGIN, SITE_DESCRIPTION } from '$chassis/content';
import { cairn, publicMediaResolver, mediaEnabled, siteConfig } from '$theme/cairn.config';

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

/** The `load` both bespoke registration routes export. */
export function loadRegistrationPageEntry({ url }: { url: URL }) {
  return routes.entryLoad({ url });
}
