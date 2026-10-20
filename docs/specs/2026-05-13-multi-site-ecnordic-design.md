# Cairn CMS — Multi-Site & ECN Nordic

Design for evolving 907.life into **Cairn CMS**: a reusable SvelteKit
site engine supporting multiple independent sites from one codebase.
First new site: East Community Nordic (ecnordic.ski), a small nonprofit
supporting year-round Nordic ski training for high school and junior high
students in Anchorage, Alaska.

**Repo rename:** `907-life` → `cairn-cms`

---

## Approach

Single repo, environment-driven builds (Option A). One SvelteKit project
serves both sites. A build-time env var (`VITE_SITE`) selects the active
site's content, config, and theme. Each site deploys as its own independent
Cloudflare Worker.

Rejected alternatives:
- **Monorepo with npm workspaces** — overkill for two sites, one maintainer
- **Fork/template** — drift compounds over time, double maintenance burden

---

## Repository Structure

```
src/
  content/
    907-life/
      posts/                    ← existing posts (moved from src/content/posts/)
    ecnordic/
      posts/                    ← news & updates
      events/                   ← upcoming events (markdown with frontmatter)
      pages/                    ← static resource pages (about, coaches, etc.)
      schedule.yaml             ← recurring weekly training sessions
  sites/
    907-life/
      config.ts                 ← site constants (SITE_URL, SITE_TITLE, etc.)
      theme.css                 ← Spectral/Karla/Monaspace Neon, silk/dim tokens
    ecnordic/
      config.ts                 ← ECN site constants
      theme.css                 ← iA Writer Quattro/Alegreya Sans, ECN tokens
  lib/
    posts.ts                    ← shared; two static globs, selects by VITE_SITE
    events.ts                   ← new: ECN calendar data layer
    config.ts                   ← re-exports from $site-config alias
    feed.ts, utils.ts, types.ts ← unchanged
  routes/                       ← all shared; see routing table below
wrangler.907-life.toml
wrangler.ecnordic.toml
```

**Site selection mechanism:** `VITE_SITE` is replaced at build time by Vite.
`src/lib/posts.ts` contains two static `import.meta.glob` calls (one per
site content dir) and selects between them based on `VITE_SITE`. Active
site config and theme are injected via Vite aliases:
- `$site-config` → `src/sites/${VITE_SITE}/config.ts`
- `$site-theme` → `src/sites/${VITE_SITE}/theme.css`

`src/content/907-life/posts/` replaces the current `src/content/posts/` —
existing posts move, no content changes.

---

## ECN Routes

| Route | Source | Notes |
|---|---|---|
| `/` | Latest post featured, list below | Same homepage pattern as 907.life |
| `/[year]/[month]/[slug]/` | `content/ecnordic/posts/` | 3-segment URL (no day) |
| `/[year]/[month]/[day]/[slug]/` | `content/907-life/posts/` | 907.life keeps 4-segment |
| `/schedule/` | `events/` + `schedule.yaml` | Weekly grid + upcoming events |
| `/[page-slug]/` | `content/ecnordic/pages/` | Static pages at root; 404 if not found |
| `/contact/` | Existing contact form pattern | Standalone page (not embedded in about) |
| `/feed.xml`, `/feed.json` | ECN posts | News feed |

**Static pages** are file-driven: adding `coaches.md` to `content/ecnordic/pages/`
creates `/coaches/` with no code changes.

---

## Calendar / Schedule Feature

Two data sources rendered on the `/schedule/` route:

**Weekly training grid** (`schedule.yaml`):
```yaml
sessions:
  - day: Monday
    time: "4:00–6:00 PM"
    location: "Hillside Ski Area"
    group: "High School"
  - day: Wednesday
    ...
```

**Upcoming events** (`content/ecnordic/events/*.md`):
```yaml
---
title: "Kincaid Classic Race"
date: 2026-12-06
end_date: 2026-12-07
location: "Kincaid Park"
type: race   # race | camp | clinic | social
---
```

`src/lib/events.ts` loads and parses both. Past events are filtered at
build time (date < build date) — the site must be rebuilt for stale events
to disappear. A weekly scheduled GitHub Actions run handles this automatically.

---

## Visual Identity

ECN uses red and blue drawn from the Bettye Davis East Anchorage High School
color family (the affiliated school), but in ECN's own interpretation — not
the school's exact branding or logo.

- **Primary:** Crimson red (deeper/richer than school red)
- **Accent:** Navy blue (darker, more refined than school blue)
- **Background:** Warm off-white
- **Dark mode:** Deep navy with red/white accents
- **Body font:** Alegreya Sans (already in `static/fonts/`)
- **Display font:** iA Writer Quattro (already in `static/fonts/`)
- **Mono:** iA Writer Mono S (already in `static/fonts/`)

Theme tokens follow the same 17-token `--color-*` system as 907.life.
ECN gets its own DaisyUI theme names (e.g., `ecn --default`, `ecn-dark --prefersdark`).

**Design pass is a separate planned pass** — the infrastructure pass ships
ECN with a placeholder theme; visual polish comes after.

---

## Deployment

**Two Cloudflare Workers:**

`wrangler.907-life.toml` — unchanged, deploys to `907.life`

`wrangler.ecnordic.toml`:
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
destination_address = "<ecn-contact-email>"  # fill in before first deploy

[[routes]]
pattern = "ecnordic.ski"
custom_domain = true
```

**Build commands:**
```bash
# 907.life (unchanged)
VITE_SITE=907-life npm run build && npx wrangler deploy --config wrangler.907-life.toml

# ECN
VITE_SITE=ecnordic npm run build && npx wrangler deploy --config wrangler.ecnordic.toml
```

**GitHub Actions:** Two workflow files. Each triggers on pushes touching its
site's content directory or shared `src/`. Shared secrets: `CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_ACCOUNT_ID`. ECN Worker secrets (set separately):
- `TURNSTILE_SECRET_KEY` — new Turnstile widget registered for ecnordic.ski
- `CONTACT_EMAIL` — ECN contact address

**Pagefind:** Each build generates its own index in `.svelte-kit/cloudflare/pagefind/`.
Run after build: `npx pagefind --site .svelte-kit/cloudflare`.

---

## CMS (Sveltia)

ECN gets a second CMS config at `static/admin/ecnordic-config.yml`, scoped
to `src/content/ecnordic/`. Collections:

- **posts** — `src/content/ecnordic/posts/`, fields: title, date, draft, description, tags, body
- **events** — `src/content/ecnordic/events/`, fields: title, date, end_date, location, type, body
- **pages** — `src/content/ecnordic/pages/`, fields: title, body
- **schedule** — `src/content/ecnordic/schedule.yaml`, structured editor for sessions

Coaches and parent volunteers log in via GitHub OAuth. GitHub permissions
are repo-level — contributors get read/write access to the whole repo.
Sveltia scopes their CMS view to ECN content only, so in practice they
never see or touch 907.life content.

The ECN admin UI is served at `/admin/` when `VITE_SITE=ecnordic`. 907.life
admin remains at its own `/admin/`.

---

## Implementation Passes

| Pass | Scope |
|---|---|
| **1 — Claude infrastructure** | Adopt poplar-style dev patterns: `cairn-cms-pass` skill, BACKLOG.md, richer STATUS.md with starter prompts, path-scoped `.claude/rules/` for Svelte/CSS |
| **2 — Repo rename + multi-site engine** | Rename repo to `cairn-cms`; restructure for `VITE_SITE` builds, move content dirs, Vite aliases, two Worker configs, two GitHub Actions workflows, ECN skeleton with placeholder theme |
| **3 — ECN design** | Color tokens, typography, layout for org site (nav, homepage, schedule page) |
| **4 — ECN features** | Calendar/schedule route, static page routing, Sveltia CMS config for ECN |

---

## Domain

Register `ecnordic.ski` via Cloudflare Registrar (~$50.20/year at-cost).
