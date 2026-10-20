# Web-content authoring infrastructure: drafting skill, review rubric, shared method

Date: 2026-06-05
Status: Approved design, ready for an implementation plan

## Problem

The site's prose stack was built coder-first. The `writing-voice` output style, the
`prose-voice.md` reference, and the `prose-guard` hook all assume technical writing: terse,
plain, and stripped of decoration. That register fits code comments, docs, specs, and commit
messages. It does not fit website content for high-school athletes and their parents.

Two gaps follow. First, there is no skill that drives drafting. The one editorial skill,
`content-cleanup`, reviews finished copy and flags ten named patterns, but it starts after the
words are on the page and it produces a yes/no flag, not a measured quality signal. Second,
nothing makes the writer start from the audience. The hardest part of website copy is deciding
who it serves and what they need before a sentence is written, and the current tools say nothing
about that step.

The user's standard for participant-facing copy is explicit: write like a coach at a trailhead,
concrete and local, and recognize that this audience spots AI-style school communications and
brochure prose on sight. That standard has no home in the infrastructure today. It lives only in
`docs/content-guide.md`, which the drafting tools do not enforce as a process.

## Goal

Build a web-content authoring track that starts from the audience, drafts in the right register,
and scores the result against a rubric. Keep the technical writing track intact. Make the
method reusable across sites (ecnordic, 907.life) while each site keeps its own voice.

## Non-goals

- No change to the technical writing track. Code comments, docs, specs, and commit messages keep
  the existing voice, the `prose-voice.md` reference, and the `prose-guard` docs and comments
  tiers. This work adds a register; it does not replace one.
- No rewrite of existing site content. The skills and rubric apply going forward and on demand.
- No new automated detector. The rubric uses `prose-guard`'s existing sweep for machine signals
  and agent judgment for the rest. Burstiness and word-list checks are one input, not a verdict.

## Design principle: one floor, two registers, chosen by context

A website article is not a code comment. The model is a single quality floor with two registers
selected by what is being written.

- **Floor, always on.** The `writing-voice` output style: plain voice, varied cadence, no AI
  tells. It applies to everything.
- **Technical register.** Code comments, docs, specs, commits, READMEs. Governed by
  `prose-voice.md`, the `go-conventions` skill, and the `prose-guard` docs and comments tiers.
  Unchanged by this work.
- **Web-content register, new.** Site pages, posts, and form copy. Audience-first, coach at a
  trailhead, governed by the site `content-guide.md`, the `prose-guard` general tier, and the two
  new skills.

`prose-guard` already routes by tier: the general tier for `.md` under `src/content/`, the docs
tier for other `.md`, and the comments tier for code. That tier map is the context router. The
web-content register plugs into the general tier and leaves the technical tiers alone.

## Architecture and homes

The hybrid split puts the method in the dotfiles and the voice in each repo.

**Shared, in `~/.dotfiles/claude/.claude/` (synced by stow, reusable across sites):**

- `docs/web-content-method.md`: the methodology. It holds the audience-first drafting method, the
  exemplar library, the full Signs-of-AI-writing catalog (banned vocabulary, constructions,
  structural and tonal tells) in fenced blocks, the scoring rubric with its per-dimension level
  anchors, and the calibration gold set. Both skills load it.
- `skills/content-draft/SKILL.md`: the drafting skill.
- `skills/content-review/SKILL.md`: the review-and-score skill.

**Local, in the ecnordic repo:**

- `docs/content-guide.md`: stays the site voice source of truth. It gains a short pointer to the
  shared method and keeps the ecnordic specifics (the trailhead voice, the Anchorage features, the
  off/on-voice examples). It does not duplicate the catalog.
- `.claude/rules/content.md`: carries the context-to-register map and routes drafting to
  `content-draft` and review to `content-review`.
- `CLAUDE.md`: gains a short Website Content line naming the workflow and pointing at the rule.
- A hookify reminder (`.claude/hookify.content-review-reminder.local.md`, matching the existing
  reminder files) nudges `content-review` when a `src/content/` file is edited.
- `.claude/skills/content-cleanup/`: deleted. `content-review` supersedes it.

Banned-word lists go inside fenced code blocks in every file, because `prose-guard` skips fenced
content. That is why this spec, the method doc, and the guide can all carry the catalog without
the hook rejecting the edit.

## The drafting skill: `content-draft`

A process skill. The steps are ordered. The first one is the point of the whole skill, and the
draft is steered by positive exemplars rather than by a list of words to avoid. The 2026 research
is clear that a banned-word list is a soft constraint that decays over a long draft, while a
consistent set of example pairs is a reliable style control (see Design rationale and evidence).

1. **Audience and purpose brief, first.** Before any prose, state who the piece serves (athletes,
   parents, or both), what they already know, what they need or worry about, where and how they
   will read it, and the one action or takeaway it must land. If any of these is unknown, ask.
   Nothing gets drafted before this brief exists.
2. **Gather the concrete facts.** Pull the real specifics from the content-guide canonical facts:
   places, dates, schedule, gear, cost, sign-up. Drafting on abstractions is the failure mode this
   step prevents.
3. **Load the register and its exemplars.** Read the site `content-guide.md` for the voice and the
   canonical facts, and read the off/on-voice exemplar pairs in the method doc. The exemplars are
   the primary style control. Match them.
4. **Outline, then critique the outline.** Sketch the structure first: headings and the one or two
   sentences each section must carry. Check the outline against the brief before writing prose.
   Fix a weak structure here, not after a full draft exists.
5. **Draft.** Write audience-first and concrete, matching the exemplars, with varied sentence and
   paragraph length.
6. **Self-check.** Run the Signs-of-AI-writing self-check from the method doc: read it aloud, hunt
   the banned vocabulary and the negative-parallelism frame, test every dash, and check for
   trailing "-ing" editorial tags. This is a backstop. The deterministic enforcement is
   `prose-guard`, which blocks the banned vocabulary at write time regardless of what the draft
   remembers.
7. **Offer the score.** Offer to run `content-review` before saving or committing.

The skill is reusable. The audience-first steps, the outline critique, and the self-check are
site-agnostic. The local `content-guide.md` supplies the voice, the exemplars, and the facts.

## The review-and-score skill: `content-review`

A review skill that produces a band, a score, and a findings list, then gates edits on approval.
It runs as a fresh agent, separate from whatever context drafted the piece. The research is
consistent that single-model self-critique is unreliable, while rubric-guided review by an
independent evaluator is the form that works. Running it fresh is the design's way of buying that
independence.

1. Read the target file, the site `content-guide.md`, and the rubric in the method doc, including
   the per-dimension level anchors.
2. Run `prose-guard` on the file for the machine signals: burstiness, banned words, structural
   tells, and the advisory sweep.
3. Score the seven dimensions against their 0-to-5 level anchors. The machine signals feed cadence
   and part of AI-tell freedom; agent judgment scores audience fit, concreteness, voice, structure,
   and key-fact clarity.
4. Check the hard gates.
5. Decide the band: publish, hold, or redraft. The band is the headline output, because a
   three-way decision is the reliable part of an LLM judgment. The 0-to-100 number is reported
   under it as a secondary signal, not as the verdict.
6. Report: the band first, then the hard-gate status, then the score table, then a per-sentence
   findings list. Each finding names the specific pattern and proposes a fix. This is the
   `content-cleanup` behavior, preserved.
7. Apply only approved edits. Change nothing else.

Its description carries the old `content-cleanup` triggers (`/content-cleanup`, "clean up this
content", "check for AI tells", "editorial pass") so existing habits still reach it.

## Activation: how Claude knows when and how to use these

Skills that never fire are dead weight, and the register has to be chosen correctly every time.
Four layers decide when the skills fire and which voice applies, from softest to hardest.

1. **Skill descriptions. The discovery layer.** Each `SKILL.md` description names its trigger
   moment and scopes it to website content. `content-draft` triggers when the next action is
   drafting a site page, post, or form copy, or when the user asks to write or draft such copy.
   `content-review` triggers before committing edited site content and on the old `content-cleanup`
   phrases. Both descriptions say in plain terms that they are for website content, not for code,
   docs, specs, or commit messages.

2. **The repo rule. The router.** `.claude/rules/content.md` auto-loads, so it is always in
   context. It carries the context-to-register map and the workflow. Editing a file under
   `src/content/`, or drafting a page, post, or form copy, uses the web-content register and the two
   skills: invoke `content-draft` before writing, run `content-review` before committing. Editing
   code, docs, specs, or commit messages keeps the technical voice and its existing tools. This rule
   is the line that makes the right voice and the right skill the default rather than an afterthought.

3. **The project pointer.** `CLAUDE.md` gains a short Website Content line that names the workflow
   and points at the rule, so the always-loaded instructions carry it.

4. **A drafting-time reminder.** A reminder, fired when a file under `src/content/` is edited, that
   suggests `content-review` before the commit. It mirrors the existing hookify svelte-check
   reminder and matches its tracked-or-local status. Reminder hooks can read as noise, so it stays a
   single short nudge, not a repeated block.

The cross-site story rides on layers 1 and 2. The skills are global, so their descriptions trigger
everywhere. Each site carries its own `content.md` rule and `CLAUDE.md` pointer, so 907.life gets
the same routing by copying two small local files.

## The rubric

Audience-first, with hard gates that override the score.

**Hard gates. Any hit blocks publish, whatever the score.**

- A banned word or phrase from the catalog (also caught by `prose-guard`).
- An unverified factual claim or fabricated social proof.
- A safety or standard-of-care promise that carries legal risk.
- A cost misstatement. Training is free; donations are optional.

**Scored dimensions. Each scores 0 to 5. Weighted, then normalized to 100.**

| Dimension | Weight | Measures |
|---|---|---|
| Audience fit | x3 | Written to athletes and parents; answers their real questions; right reading level and context |
| Concreteness and local specificity | x2 | Real places, dates, workouts, gear; abstraction and marketing absent |
| Voice fidelity | x2 | Coach at a trailhead; matches the content-guide; warm, not gushing |
| AI-tell freedom | x2 | Clean against the Signs-of-AI-writing catalog |
| Cadence and burstiness | x1 | Varied sentence and paragraph length, from the `prose-guard` sweep |
| Structure and scannability | x1 | Headings, short paragraphs, tables and bullets where they earn their place |
| Key-fact and next-step clarity | x1 | Cost, schedule, safety, sign-up clear; a clear next step where relevant |

The weights sum to twelve sub-scores. Maximum raw score is sixty. The normalized score is the raw
score times 100 divided by 60.

**Level anchors.** Each dimension scores against explicit descriptors in the method doc for what a
0, a 1, a 3, and a 5 look like. A 100-point scale with no anchors drifts and reads as false
precision. The anchors are what make a 3 mean the same thing across sessions.

**The band is the verdict; the number is a secondary signal.** A three-way decision is the
reliable part of an LLM judgment, so the band leads. The 0-to-100 number rides under it for
tracking, not as the call.

- Publish at 80 or above, with no hard-gate hit.
- Hold from 60 to 79. One revision pass, then re-score.
- Redraft below 60. Return to the brief.

**Cadence and AI-tell freedom are inputs, never gates.** Burstiness and the detector-style signals
are evadable and prone to false positives, so they inform their two dimensions and never block a
piece on their own. Only the four hard gates block.

**Calibration is required, not optional.** The method doc carries a small gold set: a handful of
sample pieces scored by hand with their expected bands. A reviewer re-anchors against it
periodically. The aim is a steady judgment, with the same piece landing in the same band across
sessions.

## The shared method doc: `web-content-method.md`

The reusable reference both skills load. Its sections:

1. The audience-first method. The seven drafting steps, written site-agnostic.
2. The exemplar library. Off/on-voice pairs that show the target register beside the slop version
   of the same idea. These are the primary style control, so this section earns real length. Each
   site extends it with its own pairs in the local `content-guide.md`.
3. The Signs-of-AI-writing catalog. The full set, in fenced blocks so `prose-guard` skips it. It
   covers the banned vocabulary, the banned constructions, the structural tells, and the tonal
   tells. It credits Wikipedia's "Signs of AI writing" page as the source.
4. The rubric. The dimensions, weights, gates, bands, and the normalization formula.
5. The per-dimension level anchors. For each of the seven dimensions, what a 0, a 1, a 3, and a 5
   look like, so the score means the same thing across sessions.
6. The calibration gold set. A handful of sample pieces scored by hand with their expected bands,
   used to re-anchor the agent's scoring.

The catalog's banned vocabulary, recorded for reference (this block is fenced, so the guard skips
it):

```
Vocabulary to skip: delve, dive into, navigate (as metaphor), unlock, embark, foster, cultivate,
empower, leverage, harness, unpack, underscore, bolster, shed light on, pave the way, robust,
comprehensive, vibrant, dynamic, seamless, holistic, intricate, nuanced (as empty praise),
multifaceted, journey (as metaphor), passion, passionate, vital, crucial, essential, pivotal,
transformative, groundbreaking, cutting-edge, innovative, foundational, testament.

Constructions to skip: "It's not just X. It's Y." and every negative-parallelism form;
"Whether you're a beginner or a seasoned racer..."; "More than just..."; "In today's world...";
"It's worth noting / It's important to note"; "When it comes to / At its core / At the end of the
day"; "Join us as we... / Discover the joy of..."; "Take it to the next level"; opening with a
rhetorical question; closing with a motivational tag; sentences ending in an "-ing" editorial tag.

Structural patterns to skip: three-item lists where two or four fit equally; stacked parallel
sentence openings; every paragraph ending on a punchy line; paragraphs all the same length;
decorative em-dashes; excessive bolding; "Bold term: explanation" list formatting; bullets for
content that reads better as prose; closing summaries.

Tonal patterns to skip: promotional or tourism-website tone; performative enthusiasm; unsolicited
reassurance; phrases that promise standards of care or safety guarantees.

Wikipedia adds, beyond the user's list: copula avoidance (swapping plain is/are for fancier
being-verbs), formulaic upbeat conclusion sections, and vague attribution openers.
```

## prose-guard lexicon expansion

The general tier should enforce the approved catalog as far as a regex reliably can. The change
splits the new words by how safely they block.

- **Add to the blocking list (general tier):** the clear tells the catalog has and the tool lacks,
  for example embark, harness, bolster, groundbreaking, cutting-edge, innovative, foundational.
  These rarely appear in honest website copy, so a hard block has a low false-positive rate.
- **Add to the advisory sweep only:** the context-dependent common words, for example vital,
  crucial, essential, key, dynamic, journey, passion. These appear in normal sentences, so a hard
  block would be noisy. The sweep surfaces them without blocking the write.

This touches `~/.dotfiles/bin/.local/bin/prose-guard` and needs a `stow -R bin` refresh. The tool
has its own tests; the change keeps the existing tier structure and only extends the word lists.

## Design rationale and evidence

The shape follows current research on what actually improves writing from a frontier model. The
short version: the substance levers do the real work, and the avoidance levers are backstops.

- **Audience-first is the highest-leverage lever.** Slop is fluent on the surface and empty
  underneath, and it is what a model produces by default when given no audience and no constraints.
  Persona, audience, and tone conditioning is the documented frontier for fighting that default.
  This is why the brief comes first and audience fit carries triple weight.
- **Exemplars beat banned lists for style.** A negative instruction is a soft constraint competing
  with the model's training prior, and it decays across a long draft. Consistent positive examples
  are a more reliable style control. So the drafting skill leads with the exemplar pairs, and the
  banned vocabulary is enforced deterministically by `prose-guard`, not by the model's memory.
- **Rubric review works, and independence matters.** Rubric-guided feedback beats generic critique
  and helps a writer internalize the standard. Single-model self-critique is unreliable, so the
  review runs as a fresh agent. A three-way band is the dependable part of an LLM judgment, so the
  band leads and the number trails, with a hand-scored gold set to hold the scoring steady.
- **Progressive drafting reduces slop.** Outline, critique the outline, then write prose. This beats
  going straight to prose, which is why the drafting skill adds the outline-critique step.

Two honest limits. There is no Opus-4.8-specific writing evaluation in public, so this rests on
general 2026 frontier findings, which apply to a strong instruction-follower and arguably help it
most. And the detector-style signals (burstiness, perplexity) are evadable and false-positive
prone, so they stay advisory inputs and never gate a piece.

Sources: Redish on plain-language and audience
(https://redish.net/), the 2026 anti-slop and structured-prompting writing
(https://aitoolly.com/ai-news/article/2026-05-29-taste-skill-the-new-github-project-aiming-to-eliminate-ai-generated-slop-and-mediocrity),
the banned-lexicon validator on negative prompting limits
(https://blog.ozigi.app/blog/stopping-ai-slop-in-production-banned-lexicon-validator),
few-shot exemplar reliability
(https://promptingweekly.substack.com/p/few-shot-examples-done-properly),
rubric-based evaluation and LLM-judge calibration
(https://arxiv.org/html/2602.12779,
https://mer.vin/2025/11/llm-as-a-judge-best-practices-for-consistent-evaluation/), and the
burstiness detector limits
(https://www.pangram.com/blog/why-perplexity-and-burstiness-fail-to-detect-ai).

## Verification

- The drafting skill produces a stated audience-and-purpose brief and a critiqued outline before
  any prose, and it loads the exemplar pairs. A draft made without the brief is a failure of the
  skill.
- The review skill leads with the band, then reports the hard-gate status, the score table, and a
  per-sentence findings list on a sample page. Its hard gates fire on a planted banned word and a
  planted care promise. It runs as a fresh agent, not the drafting context.
- The retired `content-cleanup` triggers still reach `content-review`.
- Editing a file under `src/content/` routes to the web-content register: the `content.md` rule
  names the two skills, and editing a code or docs file does not.
- `prose-guard --all` after the lexicon change flags a planted blocking word and surfaces a
  planted advisory word without blocking it. The tool's own tests pass.
- The technical track is unchanged: a docs or code edit behaves exactly as before.

## Risks

- **Over-blocking from the lexicon change.** The blocking and advisory split is the guard. Common
  words go advisory; only clear tells block. The tool's tests catch a regression.
- **Score drift.** Agent scoring is subjective. The calibration samples in the method doc are the
  anchor. The rubric weights are fixed so the same piece scores the same way across sessions.
- **Duplication between the method doc and the guide.** The catalog lives once, in the method doc.
  The guide references it and holds only the ecnordic voice. The plan must not copy the catalog
  into the guide.

## Out of scope, noted for later

- Applying the rubric retroactively to the existing pages as a content audit.
- A 907.life `content-guide.md` that points at the same shared method. The method is built to
  support it; wiring the second site is separate work.
