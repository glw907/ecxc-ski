# ECXC team platform: requirements

Gathered 2026-07-30 in the team-platform brainstorm. This is the requirements record the
design spec derives from; when the two disagree, this document wins and the spec gets
corrected. Facts here came from Geoff directly; decisions marked *(default)* are
Claude-proposed defaults he has not overridden and can veto at review.

## Purpose and success criterion

Replace ECXC's use of CrewLAB with site-native functionality and retire CrewLAB
entirely. The acceptance bar: by end of October 2026 the team runs on ecxc.ski alone.
No fall emergency; the running season can proceed without the system.

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
- Every broadcast is recorded with its delivery outcomes.

## Chat

- Shape: simplified Slack/Discord. Channel list, room view with scrollback, @mentions,
  emoji reactions *(default)*. No threads.
- Channels are coach-created and audience-typed. Defaults at launch: `#team`, `#comp`,
  `#devo`, `#boosters` *(default)*. Athletes and boosters never share a channel.
- One-on-one conversations exist for exactly two pairs: **coach ↔ athlete** and
  **coach ↔ booster**. Every conversation involving an athlete is visible to all
  coaches; there are no unmonitored spaces involving a minor. Coach ↔ booster DMs are
  ordinary private adult conversations. No athlete ↔ athlete and no booster ↔ athlete
  DMs.
- Attachments: photos and files (race sheets, forms). Coaches can delete any message or
  attachment. Full history retained.
- Notifications: a channel message pushes only on @mention; DMs always push; broadcasts
  always push; everything else is pull.

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

- Cloudflare stack, one Worker, inside the existing ecxc.ski repo and theme.
- ECXC keeps custody of minors' data and messages; no chat SaaS. The SafeSport posture
  (monitored DMs, coaches in every space, retention) is stated as ECXC's own policy.
- Registration (Sheets + email pipeline) is unchanged; the roster is provisioned by
  coaches from registration data, not auto-synced *(default)*.

## Non-goals

Attendance tracking, race results and timing, analytics beyond the stated rollups,
parent logins, payments, a native app, athlete ↔ athlete DMs, threads, volunteer-slot
or fundraising features, coach workout assignment, athlete race RSVP.

## Open items

- Session length and re-auth behavior on shared family devices.
- Whether ski-season Zone4 races use the same eight-column format (verify against a
  ski-race export before the race-roster schema freezes).
- Directory visibility default (athletes seeing coach contacts) needs Geoff's yes/no.
- Log backfill/edit window, if any limit is wanted at all.
