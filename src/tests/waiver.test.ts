import { describe, expect, it } from 'vitest';
import { WAIVER_SECTIONS, WAIVER_HASH, computeWaiverHash } from '$theme/waiver/waiver';

describe('waiver module', () => {
  it('pins the operative text: hash constant matches the recomputed hash', async () => {
    expect(await computeWaiverHash()).toBe(WAIVER_HASH);
  });

  it('every section is complete', () => {
    expect(WAIVER_SECTIONS.length).toBeGreaterThanOrEqual(7);
    for (const s of WAIVER_SECTIONS) {
      expect(s.id).toMatch(/^[a-z]+$/);
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.summary.length).toBeGreaterThan(40);
      expect(s.html.length).toBeGreaterThan(100);
    }
    const ids = WAIVER_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('carries no paper-form placeholders', () => {
    const all = WAIVER_SECTIONS.map((s) => s.summary + s.html).join('');
    expect(all).not.toMatch(/\[camp/i);
    expect(all).not.toMatch(/\[year\]/i);
    expect(all).not.toContain('field-line');
  });

  it('keeps the statutory citations and real dates', () => {
    const all = WAIVER_SECTIONS.map((s) => s.html).join('');
    for (const required of [
      '09.65.290',
      '09.65.292',
      'AS 09.80',
      'June 1 through August 19, 2026',
      'July 21 through 24',
      'Talkeetna',
      'reckless or intentional misconduct',
      '18 years of age or older',
    ]) {
      expect(all).toContain(required);
    }
  });
});
