// The full post archive, a site-owned route (not a cairn concept entry). Reads the same `posts`
// index the home page and the feeds read, so a post can never drift between the listings.
import type { PageServerLoad } from './$types';
import { extractVocabulary } from '@glw907/cairn-cms';
import { posts } from '$chassis/content';
import { siteConfig } from '$theme/cairn.config';

export const prerender = true;

export const load: PageServerLoad = () => {
  const labels = Object.fromEntries(extractVocabulary(siteConfig).map((entry) => [entry.value, entry.label]));
  return {
    posts: posts.all(),
    labels,
    // The tag-filter chip row (Task 4 of the chassis-restructure plan restores it): every tag in
    // use, with its post count, each linking to its own `/tags/[tag]` page. Reads the same
    // allTags() call the /tags index page already makes.
    tags: posts.allTags().map(({ tag, count }) => ({ tag, label: labels[tag] ?? tag, count })),
  };
};
