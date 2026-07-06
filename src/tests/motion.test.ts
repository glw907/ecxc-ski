import { describe, it, expect } from 'vitest';
import { riseStyle } from '$lib/motion';

describe('riseStyle', () => {
  it('staggers the first module at 0.16s', () => {
    expect(riseStyle(0)).toBe('--rise:0.16s');
  });

  it('steps each subsequent module by 0.04s', () => {
    expect(riseStyle(1)).toBe('--rise:0.20s');
    expect(riseStyle(2)).toBe('--rise:0.24s');
  });

  it('keeps two decimal places', () => {
    expect(riseStyle(11)).toBe('--rise:0.60s');
  });
});
