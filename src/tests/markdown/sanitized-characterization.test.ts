import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { markdownToHtml } from '$lib/utils';

// The public render goes through markdownToHtml, which is now the engine render alone: the engine
// applies its sanitize floor internally (after rehype-raw, before the component dispatch), so there
// is no second site pass. This snapshot pins that public output so a schema change that drops a
// directive element or the download-link anchor shows up as a diff. It complements the
// characterization snapshot, which pins the renderMarkdown output the public path is built on.
const PAGES_DIR = 'src/content/pages';
const POSTS_DIR = 'src/content/posts';

function bodies(dir: string): [string, string][] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => [f, matter(readFileSync(join(dir, f), 'utf8')).content]);
}

describe('characterization: sanitized public HTML is preserved', () => {
  for (const [name, body] of [...bodies(PAGES_DIR), ...bodies(POSTS_DIR)]) {
    it(`renders ${name} (sanitized) identically`, async () => {
      expect(await markdownToHtml(body)).toMatchSnapshot();
    });
  }
});
