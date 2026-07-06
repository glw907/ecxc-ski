import { describe, it, expect } from 'vitest';
import { extractVocabulary } from '@glw907/cairn-cms';
import { cairn, siteConfig } from '$theme/cairn.config';

// The adapter's own shape, pinned so a later pass cannot silently drift the URL contract or the
// curated tag vocabulary while rationalizing the site's directive registry (Task 2's job).
describe('the ecxc adapter', () => {
  it('declares month-granularity dated posts at the current route shape', () => {
    expect(cairn.content.posts.datePrefix).toBe('month');
    expect(cairn.content.posts.permalink).toBe('/:year/:month/:slug');
  });

  it('declares an undated pages concept keyed by its own id', () => {
    expect(cairn.content.pages.routing).toBe('page');
    expect(cairn.content.pages.dir).toBe('src/content/pages');
  });

  it('curates the six ecxc tag values as the site vocabulary', () => {
    expect(extractVocabulary(siteConfig).map((entry) => entry.value)).toEqual([
      'training',
      'racing',
      'results',
      'events',
      'camp',
      'announcements',
    ]);
  });
});
