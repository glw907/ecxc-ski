# ECN Nordic — Standalone Site Design

East Community Nordic (ecnordic.ski) launched as a standalone SvelteKit site,
forked from 907.life plumbing. Migrates to cairn-cms once cairn is battle-ready.

**Rationale:** ecnordic.ski needs to go live in the near term. cairn-cms is not
ready. Using 907.life's proven plumbing gets the site live without blocking on
cairn architecture work.

---

## Repo

New GitHub repo: `glw907/ecnordic-ski`

Hard fork of 907.life structure — keeps the posts pipeline, Cloudflare adapter,
GitHub Actions deploy workflow, Turnstile contact form pattern. 907.life-specific
content and theme are stripped and replaced with ECN equivalents.

Claude infrastructure mirrors 907.life: `CLAUDE.md`, `docs/STATUS.md`,
`BACKLOG.md`, cairn-pass skill wired in.

---

## Stack

Identical to 907.life:

| Layer | Choice |
|---|---|
| Framework | SvelteKit + TypeScript |
| Styling | Tailwind CSS v4 + DaisyUI v5 |
| Markdown (posts/events/pages) | remark + remark-gfm |
| Calendar UI | @schedule-x/svelte |
| Search | Pagefind |
| Adapter | @sveltejs/adapter-cloudflare |
| Contact form | Cloudflare Email Workers + Turnstile |
| Feeds | RSS 2.0 + JSON Feed 1.1 |

---

## Routes

| Route | Notes |
|---|---|
| `/` | Blog-style homepage (same pattern as 907.life) |
| `/[year]/[month]/[slug]/` | Post detail — 3-segment URL (no day) |
| `/calendar/` | @schedule-x monthly grid + ICS subscribe link |
| `/calendar.ics` | `+server.ts` endpoint, RFC 5545 from event markdown |
| `/about/` | Static page from markdown |
| `/talkeetna-camp/` | Static page from markdown |
| `/resources/` | Static page from markdown |
| `/contact/` | Standalone contact form |
| `/tags/[tag]/` | Tag pages |
| `/feed.xml`, `/feed.json` | RSS + JSON Feed from posts |

Static pages (about, talkeetna-camp, resources) are file-driven from
`src/content/pages/` — adding a `.md` file creates the route, no code changes.

---

## Content Pipeline

### Posts (`src/content/posts/*.md`)

Identical to 907.life. Frontmatter: `title`, `date`, `draft`, `description`, `tags`.

URL derived from filename: `2026-05-14-spring-dryland.md` → `/2026/05/spring-dryland/`

### Events (`src/content/events/*.md`)

New content type. Frontmatter:

```yaml
---
title: "Kincaid Classic Race"
date: 2026-12-06
end_date: 2026-12-07
location: "Kincaid Park"
type: race   # race | camp | clinic | training | social
---
```

`src/lib/events.ts` loads all event files at build time via `import.meta.glob`,
parses frontmatter, sorts by date. The `/calendar.ics` endpoint reads from this
same data layer.

### Static Pages (`src/content/pages/*.md`)

Frontmatter: `title`, optional `description`. Body is prose. Served at `/{slug}/`.

---

## Calendar

`@schedule-x/svelte` renders the monthly grid on `/calendar/`. Event data is
loaded by `src/lib/events.ts` and transformed to @schedule-x's event format
at route load time. An ICS subscribe button links to `/calendar.ics`.

`/calendar.ics` is a SvelteKit `+server.ts` endpoint that returns `text/calendar`
content (RFC 5545) generated from the same parsed event data.

---

## Theme

**Placeholder for launch.** Full visual design is a dedicated pass (see below).

Fonts are already present in `static/fonts/` from 907.life:
- **Body:** Alegreya Sans
- **Display:** iA Writer Quattro S
- **Mono:** iA Writer Mono S

Color tokens follow the same 17-token `--color-*` system as 907.life. Stubbed
with ECN hue anchors — crimson red (primary), navy blue (accent) — sufficient
to distinguish ECN from 907.life visually. Two DaisyUI themes: `ecn --default`,
`ecn-dark --prefersdark`.

### Design Pass (deferred)

Once structure and content are in place, run `/frontend-design` to produce a
full visual treatment: refined color token values, typography scale, nav layout,
homepage layout, schedule page design. This pass produces a spec before any
visual implementation begins.

---

## Deployment

**Domain:** Register `ecnordic.ski` via Cloudflare Registrar.

**Cloudflare Worker:** `ecnordic` — own `wrangler.toml` targeting `ecnordic.ski`.

**Secrets** (set via `npx wrangler secret put`):
- `TURNSTILE_SECRET_KEY` — new widget registered for ecnordic.ski
- `CONTACT_EMAIL` — ECN contact address

**GitHub Actions:** Push to `main` → build → pagefind → `wrangler deploy`.
Shared secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

---

## Editorial Workflow

Single author (git-push) to start. No CMS setup needed at launch. Sveltia CMS
can be wired in later if other contributors need web-based editing.

---

## Future: cairn-cms Migration

This repo is a temporary standalone. When cairn-cms matures, ecnordic.ski
migrates to the multi-site engine alongside 907.life. The content pipeline,
event schema, and route structure are designed to be compatible with the
cairn architecture spec (`2026-05-13-cairn-cms-multi-repo-architecture.md`).
