// ecxc.ski's cairn adapter. The site-specific half of the CMS: which repo to commit to, the
// editable concepts and their schema, the directive component registry, and the engine render the
// editor preview mirrors. One defineFields declaration per concept is the single source of truth
// for the editor form, the validator, and the inferred frontmatter type.
import { defineAdapter, defineFields } from '@glw907/cairn-cms';
import { normalizeAssets, makeMediaResolver } from '@glw907/cairn-cms/media';
import { ecxcRegistry } from './markdown/components.js';
import { markdownToHtml } from './utils.js';
import { ICON_PATHS } from './markdown/icons.js';
import { POST_TAGS, siteConfig, siteEmail } from './config.js';
// The ?url import resolves the compiled stylesheet to its served URL (the hashed asset in a
// build), so the editor's preview frame can link the same sheet the (site) layout loads. The
// sheet must stay ?url-only; the (site) layout's header comment explains the chunk-fold trap.
import appCss from '../app.css?url';
// The committed media manifest backs the public media resolver below. A media: reference in a post
// body (or a frontmatter hero) resolves to its /media delivery URL through this. The file starts as
// {} and the admin upload pipeline commits rows into it.
import mediaManifest from '../content/.cairn/media.json';

// The cairnManifest() Vite plugin and the cairn-manifest bin read the adapter and the parsed site
// config off one module. Re-export siteConfig here so this file is that single configModule.
export { siteConfig };

// The default public media resolver. The build render path and the public route both inject it so a
// committed media: reference rewrites to its content-addressed /media URL on the live site; without
// it an inserted image would ship as a bare media: token. The admin preview injects its own resolver
// from the edit page's mediaTargets, so this default only backs the public build.
export const publicMediaResolver = makeMediaResolver(
  mediaManifest,
  normalizeAssets({ bucketBinding: 'MEDIA_BUCKET' }),
);

export const cairn = defineAdapter({
  siteName: siteConfig.siteName ?? 'ECXC',
  content: {
    posts: {
      dir: 'src/content/posts',
      label: 'Posts',
      schema: defineFields([
        { type: 'text', name: 'title', label: 'Title', required: true },
        { type: 'date', name: 'date', label: 'Date', required: true },
        { type: 'textarea', name: 'description', label: 'Description', required: true, rows: 2 },
        { type: 'tags', name: 'tags', label: 'Tags', options: POST_TAGS },
        { type: 'boolean', name: 'draft', label: 'Draft (hidden from the live site)' },
      ]),
    },
    pages: {
      dir: 'src/content/pages',
      label: 'Pages',
      schema: defineFields([{ type: 'text', name: 'title', label: 'Title', required: true }]),
    },
  },
  backend: {
    owner: 'glw907',
    repo: 'ecxc-ski',
    branch: 'main',
    appId: '3847496',
    installationId: '135372268',
  },
  sender: { from: siteEmail.sender ?? 'noreply@ecxc.ski' },
  // Media on: the R2 bucket binding (wrangler.toml) the upload, storage, delivery, and resolver
  // paths read. Cloudflare Images transforms stay off (the default), so the site serves full-size
  // bytes until the zone opts in.
  assets: { bucketBinding: 'MEDIA_BUCKET' },
  // Thread the public media resolver as the default, so a published media: reference resolves on the
  // live site. A per-call resolver (the admin preview's) still wins when supplied.
  render: (md, opts) => markdownToHtml(md, { ...opts, resolveMedia: opts?.resolveMedia ?? publicMediaResolver }),
  registry: ecxcRegistry,
  icons: ICON_PATHS,
  navMenu: {
    configPath: 'src/lib/site.config.yaml',
    menuName: 'primary',
    label: 'Navigation',
    maxDepth: 2,
  },
  // The preview knob. The (site) content region nests main.container > article > div.post-body,
  // where the article class is static-page on pages and post on posts; the frame reproduces it as
  // body (the main classes plus the article class) over one post-body container, and app.css's
  // descendant selectors match both chains the same way. The top level carries the page shape;
  // posts override it to drop static-page (post itself holds only a scoped entrance animation,
  // which the frame deliberately omits).
  preview: {
    stylesheets: [appCss],
    bodyClass: 'container mx-auto px-4 max-w-5xl py-8 static-page',
    containerClass: 'post-body',
    byConcept: {
      posts: {
        bodyClass: 'container mx-auto px-4 max-w-5xl py-8',
        containerClass: 'post-body',
      },
    },
  },
});
