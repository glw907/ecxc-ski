# Web-Content Authoring Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an audience-first web-content authoring track: a shared method doc, a drafting skill, a scored review skill, a widened `prose-guard` lexicon, and the routing that fires the right voice and skill by context.

**Architecture:** The reusable method (drafting steps, exemplar library, Signs-of-AI-writing catalog, rubric, level anchors, calibration set) and the two skills live in the dotfiles so every site shares them. Each site keeps its own voice in `content-guide.md` and routes to the skills through a local `content.md` rule, a `CLAUDE.md` pointer, and a reminder hook. The technical writing track is untouched.

**Tech Stack:** Markdown skills and docs, a Python `prose-guard` hook with pytest tests, hookify reminder files, GNU Stow for the dotfiles.

---

## Background the implementer needs

Read the design spec first: `docs/superpowers/specs/2026-06-05-web-content-authoring-design.md`. It carries the rationale, the rubric, and the verbatim catalog this plan refers to.

This plan spans two git repositories:

- **The dotfiles repo at `~/.dotfiles`** (remote `github.com/glw907/workstation`). Holds the shared method doc, the two skills, and the `prose-guard` tool. Commit dotfiles changes with `git -C ~/.dotfiles ...`.
- **The ecnordic repo at `~/Projects/ecnordic-ski`**. Holds the local routing files, the content guide, and the reminder hook. Commit with `git -C ~/Projects/ecnordic-ski ...`.

Key facts about the environment, already verified:

- `~/.claude/skills` is a symlink to `~/.dotfiles/claude/.claude/skills`. A new skill directory created under the dotfiles path appears live with no re-stow.
- `~/.local/bin/prose-guard` is a symlink to `~/.dotfiles/bin/.local/bin/prose-guard`. Editing the dotfiles file updates the live hook immediately, no re-stow needed.
- `prose-guard` scans only the text being written and skips fenced code blocks, indented code, frontmatter, inline `code` spans, and any line containing `PLACEHOLDER`. Every banned-word list in every file authored here MUST sit inside a fenced code block, or the hook rejects the write.
- The guard keys a fence on its first three characters. A four-backtick fence and a three-backtick fence both read as the same marker, so a three-backtick fence inside a four-backtick fence closes it early. When one file's content has to be shown inside another (as in this plan), wrap the outer block in a tilde fence (`~~~`) so the inner backtick fences cannot close it.
- `prose-guard` tiers: `.md` under `src/content/` is the `general` tier, other `.md` is the `docs` tier, code files are the `comments` tier. The general tier allows an occasional em dash and flags only a spray or a tacked-on appendage. The docs tier blocks any em dash. So this plan, the method doc, the guide, and the skills are docs-tier prose: write them with no em dashes and no banned words outside fences.

Commit messages end with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Do not push. The user pushes to `main` because it deploys live.

---

## File structure

**Dotfiles (`~/.dotfiles`):**

- Create: `~/.dotfiles/claude/.claude/docs/web-content-method.md` (the shared method)
- Create: `~/.dotfiles/claude/.claude/skills/content-draft/SKILL.md` (drafting skill)
- Create: `~/.dotfiles/claude/.claude/skills/content-review/SKILL.md` (review-and-score skill)
- Modify: `~/.dotfiles/bin/.local/bin/prose-guard` (widen the general-tier lexicon)
- Modify: `~/.dotfiles/tests/test_prose_guard.py` (tests for the new words)

**Ecnordic (`~/Projects/ecnordic-ski`):**

- Modify: `.claude/rules/content.md` (the context-to-register router)
- Modify: `CLAUDE.md` (the Website Content pointer)
- Modify: `docs/content-guide.md` (reference the shared method, add exemplars)
- Create: `.claude/hookify.content-review-reminder.local.md` (the reminder)
- Delete: `.claude/skills/content-cleanup/` (superseded by `content-review`)
- Modify: `docs/STATUS.md` and `BACKLOG.md` (record the initiative)

---

## Task 1: Widen the prose-guard general-tier lexicon

Add the catalog's clear-tell words to the general-tier blocking list, and the context-dependent common words to the advisory sweep. This is the only real-code task, so it uses TDD against the existing pytest suite.

**Files:**
- Modify: `~/.dotfiles/bin/.local/bin/prose-guard`
- Modify: `~/.dotfiles/tests/test_prose_guard.py`

- [ ] **Step 1: Write the failing tests**

Append to `~/.dotfiles/tests/test_prose_guard.py`:

```python
# web-content lexicon expansion (2026-06-06)
NEW_BLOCKING = ["embark", "harness", "bolster", "groundbreaking",
                "cutting-edge", "innovative", "foundational"]
NEW_ADVISORY = ["vital", "crucial", "essential", "dynamic", "journey", "passion"]


@pytest.mark.parametrize("word", NEW_BLOCKING)
def test_new_blocking_words_block_in_general(word):
    issues = pg.scan(f"We {word} the season together.", "general")
    assert f"banned word: {word}" in _kinds(issues)


@pytest.mark.parametrize("word", NEW_BLOCKING)
def test_new_blocking_words_skip_docs_tier(word):
    issues = pg.scan(f"We {word} the season together.", "docs")
    assert f"banned word: {word}" not in _kinds(issues)


@pytest.mark.parametrize("word", NEW_ADVISORY)
def test_new_advisory_words_do_not_block(word):
    issues = pg.scan(f"This is a {word} part of training.", "general")
    assert not any(k.startswith("banned word") for k in _kinds(issues))


@pytest.mark.parametrize("word", NEW_ADVISORY)
def test_new_advisory_words_surface_in_sweep(word):
    issues = pg.scan_advisory(f"This is a {word} part of training.", "general")
    assert any(word in k for k in _kinds(issues))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd ~/.dotfiles && python -m pytest tests/test_prose_guard.py -k "new_blocking or new_advisory" -q`
Expected: FAIL. The blocking words are not in any list yet, and the advisory words are not in `ADVISORY_WORDS`.

- [ ] **Step 3: Add the blocking words to the general tier**

In `~/.dotfiles/bin/.local/bin/prose-guard`, find the `JUDGMENT_WORDS` list (it begins `JUDGMENT_WORDS = [`). Add the new clear-tell words to it. The list becomes:

```python
JUDGMENT_WORDS = [
    "robust", "leverage", "comprehensive", "dedicated", "curated", "tailored",
    "foster", "elevate", "transformative", "pivotal", "thriving", "meticulous", "nuanced",
    "embark", "harness", "bolster", "groundbreaking", "cutting-edge", "innovative",
    "foundational",
]
```

`JUDGMENT_WORDS` feeds `TIER_WORDS["general"]` only, so these block in the general tier (website content) and stay silent in the docs and comments tiers, which is what the spec requires.

- [ ] **Step 4: Add the advisory words to the sweep**

In the same file, find `ADVISORY_WORDS` (it begins `ADVISORY_WORDS = [`). Extend it:

```python
ADVISORY_WORDS = ["leverage", "unlock", "elevate", "foster", "boost",
                  "vital", "crucial", "essential", "dynamic", "journey", "passion"]
```

`scan_advisory` is sweep-only and never blocks a write, so these surface in the report without stopping a draft.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd ~/.dotfiles && python -m pytest tests/test_prose_guard.py -q`
Expected: PASS, the full suite green (the new tests plus the existing ones).

- [ ] **Step 6: Confirm the live hook behaves**

Run: `mkdir -p /tmp/pgtest/src/content && printf 'We embark on the season.\nThis is a vital session.\n' > /tmp/pgtest/src/content/x.md && prose-guard /tmp/pgtest/src/content/x.md; echo "exit: $?"`
Expected: the report lists `banned word: embark` and `advisory: soft tell: vital`, and exits 1 (sweep found tells).

- [ ] **Step 7: Commit (dotfiles repo)**

```bash
git -C ~/.dotfiles add bin/.local/bin/prose-guard tests/test_prose_guard.py
git -C ~/.dotfiles commit -m "prose-guard: widen the general-tier web-content lexicon

Add the catalog's clear-tell words to the general-tier blocking list and the
context-dependent common words to the advisory sweep, so enforcement matches
the approved Signs-of-AI-writing standard without over-blocking normal prose.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Create the shared method doc

The reusable reference both skills load. It carries the audience-first method, the exemplar library, the catalog, the rubric, the level anchors, and the calibration set.

**Files:**
- Create: `~/.dotfiles/claude/.claude/docs/web-content-method.md`

- [ ] **Step 1: Write the method doc**

Create `~/.dotfiles/claude/.claude/docs/web-content-method.md` with exactly the content shown in the tilde-fenced block below. The prose carries no em dashes and no banned words. The catalog and the off-voice examples sit in three-backtick fenced blocks so the guard skips them. (The outer block here is tilde-fenced only so this plan can show it; the real file uses three-backtick fences internally.)

~~~markdown
# Web-content authoring method

The shared, site-agnostic method for drafting and reviewing website content. Each site supplies
its own voice and facts in its local `content-guide.md`. This doc supplies the process, the
catalog, and the rubric. Both the `content-draft` and `content-review` skills load it.

The guiding principle: a website article is not a code comment. Website content starts from the
audience. The substance levers (audience, concreteness, exemplars, an independent rubric review)
do the real work. The avoidance levers (the banned list, burstiness) are backstops, best left to
the deterministic `prose-guard`.

## 1. The audience-first drafting method

1. Audience and purpose brief, first. Before any prose, state who the piece serves, what they
   already know, what they need or worry about, where and how they will read it, and the one action
   or takeaway it must land. If any of these is unknown, ask. Nothing gets drafted before the brief.
2. Gather the concrete facts. Pull the real specifics from the site's canonical facts: places,
   dates, schedule, gear, cost, sign-up. Drafting on abstractions is the failure mode this prevents.
3. Load the register and its exemplars. Read the site `content-guide.md` for the voice and the
   facts, and read the exemplar pairs below. The exemplars are the primary style control. Match them.
4. Outline, then critique the outline. Sketch the headings and the one or two sentences each section
   must carry. Check the outline against the brief before writing prose.
5. Draft. Write audience-first and concrete, matching the exemplars, with varied sentence and
   paragraph length.
6. Self-check. Run the self-check in section 6 below.
7. Offer the score. Offer to run `content-review` before saving or committing.

## 2. The exemplar library

The primary style control. Each pair shows the slop version and the on-voice version of the same
idea. Each site adds its own pairs in its local `content-guide.md`. The off-voice halves sit in a
fenced block because they carry the words the guard blocks.

```
Off-voice (AI or program marketing): "East Community Nordic offers a comprehensive summer training
experience that empowers young athletes to navigate their journey toward elite Nordic skiing
performance, fostering a vibrant community of passionate skiers."

Off-voice: "Whether you're a beginner or a seasoned racer, our experienced volunteer coaches
provide expert guidance in a supportive environment, helping you take your skiing to the next level."
```

On-voice (a coach): "We run, ride mountain bikes, and roller-ski together through the summer.
Tuesday evenings we usually meet at the Service High parking lot. Most weeks include one strength
session when the gym is open."

On-voice: "Returning racers and first-summer kids both come. The pace is whatever the group can
hold together. Bring trail shoes, a water bottle, and bug spray."

## 3. The Signs-of-AI-writing catalog

The full set, sourced from Wikipedia's "Signs of AI writing" page and the user's standard. It lives
in a fenced block so the guard skips it. Copy the fenced catalog block verbatim from the design spec
at `docs/superpowers/specs/2026-06-05-web-content-authoring-design.md`, the fenced block under the
heading "The shared method doc", and paste it here. It covers the banned vocabulary, the banned
constructions, the structural tells, the tonal tells, and the Wikipedia additions (copula avoidance,
formulaic upbeat conclusions, vague attribution openers).

## 4. The rubric

Audience-first, with hard gates that override the score.

Hard gates. Any hit blocks publish, whatever the score:
- A banned word or phrase from the catalog (also caught by `prose-guard`).
- An unverified factual claim or fabricated social proof.
- A safety or standard-of-care promise that carries legal risk.
- A cost misstatement, for sites where cost is a fact (training is free; donations optional).

Scored dimensions. Each scores 0 to 5, weighted, then normalized to 100:

| Dimension | Weight |
|---|---|
| Audience fit | x3 |
| Concreteness and local specificity | x2 |
| Voice fidelity | x2 |
| AI-tell freedom | x2 |
| Cadence and burstiness | x1 |
| Structure and scannability | x1 |
| Key-fact and next-step clarity | x1 |

The weights sum to twelve sub-scores. Maximum raw score is sixty. Normalized score is the raw score
times 100 divided by 60.

The band is the verdict; the number is a secondary signal:
- Publish at 80 or above, with no hard-gate hit.
- Hold from 60 to 79. One revision pass, then re-score.
- Redraft below 60. Return to the brief.

Cadence and AI-tell freedom are inputs, never gates. Only the four hard gates block.

## 5. Per-dimension level anchors

What a 0, a 1, a 3, and a 5 look like, so a score means the same thing across sessions.

Audience fit:
- 5: speaks to both audiences at once, answers their real questions, reading level fits a teen and a
  parent, respects where they read it.
- 3: serves one audience well and the other thinly, mostly answers the real questions.
- 1: generic, addresses no specific reader, misses the questions they actually have.
- 0: wrong audience, an institutional or marketing voice.

Concreteness and local specificity:
- 5: names real places, dates, workouts, gear, cost, with nothing abstract.
- 3: some specifics, some filler abstraction.
- 1: mostly abstract, few real details.
- 0: brochure copy, no real details.

Voice fidelity:
- 5: the site's coach voice throughout, warm and plain, matches the guide.
- 3: mostly on-voice with a few off-register lines.
- 1: a corporate or cheerleader voice creeping in.
- 0: an institutional or marketing voice throughout.

AI-tell freedom:
- 5: clean against the catalog.
- 3: one or two tells.
- 1: several tells.
- 0: saturated with tells.

Cadence and burstiness:
- 5: varied sentence and paragraph length, no low-burstiness flag from the sweep.
- 3: some variation, one flat stretch.
- 1: uniform cadence, the sweep flags low burstiness.
- 0: metronomic.

Structure and scannability:
- 5: clear headings, short paragraphs, tables or bullets where they earn their place.
- 3: readable, a wall in places.
- 1: poor structure, hard to scan.
- 0: an unstructured block.

Key-fact and next-step clarity:
- 5: cost, schedule, safety, sign-up clear, with an obvious next step where relevant.
- 3: most facts clear, the next step vague.
- 1: key facts missing or buried.
- 0: misleading on a key fact.

## 6. The self-check before delivering

1. Read it out loud. Anything that sounds like a school brochure or a tourism page gets rewritten.
2. Search for the banned vocabulary and the negative-parallelism frame.
3. Scan for em dashes. For each, confirm it does work a comma, period, or parentheses cannot. If
   not, replace it.
4. Check for sentences ending in an "-ing" editorial tag.
5. Check for participial and formal-connector openers, and for paragraphs that restate themselves.

## 7. The calibration gold set

Re-anchor scoring against these from time to time, so the same piece lands in the same band. The
slop sample sits in a fenced block because it carries banned words.

Sample A, expected band Publish (about 88):

"Summer training starts the first week of June. We meet Tuesday and Thursday evenings at the Service
High parking lot, plus a Saturday morning long session. Most weeks we run, roller-ski, or ride
mountain bikes, and we add one strength session when the gym is open. Bring trail shoes, a water
bottle, and bug spray. Training is free. If you have questions, reach a coach through the contact
form."

Sample B, expected band Redraft (about 40):

```
"East Community Nordic is a vibrant, comprehensive program that empowers passionate young athletes
to embark on a transformative journey. Whether you're a beginner or a seasoned racer, our dedicated
coaches foster a dynamic environment. It's not just training. It's a community. Take your skiing to
the next level. Your summer starts here."
```
~~~

- [ ] **Step 2: Verify the doc is clean and complete**

Run: `prose-guard ~/.dotfiles/claude/.claude/docs/web-content-method.md; echo "exit: $?"`
Expected: no blocking tells (advisory lines are acceptable). If a banned word trips it, the word escaped a fence. Move it inside a three-backtick fenced block.
Run: `grep -c "^## " ~/.dotfiles/claude/.claude/docs/web-content-method.md`
Expected: 7 (the seven numbered sections).

- [ ] **Step 3: Fill in the catalog block**

Open the design spec, copy the fenced catalog block (under "The shared method doc") verbatim, and paste it into section 3 of the method doc, replacing the instruction paragraph with the fenced catalog itself. Keep it inside a three-backtick fence.

Run: `grep -q "Vocabulary to skip" ~/.dotfiles/claude/.claude/docs/web-content-method.md && echo OK`
Expected: `OK`.

- [ ] **Step 4: Commit (dotfiles repo)**

```bash
git -C ~/.dotfiles add claude/.claude/docs/web-content-method.md
git -C ~/.dotfiles commit -m "Add the shared web-content authoring method doc

The reusable reference both content skills load: the audience-first drafting
method, the exemplar library, the Signs-of-AI-writing catalog, the scoring
rubric, the per-dimension level anchors, and the calibration gold set.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Create the content-draft skill

The drafting skill. Audience-first by construction, exemplar-led, with the outline-critique step.

**Files:**
- Create: `~/.dotfiles/claude/.claude/skills/content-draft/SKILL.md`

- [ ] **Step 1: Write the skill**

Create `~/.dotfiles/claude/.claude/skills/content-draft/SKILL.md` with the content shown in the tilde-fenced block below.

~~~markdown
---
name: content-draft
description: "Draft website content (pages, posts, form copy) audience-first. Use BEFORE writing any new site page, post, or form copy, or when the user says \"draft a page\", \"write the X page\", \"write a post\", \"write copy for\". For website content only, NOT code, docs, specs, or commit messages. Loads the shared web-content method and the site's content-guide voice."
user_invocable: true
---

# Content Draft

Drive website-content drafting from the audience outward. This skill is for the web-content
register only. For code comments, docs, specs, or commit messages, use the technical voice instead.

Load the shared method at `~/.claude/docs/web-content-method.md` and the site's
`docs/content-guide.md`. Then work the steps in order.

## Steps

1. **Audience and purpose brief, first.** State, in writing, who the piece serves (for ecnordic,
   high-school athletes and their parents, usually both at once), what they already know, what they
   need or worry about, where and how they will read it, and the one action or takeaway it must
   land. If any of these is unknown, ask the user. Do not draft prose before this brief exists.

2. **Gather the concrete facts.** Pull the real specifics from the content-guide canonical facts:
   places, dates, schedule, gear, cost, sign-up. If a needed fact is missing, ask rather than invent.

3. **Load the register and its exemplars.** Read the off/on-voice exemplar pairs in the method doc
   and the site voice in the guide. The exemplars are the primary style control. Match them. The
   banned-word list is a backstop enforced by prose-guard, not your main lever.

4. **Outline, then critique the outline.** Write the headings and the one or two sentences each
   section must carry. Check the outline against the brief. Fix a weak structure here, before prose.

5. **Draft.** Write audience-first and concrete, matching the exemplars, with varied sentence and
   paragraph length. Use contractions. Let one-sentence paragraphs stand.

6. **Self-check.** Run the self-check from the method doc. If you used a banned word, flag it in your
   response with a one-line justification.

7. **Offer the score.** Offer to run the content-review skill before saving or committing.

## Hard rules

- The brief comes first. A draft with no stated audience is a failure of this skill.
- Ask for missing facts. Never invent a place, date, cost, or quote.
- This is website content. Do not apply it to code, docs, specs, or commits.
~~~

- [ ] **Step 2: Verify the skill is well-formed**

Run: `prose-guard ~/.dotfiles/claude/.claude/skills/content-draft/SKILL.md; echo "exit: $?"`
Expected: no blocking tells. The frontmatter is skipped by the guard, and the body carries no banned words.
Run: `grep -q "name: content-draft" ~/.dotfiles/claude/.claude/skills/content-draft/SKILL.md && echo OK`
Expected: `OK`.

- [ ] **Step 3: Commit (dotfiles repo)**

```bash
git -C ~/.dotfiles add claude/.claude/skills/content-draft/SKILL.md
git -C ~/.dotfiles commit -m "Add the content-draft skill

Audience-first website-content drafting: brief, gather facts, load exemplars,
outline and critique, draft, self-check, offer the score. Scoped to the
web-content register, not technical writing.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Create the content-review skill

The review-and-score skill. Runs as a fresh pass, band-led, and absorbs the old content-cleanup triggers.

**Files:**
- Create: `~/.dotfiles/claude/.claude/skills/content-review/SKILL.md`

- [ ] **Step 1: Write the skill**

Create `~/.dotfiles/claude/.claude/skills/content-review/SKILL.md` with the content shown in the tilde-fenced block below.

~~~markdown
---
name: content-review
description: "Review and score website content (pages, posts, form copy) against the audience-first rubric, then propose per-sentence fixes. Use after drafting or editing site content, before committing, or when the user says \"/content-cleanup\", \"clean up this content\", \"check for AI tells\", \"editorial pass\", \"review this page\", \"score this copy\". For website content only. Takes a file path."
user_invocable: true
---

# Content Review

Score a website-content file against the rubric and propose fixes. Run this as a fresh review of the
file, not as a continuation of the context that drafted it. Independent rubric-guided review is the
reliable form; self-critique in the drafting context is not.

Load the shared method at `~/.claude/docs/web-content-method.md` (the rubric, the level anchors, the
gold set) and the site's `docs/content-guide.md` (the voice).

## Steps

1. **Read** the target file, the content-guide, and the rubric with its level anchors.

2. **Run prose-guard** on the file for the machine signals:
   `prose-guard <file>`
   It reports burstiness, banned words, structural tells, and the advisory sweep. These feed the
   cadence and AI-tell dimensions. They are inputs, never the verdict.

3. **Score the seven dimensions** against their 0-to-5 level anchors. The machine signals feed
   cadence and AI-tell freedom. Agent judgment scores audience fit, concreteness, voice, structure,
   and key-fact clarity. Compute the raw score, then the normalized score (raw times 100 over 60).

4. **Check the hard gates:** a banned word or phrase, an unverified or fabricated claim, a
   safety or standard-of-care promise, a cost misstatement. Any hit blocks publish.

5. **Decide the band:** Publish (80+, no gate hit), Hold (60 to 79), or Redraft (below 60).

6. **Report, band first.** Lead with the band. Then the hard-gate status. Then the score table.
   Then a per-sentence findings list. Each finding quotes the sentence, names the specific pattern,
   proposes a replacement, and gives a one-line reason. If nothing is flagged, say so.

7. **Apply only approved edits.** Ask "apply all, apply some (specify), or skip?". Edit only the
   approved sentences. Change nothing else. Never change meaning to fix rhythm; flag those as needing
   human judgment and skip.

## Hard rules

- The band leads; the 0-to-100 number is secondary.
- Cite a named pattern or leave the sentence alone. No "improved the flow" rewrites.
- Re-check each proposed replacement against the catalog before presenting it.
- This is website content. Do not apply it to code, docs, specs, or commits.
~~~

- [ ] **Step 2: Verify the skill is well-formed**

Run: `prose-guard ~/.dotfiles/claude/.claude/skills/content-review/SKILL.md; echo "exit: $?"`
Expected: no blocking tells.
Run: `grep -q "content-cleanup" ~/.dotfiles/claude/.claude/skills/content-review/SKILL.md && echo OK`
Expected: `OK` (the old triggers are absorbed into the description).

- [ ] **Step 3: Commit (dotfiles repo)**

```bash
git -C ~/.dotfiles add claude/.claude/skills/content-review/SKILL.md
git -C ~/.dotfiles commit -m "Add the content-review skill

Independent, band-led rubric scoring for website content, with per-sentence
findings and approval-gated edits. Absorbs the retired content-cleanup
triggers. Scoped to the web-content register.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Wire the ecnordic routing and retire content-cleanup

Make the right voice and skill the default in the ecnordic repo, and remove the superseded skill.

**Files:**
- Modify: `~/Projects/ecnordic-ski/.claude/rules/content.md`
- Modify: `~/Projects/ecnordic-ski/CLAUDE.md`
- Delete: `~/Projects/ecnordic-ski/.claude/skills/content-cleanup/`

- [ ] **Step 1: Add the routing block to the content rule**

In `~/Projects/ecnordic-ski/.claude/rules/content.md`, insert the block shown below immediately after the top `# Content Standards` heading and before the existing "Before writing or editing any website content..." line.

~~~markdown
## Voice routing: pick the register by context

Website content and code are different writing. Route by what you are editing.

- **Website content** (pages, posts, or form copy under `src/content/`): the web-content register.
  Before drafting, use the `content-draft` skill. Before committing edited content, use the
  `content-review` skill. The shared method is at `~/.claude/docs/web-content-method.md`; the local
  voice is in `docs/content-guide.md` below.
- **Code, docs, specs, commit messages:** the technical voice. Keep the existing tools (the
  `writing-voice` output style, `prose-voice.md`, the `prose-guard` docs and comments tiers). Do not
  apply the web-content skills to them.
~~~

- [ ] **Step 2: Point the banned-list duplication at one source**

In the same file, the `## Avoiding AI Rhythm` section duplicates the catalog under anti-pattern 10 (a three-backtick fenced word list). Replace that whole anti-pattern 10 item, including its fenced list, with the single item shown below, so the catalog lives in one place.

~~~markdown
10. **Banned words and phrases.** The full Signs-of-AI-writing catalog lives in the shared method
    doc (`~/.claude/docs/web-content-method.md`) and in `docs/content-guide.md`. `prose-guard`
    enforces it at write time. Do not maintain a third copy here.
~~~

- [ ] **Step 3: Verify the content rule is clean**

Run: `prose-guard ~/Projects/ecnordic-ski/.claude/rules/content.md; echo "exit: $?"`
Expected: no blocking tells. If the old fenced list was removed cleanly, nothing trips.
Run: `grep -q "content-draft" ~/Projects/ecnordic-ski/.claude/rules/content.md && grep -q "content-review" ~/Projects/ecnordic-ski/.claude/rules/content.md && echo OK`
Expected: `OK`.

- [ ] **Step 4: Add the Website Content pointer to CLAUDE.md**

In `~/Projects/ecnordic-ski/CLAUDE.md`, find the `## Development Workflow` section. Immediately after that section's paragraph, add the section shown below.

~~~markdown
## Website Content

Website content (pages, posts, form copy under `src/content/`) uses the audience-first web-content
register, not the technical voice. Draft with the `content-draft` skill and review with
`content-review`. The routing and the voice rules are in `.claude/rules/content.md`.
~~~

- [ ] **Step 5: Delete the superseded content-cleanup skill**

Run: `git -C ~/Projects/ecnordic-ski rm -r .claude/skills/content-cleanup`
Expected: the directory and its `SKILL.md` are staged for deletion.

- [ ] **Step 6: Verify content-cleanup is gone and its triggers are covered**

Run: `test ! -e ~/Projects/ecnordic-ski/.claude/skills/content-cleanup && echo "removed"`
Expected: `removed`.
The `content-review` description (Task 4) carries the `/content-cleanup`, "clean up this content", "check for AI tells", and "editorial pass" phrases, so those still route to a skill.

- [ ] **Step 7: Commit (ecnordic repo)**

```bash
git -C ~/Projects/ecnordic-ski add .claude/rules/content.md CLAUDE.md .claude/skills/content-cleanup
git -C ~/Projects/ecnordic-ski commit -m "Route website content to the new draft and review skills

Add a context-to-register router to the content rule, a Website Content
pointer to CLAUDE.md, and retire content-cleanup in favor of content-review.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Add the content-review reminder hook

A single nudge toward `content-review` when a `src/content` file is edited.

**Files:**
- Create: `~/Projects/ecnordic-ski/.claude/hookify.content-review-reminder.local.md`

- [ ] **Step 1: Write the hook**

Create `~/Projects/ecnordic-ski/.claude/hookify.content-review-reminder.local.md` with the content shown in the tilde-fenced block below.

~~~markdown
---
name: content-review-reminder
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: src/content/.*\.md$
---

**Website content edited.** Before committing, run the `content-review` skill on this file to score
it against the audience-first rubric and catch AI tells. The band (publish, hold, or redraft) is the
go/no-go. This is website content, so use the web-content register, not the technical voice.
~~~

- [ ] **Step 2: Verify the hook is well-formed**

Run: `grep -q "content-review-reminder" ~/Projects/ecnordic-ski/.claude/hookify.content-review-reminder.local.md && echo OK`
Expected: `OK`.
Confirm the frontmatter matches the schema of `.claude/hookify.hardcoded-oklch.local.md` (same `event: file` and `conditions` shape).

- [ ] **Step 3: Commit (ecnordic repo)**

```bash
git -C ~/Projects/ecnordic-ski add .claude/hookify.content-review-reminder.local.md
git -C ~/Projects/ecnordic-ski commit -m "Add a content-review reminder hook for src/content edits

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Reference the shared method from the content guide

Keep `content-guide.md` the ecnordic voice source of truth, point it at the shared method, and stop duplicating the catalog. Add the trailhead-voice framing and the off/on exemplar pairs.

**Files:**
- Modify: `~/Projects/ecnordic-ski/docs/content-guide.md`

- [ ] **Step 1: Add a method pointer at the top**

In `~/Projects/ecnordic-ski/docs/content-guide.md`, immediately after the opening paragraph (the one that starts "Editorial standards for ecnordic.ski"), add the paragraph shown in the tilde-fenced block below.

~~~markdown
This guide is the ecnordic voice. The shared, site-agnostic method (the audience-first drafting
steps, the full Signs-of-AI-writing catalog, the scoring rubric, and the calibration set) lives at
`~/.claude/docs/web-content-method.md`. Draft with the `content-draft` skill and review with
`content-review`. This guide holds what is specific to EC Nordic: the trailhead voice, the local
features, and the exemplars below.
~~~

- [ ] **Step 2: Add the trailhead-voice exemplars**

In the `## Voice and Tone` section, after the existing examples, add the subsection shown in the tilde-fenced block below. In the real file, the inner off-voice block uses a three-backtick fence (the guard skips it, which is why the banned words there do not trip it).

~~~markdown
### Concrete, local, and credible

Write as a coach talking to teenagers and their parents at a trailhead. Be specific about places,
workouts, conditions, and gear. The audience spots AI-generated school communications on sight, so
concrete writing reads as credible and abstraction reads as suspect. Name real local features when
natural: the Service High parking lot, the Coastal Trail, Kincaid, the Hillside trails, specific
dates, specific weather.

The off-voice halves below carry the words the guard blocks, so they sit in a three-backtick fence:

```
Off-voice (AI or program marketing): "East Community Nordic offers a comprehensive summer training
experience that empowers young athletes to navigate their journey toward elite Nordic skiing
performance, fostering a vibrant community of passionate skiers."

Off-voice: "Whether you're a beginner or a seasoned racer, our experienced volunteer coaches
provide expert guidance in a supportive environment, helping you take your skiing to the next level."
```

On-voice (a coach): "We run, ride mountain bikes, and roller-ski together through the summer.
Tuesday evenings we usually meet at the Service High parking lot. Most weeks include one strength
session when the gym is open."

On-voice: "Returning racers and first-summer kids both come. The pace is whatever the group can
hold together. Bring trail shoes, a water bottle, and bug spray."
~~~

- [ ] **Step 3: Verify the guide is clean**

Run: `prose-guard ~/Projects/ecnordic-ski/docs/content-guide.md; echo "exit: $?"`
Expected: no blocking tells. If a banned word from the off-voice examples trips it, that example escaped its three-backtick fence. Move it inside.
Run: `grep -q "web-content-method.md" ~/Projects/ecnordic-ski/docs/content-guide.md && echo OK`
Expected: `OK`.

- [ ] **Step 4: Commit (ecnordic repo)**

```bash
git -C ~/Projects/ecnordic-ski add docs/content-guide.md
git -C ~/Projects/ecnordic-ski commit -m "Point the content guide at the shared method and add exemplars

Reference the shared web-content method as the catalog and rubric source,
keep the guide as the EC Nordic voice, and add the trailhead-voice framing
and the off/on exemplar pairs.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: End-to-end verification and status update

Confirm the whole system behaves, then record the initiative.

**Files:**
- Modify: `~/Projects/ecnordic-ski/docs/STATUS.md`
- Modify: `~/Projects/ecnordic-ski/BACKLOG.md`

- [ ] **Step 1: Verify the lexicon change end to end**

Run: `mkdir -p /tmp/pgv/src/content && printf 'We embark on a vital journey.\n' > /tmp/pgv/src/content/x.md && prose-guard /tmp/pgv/src/content/x.md; echo "exit: $?"`
Expected: the report lists `banned word: embark` (blocking) and `advisory: soft tell: vital` and `advisory: soft tell: journey` (advisory). Exit 1.

- [ ] **Step 2: Verify the skills are discoverable**

Run: `ls ~/.claude/skills/content-draft/SKILL.md ~/.claude/skills/content-review/SKILL.md`
Expected: both paths exist (through the stow symlink).
Run: `python -m pytest ~/.dotfiles/tests/test_prose_guard.py -q`
Expected: the suite passes.

- [ ] **Step 3: Verify the technical track is unchanged**

Run: `printf 'This is a robust, comprehensive design.\n' > /tmp/pgv/docs-check.md && prose-guard /tmp/pgv/docs-check.md; echo "exit: $?"`
Expected: `robust` and `comprehensive` do NOT block in the docs tier (they are general-tier `JUDGMENT_WORDS`). The sweep may surface other advisories. The point is the docs tier behaves as before.

- [ ] **Step 4: Run a live review as a calibration sanity check**

Use the `content-review` skill on an existing page, for example `src/content/pages/about.md`. Confirm it returns a band, a score table, the hard-gate status, and a per-sentence findings list. This is a smoke test of the skill, not a content change. Do not apply edits.

- [ ] **Step 5: Update STATUS.md**

In `~/Projects/ecnordic-ski/docs/STATUS.md`, update the current-initiative block to record that the web-content authoring infrastructure shipped: the shared method doc, the `content-draft` and `content-review` skills, the widened `prose-guard` lexicon, and the ecnordic routing. Note that the dotfiles changes are committed in `~/.dotfiles` (unpushed) and the ecnordic changes are committed on local `main` (unpushed, because a push deploys live).

- [ ] **Step 6: Record the out-of-scope follow-ups in the backlog**

In `~/Projects/ecnordic-ski/BACKLOG.md`, record the two follow-ups from the spec: a retroactive rubric audit of the existing pages, and a 907.life `content-guide.md` plus `content.md` that point at the same shared method. Use the repo's `/log-issue` format.

- [ ] **Step 7: Verify the status docs are clean**

Run: `prose-guard ~/Projects/ecnordic-ski/docs/STATUS.md ~/Projects/ecnordic-ski/BACKLOG.md; echo "exit: $?"`
Expected: no blocking tells.

- [ ] **Step 8: Commit (ecnordic repo)**

```bash
git -C ~/Projects/ecnordic-ski add docs/STATUS.md BACKLOG.md
git -C ~/Projects/ecnordic-ski commit -m "Record the web-content authoring initiative in STATUS and backlog

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 9: Stop for the human**

Do not push. The dotfiles changes sit unpushed in `~/.dotfiles`; the ecnordic changes sit on local `main`. Tell the user the initiative is complete, summarize what to smoke-test (draft a short post with `content-draft`, review it with `content-review`), and let them push both repos when ready.

---

## Self-review

**Spec coverage.** Spec section "Architecture and homes" maps to Tasks 2, 3, 4 (shared) and 5, 6, 7 (local). "The drafting skill" maps to Task 3. "The review-and-score skill" maps to Task 4. "Activation" maps to Task 5 (rule, CLAUDE.md) and Task 6 (reminder hook). "The rubric", the level anchors, and the calibration set map to Task 2. "prose-guard lexicon expansion" maps to Task 1. "Verification" maps to Task 8. The content-cleanup retirement maps to Task 5. No spec section is unaddressed.

**Placeholder scan.** Every file's content is given in full, except the catalog block in Task 2, which points at the verbatim fenced block in the committed spec and is pasted in Step 3. The rubric, the level anchors, the exemplars, the calibration samples, the skill descriptions, the hook, and the prose-guard lists and tests are all complete.

**Name consistency.** The skills are `content-draft` and `content-review` in every task. The method doc is `web-content-method.md`, at `~/.claude/docs/` through the stow symlink and `~/.dotfiles/claude/.claude/docs/` at the real path. The new prose-guard lists are `JUDGMENT_WORDS` (blocking, general tier) and `ADVISORY_WORDS` (sweep), matching the tool. The hook fields (`event: file`, `conditions`, `field`, `operator`, `pattern`) match the existing hookify files.
