# Site Refresh Plan 2: Carry-over and Revise Pages

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the three carry-over content pages (About, CrewLAB, Volunteers & Coaches) to a finished first draft in the coach voice, fold the Resources page into CrewLAB, and retire Resources, so the only page left for the refresh is the Training hub (Plan 3).

**Architecture:** This is the second of three plans from `docs/superpowers/specs/2026-06-04-site-refresh-design.md`. It is almost entirely content. Pages are filename-routed markdown under `src/content/pages/`, rendered through cairn's public surface and the container directives that Plan 1 landed. Each page is rewritten as a complete file so the prose clears the content guard in one pass. Two verbatim blocks (the origin story on About, the three bios on Volunteers) are placed exactly as written. Contact copy already shipped in Plan 1, so it is out of scope here.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Tailwind 4 + DaisyUI 5, `@glw907/cairn-cms` (`^0.24.0`), vitest.

---

## What every task needs to know

Read this section before starting any task.

**Source of truth for facts.** The canonical-facts block in the design spec (`docs/superpowers/specs/2026-06-04-site-refresh-design.md`, lines 57 to 124) is the authority for the load-bearing facts: the name, the activity set, eligibility, the schedule, the camp, the access framing, non-affiliation, the inaugural season, the waiver, and the site/CrewLAB boundary. The full target content for each page is written out in the task below, already aligned to those facts. Place the content as given. If you spot a contradiction between this plan and the spec's canonical block, stop and report it rather than guessing.

**Verbatim blocks.** The origin story (About) and the three bios (Volunteers) are quoted from the spec and must be placed character-for-character. Do not reword them, even if a later editorial pass would flag a word in them. They read as written on purpose.

**The content guard (`prose-guard`) runs on every Write and Edit to `src/content/**/*.md`.** It denies the write on a hard tell. Verified behavior on 2026-06-04:
- A hard tell denies the write: an em dash in prose, a banned word (for example `seamless`), or a banned opener (`Moreover`, `Additionally`, `Furthermore`).
- The guard exempts em dashes inside a `[PLACEHOLDER ...]` bracket, but do not rely on that. Em dashes are a real tell even where the guard lets them through, and the bracket exemption is how ten of them once piled up unseen in `training.md`. Write placeholders with a colon: `[PLACEHOLDER: confirm the dates.]`, never `[PLACEHOLDER — confirm the dates.]`.
- Advisory tells do not block: a tricolon, a passive voice with a named agent, or a soft word like `foster` or `boost`. The guard reports them and allows the write.
- The current `about.md`, `crewlab.md`, and `volunteers.md` each fail the guard today because of prose em dashes. The full-file content in each task below is already em-dash-free in prose, so a complete `Write` of that content clears the guard. Use `Write` (full file), not piecemeal `Edit`, for the three page rewrites, so no stale em dash from the old file survives.

**The editorial rules** live in `.claude/rules/content.md` and `docs/content-guide.md`. The voice is a friendly, competent coach writing to high school athletes and their parents. The provided content already follows them. The wrap-up task (Task 5) runs the `content-cleanup` skill across the rewritten pages as a backstop, skipping the verbatim blocks.

**After any content file changes, regenerate the committed manifest:** `npm run cairn:manifest` rewrites `src/content/.cairn/index.json`. The build's `verifyManifest` fails on drift, so the manifest goes in the same commit as the content.

**Characterization snapshots.** Two snapshot suites under `src/tests/markdown/__snapshots__/` snapshot every page's rendered HTML. Rewriting a page changes its snapshot, which is the expected consequence. When `npm test` reports a snapshot mismatch for the page you changed, regenerate with `npx vitest run -u`, then `git diff` the two `.snap` files and confirm the only change is the page you edited. If any other page's snapshot moved, stop and report. Commit the regenerated snapshots with the content.

**Internal links.** Use the cairn token form `cairn:pages/crewlab` for a markdown link to CrewLAB in prose (this is what the content graph tracks, and what the welcome post uses). For a raw-HTML button (`<a class="download-link">`), use the literal path `/crewlab`, since a raw href is not token-resolved. Leave the existing literal links to `/training`, `/volunteers`, and `/contact` as they are.

**Project gate (run before every commit):**

```bash
npm run check && npm test && npm run build
```

Expected: `check` 0 errors, `test` all passing, `build` exits 0.

---

## Task 1: About page

Rewrite `src/content/pages/about.md` to the canonical facts. The changes from the current file: broaden Who can join to the full eligibility range and add the graduate-leadership line, add the need-blind framing to Who can join, the second philosophy principle, and Costs, place the origin story verbatim as a new passage after the intro, repoint every waiver reference to CrewLAB, and update the location list and the season dates to the canonical set. Keep the section order otherwise.

**Files:**
- Modify (full `Write`): `src/content/pages/about.md`
- Run: `npm run cairn:manifest`

- [ ] **Step 1: Write the full About page**

Replace the entire contents of `src/content/pages/about.md` with this. The `Why we started` passage is the verbatim origin story from the spec; do not alter it.

```markdown
---
title: "About East Community Nordic"
---

East Community Nordic is a free, volunteer-run summer training group for Anchorage high school Nordic skiers and cross-country runners. We build the fitness, skills, and outdoor habits that carry kids through the ski season and past graduation.

The group is informal and volunteer-run. The volunteers are unpaid: parents, former racers, and local athletes who want to keep kids on snow and on trails. We are not affiliated with the Anchorage School District, East High School, or any other school, club, or business. The name refers to East Anchorage, where the program is based, not to any institutional connection. Athletes are welcome from anywhere in the area, whether they go to a public school, a private school, or homeschool.

:::passage[Why we started]
East Community Nordic was founded in 2026 by Amy Purevsuren and Geoff Wright. Anchorage is home to two of the most storied Nordic ski clubs in the country, APU Nordic and Alaska Winter Stars, whose athletes have cemented Alaska's reputation for producing extraordinary Nordic skiers. But year-round professional coaching is out of reach for many families. EC Nordic exists to help fill that gap. We're not trying to replace APU or Winter Stars, and we can't match that level of support. What we offer is structured summer training and coaching, open to any athlete who's driven enough to put in their own work, regardless of ability to pay. For a dedicated skier or runner, a strong summer is the base the season is built on.
:::

::::card[What we do]{icon="path"}
The high school ski season is short, about four months. The eight months around it are where most of the fitness gets built or lost.

EC Nordic's summer training program runs from June 1 to August 19, 2026. We meet three mornings a week, Monday, Wednesday, and Friday. Running and strength training are the weekly core, with mountain biking and roller-skiing mixed in on some days. We train across the usual Anchorage spots: East High, the Hillside trails, Kincaid Park, Bartlett, and the Chugach front range. The weekly plan also includes workouts to do on your own between group sessions. Full details on the [training page](/training).

Each summer includes a four-day camp near Talkeetna in July, July 21 to 24 in 2026. The team trains twice a day and stays in cabins on a lake. Full details in the [Talkeetna Camp section](/training#talkeetna-camp) of the training page.
::::

::::alert[Risks]{role="caution"}
Running, mountain biking, roller-skiing, and strength training all carry inherent risks. Falls, collisions, equipment failure, and wildlife encounters are all possible, and no amount of care from volunteers or participants removes them. A signed liability waiver must be on file before any athlete's first session. It lays out the activities and risks in full, and it is signed in CrewLAB. A guardian signs for an athlete under 18. An adult athlete signs for themselves. Sign the [liability waiver](cairn:pages/crewlab) in CrewLAB.
::::

::::card[Who can join]{icon="users-three" role="secondary"}
The group is open to students entering high school (rising 9th graders) through 12th grade, plus high school graduates home from college for the summer. Graduates can train with us, and we encourage them into volunteer team leadership. Training is designed around Nordic skiing, and the same work benefits cross-country runners and any high school athlete trying to stay in shape over the summer.

The program is need-blind. Donations and ability to pay do not affect who can join, and we do our best to make room for any athlete who fully commits to their training.

Athletes aiming at Junior Nationals or Arctic Winter Games team selections train alongside kids who have never followed a structured workout before. The weekly plan accommodates both: personalized guidance for athletes chasing specific competitive goals, and a clear starting point for kids new to year-round endurance training.

Athletes train at their own pace. The spread across the group can be wide, particularly on endurance days, and adult volunteers come along to run, ride, or ski with both the faster and the slower kids.
::::

::::grid[Program philosophy]{icon="compass"}
Five core principles guide our program design and the decisions we make for every athlete:

- **Total person first.** A solid sleep schedule, good food, academic success, and community engagement are not tradeoffs against athletic ambition. They are core ingredients for both athletic success and a healthy, meaningful life. We help athletes build the habits that let them succeed in sport and in the rest of their lives.
- **Open to any committed athlete.** The program is free and need-blind. Donations and ability to pay do not affect who can join. Anyone who needs help affording camp, gear, or a ride can ask, with no questions about family finances. All we ask in return is a strong commitment to training and a willingness to give back to the community.
- **High school sports matter.** Being on a high school team is a once-in-a-lifetime opportunity that sets the stage for a better, healthier life. EC Nordic aims to complement that opportunity. We provide training, knowledge, and support to help students make the most of their high school teams.
- **A lasting bond with trails and skiing.** We want to help athletes find competitive success in high school and beyond, but our larger mission is to help teens develop a lifelong love for skiing, trails, and the outdoors. We work hard in training, and we also strive to find joy and community every day.
- **Support the community that supports you.** Our athletes are expected to perform community service as part of their membership in EC Nordic, including trail work and helping at community events and races. Our volunteers organize structured opportunities to give back as a team, and we encourage athletes to find ways to give back that are meaningful to them.
::::

::::split[Costs & volunteers]
:::panel{icon="hand-coins"}
**Free to join.** Participation is free. Voluntary donations are accepted and go to shared expenses such as gas, campground fees, and group equipment, and to athletes who need gear or transportation to take part. The program is need-blind: donations and ability to pay do not affect who can join.
:::

:::panel{icon="handshake" role="secondary"}
**Lend a hand.** Unpaid volunteers run the program: parents, former racers, and others. The [Volunteers page](/volunteers) lists who is running things this summer, and how to pitch in if you would like to help. No certification or background required.
:::
::::

::::cta[Getting started]{icon="flag"}
Join EC Nordic on CrewLAB. You sign the liability waiver there and pick up the schedule. A signed waiver has to be on file before your first session. Questions are welcome through the [contact form](/contact).

<a href="/crewlab" class="download-link">Get started on CrewLAB →</a>
::::
```

- [ ] **Step 2: Confirm the page clears the content guard**

The `Write` in Step 1 runs through `prose-guard`. If it is denied, the denial names the tell and the line. Fix that line in the coach voice without touching the verbatim `Why we started` passage, then write again. The content above is expected to pass.

- [ ] **Step 3: Regenerate the manifest**

Run: `npm run cairn:manifest`
Then review: `git diff src/content/.cairn/index.json`
Expected: the `about` entry's `links` now lists `crewlab` (the waiver links became the `cairn:pages/crewlab` token). No other entry changes.

- [ ] **Step 4: Run the gate and refresh snapshots**

Run: `npm run check && npm test && npm run build`
If `npm test` reports a characterization snapshot mismatch for `about`, regenerate: `npx vitest run -u`, then `git diff src/tests/markdown/__snapshots__/` and confirm the only change is the `about` page's rendered HTML. If any other page's snapshot moved, stop and report.
Re-run `npm run check && npm test && npm run build` and confirm all green. `url-inventory` is unaffected (no URL added or removed).

- [ ] **Step 5: Commit**

```bash
git add src/content/pages/about.md src/content/.cairn/index.json src/tests/markdown/__snapshots__/characterization.test.ts.snap src/tests/markdown/__snapshots__/sanitized-characterization.test.ts.snap
git commit -m "Rewrite About to canonical facts, origin story, CrewLAB waiver

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: CrewLAB page

Extend `src/content/pages/crewlab.md`. The changes from the current file: move the SafeSport definition into an `aside`, add a Waiver-and-forms section that carries the content folded in from Resources (CrewLAB-only signing, guardian-for-minors and adult-self-signing, the handbook and gear info), and state need-blind donations for the program and the camp. Keep the existing sections and their order otherwise. This task re-homes the Resources content so Task 3 can retire that page without leaving a gap.

**Files:**
- Modify (full `Write`): `src/content/pages/crewlab.md`
- Run: `npm run cairn:manifest`

- [ ] **Step 1: Write the full CrewLAB page**

Replace the entire contents of `src/content/pages/crewlab.md` with this:

```markdown
---
title: "CrewLAB"
---

EC Nordic runs on CrewLAB, a free app that holds the schedule, team chat, workouts, and the day-to-day of training. If you are with us this summer, you will use it most days. It is also built to meet SafeSport standards.

:::aside[SafeSport]{icon="info"}
SafeSport is the national framework, set by the U.S. Center for SafeSport, for protecting young athletes from abuse and misconduct in sport. In practice it means our communication stays out in the open. Volunteers can see every channel, and there is no private one-on-one messaging between an adult and an athlete.
:::

::::passage[Why we use it]{icon="chat-circle"}
We keep the season in one app instead of a pile of group texts and email threads. The schedule lives there, so a rained-out session reaches you as a notification. Volunteers post the workouts and keep an eye on how athletes are recovering. Parents see where to be and when. And because the talking happens here, it happens where the people responsible for your athlete can see it.
::::

::::grid[For athletes]{icon="person-simple-run"}
CrewLAB is where your training week lives: the schedule, workouts, team chat, and a daily check-in, all in one app on your phone. Once you have joined, here is what you will do with it.

- **Check the schedule and RSVP.** Open an event on the calendar and tap yes or no. Tap no and it asks why. Do it before each session, and keep notifications on so weather changes reach you in time.
- **Use team chat.** Read and post in the team and squad channels. Every channel is visible to the volunteers and follows SafeSport rules, so there is no private one-on-one messaging.
- **Log your workouts.** Find the week's workouts in the feed or on the calendar event. After you train, tap the yellow plus, choose Workout, and add your notes, effort, and result. Connect a Garmin or Concept2 under Settings, then Integrations, and it logs your sessions for you.
- **Do the daily check-in.** Each day it asks how you slept and how you are feeling. A few taps, no typing. Miss a day and there is a catch-up button on your Home tab. Only you and the volunteers see it, and it is how we notice when you are running down.
- **Watch your video.** Open a clip a volunteer tagged you in, slow it down, and scrub to the moment to study your stride or roller-ski form. Leave a question right on the video.
::::

::::card[For parents & supporters]{icon="users-three" role="secondary"}
For parents and supporters, CrewLAB keeps you current on where the team needs to be, without putting you in the middle of the athletes' day. You get the calendar, announcements, and logistics. This is what it looks like from your side.

- **What you can see and do.** The team calendar, the supporters' channel, and program announcements. You sign the waiver as guardian and pay here too. [PLACEHOLDER: confirm what EC Nordic collects through CrewLAB, whether camp cost-share, dues, or donations.] CrewLAB takes cards, bank transfer, Apple Pay, and Google Pay.
- **Organize and pitch in.** Message the volunteers directly, and use the supporters' channel to organize carpools to camp, trail work, and team meals.
- **What stays private.** You will not see daily check-ins, workout logs, volunteer feedback, or the athletes' own chat. That is deliberate. It gives athletes their own space and keeps us SafeSport-compliant.
- **Notifications and logistics.** Turn on the supporters' channel. Weather moves, camp packing lists, and travel plans all land there.
::::

::::card[Waiver and forms]{icon="flag"}
The liability waiver is signed in CrewLAB, and only in CrewLAB. There is no print, mail-in, or third-party option. A guardian signs for an athlete under 18. An adult athlete, such as a graduate home from college, signs for themselves. A signed waiver has to be on file before the first session, and before camp.

Donations are need-blind. What you give, or do not give, has no bearing on who can join. The summer program and the Talkeetna camp are both free, with donations requested according to what a family can manage.

The parent handbook and the gear and vendor list also live in CrewLAB, so the version you see in the app is always the current one.
::::

::::cta[Getting started]{icon="flag"}
Getting on takes about two minutes, athlete or parent. Download CrewLAB from the App Store or Google Play, or open app.crewlab.io, then tap the invite below and pick your account type when you sign up. Parents, link to your athlete to connect. For athletes under 18, that link is what lets volunteers message them under SafeSport rules. Questions first? [Contact us](/contact).

<a href="https://crewlab.app.link/5g7vhhYEn3b" class="download-link" target="_blank" rel="noopener">Join EC Nordic on CrewLAB →</a>
::::
```

- [ ] **Step 2: Confirm the page clears the content guard**

The placeholder uses a colon, not an em dash. If the `Write` is denied for any reason, fix the named line and write again.

- [ ] **Step 3: Regenerate the manifest**

Run: `npm run cairn:manifest`
Then: `git diff src/content/.cairn/index.json`
Expected: the `crewlab` entry is unchanged or trivially changed (its `links` did not gain a new content-page token). No other entry changes.

- [ ] **Step 4: Run the gate and refresh snapshots**

Run: `npm run check && npm test && npm run build`
If `npm test` reports a snapshot mismatch for `crewlab`, regenerate with `npx vitest run -u`, `git diff` the `.snap` files, and confirm the only change is the `crewlab` page. Re-run the gate and confirm green.

- [ ] **Step 5: Commit**

```bash
git add src/content/pages/crewlab.md src/content/.cairn/index.json src/tests/markdown/__snapshots__/characterization.test.ts.snap src/tests/markdown/__snapshots__/sanitized-characterization.test.ts.snap
git commit -m "Extend CrewLAB: SafeSport aside, waiver and forms, need-blind donations

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Retire the Resources page

CrewLAB now carries the waiver and forms content (Task 2), so the Resources page is redundant. Delete it, repoint the one remaining link to it, and keep the content graph and URL inventory consistent. The launch-time `/resources` redirect is already recorded in `BACKLOG.md` (#18); do not build it here.

**Files:**
- Delete: `src/content/pages/resources.md`
- Modify: `src/content/pages/training.md` (the one line that links to Resources)
- Run: `npm run cairn:manifest`

- [ ] **Step 1: Confirm Resources has only one inbound content link**

Run: `grep -rn "/resources" src/content src/routes src/lib`
Expected: the manifest entry for `resources`, and one link in `src/content/pages/training.md` line 78. (The `[...path]/+page.svelte` match is a CSS comment, not a link.) If any other content link to `/resources` exists, repoint it to `cairn:pages/crewlab` the same way as the training line below before deleting the page.

- [ ] **Step 2: Repoint the Training waiver line to CrewLAB**

`training.md` is rewritten in full in Plan 3; this is a minimal one-line repoint so the link does not dangle when Resources is deleted. The current line 78 reads:

```markdown
A signed waiver is required before your first session. Get it on the [Resources](/resources) page. Camp registration is included; you don't need to sign up for Talkeetna separately.
```

Edit it to:

```markdown
A signed waiver is required before your first session. You sign it in [CrewLAB](cairn:pages/crewlab). Camp registration is included; you don't need to sign up for Talkeetna separately.
```

This is an `Edit` (not a full file write). `training.md` passes the guard today, and the new text has no em dash, so the edit clears the guard.

- [ ] **Step 3: Delete the Resources page**

Run: `git rm src/content/pages/resources.md`

- [ ] **Step 4: Regenerate the manifest**

Run: `npm run cairn:manifest`
Then: `git diff src/content/.cairn/index.json`
Expected: the `resources` entry is gone. The `training` entry's `links` now lists `crewlab`. No other unexpected change.

- [ ] **Step 5: Run the gate and refresh snapshots**

Run: `npm run check && npm test && npm run build`
Two snapshot changes are expected: the `resources` entry disappears from both characterization snapshots, and the `training` page's snapshot changes by the one repointed line. If `npm test` reports the mismatch, regenerate with `npx vitest run -u`, `git diff` the `.snap` files, and confirm the only changes are the removed `resources` entry and the one `training` line. `url-inventory` should pass: `/resources` is dropped from both the expected set (no file) and the actual set (no manifest entry), so they stay in agreement. If `url-inventory` fails, read its output and report.

- [ ] **Step 6: Commit**

```bash
git add src/content/pages/training.md src/content/.cairn/index.json src/tests/markdown/__snapshots__/characterization.test.ts.snap src/tests/markdown/__snapshots__/sanitized-characterization.test.ts.snap
git rm src/content/pages/resources.md
git commit -m "Retire Resources page; repoint Training waiver link to CrewLAB

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Volunteers & Coaches page

Rewrite `src/content/pages/volunteers.md`. The changes from the current file: retitle the page to "Volunteers & Coaches", replace the roster placeholder with the three bios placed verbatim via `split`/`panel` (leads first), keep the Help out block, and add the graduate-leadership line. `roster` is deferred until real coach photos exist (BACKLOG #19), so the bios use `split`/`panel` for now.

**Files:**
- Modify (full `Write`): `src/content/pages/volunteers.md`
- Run: `npm run cairn:manifest`

- [ ] **Step 1: Write the full Volunteers & Coaches page**

Replace the entire contents of `src/content/pages/volunteers.md` with this. The three panel bodies are the verbatim bios from the spec, in lead-first order (Geoff, Amy, Duncan). Do not alter them.

```markdown
---
title: "Volunteers & Coaches"
---

EC Nordic runs entirely on unpaid volunteers: parents, former racers, and local athletes who want to keep Anchorage kids on snow and on trails. This page lists who is running the program this summer and how you can help.

::::split[This summer's coaches]
:::panel{icon="person-simple-run"}
Geoff Wright leads the summer session. He's a lifelong runner and cyclist who came to cross-country skiing as an adult, and he's spent 13 years coaching NSAA's Junior Nordic program, eight of them as site director at Kincaid. He was an assistant coach at West High in 2024/25 and now coaches at Bettye Davis East. He's raised three competitive cross-country runner-skiers, the youngest now racing and training with the APU Nordic Elite Team. When he's not coaching, he loves snow, trails, books, general nerdery, and Sunday morning pancakes.
:::

:::panel{icon="person-simple-run"}
Amy Purevsuren runs the Talkeetna camp and is the head nordic coach at Bettye Davis East High School. She raced for Western Colorado, where she was a seven-time All-American and won the 1997 national title in the 15K freestyle, the first woman in school history to take an individual skiing national championship. Away from skiing, she teaches high school English. She got her start in the Peace Corps in Mongolia and has taught for 11 years in rural Alaska since, set on making her students lifelong readers and writers. She lives in Anchorage with her husband and three kids, and the family reads, camps, and gets outside together.
:::

:::panel{icon="person-simple-run"}
Duncan Wright, Geoff's oldest, coaches the Friday distance sessions. He's a lifelong competitive mountain runner, cyclist, and skier, with top-10 finishes at Crow Pass and the Kesugi Ridge 50K, where he was the youngest in the field. His latest endurance feat was second place at the Kenai 250, a 250-mile mountain bike race and one of the most grueling in the country. He holds an Outdoor Studies degree from APU with a concentration in snow science. When he's not plotting his next big race, he reads science fiction, works on local trails, builds bikes, and makes beautiful things out of wood.
:::
::::

::::grid[Help out]{icon="handshake" role="secondary"}
We always need more adults. Graduates home from college for the summer are especially welcome to train with us and step into team leadership. The most useful things you can do:

- **Drive.** Many sessions are at remote trailheads, and we carpool. A driver with room for a few athletes makes a session happen.
- **Train alongside athletes.** Run, ride, or ski with the group at any pace. The spread on endurance days is wide, and we want adults with both the faster and the slower kids.
- **Teach what you know.** Strength work, technique, nutrition, navigation. If you know it, we can use it.

No certification or background required. We will find a way to put you to work. [Reach out](/contact) if you would like to help.
::::
```

- [ ] **Step 2: Confirm the page clears the content guard**

The bios contain no prose em dashes, so the `Write` passes. If denied, fix the named line without touching a bio, then write again.

- [ ] **Step 3: Regenerate the manifest**

Run: `npm run cairn:manifest`
Then: `git diff src/content/.cairn/index.json`
Expected: the `volunteers` entry is unchanged except possibly its title; its `links` still lists `contact` if it tracked the literal `/contact` link before (most likely unchanged). No other entry changes.

- [ ] **Step 4: Run the gate and refresh snapshots**

Run: `npm run check && npm test && npm run build`
If `npm test` reports a snapshot mismatch for `volunteers`, regenerate with `npx vitest run -u`, `git diff` the `.snap` files, and confirm the only change is the `volunteers` page. Re-run the gate and confirm green.

- [ ] **Step 5: Commit**

```bash
git add src/content/pages/volunteers.md src/content/.cairn/index.json src/tests/markdown/__snapshots__/characterization.test.ts.snap src/tests/markdown/__snapshots__/sanitized-characterization.test.ts.snap
git commit -m "Rewrite Volunteers & Coaches: three bios, graduate leadership line

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Wrap-up: editorial backstop, placeholders, STATUS, BACKLOG

Run the editorial backstop over the three rewritten pages, record the open placeholders, and leave the tree ready for Plan 3.

**Files:**
- Possibly modify: the three rewritten pages (only if the editorial pass finds a non-verbatim issue)
- Modify: `BACKLOG.md`
- Modify: `docs/STATUS.md`
- Modify (only if the work surfaced a finding): `docs/cairn-dx-findings.md`

- [ ] **Step 1: Editorial backstop**

Run the `content-cleanup` skill on each rewritten page in turn:
- `src/content/pages/about.md`
- `src/content/pages/crewlab.md`
- `src/content/pages/volunteers.md`

Apply only fixes that improve the connective prose. Do not change the verbatim blocks: the `Why we started` passage on About, and the three bios on Volunteers. If the cleanup flags a word inside a verbatim block (for example `dedicated` in the origin story, or a tricolon in a bio), leave it. If it changes any non-verbatim prose, regenerate the manifest and snapshots for the touched page and re-run the gate before committing in Step 5.

- [ ] **Step 2: Record the open placeholders in BACKLOG**

The drafts carry one bracketed placeholder, and the spec's pre-publish checklist has items that block publish, not drafting. In `BACKLOG.md`, using the `/log-issue` structured format and continuing the number sequence (the current highest is #20 from Plan 1's wrap-up), add:
- A Low item: confirm what EC Nordic collects through CrewLAB (camp cost-share, dues, donations), and replace the placeholder in `crewlab.md` ("For parents & supporters" section). Tag `#improvement` `#ecnordic`, dated 2026-06-04.
- A Low item: pre-publish confirmation that the CrewLAB join link (`crewlab.app.link/5g7vhhYEn3b`), the guardian and adult self-signing support, and donation collection are all current. Tag `#improvement` `#ecnordic`, dated 2026-06-04.

If an equivalent item already exists in `BACKLOG.md`, update it rather than adding a duplicate. Confirm the launch-time `/resources` redirect item (#18) is still open now that the page is deleted; it stays open until the beta launch.

- [ ] **Step 3: Update STATUS**

In `docs/STATUS.md`, record that Plan 2 of the site refresh is done (2026-06-04): About, CrewLAB, and Volunteers & Coaches rewritten to the canonical facts, the origin story and the three bios placed verbatim, the waiver pointed to CrewLAB everywhere, and the Resources page retired (its waiver and forms content folded into CrewLAB). State that Plan 3 (the Training hub, with the `toc` component) is the immediate next action, authored from the spec's Training map, then executed via `subagent-driven-development`. Update the gate figures where STATUS cites them (run the gate first to get the current test count). Add a "Refresh 2" row to the passes table and refresh the next-starter-prompt block. Keep the prose within the writing-voice rules (the `prose-guard` hook covers `docs/`).

- [ ] **Step 4: Append a cairn DX finding only if the work surfaced one**

If any directive was awkward to use for this content (for example the three-panel `split` reading poorly for long bios, which is the kind of thing `roster` would solve), append a dated finding to `docs/cairn-dx-findings.md`. If nothing new surfaced, skip this step and note that in the report.

- [ ] **Step 5: Run the gate and commit**

```bash
npm run check && npm test && npm run build
git add BACKLOG.md docs/STATUS.md
# add docs/cairn-dx-findings.md if you wrote a finding in Step 4
# add any page + manifest + snapshot files only if Step 1 changed non-verbatim prose
git commit -m "Record Plan 2 outcomes: placeholders, STATUS, BACKLOG

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-review against the spec

- **About** (spec lines 173 to 175): broaden Who can join to the canonical eligibility range (Task 1, Who can join), add need-blind framing to the second philosophy principle and Costs (Task 1, Program philosophy and Costs & volunteers), place the origin story verbatim (Task 1, Why we started), repoint the CTA from `/waiver` to CrewLAB (Task 1, every waiver reference repointed), keep section order, update the location list to the canonical set (Task 1, What we do). ✓
- **CrewLAB** (spec lines 176 to 178): keep the four sections, add the Waiver-and-forms block from Resources (Task 2, Waiver and forms), move the SafeSport definition into an `aside` (Task 2), state need-blind donations for program and camp (Task 2, Waiver and forms). ✓
- **Volunteers & Coaches** (spec lines 179 to 181): three bios verbatim, leads first, via `split`/`panel` since `roster` is deferred (Task 4), keep the Help out block, add the graduate-leadership line (Task 4, Help out). ✓
- **Contact** (spec line 182 to 184): already shipped in Plan 1 Task 6. Out of scope here, noted at the top. ✓
- **Retire Resources** (spec lines 144 to 148): content folded into CrewLAB first (Task 2), then the page deleted and the one inbound link repointed (Task 3). The launch redirect stays in BACKLOG (#18). ✓
- **Verbatim blocks** (spec lines 225 to 237): origin story on About, three bios on Volunteers, placed character-for-character and protected from the editorial pass (Tasks 1, 4, 5). ✓
- **Canonical facts:** the activity set, eligibility, schedule dates, camp dates, access framing, non-affiliation, inaugural-season phrasing, and the CrewLAB-only waiver all read per the canonical block on every page that states them. ✓
- **Placeholders recorded** (spec line 241 and the definition of done): the CrewLAB collection placeholder and the pre-publish confirmations go to BACKLOG (Task 5). ✓
- **DX findings** (spec lines 260 to 267): appended only if the work surfaced one (Task 5 Step 4). ✓

**Out of scope for Plan 2:** the Training hub and the `toc`/`schedule` components (Plan 3), real photo sourcing and `figure`/`gallery` use on these pages (no photos staged; a pre-publish step), the `/resources` and `/waiver` redirects (deferred to launch), and any legal or waiver text (attorney review).

**Type and naming consistency:** every directive used here (`card`, `grid`, `alert`, `cta`, `split`, `panel`, `passage`, `aside`) shipped in Plan 1 and is documented in `docs/directive-syntax.md`. The `aside` uses the `info` glyph from Plan 1. The CrewLAB token form `cairn:pages/crewlab` matches the welcome post and the manifest's `crewlab` id. No new component is introduced.
