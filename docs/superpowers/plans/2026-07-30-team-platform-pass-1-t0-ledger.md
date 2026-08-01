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
4. **Coach roster: Geoff only at seed**; the other coaches join through the
   interface later. Consequence for T5, recorded as a plan amendment: the
   add-coach flow must also provision the person as a cairn editor (or the
   screen documents the manual allowlist step), because coach admin rides the
   cairn magic-link shell. Geoff's editor email is `geoff@907.life` per the ecxc
   admin precedent (**pending his confirmation**), cell number **pending** (not
   in the contacts store).

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
