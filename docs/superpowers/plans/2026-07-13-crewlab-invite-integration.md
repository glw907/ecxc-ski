# CrewLAB Invite Integration Implementation Plan

> **For agentic workers:** Execution is Workflow-orchestrated (Geoff's opt-in): implementation
> tasks dispatch to `site-implementer` agents; the content task runs in the main loop
> (Fable-level flow work, per Geoff); reviews fan out after. Tasks use checkboxes for tracking.

**Goal:** Fold CrewLAB onboarding into the existing forms — registration collects where each
invite goes; the public join link leaves the site.

**Architecture:** Five new flat fields ride the existing registration pipeline end to end
(valibot schema → `buildRecord` → sheet row → record email), one new fieldset renders in the
shared `RegistrationForm.svelte`, and four content pages re-point every sign-up mention at the
single entry point per constituency. No new forms, routes, modules, secrets, or sheet tabs.

**Tech Stack:** SvelteKit remote forms, valibot, the existing Sheets JWT writer, vitest.

**Spec:** `docs/superpowers/specs/2026-07-13-crewlab-invite-integration-design.md`
**Research:** `docs/crewlab-onboarding-research.md`

## Global Constraints

- Field names are identifier-path-safe: no hyphens anywhere in a posted field name (SvelteKit
  remote-form `split_path` crashes client-side on them; the registration pass proved it live).
- Checkbox/number fields post through `fields.<name>.as(...)` so the `b:`/`n:` prefixes are
  emitted by the framework, never hand-written.
- New sheet columns append at the END of the row for both kinds. The live tabs already carry
  header rows; mid-array insertion would misalign every new row against them.
- Copy follows the web-content register (`docs/content-guide.md`), gated by independent
  content-review. The spec's seamlessness bar (design decision 0) grades the flow: one obvious
  sign-up act per constituency; the adult path reads clean; no page offers two competing paths.
- No auto-reply to submitters. Geoff's own invite message is the confirmation.
- Full gate before any push: `npm run check` 0/0, `npm test` exit 0, `npm run build` (strict
  prerender), `npm run cairn:manifest` after content edits.

---

### Task 1: Schema, record, row, and email plumbing

**Files:**
- Modify: `src/theme/registration/schema.ts`
- Modify: `src/theme/registration/emails.ts` (FIELD_GROUPS only)
- Test: `src/tests/registration/schema.test.ts`, `src/tests/registration/emails.test.ts`

**Interfaces (later tasks rely on these exact names):**
- New entries in `sharedFields` (flat posted names): `athleteEmail` (via the existing
  `optionalEmailField`, message `"Please enter a valid email address for the athlete, or leave
  it blank."`), `athleteCell` (via `optionalText()`), `parentCrewlabInvite`
  (`v.optional(v.boolean(), false)`), `secondParentName` (`optionalText()`),
  `secondParentEmail` (via `optionalEmailField`, message `"Please enter a valid email address
  for the second parent, or leave it blank."`).
- Two cross-field checks added to BOTH `trainingSchema` and `campSchema` pipes, matching the
  existing `v.forward(v.check(...), [field])` idiom:
  1. At least one of `athleteEmail`/`athleteCell` is non-blank. Forward to `['athleteEmail']`.
     Message: `"Please give us an email or a cell number for the athlete's CrewLAB invite —
     either works."`
  2. `secondParentName`/`secondParentEmail` are both blank or both filled. Forward to
     whichever is blank. Message: `"Please give the second parent's name and email together,
     or leave both blank."`
- `RegistrationRecord` gains
  `crewlab: { athleteEmail?: string; athleteCell?: string; parentInvite: boolean; secondParent?: { name: string; email: string } }`
  (required member, optional insides); `SharedParsedFields` gains the five flat fields;
  `buildRecord` maps them with the existing `toOptional` helper, `secondParent` present only
  when both halves are.
- New header constant `CREWLAB_HEADERS = ['Athlete Email (CrewLAB)', 'Athlete Cell (CrewLAB)',
  'Parent CrewLAB Invite', 'Second Parent Name', 'Second Parent Email']`, appended LAST in
  `SHEET_HEADERS` for both kinds; `toRowValues` appends the matching five cells last, booleans
  through the existing `cell()` Yes/No.
- `emails.ts`: a new group `{ heading: 'CrewLAB invite', headers: <the five header strings> }`
  inserted in `FIELD_GROUPS` directly after the `'Parent or guardian'` group (email display
  order is independent of sheet column order; the record email should surface the invite info
  near the top).

**Steps (TDD; the repo test commands are `npx vitest run src/tests/registration/schema.test.ts`
etc.):**
- [ ] Write failing tests: both-contacts-blank rejects with the issue forwarded to
  `athleteEmail`; email-only and cell-only both pass; half-filled second-parent pair rejects
  forwarded to the blank half; both-filled yields `record.crewlab.secondParent`;
  `parentCrewlabInvite` defaults false and round-trips true; `toRowValues` for training is the
  old length + 5 with the five cells last (`Yes`/`No` for the boolean); same for camp; the
  record email body contains a `CrewLAB invite` heading with the values, positioned after the
  parent group.
- [ ] Run them; confirm they fail for the expected reason (fields not in schema).
- [ ] Implement the schema, record, headers, row, and email-group changes exactly as the
  Interfaces block names them.
- [ ] Run the registration test files; all pass. Run `npm run check`; 0/0.
- [ ] Commit: `feat(registration): collect CrewLAB invite contacts on both forms`

### Task 2: The form fieldset

**Files:**
- Modify: `src/theme/components/RegistrationForm.svelte`
- Test: `src/tests/registration/components.test.ts`

**Interfaces:**
- Consumes Task 1's field names verbatim: `athleteEmail`, `athleteCell`,
  `parentCrewlabInvite`, `secondParentName`, `secondParentEmail`.
- Produces the rendered fieldset both e2e and reviewers exercise.

**Requirements:**
- One new `<fieldset class="fieldset">` with `<legend class="fieldset-legend">CrewLAB team
  app</legend>`, placed directly AFTER the "Parent or guardian" fieldset and before "Emergency
  contact" (the spec: the invite questions land while contact details are in hand).
- Lead-in paragraph (form microcopy, coach register, roughly): practice plans and schedule
  changes live in CrewLAB; after we process your registration we send the athlete's invite —
  email or cell, either works. One or two sentences, no app-marketing chirp.
- Fields, in order, each following the file's existing label + input + `{@render
  fieldError(...)}` pattern with `aria-describedby="<name>-error"`:
  `athleteEmail` (`.as('email')`, `autocomplete="email"`), `athleteCell` (`.as('tel')`,
  `autocomplete="tel"`), `parentCrewlabInvite` (`.as('checkbox')`, label "Send me a parent
  invite too", helper line noting parents confirm the athlete link inside the app),
  then a quietly framed optional pair introduced as the family case ("Another parent or
  guardian who should get their own invite? Optional."): `secondParentName` (`.as('text')`),
  `secondParentEmail` (`.as('email')`). An adult athlete must be able to skip everything after
  the two contact fields without thought; do not gate the fields on age with JS.
- Neither contact field carries the HTML `required` attribute (the requirement is
  either-of-two, enforced by the schema; marking one required would lie to screen readers).

**Steps:**
- [ ] Write failing tests: the legend `CrewLAB team app` renders in BOTH variants (extend the
  two variant tests' legend lists); the five fields join the `aria-describedby` iteration
  list; the checkbox posts under a `b:parentCrewlabInvite` name; neither contact input has
  `required`.
- [ ] Run; confirm failure. Implement. Run components tests + `npm run check`; green.
- [ ] Commit: `feat(registration): CrewLAB invite fieldset on the shared form`

### Task 3: Content pass (main loop, Fable — the seamlessness work)

**Files:**
- Modify: `src/content/pages/crewlab.md`, `home.md`, `about.md`, `training.md`
- Modify: `docs/content-briefs/crewlab.md` if present (fact update: invite-by-coach flow)
- Regenerate: `src/content/.cairn/index.json` (`npm run cairn:manifest`)

**Outcomes, graded against the spec's seamlessness bar:**
- `crewlab.md`: the public-link CTA and "tap the invite below" copy are gone. Getting started
  says: register (training or camp) and the invite comes to you by email or text; check the
  parent box for your own invite; parents, expect the in-app "Connected Athletes"
  confirmation; not registering (boosters, alumni, family, returning grads not training) —
  use the contact form and say how you're connected. CTA points at registration; the contact
  path is a real link in the body.
- `home.md`: the "[Sign up on CrewLAB](/crewlab)" action line becomes a register line pointing
  at `/training`.
- `about.md`: "Then join CrewLAB…" becomes invite-comes-with-registration language, one
  sentence, no duplicated mechanics (rule 6: crewlab.md owns the detail).
- `training.md`: line ~104's "Read the [CrewLAB page](cairn:pages/crewlab) to join" becomes
  "your invite comes after you register" language; the returning-summer sentence stays true.
- `grep -ri 'crewlab.app.link' src/` returns nothing.
- Independent content-review gate passes on all four files; manifest regenerated.
- [ ] Draft, gate, commit: `content: CrewLAB onboarding flows through registration`

### Task 4: Live e2e coverage + sheet header extension

**Files:**
- Modify: `scripts/e2e-registration.mjs` (post the five new fields; assert the row carries
  them), `docs/registration-e2e.md` (field list note)
- Operational: append the five `CREWLAB_HEADERS` cells to the END of the header row on BOTH
  live tabs (training, camp) of the roster spreadsheet, matching however the original headers
  were installed (check the runbook/scripts for a header-setup step first; extend it if it
  exists, one-time API append if not).

**Steps:**
- [ ] Extend the harness fields + assertions; update the runbook.
- [ ] Extend the live header rows; verify with a values read that both tabs' header rows equal
  `SHEET_HEADERS[kind]`.
- [ ] Commit: `test: e2e covers CrewLAB invite fields; roster headers extended`

### Task 5: Reviews, gate, ship, live verify (main loop + review workflow)

- [ ] Review fan-out (workflow): `svelte-reviewer` (form + component), `daisyui-a11y-reviewer`
  (fieldset markup, labels, announcement regions), `cloudflare-workers-reviewer` (schema/email
  changes run in the Worker), content-review already ran in Task 3. Adversarially verify any
  CONFIRMED-severity finding before folding fixes.
- [ ] code-simplifier over the pass's changed code.
- [ ] Full gate: `npm run check` 0/0, `npm test` exit 0, `npm run build` green.
- [ ] Push; watch the Actions deploy.
- [ ] Live e2e per the runbook on BOTH forms (test rows, `TEST ROW - DELETE ME` convention):
  submission with the new fields lands the row (five new cells last) and the record email
  carries the `CrewLAB invite` group; then delete the test rows.
- [ ] Live render reads: the new fieldset at 1440 and 390 on `/training`; `/crewlab` full-page
  read; `grep` the deployed `/crewlab` HTML for `crewlab.app.link` (must be absent).
- [ ] BACKLOG #22 re-scoped (join-link half superseded); STATUS entry + next starter prompt;
  archive plan + spec.

## Self-review notes

- Spec coverage: fields (T1), form (T2), four content files incl. home.md (T3), e2e +
  validation edges + grep criterion (T4/T5), seamlessness bar carried as a global constraint,
  no-new-forms honored (no task creates a route or module). Second-parent pair, adult-path
  cleanliness, and the append-only column constraint all present.
- Names used in T2/T4 match T1's Interfaces block exactly.
- Out of plan, deliberately: revoking the old public link (Geoff → CrewLAB support), #21
  payments, any supporter form.
