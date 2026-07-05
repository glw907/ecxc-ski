import { describe, it, expect } from 'vitest';
import { deriveHeroImage } from '$lib/hero-image';

// The home masthead's hero projection (Task 4 of the rebuild-from-Waymark plan): a small pure
// function, so it is worth pinning directly rather than only through the built page's rendered
// HTML. A stub resolver stands in for the real R2-backed one.
const resolveMedia = (ref: { hash: string }) => (ref.hash === 'eadc978e4f4f3a35' ? '/media/hero.webp' : undefined);

describe('deriveHeroImage', () => {
  it('resolves a valid image field to a delivery URL, alt, and caption', () => {
    const hero = deriveHeroImage(
      { image: { src: 'media:ec-xc-hero.eadc978e4f4f3a35', alt: 'Skiers racing', caption: 'Race day' } },
      resolveMedia,
    );
    expect(hero).toEqual({ url: '/media/hero.webp', alt: 'Skiers racing', caption: 'Race day' });
  });

  it('drops the caption key when none is set, rather than an empty string', () => {
    const hero = deriveHeroImage(
      { image: { src: 'media:ec-xc-hero.eadc978e4f4f3a35', alt: 'Skiers racing' } },
      resolveMedia,
    );
    expect(hero).toEqual({ url: '/media/hero.webp', alt: 'Skiers racing' });
    expect(hero).not.toHaveProperty('caption');
  });

  it('returns undefined when no image field is set', () => {
    expect(deriveHeroImage({}, resolveMedia)).toBeUndefined();
  });

  it('returns undefined when the src does not parse as a media: token', () => {
    expect(deriveHeroImage({ image: { src: '/images/hero.webp', alt: 'x' } }, resolveMedia)).toBeUndefined();
  });

  it('returns undefined when the resolver finds no asset (a preview miss or media off)', () => {
    expect(
      deriveHeroImage({ image: { src: 'media:missing.0000000000000000', alt: 'x' } }, resolveMedia),
    ).toBeUndefined();
  });
});
