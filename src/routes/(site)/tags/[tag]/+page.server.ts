// One tag's posts, a site-owned route (not a cairn concept entry). `trailingSlash: 'always'`
// matches the permalink contract (`/tags/<tag>/`, trailing slash), which the sitemap and every
// prerendered tag link (the tag index, each post's row) already target.
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { extractVocabulary } from '@glw907/cairn-cms';
import { posts } from '$lib/content';
import { siteConfig } from '$lib/cairn.config';

export const prerender = true;
export const trailingSlash = 'always';

export const entries: EntryGenerator = () => posts.allTags().map(({ tag }) => ({ tag }));

export const load: PageServerLoad = ({ params }) => {
  const list = posts.byTag(params.tag);
  if (list.length === 0) error(404, 'Tag not found');
  const labels = Object.fromEntries(extractVocabulary(siteConfig).map((entry) => [entry.value, entry.label]));
  return { tag: params.tag, label: labels[params.tag] ?? params.tag, posts: list, labels };
};
