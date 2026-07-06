import type { PageServerLoad } from './$types';
import { posts } from '$lib/content';

export const load: PageServerLoad = () => {
  return { tags: posts.allTags() };
};
