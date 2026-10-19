# ECN Nordic — Pass 1: Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `glw907/ecnordic-ski` GitHub repo, copy 907.life as the starting point, configure it for ECN, and install Claude infrastructure. Ends with a working (but unstyled) SvelteKit scaffold committed and pushed.

**Architecture:** Hard fork of 907.life. Strip content; update site constants, wrangler.toml, and package name. Claude infrastructure mirrors 907.life. No feature work — Pass 2 handles that.

**Tech Stack:** SvelteKit · TypeScript · adapter-cloudflare · GitHub Actions

---

> **Working directory:** Tasks 1–2 run on the local machine. From Task 3 onward, work inside `~/Projects/ecnordic-ski/`.

---

## File Map

| Path | Action | Responsibility |
|---|---|---|
| `~/Projects/ecnordic-ski/` | Create | New repo root |
| `package.json` | Modify | Update `name` |
| `src/lib/config.ts` | Modify | ECN site constants |
| `wrangler.toml` | Modify | ECN Worker name, domain, send_email |
| `src/content/posts/*.md` | Delete | Remove 907.life posts |
| `src/routes/about/` | Delete | Not needed — replaced in Pass 2 |
| `src/routes/archives/` | Delete | 907.life-only |
| `.github/workflows/deploy.yml` | Modify | Confirm secrets names |
| `CLAUDE.md` | Create | Claude instructions for this repo |
| `docs/STATUS.md` | Create | Pass tracking |
| `BACKLOG.md` | Create | Known issues and future work |
| `.claude/rules/development-workflow.md` | Create | cairn-pass trigger rule |

---

## Task 1: Create the GitHub repo and local scaffold

**Files:**
- Creates: `~/Projects/ecnordic-ski/`

- [ ] **Step 1: Create the GitHub repo**

```bash
gh repo create glw907/ecnordic-ski --public --description "East Community Nordic — ecnordic.ski"
```

Expected: `✓ Created repository glw907/ecnordic-ski on GitHub`

- [ ] **Step 2: Copy 907.life into a new local directory and reinitialise git**

```bash
cd ~/Projects
cp -r 907-life ecnordic-ski
cd ecnordic-ski
rm -rf .git
git init
git remote add origin git@github.com:glw907/ecnordic-ski.git
```

- [ ] **Step 3: Remove 907.life-specific content**

```bash
rm -f src/content/posts/*.md
rm -rf src/routes/about src/routes/archives
```

- [ ] **Step 4: Create ECN content directories**

```bash
mkdir -p src/content/events src/content/pages docs .claude/rules
```

- [ ] **Step 5: Initial commit and push**

```bash
git add -A
git commit -m "Initial scaffold from 907.life"
git branch -M main
git push -u origin main
```

---

## Task 2: Configure for ECN

**Files:**
- Modify: `package.json`
- Modify: `src/lib/config.ts`
- Modify: `wrangler.toml`

- [ ] **Step 1: Update `package.json` name**

Open `package.json`. Change the `name` field:

```json
"name": "ecnordic-ski",
```

- [ ] **Step 2: Rewrite `src/lib/config.ts`**

```typescript
export const SITE_URL              = 'https://ecnordic.ski';
export const SITE_TITLE            = 'ECN Nordic';
export const SITE_DESCRIPTION      = 'East Community Nordic — year-round training for junior skiers in Anchorage, Alaska.';
export const SITE_AUTHOR           = 'ECN Nordic';
export const SITE_LOCALE           = 'en-US';
export const FEED_MAX_ITEMS        = 20;
export const HOMEPAGE_FEATURED_COUNT = 1;
```

- [ ] **Step 3: Rewrite `wrangler.toml`**

```toml
name = "ecnordic"
compatibility_date = "2025-01-25"
compatibility_flags = ["nodejs_compat"]

main = ".svelte-kit/cloudflare/_worker.js"

[assets]
directory = ".svelte-kit/cloudflare"
binding = "ASSETS"

[[send_email]]
name = "SEND_EMAIL"
destination_address = "contact@ecnordic.ski"

[[routes]]
pattern = "ecnordic.ski"
custom_domain = true
```

- [ ] **Step 4: Confirm GitHub Actions workflow**

Open `.github/workflows/deploy.yml`. Verify the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secret names match. No other changes needed — the same secrets will be added to this repo in Pass 2 (deploy task).

- [ ] **Step 5: Build to confirm no broken imports**

```bash
npm install
npm run build 2>&1 | head -40
```

Expected: build succeeds or fails only on missing post content (no posts yet). Fix any TypeScript errors referencing `SITE_URL`, `SITE_TITLE`, etc. before continuing.

- [ ] **Step 6: Commit**

```bash
git add package.json src/lib/config.ts wrangler.toml
git commit -m "Configure for ECN Nordic"
```

---

## Task 3: Claude infrastructure

**Files:**
- Create: `CLAUDE.md`
- Create: `docs/STATUS.md`
- Create: `BACKLOG.md`
- Create: `.claude/rules/development-workflow.md`

- [ ] **Step 1: Create `CLAUDE.md`**

```markdown
# ecnordic.ski

East Community Nordic — SvelteKit + TypeScript, deployed to Cloudflare Workers.

@docs/STATUS.md

## Stack

SvelteKit · TypeScript · Tailwind CSS v4 · DaisyUI v5 · @schedule-x/svelte · remark + remark-gfm · Pagefind · @sveltejs/adapter-cloudflare

## Development Workflow

Pass-driven. Trigger phrases — "continue development," "next pass," "finish pass,"
"ship pass" — invoke the `cairn-pass` skill.

## Build & Dev

\`\`\`bash
npm install
npm run dev                      # dev server at http://localhost:5173
npm run build                    # build to .svelte-kit/cloudflare/
npm run build && npx pagefind --site .svelte-kit/cloudflare
\`\`\`

## New Post

Create \`src/content/posts/YYYY-MM-slug.md\`:

\`\`\`yaml
---
title: "Post Title"
date: YYYY-MM-DD
draft: false
description: "One sentence description."
tags: ["tag1"]
---
\`\`\`

## New Event

Create \`src/content/events/YYYY-MM-DD-slug.md\`:

\`\`\`yaml
---
title: "Event Name"
date: YYYY-MM-DD
end_date: YYYY-MM-DD
location: "Venue, Anchorage"
type: race
---
\`\`\`

## Worker & Secrets

\`\`\`bash
npx wrangler secret list
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put CONTACT_EMAIL
\`\`\`

## Deploy

Push to \`main\` → GitHub Actions → build + pagefind + wrangler deploy → live in ~2 min.
```

- [ ] **Step 2: Create `docs/STATUS.md`**

```markdown
# ecnordic.ski — Project Status

**Current state:** Pass 1 complete. Repo scaffolded, Claude infrastructure in place.

---

## Passes

| Pass | Goal | Status |
|------|------|--------|
| 1 | Scaffold: repo creation, ECN config, Claude infrastructure | ✓ Done |
| 2 | Build: 3-segment posts, events pipeline, calendar, static pages, contact, deploy | next |
| 3 | Design: /frontend-design visual treatment | planned |

---

### Next starter prompt (Pass 2)

> **Goal.** Build all ECN-specific features: update post routing to 3-segment
> URLs, add events data layer, @schedule-x calendar, ICS endpoint, static page
> routing, standalone contact page, placeholder theme, and first production deploy.
>
> **Plan:** \`docs/superpowers/plans/2026-05-14-ecnordic-pass-2-build.md\`
>
> **Approach.** Invoke cairn-pass to start.
```

- [ ] **Step 3: Create `BACKLOG.md`**

```markdown
# ecnordic.ski Backlog

## Known Issues

## Future Work

- [ ] Full visual design pass (Pass 3 — run /frontend-design)
- [ ] Real Turnstile site key after domain is live
- [ ] Sveltia CMS config for web-based editing by coaches/volunteers
- [ ] Replace @schedule-x with custom Svelte calendar component when migrating to cairn-cms
- [ ] Replace placeholder page content (about, talkeetna-camp, resources)
```

- [ ] **Step 4: Create `.claude/rules/development-workflow.md`**

```markdown
When the user says "continue development", "next pass", "start the
next pass", "finish pass", "ship pass", or "continue" in the context
of ecnordic-ski work, invoke the `cairn-pass` skill. It handles both
pass start (read STATUS, read plan, execute) and pass end (the
consolidation ritual: simplify, svelte-check, STATUS update, plan
archival, commit + push).
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md docs/STATUS.md BACKLOG.md .claude/rules/development-workflow.md
git commit -m "Add Claude infrastructure: CLAUDE.md, STATUS.md, BACKLOG.md, rules"
git push
```

Pass 1 complete. Open `~/Projects/ecnordic-ski/` in a new Claude Code session and run Pass 2.
