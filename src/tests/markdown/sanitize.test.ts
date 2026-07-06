import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '$lib/markdown/render';

// The engine render now applies the sanitize floor itself (after rehype-raw, before the
// component dispatch). ECXC extends that floor with one author attribute (ariaLabel) via
// ecSanitizeSchema. These tests render real content through renderMarkdown and assert the floor
// strips hostile markup while keeping the directive output and the author HTML ECXC relies on.

describe('engine sanitize floor (ECXC schema)', () => {
  it('drops a script and an event-handler attribute in authored raw HTML', async () => {
    const out = await renderMarkdown('Intro.\n\n<p onclick="x()">hi</p>\n\n<script>alert(1)</script>\n');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('onclick');
    expect(out).toContain('hi');
  });

  it('drops a javascript: URL on an authored anchor', async () => {
    const out = await renderMarkdown('<a href="javascript:alert(1)">x</a>\n');
    expect(out).not.toContain('javascript:');
  });

  it('keeps the directive output: the card section, its classes, and the data-rise ordinal', async () => {
    const out = await renderMarkdown(':::card[What we do]{icon="path"}\nBody.\n:::\n');
    expect(out).toContain('<section class="card ec-card bg-base-100 border border-base-300 shadow-sm"');
    expect(out).toContain('data-rise="0"');
  });

  it('keeps an authored download-link anchor and its target, and hardens rel to noopener noreferrer', async () => {
    const out = await renderMarkdown(
      ':::cta[Getting started]{icon="flag"}\nDo this.\n\n<a class="download-link" href="/waiver" target="_blank" style="position:fixed">Get it →</a>\n:::\n',
    );
    expect(out).toContain('class="download-link btn btn-primary"');
    expect(out).toContain('href="/waiver"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
    // style is not in the floor allowlist, so the author's inline style drops.
    expect(out).not.toContain('style=');
  });

  it('keeps the page-toc nav aria-label that ecSanitizeSchema admits', async () => {
    const out = await renderMarkdown(
      '<nav class="page-toc" aria-label="On this page"><a href="#x">X</a></nav>\n',
    );
    expect(out).toContain('<nav');
    expect(out).toContain('class="page-toc"');
    expect(out).toContain('aria-label="On this page"');
  });
});
