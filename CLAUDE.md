# ecxc.ski

East Community Cross Country. SvelteKit + TypeScript, deployed to Cloudflare Workers.

@docs/STATUS.md

## Stack

SvelteKit · TypeScript · Tailwind CSS v4 · DaisyUI v5 · `@glw907/cairn-cms` (markdown render + magic-link admin) · Pagefind · @sveltejs/adapter-cloudflare

## Structure

Rebuilt on the Waymark starter template (2026-07-05). `src/chassis/` is the genre-free
plumbing shared with every cairn-cms site (content indexing, feeds, the runtime composition
point, the token/prose CSS foundation); `src/theme/` is ecxc's own adapter config, chrome
components, `ecxc-theme.css`/`ecxc-components.css`, and directive registry. Read
`src/chassis/README.md` before touching either side: it states the boundary and every seam a
theme edit is allowed to reach through.

## Design work

Design changes follow the family-wide standards in `../cairn-cms/CLAUDE.md` ("The polish and
fidelity standards", "The responsive standard"): a rebuild may diverge from its pre-rebuild
look only where it improves, and every viewport from 320 to 2560 gets composed, not merely
left unbroken. Verify a design claim with a computed-style probe (a canvas round-trip
normalizes Chromium's `oklch()` computed colors to sRGB for a contrast check), not a
screenshot alone; `docs/STATUS.md`'s "Live verification" entries are the worked examples.
`ecxc-theme.css` carries its own load-bearing cascade notes inline, including the
unlayered-override trap that once erased the CTA button's label and the one-token hover
vocabulary; read its header comments before editing a cascade-sensitive rule there.

## Development Workflow

Pass-driven. Any of "continue development," "next pass," "finish pass," or "ship pass" invokes the `site-pass` skill (this repo's own roadmap). The site consumes `@glw907/cairn-cms` from the npm registry by version range; that library is a separate standalone repo with its own roadmap.

## Website Content

Website content (pages, posts, form copy under `src/content/`) uses the web-content register,
not the technical voice. Draft with the `content-draft` skill (brief-first, reply stance) and
gate-check with `content-review`. Routing and voice rules are in `.claude/rules/content.md`; the
generative authority is `docs/content-guide.md`. Content edits change the committed content
manifest: after any content edit, run `npm run cairn:manifest` and commit
`src/content/.cairn/index.json` too (a stale manifest fails the build red). The pre-rebuild
HTML characterization snapshots are gone; there is nothing to `vitest run -u`.

## Build & Dev

```bash
npm install
npm run dev                      # dev server at http://localhost:5173
npm run build                    # build to .svelte-kit/cloudflare/
npm run build:search             # build, then generate the Pagefind index
```

## New Post

Create `src/content/posts/YYYY-MM-slug.md`:

```yaml
---
title: "Post Title"
date: YYYY-MM-DD
draft: false
description: "One sentence description."
tags: ["tag1"]
---
```

## Worker & Secrets

The `ecxc` Worker carries four secrets. A renamed or recreated Worker starts with none (this
broke admin saves and the contact form at the Rename 4 cutover, backlog #32), so re-put all
four after any Worker rename. Registration submissions also fail closed without
`TURNSTILE_SECRET_KEY` (deliberate: the parent-copy email path must never run unguarded).
`GITHUB_APP_PRIVATE_KEY_B64` and `GOOGLE_SA_KEY_B64` (the registration-roster Sheets writer)
live in the workstation age store; `~/.dotfiles/scripts/secrets/sync.sh --worker ecxc`
re-puts both, and `~/.dotfiles/secrets/registry.md` carries their scope and rotation. The
Turnstile secret is recoverable from the Turnstile API. The roster spreadsheet ID is the
committed `REGISTRATION_SHEET_ID` var in `wrangler.toml`, not a secret.

```bash
npx wrangler secret list
~/.dotfiles/scripts/secrets/sync.sh --worker ecxc    # GitHub App key + Google SA key
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put CONTACT_EMAIL
```

## Deploy

Push to `main` → GitHub Actions → build + pagefind + wrangler deploy → live in ~2 min.

## The family lessons (from the cairn arc, 2026-07; binding for all design/port work)

- **The original manifest**: any rebuild/port/redesign enumerates its original
  exhaustively FIRST (every page, section, image identity + crop, behavior) and verifies
  against the manifest, never the plan. The `visual-fidelity` skill carries the method.
- **The verify loop**: fresh-context verifiers grade; builders and fixers never
  self-confirm; exit only on an independent PASS; the contrast probe on interactive
  elements is mandatory.
- **The one-check rule**: nothing deploys without a full-page render read in the main
  loop; user-facing changes get Geoff's before/after.
- **Defects are not design**: the original's typos, bugs, responsive failures always fix
  (graded IMPROVED); our CSS is cleaner than the original's, always.
- The deep records: cairn-cms docs/internal/2026-07-06-arc-post-mortem.md and the
  pre-beta-harvest ledger.
