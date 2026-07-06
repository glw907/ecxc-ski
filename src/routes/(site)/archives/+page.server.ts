import type { PageServerLoad } from './$types';
import { postList, posts } from '$lib/content';

export const prerender = true;

export const load: PageServerLoad = () => {
  return { posts: postList(), tags: posts.allTags() };
};
