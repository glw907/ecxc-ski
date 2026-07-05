// ECXC's render pipeline, composed from cairn-core. `ecxcRegistry` (components.ts) is Task 2 of
// the rebuild-from-Waymark plan's rationalized directive set. `sanitizeSchema` extends the
// engine's sanitize floor with the one author raw-HTML attribute ECXC's content still uses.
import { createRenderer } from '@glw907/cairn-cms';
import { ecxcRegistry } from './components.js';
import { ecSanitizeSchema } from './sanitize.js';

const renderer = createRenderer(ecxcRegistry, { sanitizeSchema: ecSanitizeSchema });

/** Render a post/page body to sanitized HTML. Pass opts.resolve to rewrite cairn: links. */
export const renderMarkdown = renderer.renderMarkdown;
