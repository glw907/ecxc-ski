// ecxc.ski: the home masthead's hero projection (Task 4 of the rebuild-from-Waymark plan). The
// `(site)/+page.server.ts` route is the one deliberate departure from the generic `[...path]`
// template (Task 2's rationale: the home entry needs its own bespoke layout), so it cannot reach
// `createPublicRoutes`'s internal `deriveHeroImage`. This module re-derives the same projection by
// hand from the two already-public pieces (`parseMediaToken`, a site's own media resolver), reading
// the same `image: { src, alt, caption }` frontmatter shape `fields.image` validates.
import { parseMediaToken, type MediaResolve } from '@glw907/cairn-cms/media';

/** The resolved hero: a delivery URL plus the alt text and optional caption from frontmatter. */
export interface HeroImage {
  url: string;
  alt: string;
  caption?: string;
}

/**
 * Derive the hero projection from a content entry's frontmatter, or `undefined` when no hero is
 *  set, the value is not the validated `{ src, alt, caption }` shape, the `media:` token does not
 *  parse, or the resolver finds no asset (a preview miss or media configured off).
 */
export function deriveHeroImage(
  frontmatter: Record<string, unknown>,
  resolveMedia: MediaResolve,
): HeroImage | undefined {
  const value = frontmatter.image;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const { src, alt, caption } = value as { src?: unknown; alt?: unknown; caption?: unknown };
  if (typeof src !== 'string' || src === '') return undefined;
  const ref = parseMediaToken(src);
  if (!ref) return undefined;
  const url = resolveMedia(ref);
  if (!url) return undefined;
  return {
    url,
    alt: typeof alt === 'string' ? alt : '',
    ...(typeof caption === 'string' && caption !== '' ? { caption } : {}),
  };
}
