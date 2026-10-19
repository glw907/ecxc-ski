# Pass 10 — Claude Infrastructure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adopt poplar-style Claude development patterns for cairn-cms — a `cairn-pass` skill, structured BACKLOG.md, richer STATUS.md with starter prompts, a path-scoped design-system rule, and an updated CLAUDE.md on-demand reading list.

**Architecture:** Pure infrastructure pass — no SvelteKit code changes. All work is `.claude/` config, docs, and markdown. No `/svelte-check` or build verification needed. Each task ends with a commit.

**Tech Stack:** Markdown, YAML frontmatter (Claude Code rule format), shell (none required)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `.claude/skills/cairn-pass/SKILL.md` | Create | Pass-start and pass-end ritual for cairn-cms |
| `.claude/skills/cairn-pass/plan-template.md` | Create | Starter template for pass plan docs |
| `BACKLOG.md` | Create | Project issue tracker (managed by `/log-issue`) |
| `docs/STATUS.md` | Rewrite | ≤60 lines, pass table, structured starter prompt for Pass 2 |
| `.claude/rules/development-workflow.md` | Update | Trigger `cairn-pass` skill, drop old prose instructions |
| `.claude/rules/design-system.md` | Create | Auto-loads on `.svelte`/`.css` edits; design system binding facts |
| `CLAUDE.md` | Update | Add on-demand reading list, reference `cairn-pass` explicitly |

---

## Task 1: Create `cairn-pass` skill

**Files:**
- Create: `.claude/skills/cairn-pass/SKILL.md`
- Create: `.claude/skills/cairn-pass/plan-template.md`

- [ ] **Step 1: Create the skill directory and SKILL.md**

```bash
mkdir -p .claude/skills/cairn-pass
```

Write `.claude/skills/cairn-pass/SKILL.md`:

```markdown
---
name: cairn-pass
description: >
  Invoke at the start or end of a cairn-cms development pass. Covers
  pass-end consolidation (simplify, svelte-check, STATUS update, plan
  archival, commit + push) and the starter-prompt format for the next
  pass. Trigger on "continue development", "next pass", "finish pass",
  "ship pass", or explicit invocation.
---

# Cairn Pass

Cairn-cms development proceeds in numbered passes. Each pass has a
starter prompt in `docs/STATUS.md`, a plan doc under
`docs/superpowers/plans/`, and (usually) a spec under
`docs/superpowers/specs/`. This skill encodes the ritual at both ends.

## Starting a pass

1. Read `docs/STATUS.md` — grab the current pass number and starter
   prompt.
2. Read the plan doc for the current pass. If none exists and the
   starter prompt lists open questions, brainstorm first (invoke
   `superpowers:brainstorming`) and write a plan at
   `docs/superpowers/plans/YYYY-MM-DD-<topic>.md`.
3. Execute the plan using `superpowers:subagent-driven-development`.

## Ending a pass — the consolidation ritual

Every pass ends here. No pass is done until every step has run.

### 1. /simplify

Run the `simplify` skill on changed code. Docs-only passes skip this.

### 2. /svelte-check

Run the `svelte-check` skill. Fix any type errors before continuing.
Docs-only passes skip this.

### 3. Update docs/architecture.md

Add any design decisions made this pass that belong in the long-term
record. Keep it factual — decisions, not narration.

### 4. Update docs/STATUS.md

- Mark the current pass `done` in the pass table.
- Write the next starter prompt (see format below).
- STATUS.md must stay ≤60 lines. Prune if it grows.

### 5. Archive plan + spec

```bash
git mv docs/superpowers/plans/<this-pass>.md docs/superpowers/archive/plans/
# if a spec exists:
git mv docs/superpowers/specs/<this-pass>-design.md docs/superpowers/archive/specs/
```

### 6. Commit and push

```bash
git add -A
git commit -m "Pass <n>: <summary>

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

## Starter-prompt format

```markdown
### Next starter prompt (Pass <n>)

> **Goal.** One sentence describing what this pass accomplishes.
>
> **Scope.** What's in, what's out.
>
> **Settled (do not re-brainstorm):** Decisions already made.
>
> **Still open — brainstorm these:** Questions the pass must
> answer before coding. Omit section if none.
>
> **Approach.** "Invoke cairn-pass to start. Standard pass-end
> checklist applies."
```

## When NOT to use

- Mid-pass debugging or single-file edits.
- Purely doc changes (typo fix, content update) — no ritual needed.

## Cairn skill naming convention

Project-specific skills use the `cairn-` prefix and live in
`.claude/skills/cairn-*/`. This is `cairn-pass`; future skills
follow the same pattern (e.g. `cairn-design`, `cairn-deploy`).
```

- [ ] **Step 2: Create plan-template.md**

Write `.claude/skills/cairn-pass/plan-template.md`:

```markdown
# Pass <n> — <topic>

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One sentence stating what this pass produces.

**Architecture:** What this pass delivers — files created/modified,
key decisions locked in.

**Tech Stack:** SvelteKit, TypeScript, Tailwind CSS v4, DaisyUI v5,
mdsvex. Note any new deps.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/...` | Create/Modify | ... |

---

## Task N: <component>

**Files:**
- Create/Modify: `exact/path/to/file`

- [ ] Step 1: ...
- [ ] Step 2: Run `npm run check` — expected: no errors
- [ ] Step 3: Commit

---

## Pass-end checklist

- [ ] `/simplify` on changed code
- [ ] `/svelte-check` — no errors
- [ ] Update `docs/architecture.md`
- [ ] Update `docs/STATUS.md` (mark done, write next starter prompt)
- [ ] Archive plan: `git mv docs/superpowers/plans/<this>.md docs/superpowers/archive/plans/`
- [ ] Commit and push
```

- [ ] **Step 3: Verify files exist**

```bash
ls .claude/skills/cairn-pass/
```

Expected: `SKILL.md  plan-template.md`

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/cairn-pass/
git commit -m "Add cairn-pass skill for pass-start/end ritual

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create BACKLOG.md

**Files:**
- Create: `BACKLOG.md`

- [ ] **Step 1: Write BACKLOG.md**

```markdown
# BACKLOG

> Project issue tracker. Managed by `/log-issue`.

## High

## Medium

- **#1** Deploy Pass 9 — verify dark mode on live site `#ops` `#907-life`
  Pass 9 landed dark mode + CSS token system. Not yet verified on
  the live site (907.life). Push to main and confirm dark mode toggle
  works, no flash of wrong theme.

## Low

## Closed
```

- [ ] **Step 2: Commit**

```bash
git add BACKLOG.md
git commit -m "Add BACKLOG.md project issue tracker

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Rewrite docs/STATUS.md

**Files:**
- Modify: `docs/STATUS.md`

- [ ] **Step 1: Rewrite STATUS.md**

Replace the entire file with:

```markdown
# cairn-cms — Project Status

**Current state:** Pass 9 complete. CSS tokens + dark mode live.
Transitioning to Cairn CMS multi-site architecture.

---

## Passes

| Pass | Goal | Status |
|------|------|--------|
| 1–9 | SvelteKit rebuild, features, CSS token system | ✓ Done |
| 10 | Claude infrastructure: cairn-pass skill, BACKLOG, STATUS, rules | ✓ Done |
| 11 | Repo rename → cairn-cms; multi-site VITE_SITE build system | planned |
| 12 | ECN design: tokens, typography, org-site layout | planned |
| 13 | ECN features: calendar, static pages, Sveltia CMS config | planned |

---

### Next starter prompt (Pass 11)

> **Goal.** Rename repo to `cairn-cms` and restructure the codebase
> for environment-driven multi-site builds.
>
> **Scope.** Rename GitHub repo; move `src/content/posts/` to
> `src/content/907-life/posts/`; add `src/content/ecnordic/`
> scaffold; wire `VITE_SITE` env var into Vite config + `posts.ts`;
> add `$site-config` and `$site-theme` Vite aliases; create
> `wrangler.ecnordic.toml`; add second GitHub Actions workflow.
> ECN content/design/features are out of scope.
>
> **Settled (do not re-brainstorm):** See
> `docs/superpowers/specs/2026-05-13-multi-site-ecnordic-design.md`
> — Option A single-repo approach, VITE_SITE mechanism, file layout,
> two Worker configs.
>
> **Approach.** Invoke cairn-pass to start. Standard pass-end
> checklist applies.

---

## Spec + Plan Locations

`docs/superpowers/specs/2026-05-13-multi-site-ecnordic-design.md`
`docs/superpowers/plans/2026-05-13-pass-1-claude-infrastructure.md`
```

- [ ] **Step 2: Verify line count is ≤60**

```bash
wc -l docs/STATUS.md
```

Expected: ≤60 lines

- [ ] **Step 3: Commit**

```bash
git add docs/STATUS.md
git commit -m "Rewrite STATUS.md: structured passes + cairn-cms starter prompt

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Add design-system path-scoped rule

**Files:**
- Create: `.claude/rules/design-system.md`

- [ ] **Step 1: Write the rule**

Write `.claude/rules/design-system.md`:

```markdown
---
description: Design system binding facts for cairn-cms
paths:
  - "src/**/*.svelte"
  - "src/**/*.css"
  - "src/app.css"
---

# Cairn CMS Design System

Binding facts for the cairn-cms design system. Auto-loads when
editing Svelte components or CSS.

## Color tokens

17 semantic tokens in `--color-*` namespace defined in `@theme` in
`src/app.css`. Dark overrides via `@plugin "daisyui/theme"`.

**Never use DaisyUI v4 short vars** (`--bc`, `--p`, `--b1`, etc.)
— renamed in v5, silently resolve to nothing.

**Never hardcode `oklch()` values** in component styles — define new
tokens in the `@theme` block in `src/app.css` and reference via
`var(--color-*)`.

**Never use hex or `rgb()` colors** — `oklch()` throughout.

## DaisyUI themes

- Light: `silk` (default)
- Dark: `dim` (prefers-dark)

Theme names are referenced in `@plugin "daisyui"` in `src/app.css`.
Overrides use `@plugin "daisyui/theme"`, not raw `[data-theme]` blocks.

## Typography

| Role | Font | Usage |
|---|---|---|
| Body | Spectral 400/700 | Prose, post content |
| Display | Karla 400–700 | Nav logo only |
| Mono | Monaspace Neon | Code blocks |

Self-hosted woff2 in `static/fonts/`. Font faces declared in
`src/app.css`.

## Shared CSS classes

Defined globally in `src/app.css` — use these, don't re-declare:
`.post-body`, `.post-date`, `.post-tags`, `.post-tag`, `.page-title`,
`.back-link`

Everything else: scoped `<style>` per component.

## Site constants

All site-specific values live in `src/lib/config.ts` (and per-site
configs once multi-site is wired). Never hardcode `SITE_URL`,
`SITE_TITLE`, etc. in components.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/rules/design-system.md
git commit -m "Add design-system path-scoped rule for Svelte/CSS edits

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Update development-workflow.md rule

**Files:**
- Modify: `.claude/rules/development-workflow.md`

- [ ] **Step 1: Replace with cairn-pass trigger**

```markdown
---
description: Development workflow for cairn-cms passes
paths: []
---

When the user says "continue development", "next pass", "start the
next pass", "finish pass", "ship pass", or "continue" in the context
of cairn-cms work, invoke the `cairn-pass` skill. It handles both
pass start (read STATUS, read plan, execute) and pass end (the
consolidation ritual: simplify, svelte-check, STATUS update, plan
archival, commit + push).
```

- [ ] **Step 2: Commit**

```bash
git add .claude/rules/development-workflow.md
git commit -m "Update development-workflow rule to trigger cairn-pass skill

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Read current CLAUDE.md**

Read the file to understand what's there before editing.

- [ ] **Step 2: Add on-demand reading list and cairn-pass reference**

Find the `## Build & Dev` section. Insert a new `## Development Workflow` section before it:

```markdown
## Development Workflow

Pass-driven. Each pass has a starter prompt in `docs/STATUS.md`, a
plan under `docs/superpowers/plans/`, and usually a spec under
`docs/superpowers/specs/`.

Trigger phrases — "continue development," "next pass," "finish pass,"
"ship pass" — invoke the `cairn-pass` skill. It covers both starting
a pass (read STATUS, read plan, execute) and ending one (the
consolidation ritual).

**On-demand reading:**
- `docs/STATUS.md` — current pass, pass table, next starter prompt.
  Load at the start of every pass.
- `docs/architecture.md` — design decisions and system overview.
  Load when planning structural changes.
- `docs/superpowers/specs/` — feature specs. Load the relevant spec
  before starting implementation.
- `BACKLOG.md` — known issues and future work. Check before starting
  a pass — may contain relevant known limitations.
- `.claude/rules/design-system.md` — auto-loads when editing
  `.svelte`/`.css`. Contains color token, typography, and shared
  class binding facts.
```

- [ ] **Step 3: Update the "continue development" rule reference**

Find the existing "continue development" instruction block and replace it to simply say: invoke `cairn-pass` skill.

The existing `@docs/STATUS.md` reference at the top of CLAUDE.md can stay — it pre-loads STATUS for every session, which is correct.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "Add on-demand reading list and cairn-pass reference to CLAUDE.md

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Pass-end checklist

This is a docs-only pass — skip `/simplify` and `/svelte-check`.

- [ ] Update `docs/architecture.md` — no new design decisions this pass; skip
- [ ] Verify `docs/STATUS.md` is ≤60 lines and Pass 10 is marked done
- [ ] Archive plan: `git mv docs/superpowers/plans/2026-05-13-pass-1-claude-infrastructure.md docs/superpowers/archive/plans/`
- [ ] Final commit and push:

```bash
git add -A
git commit -m "Pass 10: Claude infrastructure complete

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```
