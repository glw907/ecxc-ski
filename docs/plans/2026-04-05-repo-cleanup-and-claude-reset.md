# Repo Cleanup & Claude Infrastructure Reset — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all Hugo infrastructure, migrate post content to its future SvelteKit home, write new architecture docs and CLAUDE.md, and reset project memory — leaving the repo clean and ready for SvelteKit implementation.

**Architecture:** Sequential file operations — migrate content, delete Hugo files, write new docs, reset Claude memory. No code is implemented; this is purely repo and documentation housekeeping.

**Tech Stack:** bash, git

---

### Task 1: Migrate post content out of Hugo page bundles

Hugo stores posts as `content/posts/YYYY-MM-DD-slug/index.md`. SvelteKit will use flat files at `src/content/posts/YYYY-MM-DD-slug.md`. Migrate now so Hugo's `content/` tree can be fully deleted.

**Files:**
- Create: `src/content/posts/2024-11-20-quick-thoughts.md`
- Create: `src/content/posts/2024-12-01-favorite-albums-2024.md`
- Create: `src/content/posts/2024-12-15-book-notes-example.md`
- Create: `src/content/posts/2025-01-10-winter-prior-lake.md`
- Create: `src/content/posts/2025-01-23-testing-the-new-site.md`
- Create: `src/content/posts/2026-01-29-formatting-test-post.md`
- Create: `src/content/posts/2026-03-06-early-march.md`

- [ ] **Step 1: Create the destination directory**

```bash
mkdir -p src/content/posts src/content/pages
```

- [ ] **Step 2: Flatten all page bundles**

```bash
for dir in content/posts/*/; do
  slug=$(basename "$dir")
  cp "$dir/index.md" "src/content/posts/${slug}.md"
done
```

- [ ] **Step 3: Migrate about page content**

```bash
cp content/about.md src/content/pages/about.md
```

- [ ] **Step 4: Verify all files migrated**

```bash
ls src/content/posts/
ls src/content/pages/
```

Expected output for posts:
```
2024-11-20-quick-thoughts.md
2024-12-01-favorite-albums-2024.md
2024-12-15-book-notes-example.md
2025-01-10-winter-prior-lake.md
2025-01-23-testing-the-new-site.md
2026-01-29-formatting-test-post.md
2026-03-06-early-march.md
```

Expected output for pages:
```
about.md
```

- [ ] **Step 5: Verify post frontmatter is intact (spot check two files)**

```bash
head -10 src/content/posts/2026-03-06-early-march.md
head -10 src/content/posts/2024-11-20-quick-thoughts.md
```

Both should show valid YAML frontmatter (title, date, draft, tags, description).

---

### Task 2: Remove Hugo infrastructure

Delete all Hugo-specific files and directories. The spec defines exactly what goes and what stays.

**Files:**
- Delete: `themes/`, `layouts/`, `assets/`, `archetypes/`
- Delete: `hugo.toml`, `build.sh`, `.bin/`, `.hugo_build.lock`
- Delete: `public/`, `resources/`
- Delete: `src/worker.js` (and `src/` if empty after)
- Delete: `.gitmodules`
- Delete: `content/` (posts already migrated)
- Delete: `docs/architecture.md`, `docs/hover-style-guide.md`, `docs/iconography.md`, `docs/operations.md`
- Delete: `README.md`

- [ ] **Step 1: Remove Hugo theme and submodule**

```bash
git rm -rf themes/
git rm .gitmodules
```

- [ ] **Step 2: Remove Hugo layout and asset overrides**

```bash
git rm -rf layouts/ assets/ archetypes/
```

- [ ] **Step 3: Remove Hugo config and build tooling**

```bash
git rm hugo.toml build.sh .hugo_build.lock
git rm -rf .bin/
```

- [ ] **Step 4: Remove Hugo build output and cache**

```bash
rm -rf public/ resources/
```

(These are gitignored, so `rm -rf` not `git rm`.)

- [ ] **Step 5: Remove the old Worker script**

```bash
git rm src/worker.js
```

Note: `src/` is not removed here — it contains `src/content/` created in Task 1.

- [ ] **Step 6: Remove Hugo content tree**

```bash
git rm -rf content/
```

- [ ] **Step 7: Remove old Hugo-era docs**

```bash
git rm docs/architecture.md docs/hover-style-guide.md docs/iconography.md docs/operations.md
git rm README.md
```

- [ ] **Step 8: Verify only expected files remain**

```bash
git status
find . -not -path './.git/*' -not -path './.wrangler/*' | sort
```

Expected to remain:
```
.claude/
docs/superpowers/
src/content/
static/fonts/
static/images/
wrangler.toml
.env
.env.example
.gitignore
CLAUDE.md  (still has old Hugo content — will be replaced in Task 5)
```

---

### Task 3: Update .gitignore for SvelteKit

Replace Hugo-specific ignore entries with SvelteKit entries.

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Replace .gitignore contents**

```
# SvelteKit build output
.svelte-kit/
build/

# Node
node_modules/

# Environment and secrets
.env
.env.local
.env.*
!.env.example
.dev.vars

# Wrangler
.wrangler/

# Vite
vite.config.js.timestamp-*
vite.config.ts.timestamp-*

# Pagefind (generated at build time)
build/_pagefind/

# OS files
.DS_Store
Thumbs.db

# Editor
*.swp
*.swo
*~

# Claude Code local settings
.claude/
```

- [ ] **Step 2: Verify .gitignore**

```bash
cat .gitignore
```

---

### Task 4: Write docs/architecture.md

Captures all design decisions from the brainstorming session. This is a living reference document, not the spec (spec lives in `docs/superpowers/specs/`).

**Files:**
- Create: `docs/architecture.md`

- [ ] **Step 1: Write docs/architecture.md**

Full content:

```markdown
# 907.life Architecture

Design decisions for the SvelteKit rebuild.

> **Pattern intent:** This site is a testbed. Architecture is documented as a
> reusable pattern for future personal blog sites, not just "how this site works."

---

## Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | SvelteKit + TypeScript | Modern, first-class Cloudflare support, Svelte 5 runes |
| Styling | Tailwind CSS v4 + DaisyUI v5 | CSS-first config, no tailwind.config.js needed |
| Markdown (posts) | remark + remark-gfm | Pure data pipeline, GFM support, no magic |
| Markdown (special pages) | mdsvex | Svelte components inside markdown for pages with interactive sections |
| Search | Pagefind | Post-build static index, zero runtime JS cost |
| CMS | Sveltia CMS | Git-based, modern Decap replacement, reusable config schema |
| Adapter | @sveltejs/adapter-cloudflare | First-class Workers support, form actions work natively |
| Contact form | Cloudflare Email Workers | Native Cloudflare, free tier, replaces Resend |
| Spam protection | Cloudflare Turnstile | Carried over from Hugo site |
| Fonts | Lora (woff2, self-hosted) | Carried over from Hugo site |

**Reusable core (the pattern):**
SvelteKit + TS + adapter-cloudflare · Tailwind v4 + DaisyUI v5 · remark/mdsvex pipeline
· Pagefind · Sveltia CMS config schema · Cloudflare Email Workers contact form
· GitHub Actions → Cloudflare Workers deployment

**Site-specific:** domain, content, fonts, Cloudflare secrets

---

## Routing

URL structure preserved from Hugo: `/:year/:month/:day/:slug/`

SvelteKit route: `src/routes/[year]/[month]/[day]/[slug]/+page.svelte`

Slug derived from filename: `2026-03-06-early-march.md` → `/2026/03/06/early-march/`

---

## Content Pipeline

### Posts — remark + remark-gfm

`src/content/posts/*.md` — loaded at build time via `import.meta.glob`, processed
through remark + remark-gfm. Straight prose, no Svelte components in posts.

Frontmatter: `title`, `date`, `draft`, `tags`, `description`

### Special Pages — mdsvex

About and archives pages use mdsvex. A `.md` file holds editable prose (managed via
Sveltia CMS); embedded Svelte components handle dynamic behavior (archive listing,
contact form).

---

## About + Contact

No separate `/contact/` route. Contact form lives at the bottom of the about page,
accessible via `#contact` anchor. Nav "Contact" link → `/about/#contact`.

Form action: `src/routes/about/+page.server.ts`

Flow: validate Turnstile → send via Cloudflare Email Workers `send_email` binding.

Secrets: `TURNSTILE_SECRET_KEY`, `CONTACT_EMAIL`

---

## Search

`npx pagefind --site build` runs post-build. Generates static index in `build/_pagefind/`.
Search UI is a Svelte component wrapping the Pagefind JS API.

---

## CMS — Sveltia

Mounted at `/admin/`. Config at `static/admin/config.yml`. Two collections:

- **posts** — `src/content/posts/`, fields: title, date, draft, description, tags, body
- **pages** — about and archives prose (title + body only, not form/archive components)

Primary workflow is local editing + git push. CMS is wired in for the pattern.

---

## Deployment

Push to `main` → GitHub Actions → `npm run build` + `npx pagefind --site build`
+ `npx wrangler deploy` → live in ~2 min.

---

## What Replaced What

| Hugo | SvelteKit |
|---|---|
| `themes/PaperMod` + layout overrides | Own components, no theme |
| `build.sh` to pin Hugo version | `package.json` lockfile |
| `src/worker.js` separate Worker | SvelteKit form action in `+page.server.ts` |
| Resend + `RESEND_API_KEY` | Cloudflare Email Workers (native) |
| Page bundles (`posts/slug/index.md`) | Flat files (`src/content/posts/slug.md`) |
| lunr.js search | Pagefind |
```

- [ ] **Step 2: Verify the file**

```bash
wc -l docs/architecture.md
head -5 docs/architecture.md
```

Expected: ~80 lines, starts with `# 907.life Architecture`

---

### Task 5: Write CLAUDE.md

Lean project-level file — just what a fresh session needs to orient quickly.

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Replace CLAUDE.md contents**

Use the Write tool to write `CLAUDE.md` with the following content (code blocks
with triple backticks are inside this file — use the Write tool, not a shell heredoc,
to avoid escaping issues):

~~~
# 907.life

Personal blog — SvelteKit + TypeScript, deployed to Cloudflare Workers.

See `docs/architecture.md` for design decisions and `docs/superpowers/specs/` for the rebuild spec.

## Stack

SvelteKit · TypeScript · Tailwind CSS v4 · DaisyUI v5 · mdsvex · remark + remark-gfm · Pagefind · Sveltia CMS · @sveltejs/adapter-cloudflare

## Build & Dev

```bash
npm install
npm run dev                                    # dev server at http://localhost:5173
npm run build                                  # build to build/
npm run build && npx pagefind --site build     # build + search index
npx wrangler dev                               # test contact form at http://localhost:8787
```

## New Post

Create `src/content/posts/YYYY-MM-DD-slug.md`:

```yaml
---
title: "Post Title"
date: YYYY-MM-DD
draft: false
description: "One sentence description."
tags: ["tag1", "tag2"]
---
```

## Content Pipeline

- **Posts** (`src/content/posts/*.md`) — remark + remark-gfm. Straight prose only.
- **Special pages** (`src/routes/about/`, `src/routes/archives/`) — mdsvex. Prose editable via Sveltia; Svelte components handle form and archive listing.

## Sveltia CMS

Config: `static/admin/config.yml`
Editor: `/admin/` (requires GitHub OAuth)
Collections: **posts** and **pages** (about + archives prose)

## Worker & Secrets

Two secrets required — check with `npx wrangler secret list`:
- `TURNSTILE_SECRET_KEY`
- `CONTACT_EMAIL`

Set with: `npx wrangler secret put SECRET_NAME`

## Deploy

Push to `main` → GitHub Actions runs build + pagefind + wrangler deploy → live in ~2 min.

Manual: `npm run build && npx pagefind --site build && npx wrangler deploy`

## Cross-Site Admin

For DNS, domain verification, or Cloudflare service config: `cd ~/Projects/cloudflare-sites && claude`
~~~

- [ ] **Step 2: Verify CLAUDE.md**

```bash
cat CLAUDE.md
```

---

### Task 6: Reset project memory

Clear Hugo-era memory entries. Write fresh memory files capturing the SvelteKit rebuild decisions.

**Files:**
- Rewrite: `/home/glw907/.claude/projects/-home-glw907-Projects-907-life/memory/MEMORY.md`
- Create: `/home/glw907/.claude/projects/-home-glw907-Projects-907-life/memory/project_stack.md`
- Create: `/home/glw907/.claude/projects/-home-glw907-Projects-907-life/memory/project_pattern_intent.md`
- Create: `/home/glw907/.claude/projects/-home-glw907-Projects-907-life/memory/project_contact_form.md`
- Create: `/home/glw907/.claude/projects/-home-glw907-Projects-907-life/memory/project_sveltia.md`
- Create: `/home/glw907/.claude/projects/-home-glw907-Projects-907-life/memory/project_settings.md`

- [ ] **Step 1: Write project_stack.md**

```markdown
---
name: SvelteKit Stack Decisions
description: Technology choices for the 907.life SvelteKit rebuild
type: project
---

SvelteKit + TypeScript, Tailwind CSS v4 + DaisyUI v5, @sveltejs/adapter-cloudflare, deployed to Cloudflare Workers.

**Why:** Full reset from Hugo/PaperMod. Cleaner DX, no theme coupling, TypeScript throughout, Svelte 5 runes.

**How to apply:** All new files use TypeScript. Svelte 5 runes syntax. No Hugo patterns carry over.
```

- [ ] **Step 2: Write project_pattern_intent.md**

```markdown
---
name: Pattern Intent — Testbed Site
description: 907.life is a testbed; architecture is designed to be extracted as a reusable pattern for future sites
type: project
---

This site is a testbed. Architecture is designed to be extracted as a reusable pattern for future personal blog sites.

**Why:** User wants a documented pattern applicable to multiple sites, not just one working blog.

**How to apply:** Document decisions as "the pattern," not just "how this site works." Design for extractability. Reusable core: SvelteKit + TS + adapter-cloudflare, Tailwind v4 + DaisyUI v5, remark/mdsvex pipeline, Pagefind, Sveltia CMS config schema, Cloudflare Email Workers contact form.
```

- [ ] **Step 3: Write project_contact_form.md**

```markdown
---
name: Contact Form — Cloudflare Email Workers (not Resend)
description: Contact form uses Cloudflare Email Workers send_email binding; Resend was explicitly dropped
type: project
---

Contact form uses Cloudflare Email Workers `send_email` binding. Resend was explicitly dropped.

**Why:** Native Cloudflare, free tier, no third-party API key. Secrets reduced to TURNSTILE_SECRET_KEY + CONTACT_EMAIL only.

**How to apply:** Never suggest Resend for this project. Contact lives at /about/#contact (combined about+contact page). Form action in src/routes/about/+page.server.ts.
```

- [ ] **Step 4: Write project_sveltia.md**

```markdown
---
name: Sveltia CMS — Two Collections, Minimal Config
description: CMS has posts + pages collections; wired in as reusable pattern, not day-to-day workflow
type: project
---

Sveltia CMS at /admin/, config at static/admin/config.yml. Two collections: posts (src/content/posts/) and pages (about + archives prose only).

**Why:** Pages collection allows editing prose on about/archives via CMS. Config schema is the reusable pattern for future sites.

**How to apply:** Keep config minimal. Primary workflow is local editing + git push. Don't over-engineer schema. Future sites copy config.yml and update collection paths.
```

- [ ] **Step 5: Write project_settings.md**

```markdown
---
name: Claude Code Permissions
description: Project settings.local.json uses bypassPermissions mode
type: project
---

Project `.claude/settings.local.json` set to `"defaultMode": "bypassPermissions"` — no permission prompts on new sessions.

**How to apply:** No action needed. Permissions are already bypassed.
```

- [ ] **Step 6: Rewrite MEMORY.md as a clean index**

```markdown
# 907-life Project Memory

- [SvelteKit Stack](project_stack.md) — Technology choices for the SvelteKit rebuild
- [Pattern Intent](project_pattern_intent.md) — Testbed site; architecture designed for extraction to future sites
- [Contact Form](project_contact_form.md) — Cloudflare Email Workers (not Resend); /about/#contact
- [Sveltia CMS](project_sveltia.md) — Two collections (posts + pages), minimal config, reusable pattern
- [Claude Permissions](project_settings.md) — bypassPermissions mode active
```

- [ ] **Step 7: Verify memory files**

```bash
ls /home/glw907/.claude/projects/-home-glw907-Projects-907-life/memory/
cat /home/glw907/.claude/projects/-home-glw907-Projects-907-life/memory/MEMORY.md
```

Expected: 6 files (MEMORY.md + 5 project_*.md files). MEMORY.md shows clean index with 5 entries.

---

### Task 7: Commit everything

- [ ] **Step 1: Stage all changes**

```bash
git add -A
git status
```

Review the staged changes. Expected:
- Deleted: themes/, layouts/, assets/, archetypes/, hugo.toml, build.sh, .bin/, .gitmodules, .hugo_build.lock, content/, src/worker.js, docs/architecture.md, docs/hover-style-guide.md, docs/iconography.md, docs/operations.md, README.md
- Added: src/content/posts/*.md, src/content/pages/about.md, docs/architecture.md (new), CLAUDE.md (modified)
- Modified: .gitignore

- [ ] **Step 2: Commit**

```bash
git commit -m "$(cat <<'EOF'
Reset repo: remove Hugo, migrate content, write new docs

- Remove all Hugo infrastructure (themes, layouts, assets, archetypes,
  hugo.toml, build.sh, .bin/, worker.js, content/)
- Migrate posts to src/content/posts/ (flattened from page bundles)
- Migrate about content to src/content/pages/
- Write new docs/architecture.md capturing SvelteKit rebuild decisions
- Rewrite CLAUDE.md for SvelteKit project
- Update .gitignore for SvelteKit/Node

Repo is now clean and ready for SvelteKit implementation.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verify clean state**

```bash
git status
git log --oneline -5
```

Expected: clean working tree. Log shows this commit at top.

---

### Post-Execution Checklist

Before starting the SvelteKit implementation, install these plugins in a new session:

```
/plugin install commit-commands
/plugin install hookify
/plugin install security-guidance
/reload-plugins
```
