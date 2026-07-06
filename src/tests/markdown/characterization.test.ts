import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { renderMarkdown } from '$lib/markdown/render';

const PAGES_DIR = 'src/content/pages';
const POSTS_DIR = 'src/content/posts';

function bodies(dir: string): [string, string][] {
	return readdirSync(dir)
		.filter((f) => f.endsWith('.md'))
		.map((f) => [f, matter(readFileSync(join(dir, f), 'utf8')).content]);
}

describe('characterization: current rendered HTML is preserved', () => {
	for (const [name, body] of [...bodies(PAGES_DIR), ...bodies(POSTS_DIR)]) {
		it(`renders ${name} identically`, async () => {
			expect(await renderMarkdown(body)).toMatchSnapshot();
		});
	}
});
