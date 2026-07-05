import type { PageServerLoad } from './$types';
import { parseMediaToken } from '@glw907/cairn-cms/media';
import { postList, posts, pages, linkResolver } from '$lib/content';
import { cairn, publicMediaResolver } from '$lib/cairn.config';

// The hero photo, migrated into the media library (Task 4 of the rebuild-from-Waymark plan): a
// real R2-backed asset rather than a static path, resolved the same way a `media:` reference in
// markdown content would be. The token names the entry in content/.cairn/media.json.
const HERO_MEDIA_REF = parseMediaToken('media:ec-xc-hero.eadc978e4f4f3a35')!;

export const load: PageServerLoad = async () => {
  const list = postList();
  const first = list[0];
  const home = pages.byId('home');
  const welcomeHtml = home
    ? await cairn.rendering.render({ body: home.body, resolve: linkResolver })
    : '';
  const featured = first
    ? {
        permalink: first.permalink,
        title: first.title,
        date: first.date,
        tags: first.tags,
        html: await cairn.rendering.render({ body: posts.byId(first.id)!.body, resolve: linkResolver }),
      }
    : null;
  // The hero has no static fallback: it lives only in the media library now, so a resolver miss
  // is a genuine build invariant broken (a stale manifest or a disabled media config), not a
  // recoverable state, and should fail loudly rather than serve a silently stale image.
  const heroSrc = publicMediaResolver(HERO_MEDIA_REF);
  if (!heroSrc) {
    throw new Error('cairn: the hero media reference did not resolve; check content/.cairn/media.json');
  }
  return { posts: list, featured, welcomeHtml, heroSrc };
};
