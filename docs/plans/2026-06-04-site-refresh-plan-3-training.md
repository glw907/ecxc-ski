# Site Refresh Plan 3: Training Hub

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Training page to the canonical facts across the brief's full Training map (intro, schedule, activities, training groups, who can join, what to bring, Talkeetna camp, sign up, your first session, common questions), so the last refresh page reaches a finished first draft.

**Architecture:** This is the third and last of three plans from `docs/superpowers/specs/2026-06-04-site-refresh-design.md`. It is content, with no new component. The spec assigned a `toc` directive to this plan, but cairn-cms `^0.24.0` cannot host it: the toc needs a render pass that runs after `rehypeSlug`, and the engine exposes no plugin hook for one (recorded as DX finding 18 in `docs/cairn-dx-findings.md`). The toc is descoped here by decision. The page keeps its existing hand-maintained `<nav class="page-toc">`, with its entries updated to the new section set, and the real `toc` component waits on a cairn-cms engine change (tracked in BACKLOG). The Training page is rewritten as one full file so the prose clears the content guard in one pass.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Tailwind 4 + DaisyUI 5, `@glw907/cairn-cms` (`^0.24.0`), vitest.

---

## What every task needs to know

Read this section before starting any task.

**Source of truth for facts.** The canonical-facts block in the design spec (`docs/superpowers/specs/2026-06-04-site-refresh-design.md`, lines 57 to 124) is the authority for the schedule, the activity set, eligibility, the camp, access framing, non-affiliation, the inaugural season, the waiver, and the site/CrewLAB boundary. The full target content below is already aligned to those facts. Place it as given. If you spot a contradiction between this plan and the spec's canonical block, stop and report it rather than guessing.

**One fact this plan corrects.** The current `training.md` Sign Up line reads "Camp registration is included; you don't need to sign up for Talkeetna separately." That contradicts the canonical fact: camp registration and consent are their own forms, separate from summer-training registration, both handled in CrewLAB. The Plan 2 repoint left that clause alone on purpose (it changed only the waiver link). This plan's rewrite fixes it. The new copy states the camp is part of the program and free, with its own registration and consent in CrewLAB.

**The content guard (`prose-guard`) runs on every Write and Edit to `src/content/**/*.md`.** It denies the write on a hard tell. Verified behavior on 2026-06-04:
- A hard tell denies the write: an em dash in prose, a banned word (for example `dedicated`, `comprehensive`, `seamless`, `foster`), or a banned opener (`Moreover`, `Additionally`, `Furthermore`).
- The guard exempts em dashes inside a `[PLACEHOLDER ...]` bracket, but do not rely on it. Write placeholders with a colon: `[PLACEHOLDER: confirm the dates.]`, never with an em dash.
- The full-file content below is em-dash-free and banned-word-free in prose, so a complete `Write` of it clears the guard. Use `Write` (full file), not piecemeal `Edit`, for the page rewrite, so no stale em dash from the old file survives.

**The hand-maintained table of contents.** The page keeps a raw-HTML `<nav class="page-toc">` near the top. Its anchors must match the slug ids that `rehypeSlug` assigns to each section's directive title. A directive title becomes an `<h2>`, and `rehypeSlug` lowercases it and replaces spaces with hyphens. So `:::card[Talkeetna camp]` becomes `<h2 id="talkeetna-camp">`, which is why the About page's `/training#talkeetna-camp` link resolves. The nav in the content below lists the nine section anchors and they match the section titles exactly. Do not change a section title without changing its nav anchor to match.

**No new component.** Every directive used here (`card`, `grid`, `aside`, `cta`) already exists and is documented in `docs/directive-syntax.md`, registered in `src/lib/markdown/components.ts`. The two `aside`s gloss "spenst" and "over-distance" for non-Nordic parents, using the `info` glyph, the same way the CrewLAB SafeSport aside does. The optional `schedule` key-value component from the spec is not built: the schedule reads cleanly as a `grid` of three day cards, so the grid is enough. Recorded in the self-review.

**Internal links.** Use the cairn token form `cairn:pages/crewlab` for a markdown prose link to CrewLAB (the content graph tracks it). The literal `/contact` link to the hand-built Contact route stays a literal path. The CrewLAB join button is a raw-HTML `<a class="download-link">` with the external CrewLAB URL.

**After any content file changes, regenerate the committed manifest:** `npm run cairn:manifest` rewrites `src/content/.cairn/index.json`. The build's `verifyManifest` fails on drift, so the manifest goes in the same commit as the content.

**Characterization snapshots.** Two snapshot suites under `src/tests/markdown/__snapshots__/` snapshot every page's rendered HTML. Rewriting Training changes its snapshot, which is the expected consequence. When `npm test` reports a snapshot mismatch for `training`, regenerate with `npx vitest run -u`, then `git diff` the two `.snap` files and confirm the only change is the `training` page. If any other page's snapshot moved, stop and report.

**Project gate (run before every commit):**

```bash
npm run check && npm test && npm run build
```

Expected: `check` 0 errors, `test` all passing (the baseline after Plan 2 is 54), `build` exits 0. `url-inventory` is unaffected (no URL added or removed; Training stays at `/training`).

---

## Task 1: Rewrite the Training page

Rewrite `src/content/pages/training.md` to the canonical facts across the full Training map. The canonical facts resolve the old file's date, location, hours, and cost placeholders, so those are gone. Two content placeholders remain (loaner equipment, the camp packing list) and are recorded in Task 2.

**Files:**
- Modify (full `Write`): `src/content/pages/training.md`
- Run: `npm run cairn:manifest`

- [ ] **Step 1: Write the full Training page**

Replace the entire contents of `src/content/pages/training.md` with this:

```markdown
---
title: "Training"
---

EC Nordic's summer training program runs from June 1 to August 19, 2026. We meet three mornings a week to run, lift, roller-ski, and ride, building the fitness and skills that carry a Nordic season. Training is free and open to every high school athlete, whatever your experience. The summer builds toward a four-day camp near Talkeetna in July, part of the same program.

<nav class="page-toc" aria-label="On this page">
  <a href="#schedule">Schedule</a>
  <a href="#activities">Activities</a>
  <a href="#training-groups">Training groups</a>
  <a href="#who-can-join">Who can join</a>
  <a href="#what-to-bring">What to bring</a>
  <a href="#talkeetna-camp">Talkeetna camp</a>
  <a href="#sign-up">Sign up</a>
  <a href="#your-first-session">Your first session</a>
  <a href="#common-questions">Common questions</a>
</nav>

::::grid[Schedule]{icon="calendar-blank"}
We practice Monday, Wednesday, and Friday, June 1 through August 19, 2026. Practice starts at 10:30 AM sharp, and late arrivals miss the group.

- **Monday.** Running, outdoor strength, and spenst. Always at East High. 10:30 AM to 12:15 PM.
- **Wednesday.** Intervals, hill work, and bounding. 10:30 AM to 12:15 PM.
- **Friday.** Over-distance, the week's long day. 10:30 AM to 12:30 PM.

These are practice times and do not include travel. Monday is always at East High, with no carpool. The other days move among East High, Hillside (Hilltop parking lot), Kincaid Park, Bartlett trails, and Chugach front range trailheads. The spot for each practice is posted on CrewLAB, and it can change, so check before you head out.

For an off-site day, a carpool leaves from East High. Arrive by 10:00 AM to ride along, and a return carpool brings athletes back to East. Parents can pick up at East or at the site.
::::

:::aside[Spenst]{icon="info"}
Spenst is explosive jumping work: short, powerful bounds and hops that build the spring a skier needs. You will hear the term on Mondays.
:::

:::aside[Over-distance]{icon="info"}
Over-distance, or OD, is a long session at an easy, conversational pace. Friday is the week's long day, and the point is steady time on your feet, not speed.
:::

::::grid[Activities]{icon="path"}
Running and strength are the weekly core. Mountain biking and roller-skiing come in on some days, not every week. Helmets are required for roller-skiing and mountain biking, every time.

- **Running.** Trail and road runs across Anchorage, the backbone of the week.
- **Strength training.** Bounding, plyometrics, and core work, mostly outdoors. No gym needed.
- **Roller-skiing.** Roller skis and poles on pavement. Roller skis, poles, and a helmet are required.
- **Mountain biking.** Singletrack and gravel at various trailheads. Helmet required.

Most sessions mix two or three of these. You will not do the same thing every day.
::::

:::card[Training groups]{icon="person-simple-run"}
Everyone trains together, and we split by pace where it helps. On endurance days the spread across the group is wide, so faster and slower athletes work at their own pace, with an adult volunteer along for each end of the range.

The workouts scale to where you are. An athlete chasing a Junior Nationals or Arctic Winter Games spot and an athlete brand new to structured training can be in the same session, each at the right effort. You are not left to keep up, and you are not held back.
:::

:::card[Who can join]{icon="users-three" role="secondary"}
The program is open to students entering high school, rising 9th graders, through 12th grade, plus high school graduates home from college for the summer. Graduates can train with us, and we encourage them into volunteer team leadership. No cross-country skiing experience is needed. If you show up consistently and put in the work, you belong here.

The program is need-blind. Donations and ability to pay do not affect who can join, and we do our best to make room for any athlete who fully commits to their training.
:::

:::card[What to bring]{icon="backpack"}
- Water and snacks for the session.
- Trail running shoes.
- A helmet, required for roller-skiing and mountain biking, no exceptions.
- Layers. Anchorage summer weather changes fast.

Roller skis and poles are not provided. [PLACEHOLDER: confirm any loaner roller skis, poles, or bikes the program can lend.]
:::

::::card[Talkeetna camp]{icon="tent"}
The Talkeetna camp is the high point of the summer. We leave the morning of July 21, 2026 and return the evening of July 24: four days and three nights. We stay in cabins on a lake near Talkeetna. It is a dry cabin, so expect outhouses and no showers. Amy Purevsuren runs the camp.

Training runs twice a day, covering running, roller-skiing, strength work, and hill bounding with poles. Between sessions there is the lake, with boats, paddleboards, and swimming, and a sauna. Evenings are for group meals and recovery.

The camp is part of the summer program, not a separate cost. It is free, with donations requested according to what your family can manage. Camp registration and consent are their own forms, separate from summer-training registration, and both are handled in CrewLAB. The exact site and address go to registered families in CrewLAB.

### Camp packing list

[PLACEHOLDER: finalize the camp packing list before publish.]

- All your training gear: running shoes, roller skis and poles, a helmet, and a bike if you ride.
- Sleeping bag and sleeping pad.
- Rain gear. Talkeetna weather is its own thing.
- A swimsuit and a towel for the lake and sauna.
- A water bottle and personal snacks.
- Any medications you take daily.
::::

:::card[Your first session]{icon="compass"}
Come to your first practice with a signed waiver already on file. For a Monday, meet at East High by 10:30 AM. For an off-site day, get to East by 10:00 AM to catch the carpool, or check CrewLAB for the meeting spot. Bring water, snacks, trail shoes, and layers. You do not need roller skis or a bike for a first run. Show up ready to work, and an adult volunteer will get you into the right group.
:::

:::card[Common questions]{icon="chat-circle"}
- **What does it cost?** Nothing. The program is free, and donations are optional and need-blind.
- **Do I need skiing experience?** No. The training builds the same base competitive Nordic skiers use, and it works for any high school athlete. Cross-country runners fit right in.
- **Who can join?** Anyone entering 9th grade through 12th grade, plus graduates home from college for the summer. No junior high.
- **What if I miss a session?** Come to the next one. The weekly plan includes work you can do on your own, posted on CrewLAB.
- **Do I need my own gear?** Bring trail shoes, water, and a helmet for bike and roller-ski days. Roller skis and poles are not provided.
- **Is the camp extra?** No. The Talkeetna camp is part of the program and free, and it has its own registration and consent in CrewLAB.
:::

:::cta[Sign up]{icon="flag"}
A signed liability waiver has to be on file before your first session. You sign it in [CrewLAB](cairn:pages/crewlab), and only there. Camp has its own registration and consent forms, also in CrewLAB.

<a href="https://crewlab.app.link/5g7vhhYEn3b" class="download-link" target="_blank" rel="noopener">Sign up for summer training →</a>

Questions first? [Contact us](/contact).
:::
```

- [ ] **Step 2: Confirm the page clears the content guard**

The `Write` in Step 1 runs through `prose-guard`. If it is denied, the denial names the tell and the line. Fix that line in the coach voice, then write again. The content above is expected to pass.

- [ ] **Step 3: Regenerate the manifest**

Run: `npm run cairn:manifest`
Then review: `git diff src/content/.cairn/index.json`
Expected: no change, or a trivial one. The `training` entry already lists the `crewlab` link from Plan 2, and the rewrite keeps exactly one `cairn:pages/crewlab` prose link, so its `links` stay `[crewlab]`. The title stays "Training". If another entry changed, stop and report.

- [ ] **Step 4: Run the gate and refresh snapshots**

Run: `npm run check && npm test && npm run build`
If `npm test` reports a characterization snapshot mismatch for `training`, regenerate: `npx vitest run -u`, then `git diff src/tests/markdown/__snapshots__/` and confirm the only change is the `training` page's rendered HTML. If any other page's snapshot moved, stop and report. Re-run `npm run check && npm test && npm run build` and confirm all green. `url-inventory` is unaffected (no URL added or removed).

- [ ] **Step 5: Commit**

```bash
git add src/content/pages/training.md src/content/.cairn/index.json src/tests/markdown/__snapshots__/characterization.test.ts.snap src/tests/markdown/__snapshots__/sanitized-characterization.test.ts.snap
git commit -m "Rewrite Training hub to canonical facts across the full map

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Wrap-up: editorial backstop, placeholders, STATUS, BACKLOG

Run the editorial backstop over the rewritten page, record the open placeholders and the deferred toc, and close out the refresh initiative.

**Files:**
- Possibly modify: `src/content/pages/training.md` (only if the editorial pass finds a non-structural prose issue)
- Modify: `BACKLOG.md`
- Modify: `docs/STATUS.md`

- [ ] **Step 1: Editorial backstop**

Run the `content-cleanup` skill on `src/content/pages/training.md`. Apply only fixes that improve the connective prose. The schedule and activity bullets are deliberately parallel; that is a list, not a tricolon tell. If the cleanup changes any prose, regenerate the manifest and snapshots for the page and re-run the gate before committing in Step 4.

- [ ] **Step 2: Record the deferred toc and the open placeholders in BACKLOG**

In `BACKLOG.md`, using the `/log-issue` structured format and continuing the number sequence (the current highest is #22 from Plan 2's wrap-up), add three Low items:

- **#23** Adopt the `toc` component once cairn-cms ships a post-rehype hook. Tag `#improvement` `#ecnordic`, dated 2026-06-04. Body: The Training page keeps a hand-maintained `<nav class="page-toc">` because cairn-cms `^0.24.0` has no hook for a render pass that runs after `rehypeSlug`, which the toc needs to read the rendered `<h2>` slug ids. See `docs/cairn-dx-findings.md` finding 18. When the engine adds a post-rehype hook, build the `toc` directive (a `:::toc` placeholder component plus a rehype plugin that collects `<h2 id>` and fills it) and replace the hand-maintained nav.
- **#24** Confirm loaner equipment and fill the Training "What to bring" placeholder. Tag `#improvement` `#ecnordic`, dated 2026-06-04. Body: `src/content/pages/training.md` carries `[PLACEHOLDER: confirm any loaner roller skis, poles, or bikes the program can lend.]`. Confirm what the program can lend and replace the placeholder.
- **#25** Finalize the Talkeetna camp packing list. Tag `#improvement` `#ecnordic`, dated 2026-06-04. Body: `src/content/pages/training.md` carries `[PLACEHOLDER: finalize the camp packing list before publish.]` above a draft list. Confirm the real list before publish and replace the placeholder.

If an equivalent item already exists, update it rather than adding a duplicate.

- [ ] **Step 3: Update STATUS**

In `docs/STATUS.md`, record that Plan 3 of the site refresh is done (2026-06-04), so all three refresh plans have landed and the content rebuild is at a finished first draft. State that the Training page was rewritten to the canonical facts across the full Training map, that the `toc` component was descoped to a cairn-cms engine change (finding 18, BACKLOG #23), and that the page keeps a hand-maintained table of contents until then. Update the gate figures STATUS cites (run the gate first to get the current test count). Add a "Refresh 3" row to the passes table. Refresh the next-starter-prompt block so it points at the remaining initiative work: the pre-publish checklist (attorney review, external confirmations, real photos), the launch-time `/resources`, `/waiver`, and `/home` redirects (BACKLOG #17, #18), and the open content placeholders (#21, #24, #25). Keep the prose within the writing-voice rules (the `prose-guard` hook covers `docs/`).

- [ ] **Step 4: Run the gate and commit**

```bash
npm run check && npm test && npm run build
git add BACKLOG.md docs/STATUS.md
# add src/content/pages/training.md + manifest + snapshots only if Step 1 changed prose
git commit -m "Record Plan 3 outcomes: Training hub done, toc deferred, STATUS, BACKLOG

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-review against the spec

- **Training map** (spec lines 189 to 191): the rewrite carries all ten sections, intro, schedule, activities, training groups (new), who can join, what to bring, Talkeetna camp, sign up, your first session, common questions (Task 1). ✓
- **`toc` component** (spec lines 193 to 195): cannot be built on cairn-cms `^0.24.0` (DX finding 18). Descoped by decision. The hand-maintained `<nav class="page-toc">` stays with updated entries, and the real component is tracked in BACKLOG #23. ✓
- **Schedule** (spec lines 196 to 197 and the canonical schedule, lines 81 to 91): a `grid` of three day cards with the canonical day, focus, and time, plus the locations and carpool rules. The optional `schedule` component is not built, since the grid reads cleanly (Task 1). ✓
- **Asides** (spec line 198): `spenst` and `over-distance` glossed in `info` asides for non-Nordic parents (Task 1). ✓
- **Camp** (spec lines 93 to 97 and 199 to 200): the canonical dates (July 21 to 24, 2026), the dry cabin on a lake, Amy running it, twice-a-day training, the camp activities (lake, sauna, hill bounding), free with requested donations, and the separate camp registration and consent in CrewLAB. The two sign-ups are stated consistently with the intro and Sign Up (Task 1). ✓
- **Canonical-fact correction:** the old "camp registration is included" clause is replaced with the canonical separate-registration phrasing (Task 1, flagged in "What every task needs to know"). ✓
- **Activities** (canonical lines 65 to 70): the enumerated set (running, mountain biking, strength training, roller-skiing) with running and strength as the core, the helmet rule on roller-skiing and mountain biking, reads as on Home and About (Task 1). ✓
- **Eligibility and access** (canonical lines 75 to 102): the canonical eligibility range, the graduate-leadership line, and the need-blind framing on Who can join (Task 1). ✓
- **Placeholders recorded** (spec line 241 and the definition of done): the loaner-equipment and camp-packing-list placeholders go to BACKLOG #24 and #25 (Task 2). ✓
- **DX findings** (spec lines 260 to 267): finding 18 already filed for the toc engine gap. No other surfaced in drafting. ✓
- **STATUS and BACKLOG** (definition of done): updated to the finished-first-draft state, with the initiative's remaining pre-publish and launch work flagged (Task 2). ✓

**Out of scope for Plan 3:** the `toc` component itself and the cairn-cms post-rehype hook it needs (BACKLOG #23, finding 18, a cairn-cms roadmap item), the optional `schedule` component (not needed), real photo sourcing and `figure`/`gallery` use on Training (no photos staged; a pre-publish step), the `/resources`, `/waiver`, and `/home` redirects (deferred to launch, BACKLOG #17 and #18), and any legal or waiver text (attorney review).

**Type and naming consistency:** every directive used here (`card`, `grid`, `aside`, `cta`) shipped before Plan 3 and is documented in `docs/directive-syntax.md`. The `aside` uses the `info` glyph. Every icon name used (`calendar-blank`, `path`, `person-simple-run`, `users-three`, `backpack`, `tent`, `compass`, `chat-circle`, `flag`, `info`) is present in `src/lib/markdown/icons.ts`. The CrewLAB token form `cairn:pages/crewlab` matches the manifest's `crewlab` id. No new component is introduced.
```
