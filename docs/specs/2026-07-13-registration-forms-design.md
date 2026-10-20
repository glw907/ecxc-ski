# Registration forms, digital waiver, and the Training split

Date: 2026-07-13. Status: approved design, pending Geoff's spec review.

## Summary

Split the training surface into two pages, Training (summer-training focus for now, generic
URL for future seasons) and Talkeetna Camp, each carrying its own registration form. Both forms embed the same program-wide waiver, signed
digitally. Each submission appends a row to a private Google Sheet (the working roster),
emails the full signed record to Geoff (the durable legal copy), and emails a confirmation
copy to the parent. The print-styled `/waiver` page is retired; the waiver becomes
digital-only.

## Decisions (locked with Geoff, 2026-07-13)

- The registration forms own the waiver. The CrewLAB signing plan is superseded; contact-page
  copy and backlog items #21/#22 get updated to match.
- System of record: the record email to Geoff. The Google Sheet is the roster view. No D1.
- Sheets wiring: Google service account + Sheets API, JWT signed in the Worker.
- Two forms, one shared waiver. Training gets the lighter form; Talkeetna adds camp
  logistics (dietary needs, carpool, gear notes).
- Digital-only. No paper fallback page.
- The forms must look like the site: design-system tokens, DaisyUI fieldsets, the section
  anatomy and fireweed CTA the design pass established.

## Content architecture

| Surface | Route | What it is |
|---|---|---|
| Training | `/training` | Editorial content + registration form. The URL stays generic on purpose (Geoff, 2026-07-13): winter training or Besh Cup support can land here later without a nav or URL change. Current content focus is summer training. |
| Talkeetna Camp | `/talkeetna` | Camp info (dates, location, logistics) + registration form |
| Old waiver page | `/waiver` | 301 to `/training` (the general signing surface) |

Both routes are bespoke (like `/contact`), not plain content pages, because they carry
live forms; `/training` converts from a plain content page to a bespoke route. Each loads
its markdown page entry by slug and renders it above the form, so the editorial copy stays
admin-editable. The waiver legal text does NOT live in markdown: it is a code-owned constant
(a TS module), so its SHA-256 hash is stable and every change is a deliberate commit.
Primary nav (managed in `src/theme/site.config.yaml`) keeps Training and gains Talkeetna
Camp. `src/content/pages/training.md` is rewritten with a summer-training focus and the camp
material moves to a new `talkeetna.md`, both through the brief-first content flow
(`content-draft`, `content-review`); briefs carry `[ASK]` markers for camp dates, location,
and program dates. Content edits re-pin snapshots (`npx vitest run -u`).

Both pages get a first-class design pass, not just working forms (Geoff, 2026-07-13): the
page compositions follow the design pass's established anatomy (icon-led section headers,
the framed CTA treatment, the one-token hover vocabulary), the forms use the design system's
fieldset styling end to end, and the family polish standard applies at every viewport from
320 to 2560.

## The forms

One scrolling, sectioned form per page. No wizard: a wizard adds client state and
lost-progress risk for no gain on a form parents fill once, and the waiver's section anatomy
already gives the long form a spine.

Shared sections (both forms):

1. **Athlete**: full name, date of birth.
2. **Parent / guardian**: name, relationship, home address, city, state, ZIP, phones, email.
3. **Emergency contact**: alternate name, relationship, phone, email (optional).
4. **Insurance & physician**: provider, policy #, group #, physician, physician phone.
5. **Medical**: current medications, allergies, conditions, last tetanus shot (optional).
6. **Photo / media release**: the waiver's grant / do-not-grant choice as a required radio pair.
7. **The waiver**: full legal text rendered inline (shared component), with per-section
   agreement checkboxes replacing the paper form's initials boxes.
8. **Signatures**: typed full name for parent/guardian and for the athlete (13+), each with a
   consent checkbox stating that the typed name is a legal electronic signature.

Talkeetna adds a **Camp logistics** section between 5 and 6: dietary needs/restrictions,
carpool (needs a ride / can drive, spare seats), gear notes.

Signature record captured server-side: both typed names, server timestamp, client IP, user
agent, waiver version hash, and which form (training/camp) was signed.

## Waiver review findings (fold into the digital re-expression)

The existing text is strong: specific activities and risks, AS 09.65.290 and 09.65.292
citations, the required (b) limitation, a clean medical authorization. Findings, in order of
substance:

1. **Adult athletes are uncovered.** The text assumes a minor, but high schoolers can be 18.
   Add an adult-participant clause: when DOB shows 18+, the athlete signs on their own behalf
   and the parent signature becomes optional (emergency contact still required). Flag for the
   attorney.
2. **Electronic-signature consent is missing.** Add a clause that the typed name plus checkbox
   constitutes an electronic signature under the federal E-SIGN Act and Alaska's UETA
   (AS 09.80), with the same force as a handwritten signature. Attorney verifies citations.
3. **Placeholders become real values.** `[camp start date]`, `[camp end date]`,
   `[camp location]` (Talkeetna), and the blank Overall Program Dates line get real values
   from the content briefs.
4. **No severability or governing-law clause.** Add both (Alaska law, Anchorage venue),
   flagged for the attorney.
5. **Paper-era language goes.** "A completed and signed form must be returned to Geoffrey
   Wright" becomes "submitted through this form"; page furniture (Page 1 of 3, name-repeat
   headers, signature lines) disappears; per-section initials boxes become required
   checkboxes; the "Summer Training Program" subtitle widens to cover both surfaces.
6. **Legally strong AND friendly to read (Geoff, 2026-07-13).** Two-layer treatment. The
   operative legal text keeps its precision but gets a plain-language pass: shorter
   sentences, active voice where it does not weaken an operative term, no legalese where a
   plain word does the same work. Above each legal section, a short plain-English summary in
   the site's own voice ("In plain terms: you can't sue us for ordinary negligence, and
   you're agreeing your kid takes on the normal risks of these sports"), set visually
   distinct and labeled non-operative ("This summary is for readability; the full text below
   is what you're agreeing to"). The attorney can strike or bless the summaries
   independently of the operative text.

Attorney review of the final text stays where it is on the pre-publish checklist. This work
ships the mechanism and the improved draft, not legal sign-off.

## Submission pipeline

A remote function module mirroring `contact.remote.ts` (valibot schema, Turnstile,
`getRequestEvent`), with two `form()` exports sharing schema fragments and record assembly:

1. **Google Sheets append.** Service-account JWT (RS256 via WebCrypto, the same dance as the
   GitHub App key) exchanged for an access token; `spreadsheets.values.append` to a
   per-form tab (`Training`, `Talkeetna Camp`) in one private spreadsheet. One row per
   registration, columns matching the sections above.
2. **Record email to Geoff** via the existing `SEND_EMAIL` binding (fixed destination). The
   full signed-waiver record. This is the must-succeed write: if the Sheets append failed,
   this email says so, flagged, so Geoff can back-fill the row.
3. **Confirmation copy to the parent** via the unrestricted `EMAIL` binding, from
   noreply@ecxc.ski, containing their full signed record.

Success returns only after the record email sends. Sheets or parent-copy failure degrades to
a flag in Geoff's email, never a user-facing error after a captured signature.

### New configuration

| Name | Kind | Value |
|---|---|---|
| `GOOGLE_SA_KEY_B64` | Worker secret | Service-account JSON key, base64 |
| `REGISTRATION_SHEET_ID` | `wrangler.toml` var | Spreadsheet ID |

One-time setup (scripted where possible via gcloud): GCP project, Sheets API enabled,
service account, JSON key, share the Sheet with the service-account address. The Worker
secrets lesson from the Rename 4 cutover applies: a recreated Worker starts with no secrets.

Privacy note: medical details land in the Sheet and in email. The Sheet stays unshared
beyond Geoff and any co-coach he chooses.

## Testing and gates

- Unit tests: schema validation (both forms), record assembly, waiver hash stability, the
  failure-ordering behavior (Sheets fails, record email still sends, flagged).
- Mocked Sheets and email bindings; no live Google calls in tests.
- Snapshot re-pin for content changes; a redirect test for `/waiver`.
- The full gate: `npm run check` 0/0, `npm test` exit 0, `npm run build`.
- Family responsive standard on both new pages: composed at 320 to 2560, computed-style
  contrast probes on form controls and the submit CTA.
- Reviewer fan-out at pass end (svelte-reviewer, daisyui-a11y-reviewer,
  cloudflare-workers-reviewer; the form handles minors' medical data, so
  web-auth-security-reviewer reads the remote functions too).

## Out of scope

- Attorney sign-off (pre-publish checklist, unchanged).
- CrewLAB integration (superseded for waivers; #21/#22 get re-scoped or closed).
- Any payment or donation collection.
- An admin view of registrations beyond the Sheet itself.
