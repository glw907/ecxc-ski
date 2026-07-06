// One tag's posts, a site-owned route (not a cairn concept entry). ecxc's permalink contract
// carries no trailing slash (docs/architecture.md), unlike the 907 site this pattern was ported
// from, so this route keeps the default `trailingSlash` rather than the borrowed `'always'`,
// which would have 307-redirected every crawled `/tags/<tag>` URL away from its live permalink.
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { extractVocabulary } from '@glw907/cairn-cms';
import { posts } from '$lib/content';
import { siteConfig } from '$lib/cairn.config';

export const prerender = true;

export const entries: EntryGenerator = () => posts.allTags().map(({ tag }) => ({ tag }));

export const load: PageServerLoad = ({ params }) => {
  const list = posts.byTag(params.tag);
  if (list.length === 0) error(404, 'Tag not found');
  const labels = Object.fromEntries(extractVocabulary(siteConfig).map((entry) => [entry.value, entry.label]));
  return { tag: params.tag, label: labels[params.tag] ?? params.tag, posts: list, labels };
};
