import type { PageServerLoad, EntryGenerator } from './$types';
import { createPublicRoutes } from '@glw907/cairn-cms/delivery';
import { site, ORIGIN, SITE_DESCRIPTION } from '$chassis/content';
import { cairn, publicMediaResolver, mediaEnabled, siteConfig } from '$theme/cairn.config';

export const prerender = true;

const routes = createPublicRoutes({
  site,
  render: cairn.rendering.render,
  origin: ORIGIN,
  siteName: siteConfig.siteName,
  description: SITE_DESCRIPTION,
  feeds: { rss: ORIGIN + '/feed.xml', json: ORIGIN + '/feed.json' },
  // The same resolver the body render path uses, so the read path resolves a frontmatter `image`
  // hero into the `heroImage` projection the template and the SEO head read.
  resolveMedia: publicMediaResolver,
  // Arms the engine's media.resolver_absent diagnostic: with media on, dropping resolveMedia above
  // logs a warning instead of silently shipping a broken hero image.
  assetsEnabled: mediaEnabled,
});

// 'training' and 'talkeetna' are still pages-concept entries (so `site.byPermalink` and
// `site.all()` still resolve/list them), but their own bespoke routes
// (src/routes/(site)/training, src/routes/(site)/talkeetna) render them now, since each hosts a
// live registration form that cannot prerender. Prerendering them again here through this
// catch-all would try to emit the same output paths a second time and fail the build.
const SHADOWED_PAGE_ENTRIES = new Set(['training', 'talkeetna']);

export const entries: EntryGenerator = () =>
  routes.entries().filter(({ path }) => !SHADOWED_PAGE_ENTRIES.has(path));

export const load: PageServerLoad = async ({ url }) => {
  return routes.entryLoad({ url });
};
