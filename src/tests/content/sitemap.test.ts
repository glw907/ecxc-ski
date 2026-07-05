import { describe, it, expect } from 'vitest';
import { GET } from '../../routes/sitemap.xml/+server';
import { posts, site } from '$lib/content';

/** Pull every `<loc>` value out of a sitemap XML document, in document order. */
function locsOf(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

// The route ignores its RequestEvent entirely (`GET: RequestHandler = () => {...}`), so a test
// call needs no real event. `RequestHandler`'s declared arity still requires one, hence this cast.
const get = GET as unknown as () => Response;

describe('the sitemap', () => {
  it('carries the five bare site-owned routes, one page per live tag, and every content entry but /home', async () => {
    const xml = await get().text();
    const locs = locsOf(xml);

    const bare = [
      'https://ecxc.ski/',
      'https://ecxc.ski/archives',
      'https://ecxc.ski/tags',
      'https://ecxc.ski/contact',
      'https://ecxc.ski/waiver',
    ];
    for (const url of bare) expect(locs).toContain(url);

    const tagUrls = posts.allTags().map(({ tag }) => `https://ecxc.ski/tags/${tag}`);
    for (const url of tagUrls) expect(locs).toContain(url);

    const contentUrls = site
      .all()
      .filter((entry) => entry.permalink !== '/home')
      .map((entry) => `https://ecxc.ski${entry.permalink}`);
    for (const url of contentUrls) expect(locs).toContain(url);

    expect(locs).not.toContain('https://ecxc.ski/home');
    expect(locs.length).toBe(bare.length + tagUrls.length + contentUrls.length);
  });
});
