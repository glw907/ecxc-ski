import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '$lib/markdown/render';
import { ecxcRegistry } from '$lib/markdown/components';

describe('ecxcRegistry', () => {
	it('registers the primitives in document order', () => {
		expect(ecxcRegistry.names).toEqual([
			'card', 'grid', 'alert', 'cta', 'split', 'panel', 'passage', 'aside', 'section',
			'programs', 'program', 'week', 'day', 'spectrum', 'zone', 'gallery',
			'checklist', 'faq',
		]);
	});

	// The custom ec-figure component was dropped in the cairn 0.57.0 cutover because cairn reserves the
	// `figure` directive name (its built-in remarkFigure owns it). No ecxc content uses `:::figure`, and
	// the engine's figure behavior is covered by cairn's own suite, so the site no longer tests it.

	it('wraps a :::gallery body in an ec-gallery container', async () => {
		const html = await renderMarkdown(':::gallery[Camp]\n![One](/a.webp)\n![Two](/b.webp)\n:::\n');
		expect(html).toContain('<div class="ec-gallery"');
		expect(html).toContain('/a.webp');
		expect(html).toContain('/b.webp');
	});

	it('builds a :::card into a section.card.ec-card with an ec-head + card-title', async () => {
		const html = await renderMarkdown(':::card[Title]{icon="flag"}\nBody\n:::\n');
		expect(html).toContain('<section class="card ec-card');
		expect(html).toContain('ec-head');
		expect(html).toContain('card-title');
	});

	it('builds an :::aside into a semantic aside.ec-aside with the body', async () => {
		const html = await renderMarkdown(':::aside[Spenst]{icon="info"}\nExplosive, plyometric work.\n:::\n');
		expect(html).toContain('<aside class="ec-aside"');
		expect(html).toContain('Explosive, plyometric work.');
	});

	it('builds a titleless :::aside without an h2', async () => {
		const html = await renderMarkdown(':::aside\nA quick note.\n:::\n');
		expect(html).toContain('<aside class="ec-aside"');
		expect(html).not.toContain('<h2');
	});

	it('gives every component a group, an icon, and a preview', () => {
		for (const def of ecxcRegistry.defs) {
			expect(def.group, `${def.name} group`).toBeTruthy();
			expect(def.icon, `${def.name} icon`).toBeTruthy();
			expect(def.preview, `${def.name} preview`).toBeTruthy();
		}
	});

	it('hides exactly the four nested-only components from the catalog', () => {
		const hidden = ecxcRegistry.defs.filter((d) => d.hidden).map((d) => d.name);
		expect(hidden.sort()).toEqual(['day', 'panel', 'program', 'zone']);
	});

	it('only references declared attributes and slots in every preview', () => {
		for (const def of ecxcRegistry.defs) {
			const declaredAttrs = new Set((def.attributes ?? []).map((a) => a.key));
			for (const key of Object.keys(def.preview?.attributes ?? {})) {
				expect(declaredAttrs.has(key), `${def.name} preview attr ${key}`).toBe(true);
			}
			const declaredSlots = new Set((def.slots ?? []).map((s) => s.name));
			for (const name of Object.keys(def.preview?.slots ?? {})) {
				expect(declaredSlots.has(name), `${def.name} preview slot ${name}`).toBe(true);
			}
		}
	});

	it('validates the program href pattern', () => {
		const program = ecxcRegistry.get('program');
		const href = program?.attributes?.find((a) => a.key === 'href');
		expect(href?.pattern?.source).toBe('^(#|/|cairn:|https?://)');
	});
});
