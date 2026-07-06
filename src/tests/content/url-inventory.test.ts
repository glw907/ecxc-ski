// The contract: the catch-all serves exactly the URLs the old explicit routes did.
// The "expected" set is rebuilt the OLD way, from raw filenames, independent of the engine.
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { site } from '$lib/content';

function expectedUrls(): string[] {
  const urls: string[] = [];
  for (const f of readdirSync('src/content/posts')) {
    if (!f.endsWith('.md')) continue;
    const stem = f.replace(/\.md$/, '');
    const [year, month, ...slug] = stem.split('-');
    urls.push(`/${year}/${month}/${slug.join('-')}`);
  }
  for (const f of readdirSync('src/content/pages')) {
    if (!f.endsWith('.md')) continue;
    urls.push(`/${f.replace(/\.md$/, '')}`);
  }
  return urls.sort();
}

describe('zero URL movement', () => {
  it('the catch-all serves exactly the old explicit-route URL set', () => {
    expect(
      site
        .all()
        .map((s) => s.permalink)
        .sort(),
    ).toEqual(expectedUrls());
  });
});
