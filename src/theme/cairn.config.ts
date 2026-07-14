// ecxc.ski's cairn adapter (v2 idiom), rebuilt fresh on the Waymark scaffold. The site-specific
// half of the CMS: which repo to commit to, the editable concepts and their fieldset, the render
// the editor preview mirrors, and the GitHub App identity.
import { defineAdapter, defineConcept, fieldset, fields, githubApp, parseSiteConfig } from '@glw907/cairn-cms';
import { normalizeAssets, makeMediaResolver, readCommittedManifest } from '@glw907/cairn-cms/media';
import { renderMarkdown, registry } from './render.js';
import { wrapScrollableTables } from './render/table-scroll.js';
import { wrapCtaPanels } from './render/cta-panel.js';
import siteYaml from './site.config.yaml?raw';
// The ?url import resolves the compiled stylesheets to their served URLs (the hashed assets in a
// build), so the editor's preview frame can link the same sheets the (site) layout loads. They
// must stay ?url-only; see the header comment in site.css.
import themeCss from './theme.css?url';
import siteCss from './site.css?url';

// The cairn-manifest bin, the cairnManifest() Vite plugin, and cairn-doctor read the adapter and
// the parsed site config off one module. Re-export siteConfig here so this file is that single
// configModule.
export const siteConfig = parseSiteConfig(siteYaml);

// The committed media manifest the public render resolver reads. Starts as {} until an editor
// uploads; a glob with no match returns {} rather than failing the build (unlike a static import
// of an absent file, which fails at build time before any runtime degrade can run).
const mediaManifest = readCommittedManifest(
  import.meta.glob('../content/.cairn/media.json', { eager: true, import: 'default' }),
);

// The default public media resolver, backing the public build over the committed manifest. The
// admin preview injects its own resolver from the edit page's mediaTargets; this default keeps a
// published `media:` reference from throwing when no per-call resolver is supplied.
const resolvedAssets = normalizeAssets({ bucketBinding: 'MEDIA_BUCKET' });
export const publicMediaResolver = makeMediaResolver(mediaManifest, resolvedAssets);

// Whether media is configured on, threaded as `assetsEnabled` to the public catch-all route so the
// engine logs `media.resolver_absent` rather than silently dropping a hero image if a future edit
// forgets to wire resolveMedia while media stays on.
export const mediaEnabled = resolvedAssets.enabled;

export const cairn = defineAdapter({
  content: {
    posts: defineConcept({
      dir: 'src/content/posts',
      label: 'Posts',
      routing: 'feed',
      permalink: '/:year/:month/:slug',
      datePrefix: 'month',
      summaryFields: ['description'],
      fields: fieldset({
        title: fields.text({ label: 'Title', required: true }),
        date: fields.date({ label: 'Date' }),
        // Optional on purpose: post lists and feeds fall back to a body excerpt when it is
        // blank, and requiring it blocked saves for authors who took it to mean the post body.
        description: fields.textarea({
          label: 'Summary',
          help: 'One or two sentences shown in post lists and feeds. Leave blank to use the opening of the post.',
        }),
        // The taxonomy marker: a closed, vocabulary-sourced picker sourced from site.config.yaml's
        // committed `vocabulary` list, surfacing on ContentSummary.tags and the feed categories.
        tags: fields.multiselect({ label: 'Tags', creatable: true, taxonomy: true }),
        draft: fields.boolean({ label: 'Draft (hidden from the live site)' }),
      }),
    }),
    pages: defineConcept({
      dir: 'src/content/pages',
      label: 'Pages',
      routing: 'page',
      fields: fieldset({
        title: fields.text({ label: 'Title', required: true }),
        // The media library's first real placement (Task 4 of the rebuild-from-Waymark plan): a
        // structured hero the editor picks from the library. The [...path] template and the home
        // masthead both derive their leading figure from this same `{ src, alt, caption }` shape.
        image: fields.image({ label: 'Hero image', seo: true }),
      }),
    }),
  },
  backend: githubApp({
    owner: 'glw907',
    repo: 'ecxc-ski',
    branch: 'main',
    appId: '3847496',
    installationId: '135372268',
  }),
  email: { from: 'noreply@ecxc.ski' },
  // The media R2 binding. The fake R2 double rides platform.env in dev; a real site binds it in
  // wrangler.jsonc and mounts the /media delivery route.
  media: { bucketBinding: 'MEDIA_BUCKET' },
  rendering: {
    // The entry-aware render: the editor preview and every public page call this one function.
    // The default media resolver backs the public build; the preview path injects its own. After
    // the engine's own renderMarkdown, two of this theme's own post-processing rehype steps run
    // (createRenderer keeps its internal plugin ordering closed, so a site adds behavior at this
    // HTML-string boundary): wrapScrollableTables wraps every bare markdown table in a scrollable,
    // labeled region, so a table never blows out a narrow viewport (chassis/prose.css's
    // .table-scroll class already expects this wrapper); wrapCtaPanels groups a heading and its
    // lead-in copy with the cta directive's own button into one `.cta-panel`, the frame
    // ecxc-theme.css cards (the framed-neutral-CTA-cards pick).
    render: async ({ body, resolve, resolveMedia }) => {
      const html = await renderMarkdown(body, { resolve, resolveMedia: resolveMedia ?? publicMediaResolver });
      return wrapCtaPanels(await wrapScrollableTables(html));
    },
    components: registry,
  },
  editor: {
    // The header menu, managed from /admin/nav and committed to the site-config YAML.
    nav: { configPath: 'src/theme/site.config.yaml', menuName: 'primary', label: 'Navigation', maxDepth: 2 },
    // The preview knob: the (site) layout renders entries inside <main class="site-main">
    // (site.css), so the frame links the same theme/site sheets and reproduces that container.
    preview: { stylesheets: [themeCss, siteCss], containerClass: 'site-main prose' },
  },
});
