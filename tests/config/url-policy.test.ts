import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { parseSiteConfig, urlPolicyFrom } from '@glw907/cairn-cms';

// Parse the real YAML straight off disk, so the test proves the committed config
// rather than any build-time import wiring.
const yaml = readFileSync(new URL('../../src/lib/site.config.yaml', import.meta.url), 'utf8');
const policy = urlPolicyFrom(parseSiteConfig(yaml));

describe('posts URL policy', () => {
  it('declares month-granularity dated posts', () => {
    expect(policy.posts?.datePrefix).toBe('month');
  });

  it('declares the dated permalink that matches the current route', () => {
    expect(policy.posts?.permalink).toBe('/:year/:month/:slug');
  });
});
