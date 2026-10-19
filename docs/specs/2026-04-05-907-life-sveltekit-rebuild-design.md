# 907.life SvelteKit Rebuild — Design Spec

**Date:** 2026-04-05
**Status:** Approved
**Scope:** Repo cleanup, documentation, and Claude infrastructure reset. Not implementation.

---

## Pattern Intent

This site is a testbed. The goal is to build a clean, reusable pattern for personal blog sites that can be extracted and applied to future sites. Every architectural decision should be documented as "the pattern" not just "how this site works."

**Reusable core (the pattern):**
- SvelteKit + TypeScript + adapter-cloudflare
- Tailwind v4 + DaisyUI v5
- remark + remark-gfm for post content
- mdsvex for interactive/component pages
- Pagefind for search
- Sveltia CMS config schema
- Cloudflare Email Workers contact form
- GitHub Actions → Cloudflare Workers deployment

**Site-specific:**
- Domain (907.life)
- Content (posts, about copy)
- Fonts (Lora)
- Cloudflare secrets

---

## Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | SvelteKit + TypeScript | Modern, first-class Cloudflare support, Svelte 5 runes |
| Styling | Tailwind CSS v4 + DaisyUI v5 | CSS-first config, component library, default themes to start |
| Markdown (posts) | remark + remark-gfm | Pure data pipeline, GFM support, no magic |
| Markdown (special pages) | mdsvex | Svelte components inside markdown for archives, contact, etc. |
| Search | Pagefind | Post-build static index, zero runtime JS cost, idiomatic for static SvelteKit |
| CMS | Sveltia CMS | Git-based, modern Decap replacement, single config file, reusable pattern |
| Adapter | @sveltejs/adapter-cloudflare | First-class Workers support, SvelteKit form actions work natively |
| Contact form | Cloudflare Email Workers | Native to Cloudflare, no third-party email API, free tier |
| Spam protection | Cloudflare Turnstile | Already in use, stays |
| Fonts | Lora (woff2, self-hosted) | Already available, carries over |

---

## Routing

Preserve existing URL structure: `/:year/:month/:day/:slug/`

Maps to SvelteKit dynamic route: `src/routes/[year]/[month]/[day]/[slug]/+page.svelte`

Post slugs are derived from filenames: `2026-03-06-early-march.md` → `/2026/03/06/early-march/`

---

## Content Pipeline

Two pipelines, chosen per file type:

**Posts** (`src/content/posts/*.md`) — processed with remark + remark-gfm at build time via `import.meta.glob`. Frontmatter: `title`, `date`, `draft`, `tags`, `description`. Straight prose, no Svelte components needed.

**Special pages** (`src/routes/*/+page.svelte` or `.md`) — mdsvex. Enables Svelte components inside markdown. Used for: archives, contact, about. In each case, a `.md` file holds the editable prose content (managed via Sveltia), and the page embeds Svelte components for dynamic behavior (archive listing, contact form). The contact form logic lives in `+page.server.ts` alongside the mdsvex page file.

---

## Search

Pagefind runs post-build (`npm run build && npx pagefind --site build`). Crawls built HTML, generates static index in `build/_pagefind/` (alongside the build output). Search UI is a lightweight Svelte component wrapping the Pagefind JS API. No runtime server needed.

---

## Contact Form

No separate `/contact/` route. Contact form lives at the bottom of the about page, accessible via `#contact` anchor. Nav "Contact" link points to `/about/#contact` — matching the current site.

Form action in `src/routes/about/+page.server.ts`. Flow:

1. User submits form
2. Form action validates Turnstile token via Cloudflare API
3. Sends email via Cloudflare Email Workers binding (`send_email`)
4. Returns success/error to page

**Secrets required:**
- `TURNSTILE_SECRET_KEY`
- `CONTACT_EMAIL`

Resend and `RESEND_API_KEY` are dropped entirely.

---

## CMS

Sveltia CMS mounted at `/admin/`. Two files in `static/admin/`:

- `index.html` — loads Sveltia from CDN
- `config.yml` — collection schema pointing at `src/content/posts/`

Two collections:

- **Posts** — `src/content/posts/`, fields: title, date, draft, description, tags, body
- **Pages** — individual files for about (includes contact prose) and archives. Fields: title, body (prose only — not the form or archive listing)

Wired in properly so it works and establishes the pattern. Not over-engineered for day-to-day use — primary workflow is local editing + git push.

---

## Deployment

Push to `main` → GitHub Actions runs `npm run build` + `npx pagefind` + `npx wrangler deploy` → live in ~2 min.

`wrangler.toml` updated for SvelteKit adapter-cloudflare output. Email Workers `send_email` binding added.

---

## Repo Cleanup

**Remove:**
- `themes/` + `.gitmodules` (PaperMod submodule)
- `layouts/`, `assets/`, `archetypes/`
- `hugo.toml`, `build.sh`, `.bin/`, `.hugo_build.lock`
- `public/`, `resources/`
- `src/worker.js`
- `content/` (posts migrated to `src/content/posts/` before deletion)
- `docs/` (replaced with new docs)

**Keep:**
- `static/fonts/` (Lora woff2)
- `static/images/profile.jpg`
- `wrangler.toml` (updated)
- `.gitignore` (updated)
- `.claude/settings.local.json`
- `.env` / `.env.example`
- Git history

---

## Claude Infrastructure

**`CLAUDE.md`** — lean project-level file covering: stack summary, build/dev commands, new post workflow, content pipeline split (remark vs. mdsvex), Sveltia config location, secrets, deploy, cross-site admin pointer.

**Project memory** — fresh, capturing: stack decisions, pattern intent (testbed → extractable), Cloudflare Email Workers choice (not Resend), Sveltia as reusable CMS pattern.

**Plugins to install before first implementation session:**
- `commit-commands`
- `hookify`
- `security-guidance`

**Project-level skill** — `svelte-check` runner, created via `skill-creator` during first implementation session.

**`.claude/settings.local.json`** — `bypassPermissions` preserved.
