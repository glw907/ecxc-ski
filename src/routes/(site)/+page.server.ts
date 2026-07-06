import type { PageServerLoad } from './$types';
import { postList, posts, pages, linkResolver } from '$lib/content';
import { cairn } from '$lib/cairn.config';

export const load: PageServerLoad = async () => {
  const list = postList();
  const first = list[0];
  const home = pages.byId('home');
  const welcomeHtml = home ? await cairn.render(home.body, { resolve: linkResolver }) : '';
  const featured = first
    ? {
        permalink: first.permalink,
        title: first.title,
        date: first.date,
        tags: first.tags,
        html: await cairn.render(posts.byId(first.id)!.body, { resolve: linkResolver }),
      }
    : null;
  return { posts: list, featured, welcomeHtml };
};
