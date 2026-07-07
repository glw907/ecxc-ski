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
generative authority is `docs/content-guide.md`. Characterization snapshots pin the rendered
page HTML: after any content edit, run `npx vitest run -u` and commit the snapshots too.

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

The `ecxc` Worker carries three secrets. A renamed or recreated Worker starts with none (this
broke admin saves and the contact form at the Rename 4 cutover, backlog #32), so re-put all
three after any Worker rename. `GITHUB_APP_PRIVATE_KEY_B64` lives in `~/.local/secrets`; the
Turnstile secret is recoverable from the Turnstile API.

```bash
npx wrangler secret list
npx wrangler secret put GITHUB_APP_PRIVATE_KEY_B64   # cairn's GitHub App key (admin saves)
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put CONTACT_EMAIL
```

## Deploy

Push to `main` → GitHub Actions → build + pagefind + wrangler deploy → live in ~2 min.
