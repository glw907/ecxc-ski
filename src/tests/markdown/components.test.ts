import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '$lib/markdown/render';

// The rationalized registry from Task 2 of the rebuild-from-Waymark plan (components.ts). These
// assertions restore the registry-dependent coverage sanitize.test.ts's header comment named: the
// old card/cta shapes are gone, replaced by Waymark's alert/cta/faq, the callout (the old
// grid-with-a-list), the collapsed passage, and the small aside/checklist/domain-set leftovers.
describe('ecxcRegistry', () => {
  it('renders an alert with its role class and default caution icon', async () => {
    const out = await renderMarkdown(':::alert[Heads up]{role="caution"}\nWatch out.\n:::\n');
    expect(out).toContain('class="ec-alert ec-alert-caution"');
    expect(out).toContain('role="alert"');
    expect(out).toContain('Heads up');
    expect(out).toContain('Watch out.');
  });

  it('renders a cta as a download-link-styled button, with newTab adding target/rel', async () => {
    const out = await renderMarkdown(
      ':::cta{label="Join" url="https://example.com/join" newTab="true"}\n:::\n',
    );
    expect(out).toContain('class="cta-link download-link"');
    expect(out).toContain('href="https://example.com/join"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('Join');
  });

  it('accepts a relative or cairn: cta url, which fields.url cannot express', async () => {
    const out = await renderMarkdown(':::cta{label="Sign up" url="/crewlab"}\n:::\n');
    expect(out).toContain('href="/crewlab"');
  });

  it('renders one faq per question, as a native disclosure', async () => {
    const out = await renderMarkdown(
      ':::faq{question="Does this cost anything?"}\nNo.\n:::\n\n:::faq{question="Second?"}\nYes.\n:::\n',
    );
    expect(out).toContain('<details class="ec-faq"');
    expect(out).toContain('<summary class="ec-faq-question">Does this cost anything?</summary>');
    expect(out).toContain('<summary class="ec-faq-question">Second?</summary>');
  });

  it('renders a callout with its points list', async () => {
    const out = await renderMarkdown(
      '::::callout[Title]{tone="note"}\nIntro.\n\n:::points\n- First point\n- Second point\n:::\n::::\n',
    );
    expect(out).toContain('class="ec-callout ec-callout-note"');
    expect(out).toContain('Intro.');
    expect(out).toContain('<ul class="ec-callout-points">');
    expect(out).toContain('First point');
    expect(out).toContain('Second point');
  });

  it('renders a passage with no card chrome', async () => {
    const out = await renderMarkdown(':::passage[Title]{icon="compass"}\nBody copy.\n:::\n');
    expect(out).toContain('class="ec-passage"');
    expect(out).toContain('Body copy.');
    expect(out).not.toContain('ec-card');
  });

  it('renders an aside with its anchor id, for a footnote dagger to target', async () => {
    const out = await renderMarkdown(':::aside[Term]{id="gloss-term"}\nA definition.\n:::\n');
    expect(out).toContain('<aside class="ec-aside" id="gloss-term"');
    expect(out).toContain('class="ec-aside-term"');
  });

  it('renders a checklist, tagging the two-column modifier from cols', async () => {
    const out = await renderMarkdown(':::checklist{cols="2"}\n- Item one\n- Item two\n:::\n');
    expect(out).toContain('class="ec-checklist ec-checklist-2col"');
  });

  it('renders nested program cards inside a programs row', async () => {
    const out = await renderMarkdown(
      '::::programs\n:::program[Summer]{icon="path" href="#summer"}\nBlurb.\n:::\n::::\n',
    );
    expect(out).toContain('class="ec-programs"');
    expect(out).toContain('class="ec-program"');
    expect(out).toContain('href="#summer"');
  });

  it('renders nested schedule days inside a week rail', async () => {
    const out = await renderMarkdown(
      '::::week\n:::day[Mon]{kind="group" time="10:30"}\nFocus.\n:::\n::::\n',
    );
    expect(out).toContain('class="ec-week"');
    expect(out).toContain('class="ec-week-row ec-week-group"');
    expect(out).toContain('10:30');
  });

  it('renders nested zones inside a training-group spectrum', async () => {
    const out = await renderMarkdown(
      '::::spectrum\n:::zone[Foundation]\nWho it is for.\n:::\n::::\n',
    );
    expect(out).toContain('class="ec-spectrum"');
    expect(out).toContain('class="ec-zone"');
    expect(out).toContain('Foundation');
  });
});
