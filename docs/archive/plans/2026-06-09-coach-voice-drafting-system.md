# Coach Voice Drafting System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the content system as a generative drafting authority (the cairn admin-design-system pattern), then prove it by rewriting all five site pages for Geoff to final-edit.

**Architecture:** One generative authority in `docs/content-guide.md` (load-bearing rules, container budgets, per-type recipes with real exemplars), brief-first drafting with durable briefs in `docs/content-briefs/`, demoted scoring in review, and an edit-harvest loop into the corpus. Spec: `docs/superpowers/specs/2026-06-09-coach-voice-drafting-system-design.md` (budgets table in Decision 3).

**Tech Stack:** Markdown docs, dotfiles skills (`content-draft`, `content-review`), the existing directive containers, prose-guard, the repo gate (check, test, build).

---

### Task 1: Restructure `docs/content-guide.md` into the generative authority

**Files:** Modify: `docs/content-guide.md` (full restructure).

- [ ] Rewrite with this skeleton, in order: (1) about six load-bearing rules, including: every sentence carries a fact the reader can act on or picture; a missing fact becomes `[ASK: question]`, never padding; "we" and "you" do things, the program/app never does; say each fact once per page; fit the container budget; when the facts end, stop, no taglines. (2) The container budget table from the spec. (3) Recipes, one per content type: page lede, passage/card section, grid bullets, panel, alert, aside glossary, FAQ answer, CTA, micro-copy (program/zone/day tiles), bio panel, and the three post types (training update, results, announcement). Each recipe = shape in 2-3 sentences + budget + one real exemplar quoted from the corpus or from audit-praised shipped passages ("What if I miss a session? Come to the next one."; the CrewLAB check-in bullet; "No helmet, no wheels. We hold to this every time."), each annotated in one line. (4) Voice notes (trailhead register, audience split, punctuation), condensed from the current guide. (5) The avoid-catalog, moved to the back, with a pointer to the method and the guard.
- [ ] Keep the corpus pointer and the ECXC naming/cost facts; cut nothing factual.
- [ ] Run `prose-guard docs/content-guide.md`; fix anything blocking.

### Task 2: Method + skills update (dotfiles repo)

**Files:** Modify: `~/.claude/docs/web-content-method.md`, `~/.dotfiles/claude/.claude/skills/content-draft/SKILL.md`, `~/.dotfiles/claude/.claude/skills/content-review/SKILL.md` (the live `~/.claude/skills/*` are the same files via stow).

- [ ] Method section 1 becomes brief-first: build the brief (facts, audience questions, next step, container plan) before prose; `[ASK]` markers for gaps; draft recipe by recipe from the site guide. Add a short "Draft-off (optional)" subsection: 2-3 stance-diverse candidates judged against the corpus, splice the best, for high-stakes pages on request.
- [ ] Method review section: default output is hard gates + findings ordered by edit cost; band/score only on explicit request. Rubric text stays for that case.
- [ ] `content-draft` skill: brief-first procedure, briefs saved to `docs/content-briefs/<page>.md`, recipes loaded from the site guide.
- [ ] `content-review` skill: default gates+findings output, score behind a request.
- [ ] Commit in `~/.dotfiles` (do not push; the push is Geoff's).

### Task 3: Harvest loop + rule pointer

**Files:** Modify: `docs/coach-voice-corpus.md` (First-party gold section), `.claude/rules/content.md`.

- [ ] Corpus: replace the First-party gold placeholder text with the harvest procedure: on "feed my edits back", diff the shipped page against its draft commit, extract before/after sentence pairs, add the strongest as gold entries (passage + lesson), and promote any fix Geoff has made twice into a load-bearing rule in the guide.
- [ ] Rule file: note that drafting is brief-first and briefs live in `docs/content-briefs/`.

### Task 4: Briefs for the five pages

**Files:** Create: `docs/content-briefs/{home,about,training,crewlab,volunteers}.md`.

- [ ] Extract from each current page: the verifiable facts (every place, time, date, name, cost, rule), the audience questions the page answers, the single next step, and the container plan (the existing directive scaffolding, kept as-is). Mark unknowns as `[ASK]` (crewlab payments, #21). Facts only, no prose.

### Task 5: Rewrite the five pages

**Files:** Modify: `src/content/pages/{home,about,training,crewlab,volunteers}.md`.

- [ ] One page at a time, from its brief, recipe by recipe. Full rewrite: the brief's container plan governs, drawn from the registered directive vocabulary (`docs/directive-syntax.md`, registry in `src/lib/markdown/components.ts`); add or drop components as the prose needs. Frontmatter and slugs unchanged. Respect every budget. Specific audit findings to fix by construction: about's philosophy grid rewritten as plain coach commitments (no mission-statement register, no "once-in-a-lifetime" line), the triple-stated need-blind fact said once per page, no negative-parallelism taglines, varied bullet shapes, varied bio closers, home gets a named meeting spot and a sign-up pointer.
- [ ] After each page: `prose-guard <file>` and a hard-gates self-check (facts against the brief, no safety promise, cost correct).

### Task 6: Gate and visual check

- [ ] `npm run check` (0/0), `npm test` (exit 0; regenerate content snapshots if the suite pins page bodies), `npm run build`.
- [ ] Build + wrangler preview on 8787; eyeball each page for container overflow (tiles, cards, zones).

### Task 7: Pass-end ritual

- [ ] Site-pass consolidation: docs/architecture.md entry (one paragraph on the drafting system), STATUS.md update (this initiative done; next starter = Geoff's final edit + harvest), archive plan + spec, BACKLOG #21 note stays open, commit and push (deploys the rewrite), refresh project memory in both slugs.
