# Cairn CMS — Multi-Repo Architecture

**Status:** Design complete, pending implementation  
**Date:** 2026-05-13  
**For:** Agent review and critique in a future session

---

## Purpose

This document describes the architecture for Cairn — a distributable SvelteKit-based
CMS framework targeting developers who manage 1–10 related sites. The design emerged
from the needs of one developer managing three sites (907.life, ecnordic.ski,
aksailingclub.org) with non-technical editors, but is intentionally structured for
wider distribution.

A second section provides comparable systems and suggested review dimensions for an
independent architectural critique.

---

## Functional Goals

These goals define what Cairn is *for* — what a developer or editor should be able to
do with it. They distinguish Cairn from other SvelteKit CMS solutions, which tend to
solve a subset of these problems or solve them differently.

### For developers

**G1 — Manage 1–10 independent sites from one engine.**
A developer should be able to run three sites that share 95% of their infrastructure
without maintaining three separate codebases. Adding a fourth site should require
creating one new repo, not forking the engine.

**G2 — Per-site customization without engine modification.**
Any site-specific route, layout, data layer, or Worker binding should be expressible
entirely within the site's own repo. The developer should never need to touch
`cairn-cms` to add a feature to a single site.

**G3 — Static-first with opt-in dynamic extensions.**
Sites default to fully static output (fast, cheap, zero runtime queries). Dynamic
data (live event counts, member-only content, real-time schedule updates) is available
via Cloudflare D1/KV bindings declared in the site's `wrangler.toml`, not required
by the framework.

**G4 — Distributable to other developers.**
A developer who is not the original author should be able to adopt Cairn, create their
own sites, and pull upstream engine improvements without conflicts. The framework should
have a clear boundary between engine code (upstream) and site code (never conflicts).

**G5 — Upgrade path as sites grow.**
A simple blog (posts only) should graduate smoothly to a complex site (custom routes,
Worker bindings, multiple content types) through progressive adoption of the site
package convention — not a rewrite.

### For editors

**G6 — No GitHub account required.**
Editors authenticate with a magic link sent to their email. They never see a git
commit, a pull request, or a branch name. The CMS UI is the complete picture of
their interaction with the system.

**G7 — Scoped access by site.**
An editor for ecnordic.ski sees only ECN content. They cannot read, write, or
accidentally affect 907.life or aksailingclub.org. This isolation is enforced at the
GitHub repo level, not just in the UI.

**G8 — Familiar editing experience.**
Editors get a web-based interface with a markdown editor, structured fields for
metadata (title, date, tags), and a publish/draft toggle. The interface should feel
like a simplified version of WordPress or Ghost's editor — nothing that requires
understanding of static site generators.

**G9 — Publish means live.**
When an editor clicks publish, the site updates automatically within a few minutes.
No developer intervention required for routine content publishing.

### What Cairn explicitly does not do

- **No membership or subscriptions** — Cairn does not manage readers, paywalls, or
  newsletter delivery. Sites needing these features integrate external services.
- **No media CDN** — images are committed as static assets. A site needing managed
  media uploads requires a custom extension.
- **No high-frequency publishing** — the 2–3 minute build cycle is a feature tradeoff,
  not a bug to be fixed. Sites publishing content more than a few times per day are
  out of scope.
- **No visual page builder** — content is structured markdown with frontmatter. A
  drag-and-drop page builder is out of scope.

---

## Goals

1. **Editor isolation** — content editors for each site have no access to the engine
   code or other sites' content. GitHub accounts are not required for editors.
2. **Engine reuse** — one codebase serves all sites. Shared infrastructure (routing,
   CMS, feeds, search, contact form) is written once.
3. **Per-site flexibility** — sites can override any engine default and add custom
   routes, data layers, and Worker bindings (e.g., a training calendar, an events
   system) without touching the engine.
4. **Distributable** — other developers can adopt Cairn for their own 1–10 site
   architectures by using cairn-cms as a GitHub template repo.
5. **Static-first** — sites build to static output deployed to Cloudflare Workers.
   Dynamic data (D1, KV) is an opt-in per-site extension, not a requirement.

---

## Repository Layout

Four repos for the reference implementation (glw907's sites):

| Repo | Access | Contents |
|---|---|---|
| `cairn-cms` | Developer only | SvelteKit engine, Cairn CMS app, shared routes, CI workflows |
| `907-life` | Developer + 907.life editors | Posts, pages, config, theme, wrangler config |
| `ecnordic-ski` | Developer + ECN editors | Posts, events, schedule, pages, custom routes, config, theme |
| `aksailingclub-org` | Developer + AKS editors | Posts, events, pages, custom routes, config, theme |

Content repos contain **no Svelte build tooling**. Editors interact exclusively through
the Cairn CMS web interface (magic link auth); they never clone or push to GitHub
directly.

For other developers adopting Cairn:
- Fork or use `cairn-cms` as a GitHub template
- Create one content repo per site following the site package convention below
- Pull upstream engine improvements via `git merge upstream/main`

---

## Site Package Convention

Each content repo follows this structure:

```
<site-name>/
  content/
    posts/          ← markdown posts (frontmatter: title, date, draft, description, tags)
    pages/          ← static pages (about, custom landing pages)
    events/         ← site-specific event content (optional)
    schedule.yaml   ← recurring schedule data (optional)
  routes/           ← Svelte route overrides and additions (optional)
  lib/              ← site-specific data layers and utilities (optional)
  static/           ← fonts, favicons, site-specific static assets (optional)
  config.ts         ← site constants (SITE_URL, SITE_TITLE, SITE_AUTHOR, etc.)
  theme.css         ← color tokens and typography (replaces engine defaults)
  wrangler.toml     ← Cloudflare Worker config (name, domain, bindings, secrets)
```

Only `content/posts/`, `config.ts`, `theme.css`, and `wrangler.toml` are required.
Everything else is optional and progressively adopted as a site needs more customization.

---

## Extension Model

The site package is a **layered overlay**. At build time, site files are copied into
the engine before the SvelteKit build runs. Site files shadow engine files on conflict;
the engine provides defaults for everything.

### Overlay rules

| Site file | Engine destination | Effect |
|---|---|---|
| `routes/**` | `src/routes/**` | Overrides existing engine routes or adds new ones |
| `lib/**` | `src/lib/site/**` | Available via `$site-lib` Vite alias |
| `static/**` | `static/**` | Merged; site files take precedence |
| `config.ts` | `src/sites/<site>/config.ts` | Replaces default site constants |
| `theme.css` | `src/sites/<site>/theme.css` | Replaces default theme entirely |
| `wrangler.toml` | `wrangler.<site>.toml` | Defines the site's Worker |

### What a site can do

- **Override the homepage** — provide `routes/+page.svelte`
- **Override the layout** — provide `routes/+layout.svelte` for a completely different
  nav structure
- **Add custom routes** — `routes/schedule/+page.svelte` creates `/schedule/` with no
  engine change required
- **Add a data layer** — `lib/calendar.ts` is importable as `$site-lib/calendar`
- **Add Worker bindings** — declare D1, KV, or email bindings in `wrangler.toml`; use
  them in server-side route files

### Modules

There is no formal module registry. A self-contained feature (e.g., ECN training
calendar) is a subdirectory of `routes/` and `lib/`:

```
ecnordic-ski/
  routes/schedule/
    +page.svelte
    +page.server.ts
  lib/
    schedule.ts
```

A module reusable across sites can live in its own GitHub repo and be included in a
site package via git submodule or a CI copy step. The engine's overlay mechanism
handles it identically.

---

## Build & Deploy Pipeline

### Trigger

When a content editor publishes via Cairn CMS, the content repo receives a commit.
A lightweight GitHub Actions workflow in the content repo fires a `repository_dispatch`
event to `cairn-cms`:

```yaml
# <content-repo>/.github/workflows/trigger-build.yml
on:
  push:
    branches: [main]
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.CAIRN_DISPATCH_TOKEN }}
          script: |
            github.rest.repos.createDispatchEvent({
              owner: 'glw907',
              repo: 'cairn-cms',
              event_type: 'build-site',
              client_payload: { site: 'ecnordic-ski' }
            })
```

`CAIRN_DISPATCH_TOKEN` is a GitHub fine-grained PAT scoped to `cairn-cms`
(dispatch permission only). Content repo contributors can trigger builds but cannot
read or write the engine repo.

### Build job (cairn-cms CI)

```yaml
on:
  repository_dispatch:
    types: [build-site]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4          # checkout engine

      - name: Clone site package
        run: |
          git clone https://x-access-token:${{ secrets.SITE_CONTENT_PAT }} \
            https://github.com/glw907/${{ github.event.client_payload.site }}.git \
            /tmp/site-package

      - name: Overlay site package
        run: |
          SITE=${{ github.event.client_payload.site }}
          cp -r /tmp/site-package/content   src/content/$SITE/
          cp -r /tmp/site-package/routes/.  src/routes/          # site routes win
          cp -r /tmp/site-package/lib/.     src/lib/site/        # if present
          cp -r /tmp/site-package/static/.  static/              # if present
          cp /tmp/site-package/config.ts    src/sites/$SITE/config.ts
          cp /tmp/site-package/theme.css    src/sites/$SITE/theme.css
          cp /tmp/site-package/wrangler.toml wrangler.$SITE.toml

      - run: npm ci
      - run: VITE_SITE=${{ github.event.client_payload.site }} npm run build
      - run: npx pagefind --site .svelte-kit/cloudflare

      - name: Deploy
        run: npx wrangler deploy --config wrangler.${{ github.event.client_payload.site }}.toml
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

`SITE_CONTENT_PAT` is a GitHub PAT with read access to all content repos. It lives
only in `cairn-cms` secrets — content repo contributors never see it.

### Build time

End-to-end from commit to live: approximately 2–3 minutes. This is acceptable for
the target use case (personal blogs, small nonprofit sites with infrequent publishes).
High-frequency content scenarios (news sites, live event updates) are out of scope.

---

## Cairn CMS (Editor Interface)

The editing interface is a Cairn-built application served from the cairn-cms engine
at `/admin/`. It is **not** Sveltia CMS, Decap CMS, or any off-the-shelf Git CMS.

### Authentication

Editors authenticate via **magic link** (passwordless email). No GitHub account
required. Cairn manages its own user database (Cloudflare D1) with users scoped to
one or more content repos.

### Content writes

Cairn CMS commits to content repos using a **service account PAT** stored in the
Worker's secrets. Editors never interact with GitHub directly. Cairn constructs and
signs commits via the GitHub API on their behalf.

### CMS configuration

Each site's Cairn CMS configuration (collections, field definitions, allowed editors)
lives in the content repo alongside the content it describes. The engine reads this
configuration at runtime to render the appropriate editing UI.

> **Note:** Cairn CMS is described here at the architecture level. Its detailed design
> (auth flow, GitHub API commit strategy, collection schema, admin UI) is out of scope
> for this document and belongs in a separate spec.

---

## Distribution Model

`cairn-cms` is published as a **GitHub template repository**. Developers adopting
Cairn:

1. Click "Use this template" on GitHub to create their own engine repo
2. Create content repos for each site following the site package convention
3. Set up GitHub secrets (`CLOUDFLARE_API_TOKEN`, `SITE_CONTENT_PAT`,
   `CAIRN_DISPATCH_TOKEN`)
4. Run `cairn init <site-name>` (CLI — planned, not yet built) to scaffold a new site package

Upstream engine improvements are pulled via `git merge upstream/main`. Site-specific
customizations live entirely in content repos and are never in conflict with upstream.

---

## Open Questions for Review

The following are deliberate open questions — areas where the design may have gaps,
incorrect assumptions, or unexplored alternatives:

1. **Route conflict resolution** — the overlay copies site `routes/` on top of engine
   `routes/`. If a site provides `routes/+layout.svelte`, it replaces the engine
   layout entirely, losing engine layout features (theme toggle, nav). Is a
   component-level extension model (Svelte slots/composition) preferable to
   file-level replacement for layout overrides?

2. **CI clone security** — `SITE_CONTENT_PAT` with read access to all content repos
   lives in `cairn-cms` CI. A compromise of `cairn-cms` secrets exposes read access
   to all site content. Is per-site PAT isolation (one PAT per content repo, selected
   by site name) worth the operational overhead?

3. **Build parallelism** — multiple content repos pushing simultaneously would queue
   builds in cairn-cms. Is queuing acceptable, or should builds be isolated per site
   with separate CI runners?

4. **`import.meta.glob` and multi-site content** — SvelteKit's `import.meta.glob`
   requires static paths at build time. With content overlaid before the build, each
   build only has one site's content present, so globbing works. But this means the
   engine cannot reference content from multiple sites in a single build. Is that a
   real limitation for any planned use case?

5. **Cairn CMS hosting** — if each site deploys its own Worker, which Worker serves
   the Cairn CMS `/admin/` UI? Per-site CMS (each site manages its own admin) or
   a central CMS Worker managing all sites? Per-site is simpler; central avoids
   managing N admin deployments.

6. **Template vs. npm** — the GitHub template model requires developers to merge
   upstream changes manually. An npm package would push updates automatically but
   hits SvelteKit's routing constraints (can't inherit routes from packages). Is
   there a hybrid (engine as npm, routes as templates) worth exploring?

---

## Comparison: Similar Systems

The following systems address overlapping problems. A reviewer should use these to
stress-test the Cairn design against proven alternatives.

### Suggested Review Dimensions

When comparing Cairn against each system below, evaluate along these dimensions:

| Dimension | What to assess |
|---|---|
| **Editor auth model** | How do non-technical editors log in? GitHub OAuth, own accounts, magic link, SSO? |
| **Content storage** | Git-backed files, database (Postgres/SQLite/D1), or cloud CMS API? |
| **Multi-site support** | Is 1–10 sites a first-class use case or an afterthought? |
| **Per-site customization** | Can each site have different themes, routes, and features without forking? |
| **Route extension model** | How does a site add or override pages? File overlay, component slots, plugin API? |
| **Build pipeline** | How does content reach the build? CI clone, npm install, API call at request time? |
| **Deploy target** | Static CDN, Node server, edge Workers, or all of the above? |
| **Editor experience** | What does a non-technical editor actually see and do? |
| **Developer experience** | How hard is it to add a new site or custom feature? |
| **Distribution model** | GitHub template, npm package, SaaS, or fork? |
| **Vendor lock-in** | Is content portable? Can you move off the framework without rewriting everything? |
| **Self-hosted vs. cloud** | Where does the CMS run? Who controls the infrastructure? |
| **Cost model** | What does hosting cost at 3 sites? At 10? What scales unexpectedly? |
| **Upstream update story** | How do adopters get engine improvements without breaking their customizations? |

---

### TinaCMS

**What it is:** A Git-backed CMS with its own cloud user management. Editors log in
with email accounts (no GitHub required); a TinaCMS cloud service writes to GitHub
on their behalf. Content is stored as markdown files in the repo.

**Relevant to Cairn because:** It solves the same editor-auth-without-GitHub problem.
The Cairn CMS service account model is essentially the same mechanism TinaCMS uses
internally.

**Key differences:**
- TinaCMS is SaaS — the editing UI and auth are hosted by Tina, not self-deployed
- Content and code live in the same repo; no content repo isolation
- No native multi-site isolation (one TinaCMS project = one repo)
- Strong React/Next.js orientation; SvelteKit support exists but is less mature
- Free tier exists; paid tiers required for teams and higher content volume

**Useful comparisons:** Editor UX, magic-link-equivalent auth flow, GitHub API commit
strategy.

---

### Keystatic

**What it is:** A Git-based CMS with a local and cloud mode. Runs embedded in a
SvelteKit (or Astro/Next) project. Editors use GitHub OAuth in cloud mode, or access
a local admin UI without auth in local mode. Content is markdown or JSON in the repo.

**Relevant to Cairn because:** It has first-class SvelteKit support and a well-designed
schema-defined collections API.

**Key differences:**
- Cloud mode requires GitHub OAuth — no magic link or own-account auth
- No content repo isolation; content lives alongside code
- No multi-site story; one Keystatic instance per site
- Collection schema is TypeScript-defined, strongly typed — better DX than YAML config
- Self-hosted option exists; no vendor lock-in on content storage

**Useful comparisons:** Collection schema design, SvelteKit integration patterns,
local development workflow.

---

### Payload CMS

**What it is:** A headless CMS with its own database (MongoDB or Postgres). Editors
log in with email/password accounts managed by Payload. Content is stored in the
database, not Git. SvelteKit consumes content via Payload's REST or GraphQL API.

**Relevant to Cairn because:** It solves editor auth without GitHub. The database
model is Cairn's Option B (D1-backed) taken to its conclusion.

**Key differences:**
- Content is not in Git — no history, no PRs, no plain-file portability
- Requires a running server (Node); not compatible with static-site or edge-only deploys
- Much richer content modeling (relationships, media management, access control)
- Multi-site requires separate Payload instances or custom multi-tenancy
- Steeper infrastructure requirement than Cloudflare Workers

**Useful comparisons:** Editor auth model, content access control, media handling.
Also useful as a sanity check: if Cairn's scope grows, does it eventually need to
become Payload?

---

### Decap CMS / Sveltia CMS

**What it is:** Git-based CMS configured via a YAML file. Editors authenticate via
GitHub (or GitLab) OAuth. Sveltia CMS is a modern drop-in replacement for Decap with
better performance and UI. This is what 907.life currently uses.

**Relevant to Cairn because:** It is Cairn's direct predecessor in this project.
Cairn is being built specifically to replace it.

**Key differences:**
- Requires GitHub OAuth for every editor — the primary reason Cairn is being built
- No multi-site support; one config per deployment
- Zero infrastructure: a static HTML file + YAML config, no server needed
- Mature, battle-tested content editing UI
- Content repo isolation is not possible; all editors have GitHub access

**Useful comparisons:** Collection YAML schema (Cairn's CMS config will likely follow
a similar structure), editor UX baseline.

---

### Astro + Starlight / Content Collections

**What it is:** Astro is a competing static-site framework with a first-class Content
Collections API. Starlight is an Astro-based documentation theme. Content Collections
provides strongly-typed markdown loading with Zod schema validation.

**Relevant to Cairn because:** Astro has solved the "multi-site from one codebase"
problem more explicitly than SvelteKit. Astro's content layer and `getCollection()` API
are worth studying as a comparison to Cairn's `import.meta.glob` content loading.

**Key differences:**
- Not SvelteKit — different component model, different routing
- No built-in CMS; editor auth is a separate concern
- Content Collections API is more ergonomic than raw `import.meta.glob` + gray-matter
- Astro's "islands" architecture handles interactivity differently than SvelteKit runes
- Multi-site in Astro typically uses monorepo with npm workspaces (rejected as overkill
  for Cairn's target use case)

**Useful comparisons:** Content layer design, typed content schemas, static build
performance at scale.

---

### Ghost

**What it is:** A Node-based publishing platform with a built-in editor, member
management, and newsletter delivery. Editors log in via Ghost's own auth. Can be used
headless (content API) or with Ghost's own theme system.

**Relevant to Cairn because:** Ghost is the most successful "indie publisher" CMS in
the same target market. It is what a non-technical user might reach for instead of
building on Cairn.

**Key differences:**
- Requires a persistent server (Node + MySQL); not edge-deployable without heavy
  adaptation
- Monolithic: editor, CMS, delivery, and membership all in one — Cairn separates these
- Rich editor (Koenig) and built-in newsletter/membership are features Cairn does not
  have and likely never will
- No multi-site from one install without custom multi-tenancy work
- Not a developer framework; not designed for per-site route/theme customization

**Useful comparisons:** Editor UX (what non-technical editors expect), content model
(posts, pages, tags), the case for and against a monolithic vs. framework approach.

---

### Hugo (multi-site with submodules)

**What it is:** Go-based static site generator. The AKS site (`aksailingclub-org`)
currently uses Hugo with content as a git submodule. Hugo supports multi-site builds
via separate config files and content mounts.

**Relevant to Cairn because:** This is the most direct precedent for Cairn's own
architecture — separate content repo, CI-driven overlay, static build.

**Key differences:**
- Go templates, not Svelte components — no reactive UI, no runes
- Git submodules for content (Cairn uses CI clone, avoiding submodule pointer management)
- No built-in CMS; requires Decap/Sveltia/Forestry/etc. for editing
- Extremely fast builds (Go vs. Node)
- Less ergonomic for complex interactive features (events calendar, member auth)

**Useful comparisons:** The submodule vs. CI-clone content delivery decision, multi-site
config pattern, build pipeline shape. Hugo's content mounts feature is worth reviewing
as an alternative to Cairn's file overlay approach.
