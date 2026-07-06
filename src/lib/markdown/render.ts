import { createRenderer } from '@glw907/cairn-cms';
import { ecxcRegistry } from './components';
import { ecSanitizeSchema } from './sanitize';

// The render pipeline now lives in cairn-core; this composes it from ECXC's
// component registry. `stagger` makes the engine stamp a `data-rise` ordinal on each
// top-level module, which the page CSS maps to the entrance-cascade delay. `sanitizeSchema`
// extends the engine sanitize floor with the one author raw-HTML attribute ECXC needs.
// The exported names are kept for back-compat: callers use renderMarkdown.
const renderer = createRenderer(ecxcRegistry, { stagger: true, sanitizeSchema: ecSanitizeSchema });

/** remark plugins (directive syntax → stamped EC directive nodes). */
export const remarkEcPlugins = renderer.remarkPlugins;
/** rehype plugins (raw passthrough, EC primitive dispatch, heading slugs). */
export const rehypeEcPlugins = renderer.rehypePlugins;
export const renderMarkdown = renderer.renderMarkdown;
