// ECXC's render pipeline, composed from cairn-core. The registry is empty pending Task 2 of the
// rebuild-from-Waymark plan (directive rationalization); see the header comment on cairn.config.ts
// for why the pre-rebuild registry could not carry forward unmodified. `sanitizeSchema` extends the
// engine's sanitize floor with the one author raw-HTML attribute ECXC's content still uses.
import { createRenderer, defineRegistry } from '@glw907/cairn-cms';
import { ecSanitizeSchema } from './sanitize.js';

const renderer = createRenderer(defineRegistry({ components: [] }), { sanitizeSchema: ecSanitizeSchema });

/** Render a post/page body to sanitized HTML. Pass opts.resolve to rewrite cairn: links. */
export const renderMarkdown = renderer.renderMarkdown;
