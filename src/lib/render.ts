// ecxc.ski's renderer, composed once from the engine. The registry is empty for now (a later
// pass rationalizes the site's own directive vocabulary through defineComponent). The engine
// still supplies remark-gfm, the sanitize floor, heading slugs, anchor hardening, and cairn:
// link resolution through opts.resolve. The public catch-all page, the feeds, and the admin
// preview all call this one renderer, so the editor preview matches the published page.
import { createRenderer, defineRegistry } from '@glw907/cairn-cms';

export const registry = defineRegistry({ components: [] });

const renderer = createRenderer(registry);

/** Render a post or page body to sanitized HTML. Pass opts.resolve to rewrite cairn: links. */
export const renderMarkdown = renderer.renderMarkdown;
