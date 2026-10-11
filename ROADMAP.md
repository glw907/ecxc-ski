# ROADMAP

> Strategic initiatives. Managed by `/log-project`. Issues tracked in `BACKLOG.md`.

## Active

### ECXC standalone site `ecnordic-standalone`
Build ecnordic.ski as a standalone SvelteKit site forked from 907.life, with a new ECN
theme, to get it live in the near term. Will be migrated into cairn-cms as a site
package once the engine is battle-ready.

### Idiomatic 2026 Exemplar `idiomatic-2026`
Make ecnordic.ski an exemplar of stable 2026 Svelte 5 / SvelteKit / Tailwind v4 /
DaisyUI v5 / TypeScript. The conformance & hardening sweep (pass 7, 2026-05-24) landed
`strProp` typed accessor, typed Pagefind import, `Snippet`-typed children, MCP-verified
idiom, all surfaces output-identical. Kit rollout to contact/tags/post-detail (pass 8)
followed. The remote-functions spike (pass 9, BACKLOG #13) is deferred.
Spec: `docs/superpowers/archive/specs/2026-05-24-idiomatic-2026-exemplar-design.md`

## Planned

### Cairn CMS platform `cairn-cms`
Build the full Cairn platform: multi-repo engine (VITE_SITE, overlay script, CI
pipeline) followed by the editor interface (magic-link auth via Better Auth,
service-account GitHub writes). Covers passes 11–15. Both 907.life and ecnordic.ski
are planned migration targets once complete.
Spec: `docs/superpowers/specs/2026-05-13-cairn-requirements.md`

### PR test CI `pr-test-ci`
Add a pull-request workflow that runs `npm run check && npm test && npm run build` on `pull_request`. Until it lands, the full-suite home is the local close gate (lean pass ruling 11).

## Someday

### Migrate 907.life and ecnordic.ski to Cairn `site-migrations`
Restructure both standalone sites as cairn-cms site packages. Depends on cairn-cms
being stable and battle-tested.

### AKS Sailing Club site `aksailingclub`
Build aksailingclub.org as a Cairn site package, including content migration from the
existing Hugo site. The most complex migration; happens last, after cairn-cms is proven
and site-migrations is complete.
