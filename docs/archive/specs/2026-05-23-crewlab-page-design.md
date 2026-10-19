# Replace the Calendar feature with a CrewLAB page

**Date:** 2026-05-23
**Status:** Approved

## Goal

EC Nordic has moved scheduling, team communication, workouts, and team
management into [CrewLAB](https://crewlab.io). The website's home-grown calendar
(page, ICS feed, events pipeline, homepage "this week" list) is now redundant.
Remove the entire calendar feature and add a CrewLAB page that explains how the
team uses the app and how to join.

## Decisions (settled)

- **Removal scope:** the *entire* calendar feature, not just the page.
- **Page format:** a markdown content page rendered through the existing
  `[slug]` route + `decoratePage` system (like About and Training).
- **URL / nav label:** `/crewlab`, nav label "CrewLAB".
- **Homepage hero:** the right-hand "This Week's Schedule" card becomes a
  compact "Recent posts" card — latest 3 post titles + dates as links. The
  separate "News & Updates" section below stays as-is.
- **Invite link:** `https://crewlab.app.link/5g7vhhYEn3b`, wired into the
  CrewLAB CTA and the existing `[CREWLAB_URL]` placeholder in `training.md`.
- **Dropped feature:** CrewLAB's boat "lineups" is rowing-specific and does not
  map to a nordic dryland program, so it is omitted from the feature list.

## Part 1 — Remove the calendar feature

**Delete:**

- `src/routes/calendar/` (`+page.svelte`, `+page.ts`, `+page.server.ts`)
- `src/routes/calendar.ics/+server.ts`
- `src/content/events/` (all 5 event markdown files)
- `src/lib/events.ts`, `src/lib/ics.ts`
- `src/tests/ics.test.ts`, `src/tests/events.test.ts`

**Edit:**

- `src/routes/+page.server.ts` — drop `thisWeek` / `getThisWeekEvents`; load
  posts only.
- `src/routes/+page.svelte` — replace the schedule card with a "Recent posts"
  card (latest 3 `data.posts`, title + date, linking to `postUrl`). Remove
  now-unused event imports/CSS.
- `src/lib/components/Nav.svelte` — Calendar link → `{ href: '/crewlab',
  label: 'CrewLAB' }`.
- `src/lib/types.ts` — remove `CalendarEvent` / `EventType`.
- `src/lib/utils.ts` — remove event/calendar-only helpers
  (`eventDateRange`, `formatTimeRange`, `getThisWeekRange`, plus any others that
  become dead once events are gone; keep helpers still used by posts/feeds).
- `package.json` — remove `@schedule-x/svelte`, `@schedule-x/theme-default`,
  `temporal-polyfill`.
- Content links to `/calendar` → `/crewlab` in
  `src/content/posts/2026-05-14-welcome.md` and `src/content/pages/training.md`
  (the latter also resolves its `[CREWLAB_URL]` placeholder to the invite link).

After edits, grep for any remaining `/calendar`, `schedule-x`, `Temporal`,
`CalendarEvent`, `getThisWeek` references and confirm none are left dangling.

## Part 2 — The CrewLAB page

**Content:** `src/content/pages/crewlab.md` (copy approved in brainstorming).
Sections: lede → *What CrewLAB is* → *What we use it for* → *Free for athletes*
→ *Getting started*.

**Decoration:** add `decorateCrewlab` in `src/routes/[slug]/+page.svelte`,
wired with `if (page.slug === 'crewlab') return decorateCrewlab(page.html)`, and
a `[data-page="crewlab"]` arm added to the shared module CSS selectors (join the
existing `:is([data-page="about"], [data-page="training"])` lists).

Section → primitive mapping:

| Section | Primitive |
|---|---|
| *What CrewLAB is* | plain module card (`ecCard`) |
| *What we use it for* | `.ec-grid` of parallel titled points (bold term + note), same as Training's `what-we-do` |
| *Free for athletes* | plain module card |
| *Getting started* | centered CTA card (`ecCta`), the page's one focal-icon accent; button → invite link |

**Icons:** reuse meaning-appropriate entries from the existing `ICON` map where
they fit (e.g. `what-we-do` for the feature grid header, `getting-started` flag
for the CTA). Add new Phosphor regular-weight glyphs only for slugs with no
sensible existing match (e.g. a chat/phone glyph for "what CrewLAB is", a
free/tag glyph for "free for athletes"). No glyph repeats within the page.

## Verification

- `npm run build` succeeds with no schedule-x / Temporal references.
- svelte-check clean.
- Headless screenshot of `/crewlab`, `/` (hero), light + dark, mobile width —
  matches the About/Training design language.
- `vitest` passes (calendar tests removed, no orphaned imports).
