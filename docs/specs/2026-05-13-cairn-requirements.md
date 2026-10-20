# Cairn — High-Level Requirements

**Status:** Draft  
**Date:** 2026-05-13  
**Purpose:** Planning reference. Defines what Cairn must do across all passes. Use to
scope passes, evaluate additions, and decide what belongs in a future spec.

---

## What Cairn Is

Cairn is a distributable SvelteKit-based publishing framework for developers managing
1–10 related sites with non-technical editors. It provides a shared build engine, a
content-repo-per-site convention, a CI-driven build pipeline, and a web-based editor
that requires no GitHub account.

**Closest comparable: Sveltia CMS.** Sveltia has the right editing UX and collection
model, but two hard limitations make it unsuitable as-is:

1. Editors must authenticate via GitHub/GitLab OAuth. Sveltia has no built-in user
   auth system and acknowledges this on their roadmap.
2. No multi-site support. One config file, one repo.

Cairn solves both. Everything else about the editing experience — collections, YAML
config schema, markdown editing, structured fields — is modelled on the Sveltia/Decap
pattern.

---

## Requirements

### Multi-Site Engine

**REQ-01** One engine codebase (`cairn-cms`) builds any site. Sites are not forks.

**REQ-02** The active site is selected at build time via `VITE_SITE`. The engine has no
hardcoded site references after initial setup.

**REQ-03** Adding a new site requires creating a content repo following the site package
convention. No engine modification is required.

**REQ-04** Each site can override the engine's default theme, config, routes, and static
assets entirely from its own content repo. The engine provides defaults; sites shadow
them.

**REQ-05** Engine improvements can be pulled by any developer without conflicting with
site customizations. Engine files and site files never occupy the same paths.

**REQ-06** The engine is publishable as a GitHub template. A developer who is not the
original author can adopt it, create their own sites, and pull upstream changes without
merge conflicts.

---

### Site Package Convention

**REQ-07** Each site's content and configuration live in an isolated GitHub repo (the
site package). Required files: `content/posts/`, `config.ts`, `theme.css`,
`wrangler.toml`. Optional: `routes/`, `lib/`, `static/`, `content/pages/`,
`content/events/`.

**REQ-08** Site packages contain no SvelteKit build tooling. They are content and
configuration only.

**REQ-09** Site packages follow a standard directory layout so that the overlay
mechanism and CI pipeline work without per-site configuration in the engine.

**REQ-10** Collection definitions (content types, fields, labels) are declared in the
site package using a YAML config schema compatible with the Sveltia/Decap CMS
convention. This makes existing Sveltia configs portable to Cairn with minimal changes.

---

### Build & Deploy Pipeline

**REQ-11** A push to a content repo's main branch automatically triggers a full build
and deploy of that site. No developer action is required.

**REQ-12** The build pipeline: clone content repo → overlay site files into engine →
`npm ci` → SvelteKit build → Pagefind index → `wrangler deploy`.

**REQ-13** A manual build trigger is available (`workflow_dispatch`) to redeploy without
a content change.

**REQ-14** End-to-end time from commit to live is under 5 minutes under normal
conditions.

**REQ-15** Content repo credentials allow triggering a build for that site only. A
content repo contributor cannot read, write, or trigger builds for other sites or the
engine repo.

---

### Content Editing

**REQ-16** Editors create, edit, and delete posts and pages through a web interface at
`/admin/`.

**REQ-17** The editing interface is modelled on Sveltia CMS: a content list view, a
structured field form, and a markdown body editor. Editors familiar with Sveltia or
Decap should find Cairn's editor immediately recognisable.

**REQ-18** Each content entry has structured fields defined by the site's collection
config: at minimum title, date, description, tags, and draft/published status. The body
is edited as markdown with a live preview.

**REQ-19** Draft entries are not publicly visible. Published entries are live after the
next build completes (~2–5 min). Editors are informed of this delay.

**REQ-20** The editing UI uses plain language. Terms like "commit", "branch", "merge",
"repository", and "pull request" do not appear anywhere in the editor interface.

**REQ-21** Editors can see all entries for their site and their current draft/published
state from the content list without leaving the admin interface.

---

### Authentication & Access

**REQ-22** Editors authenticate via magic link sent to their email address. No GitHub
account, no OAuth flow, no password is required.

**REQ-23** Magic link auth is implemented using Better Auth (v1.5+) with its built-in
email magic link plugin. Editor sessions and verification tokens are stored in
Cloudflare D1.

**REQ-24** An editor's access is scoped to one or more sites. An editor for one site
cannot read or modify content belonging to another site.

**REQ-25** Adding or removing an editor for a site does not require a code change or
redeployment of the engine.

**REQ-26** Developer and operator access to the engine and content repos is managed
through standard GitHub permissions, separate from editor access.

---

### Content Writes (Service Account)

**REQ-27** When an editor publishes, Cairn commits to the site's content repo using a
GitHub App installation token, not the editor's personal credentials. Editors never
interact with GitHub directly.

**REQ-28** A GitHub App is preferred over a long-lived PAT for service account commits:
installation tokens are short-lived (1hr), produce verified commits, and can be scoped
per content repo.

**REQ-29** Commit messages are generated by Cairn (e.g. "Publish: Post title") and
attributed to the Cairn GitHub App. The editor's name is recorded in the commit message
body, not as the Git author.

---

### Deployment Target

**REQ-30** Sites deploy to Cloudflare Workers. Static assets are served from
Cloudflare's edge network.

**REQ-31** The Cairn CMS admin interface runs as part of the site's Worker. There is no
separate CMS host.

**REQ-32** Dynamic extensions (D1, KV, R2, email bindings) are declared per-site in
`wrangler.toml`. The engine itself requires only D1 (for editor auth tokens and user
records).

---

## Recommended Libraries

These are the preferred implementation choices for key subsystems. They should be
adopted by default and only reconsidered if a clear reason emerges.

| Subsystem | Library | Rationale |
|---|---|---|
| Markdown editor | [Carta](https://github.com/BearToCode/carta) v4+ | Svelte-native, SSR-compatible, 150+ remark plugins, actively maintained (Apr 2026) |
| Editor authentication | [Better Auth](https://better-auth.com) v1.5+ | SvelteKit adapter, magic link built-in, native Cloudflare D1 support |
| GitHub writes | GitHub App installation tokens | Short-lived, verified commits, per-repo scope |
| Collection schema | Sveltia/Decap YAML convention | Known format, portable configs, published JSON schema for validation |
| Search index | Pagefind | Post-build static index, zero runtime JS cost, already in use |

---

## Out of Scope

The following are explicitly not Cairn requirements. Treat requests to add these as
scope creep unless a new spec is written and a pass is planned.

- **Membership or subscriptions** — reader accounts, paywalls, newsletter delivery
- **Media CDN** — managed image or file uploads; images are committed as static assets
- **High-frequency publishing** — the 2–5 min build cycle is a design constraint, not a
  bug; news sites or live-updating dashboards are out of scope
- **Visual page builder** — content is structured markdown with frontmatter;
  drag-and-drop layout is out of scope
- **Centralised multi-tenant CMS host** — each site deploys its own Worker; a shared
  admin host serving all sites is out of scope for the current design
