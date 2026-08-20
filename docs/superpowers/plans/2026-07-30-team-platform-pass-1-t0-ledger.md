# Team platform pass 1: T0 decision ledger and T0.5 briefing

Execution record for Tasks 0 and 0.5 of
`2026-07-30-team-platform-pass-1.md`, written 2026-07-30 so a fresh execution
session inherits the decisions without this conversation. T1 folds the settled
values into the platform repo's README; until then this file is the record.

## Task 0 decisions (Geoff, 2026-07-30)

1. **Domain: `xcathletes.org`, REGISTERED (Geoff, 2026-08-01).** Zone active on the
   glw907 account, id `7c0c4d8aee47be2a777fdb068b78bad1`; DNS is scriptable with
   the existing token (Zone.DNS Edit covers all zones). Kept after checking
   generic alternatives (`athletedata.org` and `athletelog.org` were open,
   `trainingdata.org` and `teamtraining.org` taken): the platform is
   sport-specific by design and the name states the audience, not the asset.
   Plural confirmed deliberate. Repo name per local convention:
   `~/Projects/xcathletes-org/`. (History: the Registrar API supports registration
   but the managed token deliberately has no Registrar scope, so Geoff registered
   in the dashboard.)
2. **Email: Cloudflare Email Service (Email Sending), not Resend.** Geoff pushed
   back on a second Resend account; the facts support him. The 2026-07-14 quota
   outage predates Email Sending's public beta (2026-04-16). Current terms on the
   Workers Paid plan the account already has: 3,000 emails/month included, then
   $0.35 per 1,000; daily quotas start conservative and scale with reputation,
   with a documented limit-increase request path. Platform volume is far below
   the quota. Safeguards owed by the execution session: T4's transport seam stays
   (a Resend cutover remains a config change, the ecxc July playbook); request a
   daily-limit increase when onboarding the sending domain; add a quota check to
   the pass-5 cutover checklist. The managed API token already carries Email
   Sending scope (REST and binding). **CONFIRMED by Geoff 2026-08-01; decision
   final. Domain ONBOARDED the same day** (Geoff, dashboard; verified 2026-08-01
   by reading the zone: cf-bounce MX x3, SPF, DKIM, and `p=reject` DMARC all
   present). xcathletes.org can send. Still worth a daily-limit increase request
   from the Email Sending limits page before real volume; the execution session
   carries that if Geoff hasn't.
3. **SMS: Twilio, account LIVE (2026-08-01).** Account created and funded ($20,
   out of trial); credentials stored in the age store (`TWILIO_ACCOUNT_SID`,
   `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`; Standard key
   "xcathletes-platform-2026-08", scope and rotation in the dotfiles registry;
   worker routing added at T1). Twilio had zero Alaska local inventory
   (2026-08-01), so Geoff ratified the **verified toll-free path** over 10DLC.
   All filed 2026-08-02: KYC primary customer profile approved under "East
   Community Cross Country" (bundle `BU2280ff945556bb865b7b7737067a85b7`);
   **+1 888-609-8679 purchased** (`PN805ee190e4d3c29fe31cb77e7924db8d`,
   ~$2.15/mo); **toll-free verification PENDING_REVIEW**
   (`HHc002beb3bcdeefce648a3a57f228e9ff`; use case: sign-in codes + team
   notifications, WEB_FORM opt-in citing the ecxc.ski registration pages,
   volume 100/day). Check status:
   `GET messaging.twilio.com/v1/Tollfree/Verifications/HH...`. T4 uses the dev
   transport until it clears. Geoff's contact PII (cell, address) is
   deliberately NOT in this repo: the execution session reads it from the
   approved KYC profile via `GET trusthub.twilio.com/v1/CustomerProfiles/BU.../
   EntityAssignments` then `EndUsers/IT...` (age-store Twilio creds).
4. **Coach roster: Geoff only at seed; CLOSED 2026-08-02.** The other coaches
   join through the interface later. Consequence for T5, recorded as a plan
   amendment: the add-coach flow must also provision the person as a cairn
   editor (or the screen documents the manual allowlist step), because coach
   admin rides the cairn magic-link shell. Editor email **confirmed:
   `geoff@907.life`**. Roster cell: the phone on the Twilio KYC profile
   (confirmed; retrieval recipe in item 3, PII deliberately not in this repo).

## Governance ratification (Geoff, 2026-07-30, "bake it in")

After an adversarial review of the integration and data-security model, Geoff
ratified the governance foundation. The canonical text is now **requirements
§Governance and data security** (integration contract, three-class data taxonomy,
visibility-consent-at-rostering rule, the three gates, named accepted risks); the
plan's Global Constraints and T1/T3/T4/T5/T7 carry the Gate 1 amendments. The
review's key findings, for the record: the thin contract makes external sites
harmless but concentrates value in the platform (the honeypot inversion); the
two-team-era governance model is Geoff personally, which is why Gate 3 exists; the
broad workstation Cloudflare token reaching the platform D1 is a named accepted
risk, partially mitigated by the scoped CI token; and second-club rostering must
not inherit unconsented history, hence the `log_visible_from`/`history_ack_at`
fields from day one.

**New pending item for Geoff (with the four above): mint a platform-scoped
Cloudflare API token** (this Worker + its D1 only) in the dashboard once T1 names
the Worker, for the platform repo's GitHub Actions secret. The broad "Cloudflare
Admin" token must never land in that repo.

## Task 0.5: done (2026-07-30)

ecxc-ski upgraded `@glw907/cairn-cms` `^0.84.4` to `^0.91.1`, commit `ce11b6d`,
pushed. The changelog span (0.85.0 through 0.91.1) was reviewed against all nine
subpaths ecxc imports; no breaking change reached site code and `npm install`
alone closed the upgrade. Gate: check 0/0 (618 files), tests 141/141, build
green; local https admin-guard smoke passed per recipe. The platform scaffolds
directly on `^0.91.1`.

## Post-T0.5 addendum (2026-08-01): cairn 0.92.0 and the engine brief

- **cairn 0.92.0 released after T0.5** (registry latest as of 2026-08-01, the
  design-ratchet release). ecxc is unaffected and stays on `^0.91.1` (the one
  breaking change is admin-fields' new `register="stacked"` default, and ecxc
  imports no admin-fields). **T1 scaffolds on the latest release at execution
  time**, re-checking the registry and reading the incremental changelog beyond
  0.91.1: 0.92.0 adds the admin-fields register prop (stacked default is what a
  new build wants) and three advisory cairn-audit geometry rules.
- **Engine gaps: exactly two, consumer brief filed** at
  `cairn-cms/docs/internal/2026-08-01-xcathletes-consumer-brief.md` for the
  proactive engine pass Geoff is organizing. Seam 1: the auth store's editor
  functions (`insertEditor` etc.) are package-internal with no export subpath, so
  T5's add-coach-provisions-editor flow uses the manual `ManageEditors` fallback
  until the export lands (retrofit is one call site). Seam 2: no first-publish
  stamp or manifest-diff helper, which gates pass 3's announce-on-publish; the
  engine pass should land it before platform pass 3. Everything else the
  requirements need was verified present in 0.92.0.

## cairn 0.85.0-0.91.1 briefing for T2/T5 (from the T0.5 changelog review)

What a from-scratch cairn admin consumer on 0.91.1 should adopt from day one:

- **0.89.0, `@glw907/cairn-cms/admin-toolkit` is born**: `PageHeader`,
  `ListToolbar`, `AdminTable`, `StatusChip`, `Pagination`, `EmptyState`, and
  formatters (`formatMoney`, `formatCivilDate`, `formatTimestamp`,
  `ageFromBirthdate`; `formatPhone` from 0.90.0). If the platform extends the
  toolkit locally, its admin CSS `@source` glob must cover that directory (the
  0.89.0 scan gap; guarded upstream by `check:admin-css-classes`).
- **0.91.0, the grammar-token release**: `--cairn-type-*` / `--cairn-gap-*`
  custom properties plus role utilities (`type-title/subtitle/body/meta/label/
  chip/heading`, `gap-control/label/group/section`) are the supported vocabulary
  for custom admin screens; palette tokens are the brand layer and sites never
  redeclare grammar tokens. `card-shell`/`card-shadow` utilities replace
  hand-copied class strings. `badge-ghost` is retired: use
  `StatusChip register="quiet"` (the `stock-default-hazards` audit rule errors
  on it). Adopt `npx cairn-audit` (with `cairn-audit.config.json`) and the
  `cairn-admin-screens` skill (installed by `cairn-doctor --fix`) from day one.
- **0.86.0/0.86.1, the nav contract**: `navLayout` (ordered tree mixing engine
  and site-custom screens) is the current idiom, mutually exclusive with the
  older `adminNav`. `AdminShellData` collapsed `customNav`/`canManageEditors`/
  `navLabel` into `nav`. Auth D1 migrations (`0000_auth.sql`, `0001_roles.sql`)
  ship inside the npm package under `migrations/` for exactly this no-checkout
  scaffolding case; `cairn-doctor` checks `auth.role-wiring`.
- **0.85.0 + 0.88.0, roles and access**: `defineRoles` (capabilities
  `owner`/`editor`/`none`), `bootstrapOwner` seeds the first owner through the
  ordinary magic-link flow (no `wrangler d1 execute`); `defineAccess(roles, map)`
  + `canReach` + `requireAccess` is the single authority for route enforcement
  and sidebar visibility. Read both before hand-rolling per-route guards for
  coach surfaces.
- **0.90.1**: `ListToolbar` `'select'` facet is content-sized (no 320px clamp);
  the `'menu'` facet has real ARIA menu semantics.
- **0.86.2**: full admin visual-system rewrite (emphasis ladder, one status-pill
  family, mobile edit-route recomposition with a bottom action bar); it is the
  visual baseline toolkit screens inherit.
- **0.91.1**: restored 19 Tailwind classes the 0.91.0 tree-shake dropped and
  added a snapshot test on the compiled admin sheet's class inventory; a
  consumer starting on 0.91.1 never sees the regression, but the snapshot
  discipline explains any future "missing class" mystery.

## Execution handoff (written at session close, 2026-08-02)

Task 0 and Task 0.5 are complete; nothing in this pass waits on Geoff except the
platform-scoped CI token (dashboard-minted once T1 names the Worker; the T1
constraint in the plan carries it). Launch the execution session from
`~/Projects/ecxc-ski` on Opus 5 with:

> Execute Tasks 1-7 of docs/superpowers/plans/2026-07-30-team-platform-pass-1.md.
> T0/T0.5 are done; read docs/superpowers/plans/2026-07-30-team-platform-pass-1-t0-ledger.md
> first for the decisions, live infrastructure, and cairn briefing. Requirements
> authority: docs/superpowers/specs/2026-07-30-team-platform-requirements.md; where
> docs disagree, requirements win. Dispatch each task to site-implementer (Sonnet),
> review the diff, clear the full gate between dispatches. Scaffold the platform on
> the latest cairn release (re-check the registry; 0.92.0 as of 2026-08-01).

## T1-T7 execution addendum (2026-08-20)

Written at the start of the execution session. The pass scaffolds on cairn
**0.95.0** (registry latest; ecxc itself moved to `^0.95.0` the same day), which
is three releases past the 0.92.0 the T0.5 addendum anticipated. Reviewing
0.93.0 through 0.95.0 changed two tasks materially and settled several
scaffolding choices. Requirements still win over both this file and the plan.

### Both engine seams from the consumer brief are CLOSED

- **Seam 1 (editor provisioning) is closed by 0.93.0.** `@glw907/cairn-cms/auth-store`
  now exports `listEditors`, `insertEditor`, `deleteEditor`, `setEditorRole`,
  `insertOwnerIfEmpty`, `removeOwnerIfNotLast`, `demoteOwnerIfNotLast`, and
  `EditorRow`. T5's add-coach flow calls `insertEditor` directly; the manual
  `ManageEditors` fallback the brief planned for is not needed. Role values carry
  no DB constraint, so the site's own `defineRoles` vocabulary is the only check.
- **Seam 2 (first-publish stamp) is out of scope for this pass** and still gates
  pass 3's announce-on-publish. 0.95.0's entry history and `Backend.listCommits`
  move toward it but do not close it. It stays on the engine's list.

### T4 rides the engine's auth channel instead of hand-rolling OTP

`@glw907/cairn-cms/auth-channel`'s `createAuthChannel(config)` (0.94.0) is the
member-auth layer T4 planned to build from scratch. It is a numeric OTP channel
on the site's own D1 binding, deliberately separate from `AUTH_DB`, and every
seam T4 needs is a config callback: `deliver(contact, code, ctx)` is the
transport (contact-kind agnostic, so one function routes SMS and email),
`lookup(contact)` is T3's `findPersonByContact`, `normalize(raw)` is the E.164
and lowercase boundary, and `challenge(event, form)` is where `verifyTurnstile`
from `@glw907/cairn-cms/cloudflare` plugs in. It returns three plain SvelteKit
actions (`request`, `confirm`, `logout`) plus `resolveSubject` (the guard every
members route uses) and `revokeSessions`. Codes, nonces, and session tokens are
all hashed at rest; every action asserts origin and https first.

T4's plan text names `src/lib/server/auth/{otp,sessions,transport}.ts` and its
own `requestCode`/`verifyCode`/`sessionPerson`. Hand-rolling those against a
shipped, security-reviewed engine channel would be strictly worse. **T4 becomes
a configuration and transport task**, and its acceptance criteria transfer: the
expiry, lockout, throttle, unknown-contact opacity, and session round-trip are
still proven by test, now against the composed channel.

Reference: `cairn-cms/docs/reference/auth-channel.md`,
`docs/extend/add-a-second-audience.md`, and the worked example at
`cairn-cms/examples/showcase/src/members/channel.ts` plus
`examples/showcase/migrations-members/0000_channel.sql`.

**Accepted deviation from requirements, flagged for Geoff at pass close: the
sign-in code is EIGHT digits, not six.** Requirements §Identity and access says
"a six-digit SMS code". The engine clamps `codeLength` to 8-10 and draws
uniformly over Web Crypto bytes; the floor is deliberate, part of the channel's
documented guessing-cost bound. Two extra digits is a smaller cost than
hand-rolling and self-reviewing an OTP implementation, so the platform takes the
engine's number. Session length is set to the requirements' 90 days (the
engine's default is 30, its clamp one year).

### Settled scaffolding choices

- **`wrangler.jsonc`, not `wrangler.toml`.** The plan's T1 says crib ecxc's
  `wrangler.toml`; the current engine scaffold ships jsonc and the 0.95.0
  changelog names it the scaffold shape. The platform cribs ecxc's content
  (custom-domain route, observability, vars) translated into jsonc.
- **`create-cairn-site` is unpublished** (held on first-run defects, per the
  template README's own WATCH note), so T1 copies `cairn-cms/templates/waymark/`
  directly. That tree is what the tool would have baked, and it already carries
  the admin mount, `/healthz`, the dev-backend build fence, and a custom
  admin-screen precedent at `/admin/signups` that T5 follows.
- **One migrations directory per database.** `migrations/` stays AUTH_DB's;
  everything platform-owned (teams, people, memberships, the auth-channel tables,
  `audit_log`) lives in `migrations-platform/` against `PLATFORM_DB`. The
  channel's schema is a constant in engine source rather than a shipped
  migration file, so the site copies it verbatim into its own first migration.
- **`audit_log` lives in `PLATFORM_DB`**, using the schema the engine ships as
  `migrations/0002_audit.sql`, copied into `migrations-platform/`. It backs both
  the cairn admin's own action sink and T5's direct domain-event writes through
  `createD1AuditSink(db, waitUntil)`. Requirements' no-table-straddles-two rule is
  a table-level rule, so class-labeled tables sharing one D1 is conforming, and it
  matches the single-D1 logical tenancy already named as an accepted risk.
- **`adminNav` is retired** (0.94.0). `editor.navLayout` is the only nav seam,
  and a site-custom screen is a `NavLayoutEntry` with its own `/admin/<segment>`
  href. `@glw907/cairn-cms/admin-fields` merged into `/admin-toolkit`, where
  `TextField`/`SelectField` are now `TextInput`/`SelectInput`.
- **An access map on a parameterized route must be keyed by the bracket-form
  route id**, never a concrete path. A path-keyed map fails closed and refuses
  everyone, owner included.
- **The dev-backend fence is per-call-site.** A shared exported constant does not
  fold across module boundaries and ships the whole dev backend into the
  production Worker. Leave `__CAIRN_DEV_BUILD__` and `$chassis/dev-gate.ts` as
  the template ships them.

### Live infrastructure created this session (2026-08-20)

Worker `xcathletes`; D1 `cairn-xcathletes-auth`
(`e9372238-70ea-41b0-97bb-5e67519545b1`, binding `AUTH_DB`); D1
`xcathletes-platform` (`57c929df-d203-48a3-bfbf-9def775cc93c`, binding
`PLATFORM_DB`); R2 `xcathletes-media`. Repo `~/Projects/xcathletes-org`,
GitHub `glw907/xcathletes-org`, private.

### Geoff's answers, 2026-08-20

- **CI token**: Geoff mints the platform-scoped token and pastes it; it lands in
  the workstation age store with `sync.sh` routing, and the session sets the
  GitHub secret from there.
- **GitHub App**: the platform reuses the existing cairn App (id `3847496`,
  installation `135372268`) rather than creating its own. Geoff adds
  `glw907/xcathletes-org` to that installation's repository selection.
  `GITHUB_APP_PRIVATE_KEY_B64` is already in the age store, so nothing else is
  owed. This overrides T2's "new App install" wording.
- **Repo visibility**: private, until Gate 2's data policy and the waiver's
  attorney review land.

### Twilio toll-free verification was REJECTED, not pending

The ledger records `HHc002beb3bcdeefce648a3a57f228e9ff` as PENDING_REVIEW. It
was rejected on 2026-08-04, error 30445, "Business Information Could Not Be
Verified - Contact, Email, Address, or URL Is Invalid". The edit window
(`edit_expiration`) closed 2026-08-12, so a correction needs a fresh submission
rather than an edit. The filing declared business type SOLE_PROPRIETOR under
"East Community Cross Country" with `https://ecxc.ski/` as the business website,
no privacy-policy URL, no terms URL, and `opt_in_image_urls` pointing at the two
ecxc.ski registration pages rather than at screenshots of the opt-in form. Any
of those is a plausible cause and the rejection reason does not say which.

This does not block pass 1: T4 uses the dev transport until a verified number
exists, exactly as the plan already provides. Refiling needs Geoff's judgment on
business type and on standing up a privacy-policy page, so it is carried as a
trail item for the pass close rather than acted on here.

## The CI token question, settled 2026-08-20: Workers Builds, no token at all

The T0 pending item asked Geoff to mint a Cloudflare token scoped to "this Worker + its
D1 only" for the platform repo's GitHub Actions secret. **No such token can exist.**
Cloudflare's permission groups are scoped to a user, an account, or a zone, and both D1
and Workers Scripts are account permissions with no per-database or per-script resource
selector. Any token that can deploy this Worker can also reach every other Worker and
every D1 database on the account.

This was proven, not inferred. Geoff minted a token (`b3b33cc39f7cd552474247159627f31a`)
intending it to be platform-scoped. Probed before it was stored anywhere: it read the
`ecxc` Worker, `cairn-ecxc-auth`, `asc-club`, and all thirteen D1 databases on the
account, and a write probe created and deleted a throwaway database outside the platform.
It was never set as a repository secret; the local copy was destroyed and **Geoff deleted
the token the same day**.

**Resolution, Geoff's call: Workers Builds.** Cloudflare's own CI authenticates through
its GitHub app and deploys with a build token Cloudflare holds, so no deploy credential
exists in the platform repository at all. That is Gate 1's actual intent, and it is
stronger than the scoped token the gate originally asked for, since there is no secret
for a compromised workflow or a poisoned dependency to read. The quality gate rides the
Cloudflare build command (`npm run check && npm test && npm run build`), so a red check
fails the build before the deploy command runs.

Consequences already landed:

- `.github/workflows/deploy.yml` is deleted; the platform has no GitHub Actions at all.
- `xcathletes-org/docs/deploy.md` documents the reasoning and the exact dashboard build
  settings.
- **Requirements §Governance, Gate 1 is corrected in place** with a dated note. The
  original wording claimed a control Cloudflare cannot provide, which mattered more than
  usual because Gate 2 publishes a data policy to a school district.
- The Workers Builds API is not reachable with the managed workstation token (it carries
  no Builds permission), so connecting the repository is Geoff's dashboard action. Until
  he does it, the platform has no CI and deploys happen from the workstation.

What this does NOT fix, and should not be read as fixing: the broad workstation token
still reaches the platform D1. §Named accepted risks already says so. Genuine isolation
needs a separate Cloudflare account, which is Gate 3's entity-custody work.
