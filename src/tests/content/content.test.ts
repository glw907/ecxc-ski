import { describe, it, expect } from 'vitest';
import { postList, postListByTag, posts, site } from '$lib/content';

describe('content layer', () => {
  it('lists posts with the frontmatter description and the engine permalink', () => {
    const list = postList();
    const welcome = list.find((p) => p.id === '2026-05-welcome');
    expect(welcome).toBeDefined();
    expect(welcome!.permalink).toBe('/2026/05/welcome');
    expect(welcome!.slug).toBe('welcome');
    expect(welcome!.date).toBe('2026-05-14');
    expect(typeof welcome!.description).toBe('string');
    expect(welcome!.description.length).toBeGreaterThan(0);
  });

  it('resolves a post permalink to its entry', () => {
    const entry = site.byPermalink('/2026/05/welcome');
    expect(entry?.id).toBe('2026-05-welcome');
    expect(entry?.permalink).toBe('/2026/05/welcome');
    expect(typeof entry?.body).toBe('string');
  });

  it('resolves a page permalink to its entry', () => {
    const entry = site.byPermalink('/about');
    expect(entry?.id).toBe('about');
  });

  it('returns undefined for an unknown path', () => {
    expect(site.byPermalink('/no/such/path')).toBeUndefined();
  });

  it('lists every content permalink for prerender and the sitemap', () => {
    const all = site.all().map((s) => s.permalink);
    expect(all).toContain('/2026/05/welcome');
    expect(all).toContain('/about');
    expect(all).toContain('/training');
  });

  it('exposes tags with counts and posts by tag', () => {
    expect(posts.allTags()).toContainEqual({ tag: 'announcements', count: 1 });
    expect(postListByTag('announcements').some((p) => p.id === '2026-05-welcome')).toBe(true);
  });
});
