// The tag index, a site-owned route (not a cairn concept entry): every tag in use across the
// posts, labeled from the site's curated vocabulary, linking to its own `/tags/[tag]/` page.
import type { PageServerLoad } from './$types';
import { extractVocabulary } from '@glw907/cairn-cms';
import { posts } from '$chassis/content';
import { siteConfig } from '$theme/cairn.config';

export const prerender = true;

export const load: PageServerLoad = () => {
  const labels = new Map(extractVocabulary(siteConfig).map((entry) => [entry.value, entry.label]));
  const tags = posts.allTags().map(({ tag, count }) => ({ tag, label: labels.get(tag) ?? tag, count }));
  return { tags };
};
