// wrapCtaPanels (render/cta-panel.ts), the post-processing step that groups a heading and its
// lead-in copy with the cta directive's own button into one `.cta-panel`, the frame
// ecxc-theme.css cards for the framed-neutral-CTA-cards pick.
import { describe, it, expect } from 'vitest';
import { wrapCtaPanels } from '../../theme/render/cta-panel.js';

const cta = '<p class="cta"><a class="cta-link cta-primary" href="/join">Join<svg></svg></a></p>';

describe('wrapCtaPanels', () => {
  it('groups a heading and one lead-in paragraph with the button', async () => {
    const html = `<h3>Getting started</h3><p>Sign up in CrewLAB.</p>${cta}`;
    const out = await wrapCtaPanels(html);
    expect(out).toContain('<div class="cta-panel"><h3>Getting started</h3><p>Sign up in CrewLAB.</p>');
    expect(out).toContain(cta);
    // Grouped into the same wrapper, not left as siblings of it.
    expect(out.indexOf('</div>')).toBeGreaterThan(out.indexOf(cta));
  });

  it('groups a heading and several lead-in paragraphs, matching training.md\'s own shape', async () => {
    const html = `<h3>Your first day</h3><p>First.</p><p>Second.</p>${cta}`;
    const out = await wrapCtaPanels(html);
    expect(out).toBe(`<div class="cta-panel"><h3>Your first day</h3><p>First.</p><p>Second.</p>${cta}</div>`);
  });

  it('leaves a lone cta with no heading untouched', async () => {
    const html = `<p>Some copy with no heading before it.</p>${cta}`;
    const out = await wrapCtaPanels(html);
    expect(out).toBe(html);
  });

  it('does not group across another component standing between the heading and the button', async () => {
    const html = `<h3>Gear</h3><ul><li>Skis</li></ul>${cta}`;
    const out = await wrapCtaPanels(html);
    expect(out).toBe(html);
  });

  it('wraps two independent CTA moments in the same document, each on its own', async () => {
    const html = `<h3>First</h3><p>Copy one.</p>${cta}<h3>Second</h3><p>Copy two.</p>${cta}`;
    const out = await wrapCtaPanels(html);
    expect(out).toBe(
      `<div class="cta-panel"><h3>First</h3><p>Copy one.</p>${cta}</div>` +
        `<div class="cta-panel"><h3>Second</h3><p>Copy two.</p>${cta}</div>`,
    );
  });
});
