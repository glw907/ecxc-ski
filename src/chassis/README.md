# The chassis

The boundary rule, per cairn-cms's canonical statement
(`examples/showcase/src/chassis/README.md` in the `cairn-cms` repo): **a theme is everything that
isn't chassis.** `src/chassis/` holds the genre-free layer ecxc's theme (living in `src/theme/`,
plus the route files under `src/routes/` that SvelteKit's filesystem routing pins in place) mounts
onto: the plumbing every site needs regardless of what it looks like. Everything outside
`src/chassis/` (the concrete adapter config, the chrome components, the home and article
composition, the theme's color and type values, the site's own directive registry) is the theme's
own content. A theme file reaches chassis only through its exported seams: the `$chassis` alias in
`.ts`/`.svelte` files, or a relative `@import` in a `.css` file (aliases do not resolve in CSS),
always naming one of the files below.

The chassis files here came from `cairn-cms`'s own showcase, the reference site the chassis
boundary was first cut against (verbatim where a file is genuinely site-agnostic; `content.ts`,
`feed.ts`, and `cairn.server.ts` carry the same shape but wire ecxc's own two concepts, `posts` and
`pages`, matching the showcase's own).

## What lives here

| File | What it is |
| --- | --- |
| `content.ts` | The delivery content layer: globs the markdown, builds the site/posts/pages indexes through `createSiteIndexes`. |
| `feed.ts` | Maps the posts index into `cairn-cms/delivery`'s `FeedItem` shape, shared by the RSS and JSON Feed routes. |
| `cairn.server.ts` | The one server-side runtime composition point (`composeRuntime`, `createCairnAdmin`); every server route that needs the runtime imports it from here. |
| `render.ts` | The component-grammar wiring: `makeIconRenderer` turns ecxc's own icon set (`theme/markdown/icons.ts`) into the engine's glyph-rendering helpers; `theme/markdown/components.ts` calls it instead of wiring `iconSpan`/`glyph` by hand. |
| `theme-toggle.ts` | The light/dark toggle mechanism: resolve the active theme, apply a choice, persist it to a cookie. |
| `tokens.css` | The token SYSTEM: Tailwind and the DaisyUI plugin activation, the design-scale keys with generic defaults, and the semantic (code-highlight, ink, elevation, CTA) bindings. |
| `prose.css` | The reading-surface foundation: every prose element bound to tokens, with the signature flourish gestures behind `[data-flourish]`. |
| `composition.css` | The composition primitives: card, band, section, hero, sidebar-layout. Unused in ecxc's current markup, same as in the showcase; a theme reaches for one instead of hand-rolling its own. |

Omitted from this copy, deliberately: `dev-gate.ts` (the showcase's dev-backend feature flag; ecxc
has no dev backend, per `hooks.server.ts`'s own comment). Per the chassis's own subtractability
rule (a developer may drop an unused chassis element with no other seam depending on it), adding it
back is a matter of copying the file from `cairn-cms`'s showcase and wiring its one consumer;
nothing else references it.

The SvelteKit route files that touch delivery plumbing (`feed.xml`, `feed.json`, `sitemap.xml`,
`robots.txt`, `media/[...path]`, `healthz`, the `/admin` mount) stay in `src/routes/`, since
SvelteKit's routing is filesystem-based; they import chassis logic through the `$chassis` alias
(`svelte.config.js`) instead of duplicating it. The same route files reach the theme's own content
(the adapter config, the site config) through a second alias, `$theme` (`src/theme/`), the mirror
image of `$chassis` for everything that is not genre-free.

## Every override seam

**Adapter and delivery wiring.** `content.ts`, `feed.ts`, and `cairn.server.ts` take the theme's own
`cairn.config.ts` adapter (concepts, fields, backend) as input; none of them declares any content
model of its own.

**The token system (`tokens.css`).** Every design-scale key (`--font-*`, `--text-step-*`,
`--spacing-*`, `--leading-*`, `--tracking-*`, `--container-measure*`, `--color-muted`,
`--color-card-border`) is declared inside `@theme` with a generic default. `theme.css` `@import`s
`tokens.css` first, then redeclares the same keys with Waymark's real numbers; `ecxc-theme.css`
layers a second override on top of that (see its own header comment).

**The prose foundation (`prose.css`).** Every element reads a token, so a re-skin carries the
reading surface forward with no edit here. `ecxc-theme.css` overrides three of prose.css's rules
(the body-link color, the callout-points list's card-grid presentation, and the FAQ question's
cursor, since ecxc's own FAQ renders its answer inline rather than behind a `<details>` disclosure)
with ecxc's own pre-restructure look, in plain unlayered CSS that beats prose.css's `@layer
components` rules unconditionally; see that file's own comment for why no `!important` is needed
there.

**Component-grammar wiring (`render.ts`).** `makeIconRenderer(icons)` wires ecxc's own icon set
(`theme/markdown/icons.ts`'s `ICON_PATHS`) into the engine's `iconSpan`/`glyph` helpers;
`theme/markdown/components.ts`'s `build()` functions call the returned function and never import
`iconSpan`/`glyph` directly. Swapping the icon set never touches a component's `build()`.

**The theme-toggle mechanism (`theme-toggle.ts`).** `resolveTheme`/`applyTheme`/`toggleTheme` know
nothing about which two DaisyUI theme names or which cookie name a theme uses; `SiteHeader.svelte`
passes its own `ThemeToggleConfig`.

**Composition primitives (`composition.css`).** `.cairn-card`, `.cairn-band`, `.cairn-section`,
`.cairn-hero`, `.cairn-sidebar-layout`, each exposing its own `--cairn-<primitive>-*` custom
properties for a per-instance override. Adopting one is a theme choice, never a requirement.

## Adding a new primitive or seam

Read this file's boundary rule first: genre-free plumbing and configurable structure belong here; a
specific look, a specific chrome, or a specific content model belongs to the theme.
