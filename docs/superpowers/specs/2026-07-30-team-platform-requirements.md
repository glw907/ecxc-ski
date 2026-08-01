# ECXC team platform: requirements

Gathered 2026-07-30 in the team-platform brainstorm. This is the requirements record the
design spec derives from; when the two disagree, this document wins and the spec gets
corrected. Facts here came from Geoff directly; decisions marked *(default)* are
Claude-proposed defaults he has not overridden and can veto at review.

## Multi-team architecture (added 2026-07-30)

Some athletes train with both ECXC and the East High ski team; Geoff coaches both, and
East will use this system starting this ski season (Nov–Dec 2026). The model:

- **The log belongs to the athlete; teams are lenses.** One identity (keyed by
  contact), one training log, one daily check-in, regardless of how many teams an
  athlete is on. "Sharing data between teams" is achieved by permission, not by
  copying: a coach sees the full log and check-ins of any athlete on their roster.
  This is the honest overtraining picture: both teams' coaches see the same 14-hour
  week instead of each seeing half.
- **Everything else is team-scoped**: rosters, groups, plans, channels, broadcasts,
  races, directories. An athlete logs a session without picking a team.
- **Schema carries the team dimension from day one** (people global; roster membership
  per team; team id on every team-owned object). ECXC is the first team in the table;
  East High is the second. Retrofitting this after launch would be a mid-season
  migration; building it now is a column and a join.
- **A neutral home (Geoff, 2026-07-30).** Athlete-owned data shared across teams
  cannot live under one club's flag. The platform is its own application: a separate
  repo, Worker, D1, and a neutral domain (name is Geoff's pick, an open item), with
  each team's site handing members into it (e.g., ecxc.ski/team forwards there). The
  adoption framing survives because what families touch is still "the team's page";
  the neutral domain is plumbing they pass through, and the zero-signup phone-code
  entry is unchanged. Hosting stays in Geoff's Cloudflare account for now; formal
  governance of cross-team minors' data becomes a real question only if the platform
  outgrows the two teams he coaches (carried with the athletic-director open item).
- **Consequence to settle in the spec**: plans were slated as an ecxc.ski cairn
  content type. With the platform neutral, plan hosting must be decided per team
  (each team's own site vs. the platform itself; East has no site of its own by
  November).
- **Direction, not v1**: Geoff wants other teams to be able to adopt the system and
  share athlete data the same way. v1 builds no self-serve onboarding, per-team
  branding, or cross-org admin; a third team is its own future initiative.

## Purpose and success criterion

Replace ECXC's use of CrewLAB and retire it entirely. The acceptance bar: by end of
October 2026 the team runs on the platform alone, entered through ecxc.ski.
No fall emergency; the running season can proceed without the system. East High
onboards as the second team in early ski season (Nov–Dec 2026), so team-scoped UI must
work then, not merely be schema-possible.

Drivers, in order: CrewLAB's training log cannot represent XC training (minutes at
effort levels in structured sessions); both athletes and boosters need a simpler
interface; the team needs broadcast and group chat ("like Remind, with more effective
group conversations"; chat itself a simplified Slack/Discord).

## People and roles

- **Coach**: 5 people, one flat role. Every coach can broadcast, author plans, manage
  the roster, manage race entries, see all training logs, and see every conversation
  that involves an athlete.
- **Athlete**: ~50, nearly all minors. Log training, read plans, chat, receive
  broadcasts.
- **Booster**: ~20 adults. Chat and broadcasts suffice; no structured volunteer or
  fundraising features. A contact directory of boosters and coaches is wanted.
- **Race organizer**: a contact record (name, email), never an account. Receives the
  Zone4 entry email with the CSV attached.
- **Parents**: not a role. Reached by the email copy of broadcasts using contact data
  registration already holds. No parent view of a child's conversations; coach
  visibility is the monitoring guarantee.

## Identity and access

- Accounts are coach-created from the roster; never self-service.
- Sign-in is contact-based: a six-digit SMS code to a rostered cell, or a magic link to
  a rostered email, landing in the same session either way. Boosters typically use
  email; an athlete may too if their email is on file.
- Sessions are long-lived (~90 days *(default)*), so sign-in is roughly once a season
  per device.
- Visibility: coaches see all logs and all athlete-involving conversations; an athlete
  sees only their own log.
- Coach roster view (added 2026-07-30): each athlete's emergency contact and parent
  phone one tap deep, offline-tolerant (five adults, fifty minors, remote trailheads;
  the data already exists in registration). The same view shows each athlete's
  registration/waiver status, so an unwaivered kid is visible before they train.
- Season rollover (added 2026-07-30): rosters archive rather than delete; a new season
  reassigns groups and adds/retires people while every athlete's log history survives
  intact across seasons.

## Training groups

Two groups: **Comp** and **Devo**. Plan audiences may split a group by gender (Comp
Girls may get a different week than Comp Boys); gender comes from the athlete record.
Race class (below) is deliberately distinct from training group.

## Training log

- Modalities (6): running, hill bounding, strength, spenst, skiing, roller skiing. Snow
  and wheels are distinct modalities. Skiing and roller skiing carry a technique:
  classic, skate, or double-pole.
- A session: date, modality (+ technique), an ordered list of blocks, optional note. A
  block is `reps × minutes @ level` (reps default 1; levels L1–L5; strength and spenst
  take no level). Totals are always computed from blocks, never entered.
- Athletes log freely; there is no coach assignment surface. Athletes can edit and
  delete their own entries *(default)*.
- Entry UX bar: fifteen seconds on a phone in a parking lot.
- Athlete view: own week and season, hours by modality, time in zone.
- Coach view: team table of hours by modality per athlete, week and season, grouped
  Comp/Devo, athlete detail one tap deep.
- Multi-year history: log data is retained across seasons and each athlete gets a
  year-over-year view (annual hours progression, the development metric the whole
  model centers on). An optional per-athlete annual hours target draws one line on
  that view (added 2026-07-30).

## Daily check-in

- One check-in per day per athlete, independent of training sessions (rest days
  included): a four-point feeling scale rendered as face buttons (Poor / OK / Good /
  Great) plus an optional free-text note.
- Friction bar: two taps from opening the site to answered. No nudges or reminder
  pushes; coaches encourage the habit at practice.
- Visibility follows the log rule: coaches see all check-ins (the overtraining and
  illness signal), an athlete sees only their own. The coach rollup gets a recent
  team feeling row alongside hours *(default)*.
- Editable for the current day; past days read-only *(default)*.

## Plans

- A plan is **weekly and narrative**: prose for a group's week, where days may vary.
  The block grammar ("6×3 min L3") is available inside a plan as notation, not a
  required structure.
- Audience: Comp, Devo, or a gendered slice of either. Several concurrent plans are
  normal.
- Public pages, no login to read *(default)*. Authored in the cairn admin as a content
  type *(default)*.

## Broadcast

- Any coach composes; audiences: whole team, a group, a gendered slice, boosters, or
  the parent email list.
- Delivery: push first; SMS fallback to any athlete without a live push subscription;
  email for adult audiences.
- A broadcast also lands as a message in the matching chat channel, so replies thread
  there in front of the group.
- Every broadcast is recorded (message, audience, sender, time). Per-recipient
  delivery-status tracking is out: push and SMS receipts are unreliable enough that it
  would overpromise (trimmed 2026-07-30).
- Public or private is a compose-time choice (Geoff, 2026-08-01). When a coach posts
  a message they check whether it is public on the website or private to the team.
  Private is the existing behavior: delivery through the announcement/broadcast
  channels above. A public post renders on the platform's public site (a team
  announcements surface, joining plans and the schedule as the third public content
  kind) and additionally triggers an announcement broadcast by default; the coach
  can switch the accompanying broadcast off per post *(default)*. Public posts
  carry no athlete data, per §Governance's taxonomy rule.

## Chat

- Shape: simplified Slack/Discord. Channel list, room view with scrollback, @mentions,
  emoji reactions *(default)*. No threads.
- Channels are coach-created and audience-typed. Defaults at launch: `#team`, `#comp`,
  `#devo`, `#boosters` *(default)*. Athletes and boosters never share a channel.
- One-on-one conversations exist for exactly one pair: **coach ↔ athlete**, visible to
  all coaches; there are no unmonitored spaces involving a minor. No athlete ↔ athlete,
  no booster ↔ athlete, and no in-system coach ↔ booster DMs (adults use the directory
  and ordinary text/email; trimmed 2026-07-30).
- v1 is text and links only. Photos and files are the first fast-follow (kids and
  boosters both want them; see Later). Coaches can delete any message. Full history
  retained.
- Notifications: a channel message pushes only on @mention; DMs always push; broadcasts
  always push; everything else is pull.

## Schedule

Schedule truth lives on the site (added 2026-07-30): a public upcoming view carrying
races (already records for entry management), camp dates, and practice times (slow-
changing content, editable like any page). If the schedule lives in a pinned PDF or
gets re-asked in chat weekly, a parallel channel is born and the adoption strategy's
own rule fails; this section exists to prevent that.

## Directory

A contact directory of coaches and boosters (name, role, phone, email), visible to
signed-in coaches and boosters; athletes see coach contacts *(default)*.

## Race rosters and Zone4 export

- Coaches decide entries; athlete availability arrives informally (no RSVP surface).
- Per race: which athletes are entered, each with class, seed, and a free-text note.
  Class/seed prefill from the athlete's previous race.
- Export: the eight-column CSV matching the real example (Geoff's `eastxc.csv`,
  2026-07-30; not committed, it holds real minors' names):
  `First Name, Last Name, Grade, Gender, School, Class, Group, Notes` where School is
  constant `East`, Class is e.g. `Girls A`/`Boys Open`, Group is the seed within class
  (blank for Open), Grade is the word and may be blank.
- The system emails the CSV as an attachment to the race organizer contact; that send
  closes the loop.

## Mobile experience bar

Geoff's bar: the experience should feel as straightforward as WhatsApp. Assessment
(2026-07-30, sources in the brainstorm record): the in-app feel is achievable with real
keyboard/viewport polish, and iOS 26 opens home-screen sites as web apps by default.
The named reference implementation is **Telegram Web** (the one major chat PWA that is
functionally close to its native app); pass 3 builds with it open side-by-side, and our
scope is a small slice of it (in-room mechanics for ~75 users, no E2EE/calls/sync).
Notification delivery on iOS cannot match native reliability (installed-PWA-only push;
documented silent unsubscribes and missed listeners after restarts), so reliability is
engineered instead:

- The service worker re-verifies and heals its push subscription on every app open.
- DMs and @mentions fall back to SMS when the recipient has no live push subscription,
  same as broadcasts. Ordinary channel chatter never falls back.
- Installation is a coach-led ritual at practice, not a self-serve ask.
- The push substrate ships in the identity/log pass, weeks before chat, so real
  delivery data from the team's actual phones exists before chat depends on it.

## Delivery substrate

- The site becomes an installable PWA with real web push (modern iOS and Android).
- One SMS provider (Twilio-class) serves sign-in codes and fallback sends. Requires US
  A2P 10DLC campaign registration: external approval measured in days to weeks, started
  early.
- Known adoption risk, accepted: an athlete who never installs the PWA still gets
  broadcasts, DMs, and mentions by SMS but misses ordinary channel chatter until they
  next open the app.

## Adoption strategy: winning "not another app"

The effort fails if it is perceived as one more communications app (Geoff, 2026-07-30).
The design commits to four claims, each binding on later passes:

- **Never an app.** No store, no signup, no password. The roster already knows every
  person; athlete onboarding is phone number + texted code. Message it as "the team
  website got new abilities," never as a platform switch.
- **A zero-adoption floor.** A family that installs and signs into nothing still gets
  every broadcast by SMS and parent email. Day one demands no behavior change from
  anyone; the PWA install is an upgrade sold later at practice, not the price of
  staying informed.
- **Net subtraction.** CrewLAB retires, and any parallel Remind list, GroupMe thread,
  or side text-blast folds in. Hard staff rule for all five coaches: everything flows
  through the site, nothing forks to a parallel channel. One side-channel makes the
  site additive again and reopens the battle.
- **Parents exempt.** Parents never need an account or an install; "do I need to
  install something?" is answered no, permanently.

## Constraints

- Cloudflare stack. The platform is its own repo and Worker on a neutral domain
  (neither ECXC's nor East High's brand); team sites keep their own repos and hand
  members into it. It shares the family design system but is not part of ecxc-ski.
- ECXC keeps custody of minors' data and messages; no chat SaaS. The SafeSport posture
  (monitored DMs, coaches in every space, retention) is stated as ECXC's own policy.
- D1 is the system of record (the data's daily work is relational aggregation; decided
  2026-07-30). Athlete data ownership is expressed as export, not storage topology:
  every athlete can download their complete history (JSON/CSV) at any time, including
  after graduating; a departing team can take its slice the same way; and the platform
  snapshots D1 to R2 on a schedule as independent disaster insurance.
- Registration (Sheets + email pipeline) is unchanged; the roster is provisioned by
  coaches from registration data, not auto-synced *(default)*.

## Later (named, deliberately not v1)

- **Photos and files in chat**: the first fast-follow after chat ships. Both kids and
  boosters want them; v1 launching text-only protects October.
- **Video upload**: coaches video athletes to show technique; a technique-video flow
  (upload, share with the athlete, maybe annotate) is real future work with its own
  storage and playback questions. Named here so the media architecture doesn't paint
  it out; not scoped for v1.

## Non-goals

Attendance tracking, race results and timing, analytics beyond the stated rollups,
parent logins, payments, a native app, athlete ↔ athlete DMs, in-system adult ↔ adult
DMs, threads, volunteer-slot or fundraising features, coach workout assignment, athlete
race RSVP, per-recipient broadcast delivery tracking.

## Governance and data security (ratified 2026-07-30)

Ratified by Geoff after adversarial review (record: the pass 1 T0 ledger in
`docs/superpowers/plans/`). The model in one sentence: isolation by scope is the v1
mechanism, the data taxonomy is the permanent foundation, and trust beyond the two
teams Geoff coaches is bought with governance, not promises.

### The integration contract (external sites)

Team sites sit outside the trust boundary and get links, never data:

- A team site hands members in via a redirect it owns (e.g. ecxc.ski/team forwards to
  the platform). No SSO, no token passing, no API; sessions live only on the platform
  origin as `__Host-` cookies. A compromised team site holds nothing but a hyperlink.
- Team-scoped public content (plans, schedule) renders on the platform under stable
  per-team URLs; team sites hyperlink to it, never embed or fetch it.
- Data moves by human action: coaches provision the roster, exports are downloads.
  No machine-to-machine API in v1; a registration-to-roster sync, if ever wanted,
  is its own initiative with an explicit API surface.
- Sender identity: sign-in codes and broadcasts come from the platform's own domain,
  and team sites say so at the hand-off ("you'll get a code from our team platform").

### The data taxonomy (structural; enforced at schema review)

Three classes. No table straddles two; the class grouping is declared in the
migration files themselves.

- **Athlete-owned**: training log, daily check-ins. Follows the person across teams,
  is never part of any club's export, and is deletable at the athlete's (or
  parent's) request. The export right belongs to the athlete.
- **Club-owned**: roster memberships, groups, plans, channels and messages, race
  entries. The club's slice, exportable in full when a club leaves.
- **Platform-operational**: auth, sessions, delivery records, audit rows. Nobody's
  product; retained per operations policy.

No athlete data ever lives in a cairn content concept, because cairn's storage is a
GitHub repository: plans are prose, the roster is D1, and the two never mix.

### Visibility consent at rostering

Rostering grants log visibility forward from the rostering date by default.
Visibility into an athlete's pre-rostering history requires a one-tap athlete or
parent acknowledgment. This closes the second-club consent hole (a new coaching
staff must not inherit years of history the athlete never agreed to show them);
the schema carries the fields from pass 1 even though the acknowledgment UI can
arrive with the second tenant.

### The three gates

- **Gate 1 (pass 1, structural, hard to retrofit)**: taxonomy encoded in the schema;
  the visibility-consent fields; the platform repo's CI deploys with its own scoped
  Cloudflare token (the broad workstation admin token never lands in the platform
  repo's secrets); no PII or OTP codes in Worker logs, and production refuses to run
  with the dev OTP transport, both config-enforced and tested; audit rows written
  for exports and roster changes; the athlete export right shaped into the schema.
- **Gate 2 (East High onboarding)**: a published plain-language data policy (what is
  stored, who sees it, sub-processors by name: Cloudflare, Twilio; retention; how to
  export or delete), riding the waiver's attorney review; a check of the school
  district's requirements for third-party team tools; the consent acknowledgment
  exercised for real cross-team athletes.
- **Gate 3 (first club Geoff doesn't coach; its own initiative, per Multi-team
  "Direction, not v1")**: entity custody (a legal home owning a dedicated Cloudflare
  account), signed data agreements with member clubs, per-club admin isolation
  proven by test, read-access audit logging, an incident-response commitment, and a
  decision on the vault split (athlete-owned store separated from per-club
  databases; the taxonomy keeps that a table-level partition, not row surgery).
  Until Gate 3 clears, the platform does not take custody of a third club's
  athletes, and that refusal is itself part of the guarantee.

### Named accepted risks (the two-team era)

Single D1 with logical tenancy in Geoff's personal Cloudflare account; the broad
workstation admin token can reach the platform D1; R2 disaster snapshots hold
complete copies in the same account. Accepted while every rostered athlete is on a
team Geoff coaches; re-examined at each gate.

## Cairn admin extension and the harvest duty (added 2026-07-30)

The platform is the second system, after the ASC site, to extend the cairn admin
interface, and it carries the same obligations:

- Coach-side admin surfaces build inside `CairnAdminShell` using
  `@glw907/cairn-cms/admin-toolkit`, following ASC's precedent (`/admin/club/**`,
  `src/admin-club/`, including its compiled-CSS constraint notes). Platform-local
  admin components that prove general graduate to the engine's toolkit, the same path
  ASC's components took.
- Standing DX-harvest mandate, the ASC pattern verbatim: every pass keeps a
  `harvest-findings` doc as a running log of cairn contract/DX deficiencies, folded
  back to cairn-cms at pass close; consumer briefs flow the other way when the
  platform needs a seam the engine lacks. The second consumer is what hardens the
  admin-extension seams from anecdote into contract.
- To settle in the spec: how coach identity relates to cairn editor identity (likely
  ASC's shape: coaches are cairn editors and coach surfaces ride the admin shell,
  while athletes and boosters stay on the platform's lightweight contact auth).

## Operations

The platform is an operated product, not a website: someone moderates, someone answers
"my phone isn't buzzing," someone runs the seasonal onboarding ritual. One of the five
coaches is the named primary operator (which one is an open item below).

## Open items

- Which coach is the named primary operator.
- The platform's neutral name and domain (Geoff's pick; neither ECXC nor East High).
- Session length and re-auth behavior on shared family devices.
- Whether ski-season Zone4 races use the same eight-column format (verify against a
  ski-race export before the race-roster schema freezes).
- Directory visibility default (athletes seeing coach contacts) needs Geoff's yes/no.
- Log backfill/edit window, if any limit is wanted at all.
