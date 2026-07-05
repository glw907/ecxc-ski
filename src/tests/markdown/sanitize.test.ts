import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '$lib/markdown/render';

// The engine render applies the sanitize floor itself (after rehype-raw, before the component
// dispatch). ECXC extends that floor with one author attribute (ariaLabel) via ecSanitizeSchema.
// These tests render real content through renderMarkdown and assert the floor strips hostile
// markup while keeping the author HTML ECXC relies on. The registry-dependent assertions (the
// card directive's classes, the download-link-to-btn promotion inside :::cta) moved out with the
// pre-rebuild registry; Task 2 of the rebuild-from-Waymark plan restores their coverage against
// the rationalized registry.
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

  it('keeps an authored anchor and its target, and hardens rel to noopener noreferrer', async () => {
    const out = await renderMarkdown('<a href="/waiver" target="_blank" style="position:fixed">Get it</a>\n');
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
