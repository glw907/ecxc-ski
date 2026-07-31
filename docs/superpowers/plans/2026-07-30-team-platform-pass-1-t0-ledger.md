# Team platform pass 1: T0 decision ledger and T0.5 briefing

Execution record for Tasks 0 and 0.5 of
`2026-07-30-team-platform-pass-1.md`, written 2026-07-30 so a fresh execution
session inherits the decisions without this conversation. T1 folds the settled
values into the platform repo's README; until then this file is the record.

## Task 0 decisions (Geoff, 2026-07-30)

1. **Domain: `xcathletes.org`, approved.** Available at $8.50 first year, $11.20
   renewal (registry check 2026-07-30). The Cloudflare Registrar API now supports
   registration (`POST /accounts/{id}/registrar/registrations`), but the managed
   "Cloudflare Admin 2026-07" token has no Registrar scope and cannot self-extend,
   so Geoff registers in the dashboard (Domain Registration, Register Domains,
   auto-renew on to match the account's other eight domains). **Pending: Geoff's
   dashboard registration.** Once the zone exists, DNS is scriptable with the
   existing token.
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
   Sending scope (REST and binding). **Pending: Geoff's explicit yes** (
   recommended 2026-07-30, not yet confirmed).
3. **SMS: Twilio, Sole Proprietor 10DLC track** (ECXC has no EIN). Sole
   Proprietor caps (roughly 1,000 segments/day on the strictest carrier, 1
   msg/sec) far exceed platform volume. **Pending: Geoff creates the Twilio
   account** (his email, cell verification, payment card, ~$20 to exit trial) and
   hands over the Account SID and auth token once; they land via the age-store
   flow (`secret-set.sh`, registry entry, `sync.sh` routing). Then: buy a local
   number, file the Sole Proprietor brand and campaign (use case: sign-in codes
   plus team notifications; opt-in: coach-created roster accounts). Approval runs
   days to weeks; T4 uses the dev transport until it clears.
4. **Coach roster: Geoff only at seed**; the other coaches join through the
   interface later. Consequence for T5, recorded as a plan amendment: the
   add-coach flow must also provision the person as a cairn editor (or the
   screen documents the manual allowlist step), because coach admin rides the
   cairn magic-link shell. Geoff's editor email is `geoff@907.life` per the ecxc
   admin precedent (**pending his confirmation**), cell number **pending** (not
   in the contacts store).

## Task 0.5: done (2026-07-30)

ecxc-ski upgraded `@glw907/cairn-cms` `^0.84.4` to `^0.91.1`, commit `ce11b6d`,
pushed. The changelog span (0.85.0 through 0.91.1) was reviewed against all nine
subpaths ecxc imports; no breaking change reached site code and `npm install`
alone closed the upgrade. Gate: check 0/0 (618 files), tests 141/141, build
green; local https admin-guard smoke passed per recipe. The platform scaffolds
directly on `^0.91.1`.

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
