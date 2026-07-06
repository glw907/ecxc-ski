// ecxc.ski's renderer, composed once from the engine. The registry is the site's own
// component vocabulary (markdown/components.ts): Waymark's alert/cta/faq/callout shapes plus
// the site-declared passage/aside/checklist and training domain set. The engine still supplies
// remark-gfm, the sanitize floor, heading slugs, anchor hardening, cairn: link resolution
// through opts.resolve, and the default table-scroll wrap. The public catch-all page, the
// feeds, and the admin preview all call this one renderer, so the editor preview matches the
// published page.
import { createRenderer } from '@glw907/cairn-cms';
import { ecxcRegistry } from './markdown/components.js';

export const registry = ecxcRegistry;

const renderer = createRenderer(registry);

/** Render a post or page body to sanitized HTML. Pass opts.resolve to rewrite cairn: links. */
export const renderMarkdown = renderer.renderMarkdown;
