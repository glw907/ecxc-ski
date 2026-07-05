import type { RequestHandler } from './$types';
import { rssResponse } from '@glw907/cairn-cms/delivery';
import { feedItems, ORIGIN } from '$lib/content';
import { SITE_TITLE, SITE_DESCRIPTION, SITE_AUTHOR } from '$lib/config';

export const prerender = true;

export const GET: RequestHandler = async () => {
  return rssResponse(
    {
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      siteUrl: ORIGIN,
      feedUrl: ORIGIN + '/feed.xml',
      author: { name: SITE_AUTHOR },
    },
    await feedItems(),
  );
};
