# Team Platform Pass 1 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the neutral multi-team platform: repo, deploy pipeline, cairn admin
mount, multi-team schema, contact-based member auth, and coach roster management.

**Architecture:** A new standalone SvelteKit + Cloudflare Workers app on a neutral
domain, built as a cairn-cms consumer (the ASC pattern): coaches are cairn editors and
coach surfaces ride `CairnAdminShell` + `@glw907/cairn-cms/admin-toolkit`; athletes and
boosters use a platform-native contact-auth layer (OTP by SMS or email). D1 is the
system of record with the team dimension in every team-owned table from day one.

**Tech Stack:** SvelteKit, TypeScript, Tailwind v4 + DaisyUI v5, `@glw907/cairn-cms`,
@sveltejs/adapter-cloudflare, D1, Resend, an SMS provider (T0 selects), vitest.

**Authority:** `docs/superpowers/specs/2026-07-30-team-platform-requirements.md`
(ratified 2026-07-30). Where this plan and the requirements disagree, requirements win.

## Settled here (was deferred to the spec)

- **The platform is a cairn-cms consumer site.** Coach admin = cairn admin shell;
  the five coaches are cairn editors (magic-link, AUTH_DB). This satisfies the
  cairn-extension requirement structurally.
- **Plans will be the platform's own cairn content concept** (a later pass), publicly
  rendered on the platform, so East needs no site of its own. ecxc.ski keeps only a
  hand-off link.
- **One member-auth mechanism, two transports:** a 6-digit OTP delivered by SMS to a
  rostered cell or by email to a rostered email (amends the requirements' "magic link
  by email" to a uniform code flow; same-session-either-way is preserved. Geoff may
  veto at plan review).
- **`PLATFORM` = `xcathletes`** (Geoff's pick 2026-07-30; `xcathletes.org` confirmed
  available via the .org registry RDAP the same day). T0 registers it; if registration
  falls through for any reason, T0 picks a replacement and this plan's occurrences are
  literal find-and-replace.

## Pass map (this plan details pass 1 only)

1. **Foundation** (this plan): repo, deploy, cairn mount, schema, member auth, roster.
2. Training log + daily check-in + rollups + push substrate (PWA subscription + healing).
3. Plans concept + schedule + broadcast (push/SMS/email fan-out; 10DLC live by now).
4. Chat (DO channels, monitored coach↔athlete DMs, mentions, reactions).
5. Race rosters + Zone4 export email; ECXC cutover checklist; CrewLAB retirement.
6. East High onboarding (second team row, team-scoped UI proof, fast-follows begin;
   carries Gate 2 of requirements §Governance: published data policy, district
   check, consent acknowledgment exercised for real cross-team athletes).

(Gate 3 of §Governance, entity custody for a club Geoff doesn't coach, is its own
future initiative, not a pass on this map.)

## Global Constraints

- Gate for every task: `npm run check` 0 errors 0 warnings, `npm test` exit 0,
  `npm run build` green. No task is done without the full gate.
- New long-lived secrets follow the workstation flow: `secret-set.sh` into the age
  store, registry entry, `sync.sh` routing, then `wrangler secret put` via sync. Never
  a loose file.
- Roles are exactly `coach | athlete | booster` (race organizers are contact records,
  not accounts). Groups are free-text labels per membership (`Comp` / `Devo` seeded).
- Visibility: coaches see all; an athlete sees only their own; boosters see the
  directory and their channels (later passes enforce content-level rules).
- Comments/docs follow the stack standards (TSDoc via ts-conventions,
  svelte-conventions); no em dashes in code comments.
- All minors' data: name-only in test fixtures, never real athlete contacts in code,
  tests, or committed seeds.
- The requirements' §Governance and data security (ratified 2026-07-30) binds every
  task: the three-class data taxonomy (athlete-owned / club-owned /
  platform-operational; no table straddles two, class grouping declared in the
  migration files), no athlete data in any cairn content concept, no PII or OTP
  codes in Worker logs, and the integration contract (external sites get links,
  never data; no machine-to-machine API).

---

### Task 0: External decisions and accounts (Geoff-gated, one batched interaction)

**Files:** none (produces values for T1–T4 and the secrets registry).

**Outcome:** Every external dependency with lead time is started on day one, in a
single question batch to Geoff:

1. **Register `xcathletes.org`** (zone on the glw907 Cloudflare account).
2. The **email sending domain** decision: the Resend account's single verified-domain
   slot holds ecxc.ski, and the platform must send from its neutral domain (coach
   magic links, member OTP by email). Options Geoff picks from: upgrade Resend, a
   second Resend account, or another provider.
3. The **SMS provider account** (T4 research recommends one first: Twilio vs. an
   A2P-capable alternative) and the **10DLC brand + campaign registration** submitted
   (approval is days to weeks; passes 3+ consume it; T4 uses a dev transport until
   then).
4. The **coach roster**: five names with emails (cairn editors) and cells.

**Acceptance:** All four recorded in the platform repo's README-to-be (T1 carries
them); domain zone live; 10DLC submission confirmed as filed (not necessarily
approved); secrets that exist already (Resend key if decided) landed via the age-store
flow.

---

### Task 0.5: cairn currency review and ecxc upgrade (Geoff's precondition, 2026-07-30)

**Files:** `ecxc-ski/package.json`, `ecxc-ski/docs/STATUS.md` (one History line).

**Outcome:** The initiative starts on current cairn. As of plan time the registry's
latest is `0.91.1` against ecxc's `^0.84.4`; re-check at execution. Review the cairn
CHANGELOG across the span against every subpath ecxc imports (the 0.84.1-pass method,
`docs/status-archive.md` has the worked example) and against the admin-toolkit surface
this plan's T5 consumes; then upgrade ecxc-ski to the latest release and clear its full
gate plus the local https admin-guard smoke. The platform (T1/T2) scaffolds directly on
that same latest release.

**Acceptance:** ecxc-ski on the latest cairn with gate green and the admin smoke
passing per its recipe; a one-line STATUS History entry records the span; any breaking
or admin-toolkit-relevant changelog notes are summarized in the execution session for
T2/T5's benefit.

---

### Task 1: Repo scaffold and deploy pipeline

**Files:** New repo `~/Projects/PLATFORM/` (scaffold from the Waymark starter the way
the ecxc rebuild did; crib `wrangler.toml`, GitHub Actions deploy, `src/chassis/` +
`src/theme/` split, gate scripts from `ecxc-ski`). Create `docs/STATUS.md`,
`docs/harvest-findings-pass-1.md` (empty shell with the ASC running-log header).

**Interfaces produced:** a deployable SvelteKit app at the neutral domain with
`/healthz` 200; `$chassis`/`$theme` aliases; the family token/prose CSS foundation.

**Outcome:** Push-to-main deploys to the neutral domain in CI, same as ecxc. A themed
placeholder landing page (name + "team platform" one-liner, no marketing copy).

**Constraints:** Tailwind v4 + DaisyUI v5; the family design system tokens as the
starting theme (fireweed/spruce is ECXC's, not the platform's; use the chassis-neutral
defaults and leave brand theming for later). Worker name and D1 names use the T0 name.
Gate 1 (governance): the repo's GitHub Actions deploy uses a platform-scoped
Cloudflare token (this Worker + its D1 only; Geoff mints it in the dashboard, see the
T0 ledger's pending list); the broad "Cloudflare Admin" workstation token never lands
in this repo's secrets.

**Acceptance:** Full gate green in the new repo; deployed `/healthz` returns 200 over
the custom domain; GitHub Actions run visible green; STATUS.md states pass 1 in flight
and points at this plan (in ecxc-ski) as authority.

---

### Task 2: cairn admin mount with coach editors

**Files:** `src/theme/cairn.config.ts`, `src/routes/admin/**` (mirror ecxc's mount),
`wrangler.toml` (AUTH_DB D1 `cairn-PLATFORM-auth`), a minimal `plans` concept
declaration (fields: title, team, group, gender-slice optional, week-of date, body
markdown; no public rendering this pass).

**Interfaces produced:** working cairn magic-link admin at `/admin`; the `plans`
concept exists for pass 3 to render.

**Outcome:** The five coaches (T0 roster) are seeded editors; magic-link login works
on the deployed Worker; the admin shell lists the plans concept; a GitHub App
installation backs content commits (new App install on the platform repo, key stored
via the age-store flow as `GITHUB_APP_PRIVATE_KEY_B64`).

**Constraints:** Follow ecxc's `cairn.config.ts` idioms (v2 adapter, `defineConcept`/
`fieldset`); admin routes load only cairn's compiled CSS (the ASC compiled-CSS
constraint; note it in a route comment pointing at ASC's toolkit README).

**Acceptance:** Deployed `/admin` 303s to login without a cookie; a real magic-link
round trip lands in `/admin/posts`-equivalent for the plans concept; creating and
saving a draft plan entry commits to the repo; gate green.

---

### Task 3: Multi-team schema and store layer

**Files:** `migrations/0001_teams_people.sql`, `src/lib/server/db/{teams,people,
memberships}.ts`, tests beside them (mirror ASC's store/test layout,
`aksailingclub-org/src/admin-club/lib/` + `src/tests/`).

**Interfaces produced (later tasks consume exactly these):**
- `createPerson(db, p: NewPerson): Promise<Person>`; `Person` carries `id` (ULID),
  `fullName`, `cell?`, `email?`, `grade?`, `gender?`, `emergencyName?`,
  `emergencyPhone?`, `waiverStatus: 'signed' | 'missing' | 'unknown'`.
- `findPersonByContact(db, contact: string): Promise<Person | null>` (cell E.164 or
  lowercased email; the contact-identity primitive T4 leans on).
- `addMembership(db, teamId, personId, role, groupLabel?)`;
  `rosterFor(db, teamId, opts?: {includeArchived?: boolean}): Promise<RosterRow[]>`;
  `archiveMembership(db, teamId, personId)`.

**Outcome:** `PLATFORM_DB` D1 with `teams`, `people`, `memberships` per the
requirements' multi-team model: people global; membership per team with role, group
label, archive timestamp (archive-not-delete rollover); contact uniqueness enforced
(one cell / one email maps to one person). Seed migration: the ECXC team row and
Geoff as the sole seeded coach (T0 amendment; further coaches arrive through T5's
UI). Phone normalization to E.164 and email lowercasing at the store boundary (reuse
the shapes ecxc's registration schema proved).

**Gate 1 amendments (requirements §Governance):** migration files declare each
table's taxonomy class (athlete-owned / club-owned / platform-operational) and no
table straddles two; `memberships` carries the visibility-consent fields
(`log_visible_from`, defaulting to the rostering date, and a nullable
`history_ack_at`; the acknowledgment UI is a later pass, the fields are not); a
platform-operational `audit_log` table exists, written on roster changes and
exports, with a store helper later tasks call.

**Acceptance:** Store tests cover create/find-by-contact (both contact kinds),
duplicate-contact rejection, archive behavior excluded from default roster reads,
and the `log_visible_from` default; a migration applies clean on a fresh local D1
and on the deployed one; gate green.

---

### Task 4: Member auth (OTP over SMS or email)

**Files:** `src/lib/server/auth/{otp,sessions,transport}.ts`,
`src/routes/(members)/login/**`, tests beside each.

**Interfaces produced:**
- `requestCode(db, contact): Promise<{sent: true} | {error: 'unknown-contact' |
  'throttled'}>`; `verifyCode(db, contact, code): Promise<{session: string} | {error:
  'bad-code' | 'expired' | 'locked'}>`.
- `sessionPerson(db, cookieValue): Promise<Person | null>` (the guard every members
  route uses from pass 2 on).
- `transport.ts` seam: `sendOtp(contact, code)` routing SMS vs. email by contact kind,
  with a `dev` transport (logs the code) so everything works before 10DLC approval;
  email rides the T0 sending domain through Resend.

**Outcome:** Only rostered contacts can sign in (unknown contact gets the same "check
your messages" response as known, no roster oracle); codes are 6 digits, hashed at
rest, 10-minute expiry, 5 attempts then locked, 60-second resend throttle; sessions
are 90-day `__Host-` cookies, token hashed at rest.

**Constraints:** Turnstile in front of `requestCode` (fail closed, the ecxc
registration precedent) so the SMS path cannot be farmed. Secrets via the age-store
flow. Gate 1 (requirements §Governance): production refuses to boot with the dev
transport selected (config-enforced and covered by a test, not a convention); no
OTP code or contact PII is ever written to Worker logs, dev transport's local echo
excepted.

**Acceptance:** Unit tests cover expiry, attempt lockout, throttle, unknown-contact
opacity, and session round-trip; a deployed e2e (dev transport) signs in a seeded
coach by email and a seeded test person by the logged code; gate green.

---

### Task 5: Coach roster admin

**Files:** `src/routes/admin/team/**` (inside `CairnAdminShell`, the ASC
`/admin/club/**` pattern), consuming Task 3 stores and
`@glw907/cairn-cms/admin-toolkit` (`AdminTable`, `ListToolbar`, `StatusChip`,
`Pagination`).

**Outcome:** Coaches manage the roster without touching D1: list per team (name, role,
group chip, waiver StatusChip, contact presence), add/edit person (contacts, grade,
gender, group, emergency contact, waiver status), archive; a mobile-usable athlete
detail view with emergency contact and parent phone one tap deep (the trailhead
screen; server-rendered so it loads on a weak connection).

**Constraints:** Admin routes: cairn's compiled CSS only; route-local layout in scoped
`<style>` (the ASC constraint). File every engine friction met here in
`docs/harvest-findings-pass-1.md` as it lands, not at pass close. T0 amendment:
adding or editing a coach must also provision that person as a cairn editor (or the
screen documents the manual allowlist step), since coach admin rides the cairn
magic-link shell and Geoff seeds alone. Gate 1: every roster add/edit/archive writes
an `audit_log` row via T3's helper.

**Acceptance:** Playwright-free acceptance via the admin smoke recipe (ecxc's
https-local pattern): a coach session lists, adds, edits, archives a fixture person;
the emergency view renders at 390px with contact tappable (`tel:` link); gate green.

---

### Task 6: Member shell, directory, installability

**Files:** `src/routes/(members)/+layout.server.ts` (session guard),
`src/routes/(members)/home/**`, `src/routes/(members)/directory/**`,
`static/manifest.webmanifest`, `src/service-worker.ts` (minimal: install + offline
fallback page; push subscription is pass 2).

**Outcome:** A signed-in athlete or booster lands on a home shell (greeting, their
team(s) and group, honest empty states naming what's coming); the directory lists
coaches and boosters (name, role, phone, email) to coaches and boosters, coaches-only
to athletes; the site is installable to a home screen with the platform name and icon.

**Constraints:** Directory visibility exactly as the requirements' *(default)* states
it; the manifest/app name is the T0 neutral name; no marketing copy anywhere in the
member shell.

**Acceptance:** Guard test: no session → login redirect; role-based directory
rendering covered by a store-level test plus a rendered check; Lighthouse (or
`wrangler dev` + devtools audit) reports installable; gate green.

---

### Task 7: Pass close

**Files:** platform `docs/STATUS.md`, `docs/harvest-findings-pass-1.md`,
ecxc-ski `docs/STATUS.md` (one pointer paragraph), memory refresh.

**Outcome:** The pass-end ritual: code-simplifier over the pass's code, full gate,
reviewer fan-out (svelte-reviewer, cloudflare-workers-reviewer,
web-auth-security-reviewer on T4 especially), harvest findings folded to cairn-cms,
platform STATUS states what exists and names pass 2 as next, ecxc-ski STATUS points
across, deployed smoke re-run, commit + push. The reviewer fan-out also verifies the
Gate 1 items from requirements §Governance: taxonomy classes declared and respected,
consent fields present, scoped CI token in use, dev-transport refusal and no-PII
logging tested, audit rows written.

**Acceptance:** All reviewers' confirmed findings fixed or logged with reasons; both
STATUS files updated; the platform repo is the canonical home of its own docs from
here on.

---

## Self-review notes

Spec coverage check against the requirements doc: pass 1 implements identity/roster
(§Identity and access, §Multi-team, coach roster view incl. emergency + waiver), the
cairn-extension obligations (§Cairn admin extension), the neutral home (§Constraints),
and the directory (§Directory). Deliberately deferred to the pass map: log/check-in/
rollups (2), push + SMS live sends (2–3), plans/schedule/broadcast (3), chat (4),
races (5), East (6), exports (with 2's log). No task exceeds four distinct
deliverables. Type names T4/T5 consume from T3 match T3's interface block.
