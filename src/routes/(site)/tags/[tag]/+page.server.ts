import type { PageServerLoad } from './$types';
import { posts, postListByTag } from '$lib/content';
import { error } from '@sveltejs/kit';

export function entries() {
  return posts.allTags().map(({ tag }) => ({ tag }));
}

export const load: PageServerLoad = ({ params }) => {
  const list = postListByTag(params.tag);
  if (list.length === 0) error(404, 'Tag not found');
  return { tag: params.tag, posts: list };
};
