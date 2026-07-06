import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

function read(path: string): string {
	return readFileSync(path, 'utf-8');
}

describe('brand mark', () => {
	it('ships an SVG favicon', () => {
		expect(existsSync('static/favicon.svg')).toBe(true);
	});

	it('keeps the favicon font-independent', () => {
		expect(read('static/favicon.svg')).not.toContain('<text');
	});

	it('links the SVG favicon from app.html', () => {
		expect(read('src/app.html')).toContain('favicon.svg');
	});

	it('keeps the accessible name on the logo link', () => {
		expect(read('src/lib/components/Nav.svelte')).toContain('aria-label="ECXC home"');
	});

	// The mark is a system of cuts from one generator (docs/design/build-mark.py):
	// the nav carries the four-tile primary, and the favicon embeds the same
	// four tile paths on a spruce field. This pins each cut's shape, the glyph
	// sync, and the cross-references in their comments, so an edit to one
	// flags the other.
	it('keeps the favicon glyphs in sync with the nav mark', () => {
		const nav = read('src/lib/components/Nav.svelte');
		const navMark = nav.match(/<svg class="logo-mark"[\s\S]*?<\/svg>/)?.[0] ?? '';
		expect(navMark.match(/<path d="[^"]+"/g) ?? []).toHaveLength(4);
		expect(nav).toContain('build-mark.py');
		expect(nav).toContain('favicon.svg');

		const favicon = read('static/favicon.svg');
		const glyphs = favicon.match(/<path d="[^"]+"/g) ?? [];
		expect(glyphs).toHaveLength(4);
		for (const glyph of glyphs) {
			expect(navMark).toContain(glyph.trim());
		}
		expect(favicon).toContain('<rect');
		expect(favicon).toContain('Nav.svelte');
	});
});
