# EC Nordic Site Refresh: Design Spec

**Date:** 2026-06-04
**Status:** Approved, ready for writing-plans
**Source brief:** the "EC Nordic Site Refresh: Claude Code Brief and Build Spec" provided by the user.

This spec turns that brief into a sequenced build. The brief is the content authority; this document
records the decomposition, the component work, the structural changes, and the facts that must read
identically across pages. Where the brief and this spec disagree on content, the brief wins. Where they
disagree on sequencing or repo state, this spec wins.

## Goal

Refresh ecnordic.ski to the brief's information architecture: six primary pages plus a utility Archives
page, a complete first-draft of every page in the coach voice, and the components the new pages need.
"Complete" means finished prose, not stubs. The draft is a first pass for the team to edit, not a green
light to publish. Verbatim blocks are placed as written. No legal or waiver text is drafted or finalized.

## Repo state: what already exists

The brief was written against an earlier site and overstates the gaps. Verified against the repo on
2026-06-04:

- **Home page exists** (`src/routes/+page.svelte` plus `+page.server.ts`): a bespoke layout with a
  welcome card (hero image plus `WELCOME_BLURB` from `$lib/config`) and a recent-posts / news feed. The
  post feed the brief lists as a gap is already live.
- **Contact form exists** and runs on a remote function (`src/routes/contact/`, `$lib/contact.remote.ts`,
  Pass 9). The brief's "Contact form gap" is done; this round writes the page copy only.
- **Tag index, per-tag pages, and feeds exist**: `/tags`, `/tags/[tag]`, `/feed.xml`, `/feed.json`. Most
  Archives infrastructure is in place. What is missing is a single `/archives` landing page that gathers
  a tag index, posts-by-year, and feed links in the 907.life mold.
- **Nav is config-driven** (`PRIMARY_NAV` in `$lib/config`), so the nav change is a config edit plus the
  cairn index.
- **Pages render** through the `[...path]` catch-all using the cairn public surface.
- **Images:** only `static/images/ec-nordic-hero.webp` and `static/images/profile.jpg` exist.

The genuine new code is therefore smaller than the brief implies: an `aside` directive (plus an `info`
glyph), `figure` / `gallery`, `roster`, a Training-only `toc`, an `/archives` page, and the home-editable
wiring. The bulk of the work is content.

## Decisions

Settled with the user during brainstorming:

1. **Framing.** A standalone spec decomposed into a few sequenced plans, executed via
   subagent-driven-development, recorded in STATUS.md and BACKLOG.md.
2. **Photos.** Build `figure` / `gallery`, reference them with a bracketed placeholder note (the
   `[PLACEHOLDER ...]` convention already used in `training.md` and `crewlab.md`; match that file's exact
   punctuation). No real photos are invented. Photo authenticity stays a pre-publish confirmation.
3. **Home.** Keep the bespoke layout and the template post feed. Make the welcome / intro copy
   CMS-editable by sourcing it from a `home` content entry instead of the hardcoded `WELCOME_BLURB`
   constant. The featured post and news feed stay template-driven from the posts collection; the post
   "story" is not separately editable on Home.
4. **Schedule block.** Start the weekly day/focus/time rows as a `grid`. Build a dedicated `schedule`
   component only if the grid reads poorly. Recorded as an optional task in Plan 3.

## Canonical facts (anti-drift source of truth)

Every content task quotes from this block rather than rephrasing. Four pages drafted separately stay in
sync only if the load-bearing facts have one wording. Any change to a fact here is a single edit that
propagates to every page that states it, and (for activities) requires attorney review.

**Name.** "East Community Nordic" on first reference, "EC Nordic" after. Never "ECN."

**Activities (the enumerated set).** Running, mountain biking, strength training, roller-skiing. Running
and strength are the weekly core. Mountain biking and roller-skiing are occasional off-day sessions, not
every week. All four are enumerated in the waiver regardless of frequency. Helmets are required for
roller-skiing and mountain biking everywhere they appear. The set reads identically on Home, About,
Training (activities and common questions), and the waiver. Adding or removing an activity requires
attorney review and one matching update across the waiver and every page.

**Camp activities (additional).** At camp, lake use (boats, paddleboards, swimming), a sauna, and hill
bounding with poles are added. The waiver must enumerate whatever athletes actually do at camp.

**Eligibility.** Students entering high school (rising 9th graders) through 12th grade, plus high school
graduates home from college for the summer. Graduates may train and are encouraged into volunteer team
leadership. No junior high below entering-9th. Stated identically on About, Training (Who can join and
Common questions), and reflected on Home. Graduate leaders are adults working with minors, so this stays
consistent with the SafeSport model on CrewLAB and the volunteer model on Volunteers.

**Schedule.** Practices Monday, Wednesday, and Friday, June 1 through August 19, 2026.
- Monday: running, outdoor strength, spenst. Always at East. 10:30 AM to 12:15 PM.
- Wednesday: intervals, hill work, bounding. 10:30 AM to 12:15 PM.
- Friday: over-distance (OD). 10:30 AM to 12:30 PM.

These are practice times and do not include transit. Practice starts at 10:30 AM sharp; late arrivals
miss the group. Locations: East High, Hillside (Hilltop parking lot), Kincaid Park, Bartlett trails, and
Chugach front range trailheads, posted per practice on CrewLAB. No carpool on Mondays (always East). For
off-site days a carpool leaves East (arrive by 10:00 AM) with a return carpool to East; parents may pick
up at East or at the site. Always check CrewLAB; the location can change. Same dates and times on About
and Training.

**Camp.** July 21 to 24, 2026: leave the morning of the 21st, return the evening of the 24th. Four days,
three nights. Cabins on a lake near Talkeetna, a dry cabin (outhouses, no showers). Amy Purevsuren runs
the camp. Training twice a day. Free with requested donations per ability to pay. Camp registration and
consent are separate from summer-training registration; both are handled in CrewLAB. The exact site and
address go to registered families in CrewLAB, not the public page. Summer training and the camp are two
programs built to go together: most athletes do both, and an athlete may do either on its own. Inaugural
season, so phrase "most do both" as the intended model, not observed history. Stated on Training (intro,
the Talkeetna camp section, and Common questions).

**Access framing.** The program is need-blind: donations and ability to pay do not affect who can join,
and EC Nordic does its best to make room for any athlete who fully commits to their training. Use this on
About (Who can join, Costs & volunteers, Program philosophy), in the origin story, and on Training (Who
can join).

**Non-affiliation.** East High, and any school, appears only as a geographic reference ("East Anchorage")
or a meeting venue, never as a sponsor, affiliation, or home team. East High is the carpool hub and the
Monday site, as a venue. The coaches' school roles are their own positions, not EC Nordic affiliations.
Sitewide.

**Inaugural season.** 2026 is the first season. No copy implies a track record or past seasons.
Recurring-model phrasing ("each summer," "the annual camp") is fine as the intended model, not as claimed
history.

**Waiver.** The liability waiver is signed digitally in CrewLAB and only there: no print, mail-in, or
third-party route. A guardian signs for minors; adults (such as graduates home from college) sign for
themselves. A signed waiver must be on file before the first session, including before the camp. Every
page that mentions the waiver points to CrewLAB. Keep two senses distinct: "liability waiver" for the
form everyone signs, "cost help" (or "fee assistance") for help with a donation.

**Site vs. CrewLAB boundary.** Operational, live, transactional, and conversational content stays in
CrewLAB; the site links to it and does not duplicate it. The waiver, parent handbook, gear and vendor
info, and the camp's exact address live in CrewLAB.

**Post tags (controlled vocabulary).** `training`, `racing`, `results`, `events`, `camp`,
`announcements`. Do not invent tags.

## Decomposition: three plans

The plans are vertical slices. Each leaves the site building and a little more finished. Content can be
drafted against existing directives, so the order is structure first, then the lighter pages, then the
heavy hub.

### Plan 1: Structural floor and shared components

The skeleton the rest hangs on. End state: site builds, six-page nav, archives reachable, no dead links,
every shared directive available.

**IA / structure:**
- `src/content/.cairn/index.json`: add a `home` entry and a `contact` entry, remove `resources`, retitle
  the Volunteers entry to "Volunteers & Coaches." Confirm `about`, `crewlab`, `training` entries and
  their permalinks.
- `PRIMARY_NAV` in `$lib/config`: the six primary pages in order (Home, About, Training, Volunteers &
  Coaches, CrewLAB, Contact). Archives is not in primary nav.
- Footer: add an Archives link. Home gets a "see all posts" link to Archives.
- Retire `src/content/pages/resources.md`; its content folds into CrewLAB (waiver, handbook, gear) and
  Training. Verify nothing else links to it.
- Link repointing: the welcome post's `/waiver` points to CrewLAB (`cairn:pages/crewlab`). Strip any
  `resources` links. Record launch-time redirects for `/resources` and `/waiver` in BACKLOG; do not build
  them now (the site is in beta).

**Shared components (code; gated by svelte-check + build):**
- `aside` directive: a semantic `<aside>`, styled lighter than a card, an inline offset block (not a
  floated margin note) so it behaves on mobile. Optional title and body; optional icon. Add an `info`
  glyph to `src/lib/markdown/icons.ts` for it. Never used for warnings (those are `alert`). Register in
  `src/lib/markdown/components.ts` with an insert template.
- `figure` directive: a captioned single image. `gallery` directive: a small set of images. Both
  reference real photos; with none staged, content uses the bracketed placeholder note. Match existing
  daisyUI/Tailwind styling.
- `roster` directive: repeating name / role / short bio items with an optional photo, for the coaches.
- `/archives` page (template-level): a tag index with per-tag counts, posts grouped by year (newest
  first, each a dated linked title with its tags), and feed links at the foot. Generated from the posts
  collection; reuses the existing tag and feed infrastructure.

**Home wiring:**
- A `home` content entry feeds the welcome card's intro copy. The bespoke `+page.svelte` layout and the
  post feed stay. Replace the `WELCOME_BLURB` constant path with the rendered `home` body.

### Plan 2: Carry-over and revise pages

The four pages that do not need a table of contents. One implementer per page (four tasks). Each uses
`aside`, `roster`, or `figure` delivered in Plan 1.

- **About** (revise from current `about.md`): broaden Who can join to the canonical eligibility range,
  add the need-blind framing to the second philosophy principle and Costs, place the **origin story
  verbatim**, repoint the CTA from `/waiver` to CrewLAB. Keep the section order. Update the location list
  to the canonical set.
- **CrewLAB** (extend current `crewlab.md`): keep the four existing sections; add the Waiver-and-forms
  block moved from Resources (CrewLAB-only signing, guardian-for-minors and adult-self-signing, handbook
  and gear info); move the SafeSport definition into an `aside`; state need-blind donations (program and
  camp).
- **Volunteers & Coaches** (revise current `volunteers.md`): place the **three bios verbatim** (leads
  first) via `roster`; keep the Help out block and add the graduate-leadership line. Keep one page, two
  sections.
- **Contact** (new copy for the existing form page): how to reach the program, who reads it, that
  joining / donation / volunteering questions are welcome, and that the waiver is signed in CrewLAB, not
  here.

### Plan 3: Training hub

The largest page and the one with its own component. One plan, sectioned per the brief's Training map:
intro, schedule, activities, training groups (new), who can join, what to bring, Talkeetna camp, sign up,
your first session, common questions.

- **`toc` component** (Training-only, built here): a post-pass that collects the page's `<h2>` slugs and
  fills a `:::toc` placeholder, so it stays in sync rather than being hand-maintained. Replaces the
  existing hand-rolled `<nav class="page-toc">`.
- **Schedule rows:** a `grid` of day/focus/time first. Build a `schedule` key-value component only if the
  grid reads poorly (optional task).
- **Asides:** gloss "spenst" and "OD / over-distance" in `aside`s for non-Nordic parents.
- The camp section runs long on purpose (the reader is committed). The two separate sign-ups (summer,
  camp) are stated consistently with the intro, Sign Up, and the CrewLAB flow.

## Component specs

| Component | Plan | Kind | Notes |
|-----------|------|------|-------|
| `aside` + `info` glyph | 1 | directive | semantic `<aside>`, inline offset, optional title/icon, never for warnings |
| `figure` / `gallery` | 1 | directive | captioned image / small set; placeholders until real photos staged |
| `roster` | 1 | directive | name / role / bio, optional photo; coaches |
| `/archives` page | 1 | template | tag index + posts-by-year + feeds, from posts collection |
| home-editable wiring | 1 | template | `home` content entry feeds the welcome card; layout and feed stay |
| `toc` | 3 | directive | Training-only post-pass over `<h2>` slugs; fills `:::toc` |
| `schedule` | 3 | directive | optional; only if the grid reads poorly |

All directive work touches `src/lib/markdown/components.ts` (and `icons.ts` for the `info` glyph). Follow
the existing `ComponentDef` shape and the cairn `build(ctx)` slot model. Each gets an `insertTemplate` so
the admin editor can insert it.

## Cross-cutting constraints

These hold sitewide and are each restated on the sections they touch. They live in full in the
canonical-facts block above: activity enumeration, camp registration separateness, the schedule,
eligibility, access framing, non-affiliation, inaugural season, the site / CrewLAB boundary, the
CrewLAB-only waiver, and the two senses of "waiver."

## Verbatim blocks (place as written)

### Origin story (About)

> East Community Nordic was founded in 2026 by Amy Purevsuren and Geoff Wright. Anchorage is home to two of the most storied Nordic ski clubs in the country, APU Nordic and Alaska Winter Stars, whose athletes have cemented Alaska's reputation for producing extraordinary Nordic skiers. But year-round professional coaching is out of reach for many families. EC Nordic exists to help fill that gap. We're not trying to replace APU or Winter Stars, and we can't match that level of support. What we offer is structured summer training and coaching, open to any athlete who's driven enough to put in their own work, regardless of ability to pay. For a committed skier or runner, a strong summer is the base the season is built on.

### Coach bios (Volunteers & Coaches), leads first

> Geoff Wright leads the summer session. He's a lifelong runner and cyclist who came to cross-country skiing as an adult, and he's spent 13 years coaching NSAA's Junior Nordic program, eight of them as site director at Kincaid. He was an assistant coach at West High in 2024/25 and now coaches at Bettye Davis East. He's raised three competitive cross-country runner-skiers, the youngest now racing and training with the APU Nordic Elite Team. When he's not coaching, he loves snow, trails, books, general nerdery, and Sunday morning pancakes.

> Amy Purevsuren runs the Talkeetna camp and is the head nordic coach at Bettye Davis East High School. She raced for Western Colorado, where she was a seven-time All-American and won the 1997 national title in the 15K freestyle, the first woman in school history to take an individual skiing national championship. Away from skiing, she teaches high school English. She got her start in the Peace Corps in Mongolia and has taught for 11 years in rural Alaska since, set on making her students lifelong readers and writers. She lives in Anchorage with her husband and three kids, and the family reads, camps, and gets outside together.

> Duncan Wright, Geoff's oldest, coaches the Friday distance sessions. He's a lifelong competitive mountain runner, cyclist, and skier, with top-10 finishes at Crow Pass and the Kesugi Ridge 50K, where he was the youngest in the field. His latest endurance feat was second place at the Kenai 250, a 250-mile mountain bike race and one of the most grueling in the country. He holds an Outdoor Studies degree from APU with a concentration in snow science. When he's not plotting his next big race, he reads science fiction, works on local trails, builds bikes, and makes beautiful things out of wood.

## Pre-publish checklist (not implementation work)

The draft proceeds with these open. They block publish, not drafting. Where a fact is missing, copy
carries a bracketed placeholder note and invents nothing. Record each as a BACKLOG item.

**Attorney review (you draft structure, not legal text):**
- The waiver's activity, risk, and transport enumeration, matched to the site's activity list.
- Adult-versus-minor signing language.
- The separate camp consent: overnight stays, volunteer-vehicle transport, lake and sauna activities.
- Coverage for routine carpool transport in volunteer vehicles (the standing East carpool, not only at
  camp).

**External confirmation:**
- The current waiver enumerates exactly the site's activities (running, mountain biking, strength
  training, roller-skiing).
- CrewLAB supports guardian signing and adult self-signing, and donation collection, and the join/invite
  link is current.
- Real, authentic photos exist for `figure` / `gallery`.

**Launch-time redirects:** add `/resources` and `/waiver` redirects when the beta launches.

## Secondary mission: cairn DX findings

Collect cairn-cms improvement suggestions as the work surfaces them. This continues the practice from the
0.21 and 0.24 migrations. Append findings to `docs/cairn-dx-findings.md` in this repo as each plan hits
friction (a directive that was awkward to register, a public-surface rough edge, a build-backstop gap).
At the end of the initiative, file an engine-facing summary into `../cairn-cms/docs/` matching the
existing DX-feedback file naming, so the engine backlog stays current. The findings are a deliverable of
the initiative, not a blocker on any plan.

## Out of scope

- Finalizing any legal or waiver text.
- Building `/resources` and `/waiver` redirects (deferred to launch).
- The `faq` accordion and `steps` components (the bold-lead grid and an ordered list cover them for now).
- Real photo sourcing (a pre-publish confirmation, not a build task).

## Definition of done

The site builds and the pages render. Nav shows the six primary pages plus a footer Archives link. No
internal link points to a removed route. The activity list reads identically on Home, About, and
Training. CrewLAB is the only waiver and sign-in path referenced anywhere. The bios and origin story are
placed verbatim. Every placeholder is recorded with its file and section. STATUS.md and BACKLOG.md
reflect the new state, and the cairn DX findings file carries whatever the work surfaced.
