// The full post archive, a site-owned route (not a cairn concept entry). Reads the same `posts`
// index the home page and the feeds read, so a post can never drift between the listings.
import type { PageServerLoad } from './$types';
import { extractVocabulary } from '@glw907/cairn-cms';
import { posts } from '$lib/content';
import { siteConfig } from '$lib/cairn.config';

export const prerender = true;

export const load: PageServerLoad = () => ({
  posts: posts.all(),
  labels: Object.fromEntries(extractVocabulary(siteConfig).map((entry) => [entry.value, entry.label])),
});
