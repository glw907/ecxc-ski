import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '$lib/markdown/render';

describe('pipeline baseline', () => {
  it('renders unmarked content as plain prose', async () => {
    const html = await renderMarkdown('Just a paragraph.\n');
    expect(html.trim()).toBe('<p>Just a paragraph.</p>');
  });

  it('adds slug ids to headings', async () => {
    const html = await renderMarkdown(':::card[Sign Up]{icon="path"}\nx\n:::\n');
    expect(html).toContain('id="sign-up"');
  });
});

describe('card directive', () => {
  it('renders a module card with icon + heading + body', async () => {
    const html = await renderMarkdown(':::card[What we do]{icon="path"}\nBody text.\n:::\n');
    expect(html).toContain('<section class="card ec-card bg-base-100 border border-base-300 shadow-sm"');
    expect(html).toContain('<div class="card-body">');
    expect(html).toContain('<div class="ec-head"><span class="ec-icon"><svg class="ec-glyph"');
    expect(html).toContain('<h2 class="card-title"');
    expect(html).toContain('What we do');
    expect(html).toContain('<div class="section-body"><p>Body text.</p></div>');
  });

  it('applies the secondary role to the icon', async () => {
    const html = await renderMarkdown(':::card[Who]{icon="users-three" role="secondary"}\nx\n:::\n');
    expect(html).toContain('<span class="ec-icon ec-icon-secondary">');
  });

  it('stamps the first primitive with the data-rise ordinal 0', async () => {
    const html = await renderMarkdown(':::card[A]{icon="path"}\nx\n:::\n');
    expect(html).toContain('data-rise="0"');
    expect(html).not.toContain('style=');
  });

  it('leaves a non-grid card list as a plain list', async () => {
    const html = await renderMarkdown(':::card[A]{icon="path"}\n- one\n- two\n:::\n');
    expect(html).toContain('<ul>\n<li>one</li>');
    expect(html).not.toContain('ec-grid');
  });
});

describe('passage directive', () => {
  it('renders a titled prose passage with no card chrome', async () => {
    const html = await renderMarkdown(':::passage[Why we use it]{icon="chat-circle"}\nReasons.\n:::\n');
    expect(html).toContain('<section class="ec-passage" data-rise="0">');
    expect(html).toContain('<div class="ec-head"><span class="ec-icon"><svg');
    expect(html).toContain('<h2 class="card-title"');
    expect(html).toContain('<div class="section-body"><p>Reasons.</p></div>');
    expect(html).not.toContain('ec-card');
  });
});

describe('alert directive', () => {
  it('renders a subtle caution alert with the icon inline in the label', async () => {
    const html = await renderMarkdown(':::alert[Risks]{role="caution"}\nFalls happen.\n:::\n');
    expect(html).toContain('<div role="alert" class="ec-alert ec-alert-caution" data-rise="0">');
    expect(html).toContain('<div class="ec-alert-body">');
    expect(html).toContain('<h2 id="risks"><svg class="ec-glyph"');
    expect(html).toContain('Risks</h2>');
    expect(html).toContain('<p>Falls happen.</p>');
    expect(html).not.toContain('card-title');
  });
});

describe('grid directive', () => {
  it('renders a grid card: heading + body list becomes ec-grid', async () => {
    const html = await renderMarkdown(
      ':::grid[Philosophy]{icon="compass"}\nIntro.\n\n- **One** a\n- **Two** b\n:::\n',
    );
    expect(html).toContain('<section class="card ec-card');
    expect(html).toContain('<div class="ec-head"><span class="ec-icon"><svg');
    expect(html).toContain('<div class="section-body"><p>Intro.</p>');
    expect(html).toContain('<ul class="ec-grid">');
    expect(html).toContain('<li><strong>One</strong> a</li>');
  });

  it('lifts a nested grid (no heading) to a bare ec-grid list', async () => {
    const html = await renderMarkdown(
      '::::card[Camp]{icon="tent"}\n### Logistics\n\n:::grid\n- **Travel** by car\n:::\n::::\n',
    );
    expect(html).toContain('<h3 id="logistics">Logistics</h3>');
    expect(html).toContain('<ul class="ec-grid"><li><strong>Travel</strong> by car</li></ul>');
    expect(html.match(/ec-card/g)?.length).toBe(1); // the nested grid did not become its own card
  });
});

describe('cta directive', () => {
  it('renders a compact CTA card with an icon-and-title head row and promotes the download link', async () => {
    const html = await renderMarkdown(
      ':::cta[Getting started]{icon="flag"}\nDo this.\n\n<a href="/waiver" class="download-link">Get it →</a>\n:::\n',
    );
    expect(html).toContain('<section class="card ec-card ec-cta" data-rise="0">');
    expect(html).toContain('<div class="ec-cta-head"><span class="ec-icon"><svg class="ec-glyph"');
    expect(html).toContain('<h2 class="card-title"');
    expect(html).toContain('class="download-link btn btn-primary"');
  });
});

describe('split + panel directives', () => {
  it('renders a card with a heading and two iconned panels', async () => {
    const html = await renderMarkdown(
      '::::split[Costs]\n:::panel[]{icon="hand-coins"}\n**Free.** No fee.\n:::\n\n:::panel[]{icon="handshake" role="secondary"}\n**Help.** Pitch in.\n:::\n::::\n',
    );
    expect(html).toContain('<section class="card ec-card');
    expect(html).toContain('<div class="ec-head"><h2 class="card-title"'); // head has no icon
    expect(html).toContain('<div class="section-body"><div class="ec-split">');
    expect(html).toContain('<div class="ec-panel"><span class="ec-icon"><svg');
    expect(html).toContain('<div class="ec-panel"><span class="ec-icon ec-icon-secondary"><svg');
    expect(html).toContain('<strong>Free.</strong> No fee.');
  });
});

describe('prose colons are not parsed as directives', () => {
	it('renders a time range verbatim', async () => {
		const html = await renderMarkdown('We train 4:00–6:00 PM.\n');
		expect(html.trim()).toBe('<p>We train 4:00–6:00 PM.</p>');
	});

	it('renders a single clock time verbatim', async () => {
		const html = await renderMarkdown('Meet at 9:30 sharp.\n');
		expect(html.trim()).toBe('<p>Meet at 9:30 sharp.</p>');
	});

	it('restores a word-form text directive to literal text', async () => {
		const html = await renderMarkdown('Word :foo here.\n');
		expect(html.trim()).toBe('<p>Word :foo here.</p>');
	});

	it('leaves real container directives working alongside colons', async () => {
		const html = await renderMarkdown(':::card[Schedule]{icon="path"}\nWe meet 4:00–6:00 PM.\n:::\n');
		expect(html).toContain('<h2 class="card-title"');
		expect(html).toContain('<div class="section-body"><p>We meet 4:00–6:00 PM.</p></div>');
	});
});
