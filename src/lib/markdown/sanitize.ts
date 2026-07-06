import type { Schema } from 'hast-util-sanitize';

/** Extend the engine sanitize floor with the attributes ECXC's author raw HTML needs. The
 *  engine floor runs before the component dispatch, so the built section/svg/role markup is
 *  trusted and already excluded from sanitization; this only adds what authored raw HTML uses. */
export function ecSanitizeSchema(floor: Schema): Schema {
  return {
    ...floor,
    attributes: {
      ...floor.attributes,
      '*': [...(floor.attributes?.['*'] ?? []), 'ariaLabel'],
    },
  };
}
