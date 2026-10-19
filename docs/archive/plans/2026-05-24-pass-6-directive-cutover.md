# Pass 6 — Directive Cutover + Page Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut the site over to the Pass-5 directive pipeline: repoint `markdownToHtml` at `renderMarkdown`, delete the `decorate*()` / `wrapSections` / `boldParasToGrid` machinery, and migrate all five static pages to inline directives — with About / Training / CrewLAB rendering pixel-identical and Resources / Volunteers moving onto the kit.

**Architecture:** `markdownToHtml` (in `src/lib/utils.ts`) becomes a thin delegate to `renderMarkdown` (built and tested in Pass 5); `remark-html` is removed. The `[slug]/+page.svelte` `<script module>` decorate machinery is deleted and the page renders `page.html` directly (decoration now happens at render time inside the pipeline). Each content file gains directive wrappers. The page-level `<style>` block is unchanged — the pipeline emits the same classes the builders did.

**Prerequisite:** Pass 5 (`2026-05-24-pass-5-directive-pipeline.md`) is merged — `src/lib/markdown/render.ts` exports a fully-tested `renderMarkdown`.

**Tech Stack:** SvelteKit · TypeScript · the Pass-5 unified pipeline · DaisyUI v5 / Tailwind v4 (CSS unchanged).

**Spec:** `docs/superpowers/specs/2026-05-24-inline-directives-design.md`

**Render-identical contract:** About / Training / CrewLAB must render pixel-identical (screenshot-verified) to the pre-cutover live site. Resources / Volunteers are a deliberate, small migration onto the kit (no identical target). Heading `id`s now come from `rehype-slug` (invisible); `data-section` attributes are gone (no consumer).

> **Ordering note — one transitional window:** directive content cannot coexist with the old `decorate*` functions (they would re-parse already-carded HTML). So Task 1 performs the cutover (swap `markdownToHtml` + delete `decorate*`) atomically; between Task 1 and Task 6 the pages render as plain prose until each is migrated. This is intra-pass only — the pass ships at close, after the full sweep.

---

## Reference: directive vocabulary

Two optional attributes throughout: `icon=NAME` (a key in `ICON_PATHS`, defined in `src/lib/markdown/icons.ts`) and `role=ROLE` (`primary` default · `secondary` · `caution`). Nesting uses the colon-count rule: a container holding directives opens with **four** colons (`::::split`, `::::card`); inner directives use three.

| Directive | Primitive |
|---|---|
| `:::card{icon=NAME role=ROLE}` | Module card |
| `:::grid{icon=NAME role=ROLE}` | Grid card (heading) / bare `ul.ec-grid` (nested, no heading) |
| `:::alert{role=caution}` | Subtle alert |
| `:::cta{icon=NAME}` | CTA card (centered, chip icon, link → `btn btn-primary`) |
| `::::split` ⊃ `:::panel{icon=NAME role=ROLE}` | Paired panels |
| `:::passage{icon=NAME}` | Titled prose passage |
| *(no directive)* | Plain prose |

---

## File structure

- **Modify** `src/lib/utils.ts` — `markdownToHtml` delegates to `renderMarkdown`; drop `remark`/`remark-html`/`remark-gfm` imports.
- **Modify** `package.json` — remove `remark-html` (and `remark`/`remark-gfm` if now unused — verify).
- **Modify** `src/routes/[slug]/+page.svelte` — delete the `<script module>` block; render `page.html`; `<style>` unchanged.
- **Modify** `src/content/pages/{about,training,crewlab,resources,volunteers}.md` — add directives.
- **Modify** `docs/design-language.md` — document the vocabulary; register `chat-circle` / `person-simple-run`; update worked-example references.

---

## Task 1: Cut over — pipeline swap + delete decorate machinery

**Files:** Modify `src/lib/utils.ts`, `src/routes/[slug]/+page.svelte`, `package.json`.

- [ ] **Step 1: Repoint `markdownToHtml` at the pipeline**

In `src/lib/utils.ts`, replace the `remark`/`remark-gfm`/`remark-html` imports and the `markdownToHtml` body with a delegate:
```ts
import { renderMarkdown } from './markdown/render';

export async function markdownToHtml(content: string): Promise<string> {
  return renderMarkdown(content);
}
```
Leave the date helpers, `postUrl`, and `tagUrl` unchanged. Remove the now-unused `remark`/`remarkGfm`/`remarkHtml` imports at the top of the file.

- [ ] **Step 2: Gut the decorate machinery in `[slug]/+page.svelte`**

Delete the entire `<script module lang="ts">…</script>` block (lines 1–264: `slugify`, `parseSections`, `wrapSections`, the `svg`/`ICON`/`PANEL_ICONS` maps, `SECONDARY_SECTIONS`, `ecCard`, `riseStyle`, `ecCta`, `decoratePage`, `decorateAbout`, `boldParasToGrid`, `decorateTraining`, `decorateCrewlab`). Replace the instance `<script>` so it no longer derives `bodyHtml`:
```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import { SITE_TITLE } from '$lib/config';

  let { data }: { data: PageData } = $props();
  let { page } = $derived(data);
</script>
```
Render `page.html` directly:
```svelte
<article class="static-page" data-page={page.slug}>
  <h1 class="page-title">{page.title}</h1>

  <div class="post-body">
    {@html page.html}
  </div>
</article>
```
Leave the entire `<style>` block unchanged.

- [ ] **Step 3: Remove the dead dependency**

Run:
```bash
cd /home/glw907/Projects/ecnordic-ski
npm uninstall remark-html
grep -rn "from 'remark'\|remark-gfm\|remark-html" src/   # confirm no remaining imports of the old bundle
```
If `grep` shows `remark`/`remark-gfm` are no longer imported anywhere in `src/`, also `npm uninstall remark remark-gfm`. (Pass 5 added `remark-parse`/`remark-rehype`; the bundled `remark` may now be unused.) Keep them if anything still imports them.

- [ ] **Step 4: Type check + unit tests + build**

Run: `npm run check && npm test && npm run build`
Expected: clean; the Pass-5 directive tests still pass; build succeeds. (Pages currently render as plain prose — no directives yet — which is the expected transitional state.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils.ts src/routes/[slug]/+page.svelte package.json package-lock.json
git commit -m "Cut markdownToHtml over to the directive pipeline; remove decorate machinery"
```

---

## Task 2: Migrate about.md

**Files:** Modify `src/content/pages/about.md`.

- [ ] **Step 1: Rewrite the body with directives**

Keep the frontmatter and the two intro paragraphs (the lede + the "informal and volunteer-run" paragraph) exactly as-is, unmarked. Wrap the sections (replace each `<unchanged …>` with the real text from the current file — only wrappers and heading markers change):
```markdown
:::card{icon=path}
## What we do

<the three existing paragraphs, unchanged>
:::

:::alert{role=caution}
## Risks

<the existing paragraph, unchanged>
:::

:::card{icon=users-three role=secondary}
## Who can join

<the three existing paragraphs, unchanged>
:::

:::grid{icon=compass}
## Program philosophy

Five core principles guide our program design and the decisions we make for every athlete:

- **Total person first.** <unchanged>
- **Open to any committed athlete.** <unchanged>
- **High school sports matter.** <unchanged>
- **A lasting bond with trails and skiing.** <unchanged>
- **Support the community that supports you.** <unchanged>
:::

::::split
## Costs & volunteers

:::panel{icon=hand-coins}
**Free to join.** <unchanged paragraph>
:::

:::panel{icon=handshake role=secondary}
**Lend a hand.** <unchanged paragraph>
:::
::::

:::cta{icon=flag}
## Getting started

Fill out the [waiver](/waiver) and bring it to your first session, or send it ahead through the [contact form](/contact). Questions are welcome there too.

<a href="/waiver" class="download-link">Get the waiver →</a>
:::
```

- [ ] **Step 2: Type check + build**

Run: `npm run check && npm run build`
Expected: clean; build succeeds.

- [ ] **Step 3: Screenshot-verify identical** (see *Verification protocol*)

Capture About at desktop + mobile, light + dark, and compare to the pre-cutover live render. Reconcile any difference before committing.

- [ ] **Step 4: Commit**

```bash
git add src/content/pages/about.md
git commit -m "Migrate About to inline directives"
```

---

## Task 3: Migrate training.md

**Files:** Modify `src/content/pages/training.md`.

- [ ] **Step 1: Rewrite the body with directives**

Keep the lede paragraph and the `<nav class="page-toc">…</nav>` block unchanged and unmarked. Replace every `<h2 id="…">X</h2>` with a directive-wrapped `## X` (rehype-slug regenerates the same ids):
```markdown
:::card{icon=calendar-blank}
## Schedule

<the two existing paragraphs incl. the [PLACEHOLDER] line, unchanged>
:::

:::grid{icon=path}
## What We Do

- **Running.** <unchanged>
- **Roller-skiing.** <unchanged>
- **Mountain biking.** <unchanged>
- **Strength and dryland.** <unchanged>

Most sessions mix two or three of these. You won't do the same thing every day.
:::

:::card{icon=users-three role=secondary}
## Who Can Join

<the existing paragraph + [PLACEHOLDER] line, unchanged>
:::

:::card{icon=backpack}
## What to Bring

- Water and snacks
- Trail running shoes
- Helmet (required for roller-skiing and mountain biking — no exceptions)
- Layers. Anchorage summer weather is variable.

Roller skis and poles aren't provided. [PLACEHOLDER — add any loaner equipment details.]
:::

::::card{icon=tent}
## Talkeetna Camp

<the existing intro paragraph + [PLACEHOLDER] line, unchanged>

### What to Expect

<the two existing paragraphs, unchanged>

### Logistics

:::grid
- **Travel** We drive up in private vehicles, driven by parent and adult volunteers. The drive is roughly [PLACEHOLDER — N hours].
- **Lodging** [PLACEHOLDER — camping, cabin, or other lodging details.]
- **Meals** Group meals, prepared together. [PLACEHOLDER — confirm meal logistics and whether athletes need to bring food.]
- **Cost** The camp is free. We accept donations to offset gas and site fees. [PLACEHOLDER — confirm if there is any required contribution.]
:::

### Packing List

[PLACEHOLDER — finalize packing list.]

- All your training gear (running shoes, roller skis and poles, helmet, bike if applicable)
- Sleeping bag and pad
- Rain gear — Talkeetna weather is unpredictable
- Water bottle and personal snacks
- Medications you take daily
::::

:::cta{icon=flag}
## Sign Up

A signed waiver is required before your first session. Get it on the [Resources](/resources) page. Camp registration is included — you don't need to sign up for Talkeetna separately.

<a href="https://crewlab.app.link/5g7vhhYEn3b" class="download-link" target="_blank" rel="noopener">Sign Up for Summer Training →</a>

Questions? [Contact us](/contact).
:::
```
The Logistics block converts the four `**Term:** …` paragraphs into a markdown list with the colon dropped (`**Travel** …`), reproducing `boldParasToGrid`'s exact output.

- [ ] **Step 2: Type check + build**

Run: `npm run check && npm run build`
Expected: clean; build succeeds.

- [ ] **Step 3: Verify toc anchors + screenshot-identical**

Confirm the rendered ids are `schedule`, `what-we-do`, `who-can-join`, `what-to-bring`, `talkeetna-camp`, `sign-up` (the page-toc links resolve) and the page renders identically (desktop/mobile/dark).

- [ ] **Step 4: Commit**

```bash
git add src/content/pages/training.md
git commit -m "Migrate Training to inline directives"
```

---

## Task 4: Migrate crewlab.md

**Files:** Modify `src/content/pages/crewlab.md`.

- [ ] **Step 1: Rewrite the body with directives**

Keep the two intro paragraphs (lede + SafeSport paragraph) unmarked.
```markdown
:::passage{icon=chat-circle}
## Why we use it

<the existing paragraph, unchanged>
:::

:::grid{icon=person-simple-run}
## For athletes

<the existing intro paragraph, unchanged>

- **Check the schedule and RSVP.** <unchanged>
- **Use team chat.** <unchanged>
- **Log your workouts.** <unchanged>
- **Do the daily check-in.** <unchanged>
- **Watch your video.** <unchanged>
:::

:::card{icon=users-three role=secondary}
## For parents & supporters

<the existing intro paragraph, unchanged>

- **What you can see and do.** <unchanged, incl. the [PLACEHOLDER] line>
- **Organize and pitch in.** <unchanged>
- **What stays private.** <unchanged>
- **Notifications and logistics.** <unchanged>
:::

:::cta{icon=flag}
## Getting started

<the existing paragraph, unchanged>

<a href="https://crewlab.app.link/5g7vhhYEn3b" class="download-link" target="_blank" rel="noopener">Join EC Nordic on CrewLAB →</a>
:::
```
"For athletes" is a `:::grid` (its list becomes ec-grid); "For parents & supporters" is a plain `:::card` (its list stays a plain list) — matching the current `decorateCrewlab` behavior.

- [ ] **Step 2: Type check + build**

Run: `npm run check && npm run build`
Expected: clean; build succeeds.

- [ ] **Step 3: Screenshot-verify identical** (desktop/mobile/dark).

- [ ] **Step 4: Commit**

```bash
git add src/content/pages/crewlab.md
git commit -m "Migrate CrewLAB to inline directives"
```

---

## Task 5: Migrate resources.md + volunteers.md (the deferred pages)

**Files:** Modify `src/content/pages/resources.md`, `src/content/pages/volunteers.md`.

- [ ] **Step 1: Rewrite resources.md**

Keep the lede ("Forms, guides, and links…") unmarked. Wrap the single section in a plain card (no icon; the waiver link stays a plain link — this page has no CTA):
```markdown
:::card
## Forms

**Waiver and Release of Liability** — required before the first day of participation in any EC Nordic activity, including the summer training program and Talkeetna camp.

<a href="/waiver" class="download-link" target="_blank" rel="noopener">View Waiver Form →</a>

Print the form and return a signed copy to Geoffrey Wright, or use a free e-signature service such as [SignWell](https://www.signwell.com).
:::
```

- [ ] **Step 2: Rewrite volunteers.md**

Keep the lede unmarked. Replace the manual `<h2 id="…">` tags with directives:
```markdown
:::passage{icon=users-three role=secondary}
## This Summer's Volunteers

> **TK — Add the volunteer roster: names, roles, and a sentence or two on each. Program leads first, then drivers and other adult helpers.**
:::

:::grid{icon=handshake role=secondary}
## Help Out

We always need more adults. The most useful things you can do:

- **Drive.** Many sessions are at remote trailheads, and we carpool. A driver with room for a few athletes makes a session happen.
- **Train alongside athletes.** Run, ride, or ski with the group at any pace. The spread on endurance days is wide, and we want adults with both the faster and the slower kids.
- **Teach what you know.** Strength work, technique, nutrition, navigation — if you know it, we can use it.

No certification or background required. We'll find a way to put you to work. [Reach out](/contact) if you'd like to help.
:::
```

- [ ] **Step 3: Type check + build**

Run: `npm run check && npm run build`
Expected: clean; build succeeds.

- [ ] **Step 4: Screenshot-verify kit-correct**

Capture Resources + Volunteers (desktop/mobile/dark). Check they render as proper kit primitives (card / passage / grid) — there is no old render to match.

- [ ] **Step 5: Commit**

```bash
git add src/content/pages/resources.md src/content/pages/volunteers.md
git commit -m "Migrate Resources and Volunteers to inline directives"
```

---

## Task 6: Verify data-section is unused; documentation

**Files:** Modify `docs/design-language.md`.

- [ ] **Step 1: Confirm nothing consumes `data-section`**

Run: `grep -rn "data-section" src/ docs/`
Expected: no matches in `src/`. If a match appears in `src/`, stop and reconcile before continuing.

- [ ] **Step 2: Add the directive vocabulary to the design language**

In `docs/design-language.md`, update the "Last updated" line to `2026-05-24` noting that page styling is now selected by inline container directives. Add a new section, **"Selecting a primitive — inline directives,"** documenting the vocabulary table from this plan's *Reference* section (the seven directives, the `icon`/`role` attributes, the four-colon nesting rule, "unmarked = prose"). Update *Worked example — the About page* and *Refining a page — process* to reference the directive markup in `src/content/pages/about.md` and the `markdownToHtml` → `renderMarkdown` pipeline (`src/lib/markdown/*`), replacing the `decorate*()` references.

- [ ] **Step 3: Register the two new glyphs in the icon matrix**

Add rows to the icon matrix for the CrewLAB glyphs not previously listed:
```markdown
| `chat-circle` | the rationale / why | CrewLAB → Why we use it | primary |
| `person-simple-run` | athletes / the how-to | CrewLAB → For athletes | primary |
```
Add Volunteers-page usage notes for `handshake` (volunteering) and `users-three` (people) if not already covered.

- [ ] **Step 4: Commit**

```bash
git add docs/design-language.md
git commit -m "Document the inline-directive vocabulary"
```

---

## Task 7: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Type check + unit tests + build**

Run: `npm run check && npm test && npm run build`
Expected: svelte-check clean; all vitest suites pass; build to `.svelte-kit/cloudflare/` succeeds.

- [ ] **Step 2: Screenshot regression sweep** (see *Verification protocol*)

About / Training / CrewLAB: desktop (1280px) + mobile (390px), light + dark, `--force-prefers-reduced-motion`. Diff against the pre-cutover live render; every difference reconciled to identical. Resources / Volunteers: confirm kit-correct rendering.

- [ ] **Step 3: Confirm posts are unchanged**

Open a built post page (e.g. any `/YYYY/MM/slug/`) and confirm prose renders normally (posts contain no directives; the new pipeline must render them as before — including any inline raw HTML they use).

- [ ] **Step 4: Confirm Training toc anchors work**

Load the built Training page and click each page-toc link; confirm it scrolls to the matching section.

- [ ] **Step 5: Final commit (if reconciliation edits were made)**

```bash
git add -A
git commit -m "Pass 6 verification fixes"
```

> The pass-end ritual (code-simplifier over the changed code, final svelte-check, STATUS.md update, plan archival, push) is handled by the `cairn-pass` skill at pass close.

---

## Verification protocol (screenshots)

The built site is served by wrangler on `:8787`; rebuild before checking. Backgrounded `wrangler dev` exits at EOF, so keep stdin open:

```bash
npm run build
( sleep infinity | npx wrangler dev --port 8787 ) &
# wait for "Ready", then capture with a headless chromium, e.g.:
#   chromium --headless --force-prefers-reduced-motion \
#     --window-size=1280,2000 --screenshot=/tmp/about-desktop.png http://localhost:8787/about
# repeat at --window-size=390,2400 (mobile) and with the dark theme (emulate prefers-color-scheme: dark).
```
Compare each capture against the current production render (https://ecnordic.ski) at 2× crop. About / Training / CrewLAB must be pixel-identical; Resources / Volunteers are checked for kit-correctness only.

---

## Self-review notes

- **Spec coverage (this pass = cutover + migration):** `markdownToHtml`→`renderMarkdown` delegate + `remark-html` removal (1) · delete `decorate*`/`wrapSections`/`boldParasToGrid` + render `page.html` (1) · five-page migration with the per-page primitive mapping from the spec (2–5) · Logistics-as-list / nested grid (3) · explicit split panels (2) · CrewLAB grid-vs-card distinction (4) · Resources iconless card, plain waiver link (5) · Volunteers passage + grid reusing matrix icons (5) · `data-section` drop verified (6) · docs incl. new glyph rows (6) · identical-render + posts + toc verification (7). The mechanism (pipeline + primitives + icons) is **Pass 5**.
- **No placeholders:** `<unchanged …>` markers are explicit "copy verbatim from the current file" instructions; bracketed `[PLACEHOLDER …]` strings are existing site content carried over verbatim, not plan gaps.
- **Type/name consistency:** consumes `renderMarkdown` (Pass 5) via `markdownToHtml`; the page mapping (icon names, roles, primitive choices) matches the spec's *Per-page mapping* and *Migrating the deferred pages* sections.
