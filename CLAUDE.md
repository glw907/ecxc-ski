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

Design changes follow the family-wide standards in `../cairn-cms/CLAUDE.md` ("Visual work"): a rebuild may diverge from its pre-rebuild
look only where it improves, and every viewport from 320 to 2560 gets composed, not merely
left unbroken. Verify a design claim with a computed-style probe (a canvas round-trip
normalizes Chromium's `oklch()` computed colors to sRGB for a contrast check), not a
screenshot alone.
`ecxc-theme.css` carries its own load-bearing cascade notes inline, including the
unlayered-override trap that once erased the CTA button's label and the one-token hover
vocabulary; read its header comments before editing a cascade-sensitive rule there.

## Development Workflow

Pass-driven. Any of "continue development," "next pass," "finish pass," or "ship pass" invokes the `site-pass` skill (this repo's own roadmap); `pass-core` carries the process. The site consumes `@glw907/cairn-cms` from the npm registry by version range; that library is a separate standalone repo with its own roadmap.

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

The `ecxc` Worker carries six secrets: `RESEND_API_KEY` (all outbound mail since the
2026-07-14 Resend cutover; its presence flips `src/theme/email-transport.ts` off the legacy
CF bindings), `GITHUB_APP_PRIVATE_KEY_B64`, `GOOGLE_SA_KEY_B64` (the registration-roster
Sheets writer), `ANTHROPIC_API_KEY` (the editor's tidy copy-edit), `TURNSTILE_SECRET_KEY`,
and `CONTACT_EMAIL`. A renamed or recreated Worker starts with none (this broke admin saves
and the contact form at the Rename 4 cutover, backlog #32), so re-put all six after any
Worker rename. Registration submissions fail closed without `TURNSTILE_SECRET_KEY`
(deliberate: the parent-copy email path must never run unguarded). The first four live in
the workstation age store; `~/.dotfiles/scripts/secrets/sync.sh --worker ecxc` re-puts them,
and `~/.dotfiles/secrets/registry.md` carries scope and rotation (including the Resend
account note: its one verified sending domain is ecxc.ski). The Turnstile secret is
recoverable from the Turnstile API (rotate with grace; recipe in
`docs/registration-e2e.md`). The roster spreadsheet ID is the committed
`REGISTRATION_SHEET_ID` var in `wrangler.toml`, not a secret.

```bash
npx wrangler secret list
~/.dotfiles/scripts/secrets/sync.sh --worker ecxc    # the four age-store secrets
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put CONTACT_EMAIL
```

## Deploy

Push to `main` → GitHub Actions → build + pagefind + wrangler deploy → live in ~2 min.
Never run `npx wrangler deploy` from the project root in normal work: it overwrites the
Actions-managed deploy with a stale local build. Emergency only (Actions broken):
`npm run build && npx pagefind --site .svelte-kit/cloudflare && npx wrangler deploy`.

## Visual work

Any rebuild, port, or redesign follows the `visual-fidelity` skill (original manifest,
independent verify loop, full-page render read before deploy). Invoke it at the start.
