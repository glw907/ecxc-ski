# Registration Forms + Digital Waiver Implementation Plan

> **For agentic workers:** Execute per task; each task states outcome, constraints, and
> acceptance criteria. The main loop orchestrates via the Workflow tool, reviews each diff,
> and clears the gate between stages. Spec:
> `docs/superpowers/specs/2026-07-13-registration-forms-design.md`.

**Goal:** Two registration forms (Training at `/training`, Talkeetna Camp at `/talkeetna`)
sharing one digitally signed waiver, appending to a Google Sheet and emailing the signed
record, live on ecxc.ski.

**Architecture:** Bespoke routes render an admin-editable content entry above a form
component. Remote functions (the `contact.remote.ts` pattern) validate with valibot, verify
Turnstile, then run the pipeline: Sheets append (may fail soft), record email to Geoff (must
succeed), parent confirmation copy (may fail soft). The waiver legal text is a code-owned TS
module whose SHA-256 hash is recorded with every signature.

**Tech stack:** SvelteKit remote functions, valibot, WebCrypto RS256 (service-account JWT),
Google Sheets v4 `values.append`, `mimetext` + `SEND_EMAIL` binding (record email), `EMAIL`
binding (parent copy), Turnstile.

## Decisions since the spec (Geoff, 2026-07-13)

- Reuse the ASC service account `workspace-automation@aksailingclub-admin.iam.gserviceaccount.com`
  (key at `~/.config/google-workspace/credentials.json`). Verified: token exchange works;
  the Sheets API on project `aksailingclub-admin` is disabled and needs `gcloud services
  enable sheets.googleapis.com drive.googleapis.com` after Geoff re-auths gcloud.
- The roster Sheet is created programmatically by the service account and shared to Geoff's
  personal Google account (address pending from Geoff).
- Dates come from the current training page: program June 1 to August 19, 2026 (Mon/Wed/Fri
  mornings); camp July 21 to 24, 2026, at a lake near Talkeetna. The exact camp site
  continues to go out to registered families only.
- Camp lead: Amy Purevsuren (from the current page; keep in content).

## Global constraints

- Design system throughout: tokens only, no hardcoded colors, `oklab` mixes, DaisyUI v5
  fieldset styling per `ContactForm.svelte`, the one-token hover vocabulary, section
  anatomy per the design pass. Read `ecxc-theme.css` header comments before cascade edits.
- Comments per ts-conventions / svelte-conventions; no em dashes in code comments.
- Website content (markdown under `src/content/`, form copy) uses the web-content register
  (`docs/content-guide.md`); code and docs use the technical voice.
- Gate for every task: `npm run check` 0 errors 0 warnings, `npm test` exit 0,
  `npm run build` green. Content edits re-pin snapshots (`npx vitest run -u`) and commit them.
- Never commit the service-account key. Secret: `GOOGLE_SA_KEY_B64` (Worker).
  Var: `REGISTRATION_SHEET_ID` (wrangler.toml `[vars]`).
- Tests never call live Google or send real email: bindings and `fetch` are mocked.

---

### Task 1: Waiver text module (main loop; legal prose stays in the conductor's seat)

**Files:**
- Create: `src/theme/waiver/waiver.ts`
- Test: `src/tests/waiver.test.ts`

**Outcome:** The improved waiver as structured data plus a pinned content hash.

**Requirements:**
- Export `type WaiverSection = { id: string; title: string; summary: string; html: string }`,
  `WAIVER_SECTIONS: WaiverSection[]`, `WAIVER_HASH: string` (SHA-256 hex of the concatenated
  section HTML, precomputed and committed), and `computeWaiverHash(): Promise<string>`
  (WebCrypto, recomputes from `WAIVER_SECTIONS`).
- Content: the existing waiver's legal sections (About the Program, Activities & Risks,
  Release of Liability, Medical Authorization, Medication/Allergy confirmation, Code of
  Conduct, Acknowledgment) re-expressed per the spec's six findings: adult-participant
  clause (18+ athlete signs on own behalf, parent signature optional), E-SIGN / Alaska UETA
  (AS 09.80) electronic-signature consent, real dates (program June 1 to August 19, 2026;
  camp July 21 to 24, 2026, near Talkeetna), severability + governing-law (Alaska,
  Anchorage venue), paper language removed, plain-language pass. Each section's `summary`
  is the friendly plain-English layer, labeled non-operative in the component (Task 6).
- Keep: AS 09.65.290 / 09.65.292 citations, the (b) limitation, the transportation
  authorization, medical self-administration terms, the released-parties scope.

**Acceptance:** Test asserts `computeWaiverHash()` equals `WAIVER_HASH` (a text edit without
a deliberate hash bump fails CI); every section has non-empty title/summary/html; no
`[camp`/`[year]` placeholder survives; the strings "09.65.290", "09.65.292", "09.80",
"July 21", "June 1" all appear.

### Task 2: Registration schema + record assembly

**Files:**
- Create: `src/theme/registration/schema.ts`
- Test: `src/tests/registration/schema.test.ts`

**Outcome:** Validated form shapes and one canonical record type both forms share.

**Requirements:**
- `export type FormKind = 'training' | 'camp'`.
- Valibot schemas `trainingSchema` and `campSchema`. Shared fields: athlete full name +
  DOB (ISO date string, sanity-bounded 1990..today); parent name, relationship, address,
  city, state, ZIP, phones (home optional, cell required), email; emergency contact name,
  relationship, phone, email optional; insurance provider, policy, group (group optional);
  physician name + phone (optional pair); medications, allergies, conditions (each may be
  "none"), tetanus date optional; `photoRelease: 'grant' | 'deny'`; per-section waiver
  agreement booleans (one per waiver section id, all required true); athlete typed
  signature (required when age 13+ at submission), parent typed signature + consent
  checkbox (required unless athlete is 18+, then optional but athlete consent checkbox
  required); `'cf-turnstile-response'` optional string, matching `contact.remote.ts`.
  Camp adds: dietary needs (optional), `carpool: 'needs-ride' | 'can-drive' | 'self'`,
  `carpoolSeats` (int 0-8, required only for `can-drive`), gear notes (optional).
- `buildRecord(kind, input, meta: { ip: string; userAgent: string; submittedAt: string;
  waiverHash: string }): RegistrationRecord` and `toRowValues(record): string[]` with
  `SHEET_HEADERS: Record<FormKind, string[]>`; row order matches headers; camp headers are
  a superset.

**Acceptance:** Tests cover: valid submissions for both kinds parse; a missing waiver
agreement fails; a 17-year-old without parent signature fails; an 18-year-old without
parent signature passes; `can-drive` without seats fails; `toRowValues` length equals its
headers length for both kinds and round-trips every field.

### Task 3: Google Sheets client

**Files:**
- Create: `src/theme/registration/sheets.ts`
- Test: `src/tests/registration/sheets.test.ts`

**Outcome:** An append-one-row client using the service-account key from the Worker secret.

**Requirements:**
- `appendRegistrationRow(env: { GOOGLE_SA_KEY_B64: string; REGISTRATION_SHEET_ID: string },
  tab: string, row: string[]): Promise<void>`; throws on any failure (caller decides
  severity).
- Auth: decode the base64 JSON key, import the PEM private key via
  `crypto.subtle.importKey('pkcs8', ...)`, sign an RS256 JWT
  (scope `https://www.googleapis.com/auth/spreadsheets`, aud
  `https://oauth2.googleapis.com/token`), exchange for an access token, then POST
  `values.append` with `valueInputOption=RAW` to range `'<tab>'!A1`. No caching needed at
  this volume.
- No dependency additions: WebCrypto and `fetch` only.

**Acceptance:** With mocked `fetch`, tests assert the JWT claims (iss from key JSON, scope,
aud), the append URL contains the sheet ID and URL-encoded tab, the body carries the row,
and a non-2xx token or append response rejects with a message naming which step failed.

### Task 4: Record and confirmation emails

**Files:**
- Create: `src/theme/registration/emails.ts`
- Test: `src/tests/registration/emails.test.ts`

**Outcome:** The two outbound emails, built from a `RegistrationRecord`.

**Requirements:**
- `sendRecordEmail(env, record, opts: { sheetsError?: string }): Promise<void>` via the
  `SEND_EMAIL` binding + `mimetext` + `cloudflare:email`'s `EmailMessage`, exactly the
  `contact.remote.ts` mechanism, sender `noreply@ecxc.ski`. Subject
  `Registration: <athlete> (<Training|Talkeetna Camp>)`; body is the complete record,
  every field labeled, signatures + timestamp + IP + user agent + waiver hash, and when
  `sheetsError` is set a prominent `SHEETS APPEND FAILED` block with the error so Geoff
  back-fills the row.
- `sendParentCopy(env, record): Promise<void>` via the unrestricted `EMAIL` binding (plain
  `{ to, from, subject, html, text }` per the cairn binding shape; verify the exact send
  call against `@glw907/cairn-cms`'s own usage in node_modules before writing). Friendly
  subject and intro (web-content register), then their full signed record.
- Both throw on failure; caller decides severity.

**Acceptance:** Tests with stubbed bindings assert recipients, sender, subject shapes, that
every schema field label appears in the record email body, the failure block renders only
when `sheetsError` is set, and the parent copy goes to the parent's submitted address.

### Task 5: Remote functions

**Files:**
- Create: `src/theme/registration.remote.ts`
- Test: `src/tests/registration/remote.test.ts`

**Outcome:** `registerTraining` and `registerCamp` form actions wiring Tasks 1-4 together.

**Requirements:**
- Same idiom as `contact.remote.ts`: `form(schema, handler)`, `getRequestEvent`, Turnstile
  verify when `TURNSTILE_SECRET_KEY` is present, `invalid(...)` for user-facing failures.
- Handler order: Turnstile → `buildRecord` (with `WAIVER_HASH`, server time, client IP,
  user agent) → `appendRegistrationRow` in try/catch (capture error, do not fail) →
  `sendRecordEmail` (on throw: `invalid('Something went wrong saving your registration.
  Nothing was recorded. Please try again or use the contact form.')`) → `sendParentCopy`
  in try/catch (swallow, note in return) → `{ success: true }`.
- Missing `SEND_EMAIL`/`CONTACT_EMAIL` env fails closed with `invalid`, like the contact
  form. Missing Sheets env is a soft failure (recorded in the record email), so a deploy
  without the Sheets secret still captures signatures.

**Acceptance:** Tests (mocked modules/bindings) cover: happy path calls all three in order;
Sheets throw still returns success and the record email carried the failure block; record
email throw returns `invalid` and does not send the parent copy; Turnstile failure rejects
before any pipeline step.

### Task 6: WaiverText and RegistrationForm components

**Files:**
- Create: `src/theme/components/WaiverText.svelte`
- Create: `src/theme/components/RegistrationForm.svelte`
- Test: `src/tests/registration/components.test.ts` (render-level: sections present,
  variant fields present/absent)

**Outcome:** The visible form, designed, not just functional.

**Requirements:**
- `WaiverText` renders `WAIVER_SECTIONS`: each section shows its friendly `summary` in a
  visually distinct plain-terms block (labeled "Plain-terms summary, for readability; the
  full text below is what you're agreeing to"), the operative `html`, and a required
  agreement checkbox bound per section id. Design: the site's section-header anatomy, the
  `alert-structural` chrome family for the summary blocks, prose styling for the operative
  text.
- `RegistrationForm` takes `variant: 'training' | 'camp'`, posts to the matching remote
  function, and renders the spec's sections as DaisyUI fieldsets in `ContactForm`'s idiom:
  athlete, parent/guardian, emergency contact, insurance & physician, medical, (camp only)
  camp logistics, photo release radio pair, `WaiverText`, signatures (typed-name inputs
  with the electronic-signature consent checkboxes; parent block explains it becomes
  optional only for adult athletes), Turnstile widget, submit CTA in the framed CTA
  treatment, success state replacing the form with a confirmation (web-content register,
  mentions the email copy).
- Client validation mirrors the schema (required marks, date input for DOB, conditional
  seats field); server remains authoritative. Labels/help text in the web-content register.
- Accessibility: every input labeled, fieldset legends real, error text associated via
  `aria-describedby`, checkbox groups keyboard-clean. The daisyui-a11y-reviewer grades this
  at pass end.

**Acceptance:** Component tests assert both variants render all shared sections, camp
logistics appears only for camp, every waiver section renders exactly one checkbox, and the
submit button is disabled until all agreements + signatures are filled (or the form relies
on native `required` — pick one mechanism and test it).

### Task 7: Routes, nav, redirects, sitemap

**Files:**
- Create: `src/routes/(site)/training/+page.server.ts`, `+page.svelte`
- Create: `src/routes/(site)/talkeetna/+page.server.ts`, `+page.svelte`
- Replace: `src/routes/(site)/waiver/` (page + `+page.ts` become a 301 redirect to
  `/training`, matching the `/home` and `/resources` redirect idiom)
- Modify: `src/theme/site.config.yaml` (primary menu gains
  `{ label: Talkeetna Camp, url: /talkeetna }` after Training)
- Modify: `src/routes/sitemap.xml/+server.ts` (drop the hand-listed `/waiver`; verify
  `/training` and `/talkeetna` arrive via `site.all()` once `talkeetna.md` exists, since
  both are pages-concept entries shadowed by these bespoke routes)
- Modify: `src/routes/(site)/contact/+page.svelte` (the CrewLAB waiver sentence now points
  at the registration forms; keep the web-content register)

**Outcome:** Both pages live in the route tree with content above form, old surfaces
redirect, nav and sitemap true.

**Requirements:**
- Each `+page.server.ts` loads its content entry by slug (`training` / `talkeetna`) through
  the same chassis surface `[...path]/+page.server.ts` uses (`site`/`pages` from
  `$chassis/content` + `cairn.rendering.render`), so admin edits flow through. Render the
  entry's HTML above `<RegistrationForm variant=... />`. These routes cannot prerender (the
  form posts); confirm the remote-function pages ship as dynamic routes like `/contact`.
- The bespoke routes must win over the `[...path]` catch-all (SvelteKit gives specific
  routes precedence; verify with a dev-server request to each).
- Snapshot tests re-pinned; a redirect test asserts `/waiver` 301s to `/training`.

**Acceptance:** `npm run build` green; dev-server checks: `/training` and `/talkeetna`
render entry content + form, `/waiver` 301s, nav shows both items, sitemap contains
`/training` and `/talkeetna` exactly once and no `/waiver`.

### Task 8: Content (main loop; web-content register, brief-first)

**Files:**
- Create: `docs/content-briefs/training-page.md`, `docs/content-briefs/talkeetna-page.md`
- Rewrite: `src/content/pages/training.md`
- Create: `src/content/pages/talkeetna.md`
- Modify: snapshots (`npx vitest run -u`)

**Outcome:** Training page focused on summer training with registration on-page; Talkeetna
page carrying the camp story; zero CrewLAB-for-registration references anywhere in content.

**Requirements:**
- Use `content-draft` (brief-first) and `content-review`; facts from the current
  `training.md`: June 1 to August 19, Mon/Wed/Fri 10:30, meeting spots, free + optional
  donations, camp July 21 to 24 near Talkeetna, Amy Purevsuren, dry cabins, lake, sauna,
  packing list, exact site shared with registered families only.
- Training page keeps practice logistics + FAQ, gains a short registration lead-in that
  hands off to the on-page form; camp material moves out (a pointer card to `/talkeetna`
  stays, the `program` directive pair on the current page already models this).
- Talkeetna page: what camp is, the daily shape, packing list, cost (free), then the
  registration lead-in. CrewLAB mentions for *registration/waiver* go away site-wide
  (the CrewLAB page itself, about the team app, stays; check `crewlab.md` and `about.md`
  for waiver references).
- `grep -ri crewlab src/content src/routes` afterward: every remaining hit is about the
  app, not registration/waiver.

### Task 9: Provisioning and deploy (main loop; blocked on Geoff's gcloud re-auth)

**Outcome:** Live pipeline end to end on ecxc.ski.

**Steps:**
1. After `gcloud auth login` (Geoff): `gcloud services enable sheets.googleapis.com
   drive.googleapis.com --project=aksailingclub-admin`.
2. Script (scratchpad, py + SA key): create spreadsheet `ECXC Registrations 2026` with
   tabs `Training` and `Talkeetna Camp`, write `SHEET_HEADERS` row to each, share editor
   to Geoff's personal Google address (pending), print the spreadsheet ID.
3. `REGISTRATION_SHEET_ID` into `wrangler.toml` `[vars]`;
   `base64 -w0 ~/.config/google-workspace/credentials.json | npx wrangler secret put
   GOOGLE_SA_KEY_B64`. Re-run `npx wrangler secret list` to confirm four secrets (the
   Rename 4 lesson).
4. Push to `main`; GitHub Actions deploys.
5. Live smoke: one flagged test registration (athlete name `TEST ROW - DELETE`) submitted
   against the production form; verify the Sheet row, Geoff's record email, and the parent
   copy (to a Geoff-controlled address); then delete the test row and note the test emails.
6. Live verification per the family standard: all sitemap URLs 200, `/waiver` 301,
   computed-style contrast probes on form controls + submit CTA, full-page render reads of
   both pages at 320/768/1440/2560.

### Task 10: Consolidation (main loop)

- Reviewer fan-out: svelte-reviewer, daisyui-a11y-reviewer, cloudflare-workers-reviewer,
  web-auth-security-reviewer (the remote functions handle minors' medical data), plus
  code-simplifier before the final commit.
- `docs/STATUS.md`: new History entry + Next up (attorney review now covers the improved
  digital waiver text; the "note-tier alert has no content instance" item may be satisfied
  by the waiver summaries if they use `alert-structural`, re-check).
- `BACKLOG.md`: re-scope/close #21 and #22 (CrewLAB registration superseded; CrewLAB stays
  as the team app), close anything this pass completes, log the attorney-review item if not
  already tracked.
- Geoff's before/after: links + screenshots of both pages.

## Task order

1 (waiver text), 8 (content) — main loop, first, since 6 and 7 consume them.
2, 3, 4 — independent, parallel (workflow).
5 — after 2-4. 6 — after 1-2. 7 — after 6-8. 9, 10 — main loop, last.
