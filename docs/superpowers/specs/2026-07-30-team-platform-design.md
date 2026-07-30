# ECXC team platform: plans, training log, and team comms

Design spec, brainstormed and ratified 2026-07-30. This is the umbrella design for
replacing ECXC's use of CrewLAB with site-native functionality, decomposed into three
passes. Each pass gets its own implementation plan; this document is the shared contract
they build against.

## Drivers

Two, in priority order:

1. **CrewLAB's training log cannot hold an XC workout.** The currency of ECXC training is
   minutes at an effort level (L1–L5) across XC-specific modalities, in structured
   sessions ("30 min L1 warmup, 6×3 min L3, 15 min L1 cooldown"). CrewLAB's rowing-shaped
   log flattens this.
2. **Interface weight.** Athletes and boosters both need a simpler, more streamlined
   surface than CrewLAB offers.

Two mid-design additions joined the requirements: broadcast plus group chat ("like
Remind, with more effective group conversations"; chat itself a simplified
Slack/Discord), and race roster management with Zone4 export.

## Locked decisions

- **Modalities (6):** running, hill bounding, strength, spenst, skiing, roller skiing.
  Snow and wheels are distinct modalities, per Geoff. Skiing and roller skiing each carry
  a technique attribute: classic, skate, or double-pole.
- **Log grammar:** a session is a date, a modality (+ technique where it applies), an
  ordered list of blocks, and an optional note. A block is `reps × minutes @ level`
  (reps default 1; level is L1–L5 and absent for strength and spenst). Totals (hours,
  time in zone) are always computed from blocks, never entered.
- **Athletes log freely.** No coach assignment surface; the published plan and the log
  are independent.
- **Coach rollup:** hours by modality per athlete, week and season, team table first,
  athlete detail one tap deep.
- **Visibility:** coaches see all logs; an athlete sees only their own.
- **Plans are a cairn content type**, public pages, several concurrent plans at
  different level labels.
- **Delivery: push-first with SMS fallback** for athlete broadcasts; email for adults.
- **Auth is contact-based**: SMS code to a rostered cell, or magic link to a rostered
  email, same session either way. Boosters sign in by email; an athlete may too if we
  hold their email.
- **Chat is group-only.** No direct messages of any kind. Coaches are present in every
  channel; full history is retained.

## Architecture

One product, one repo, one Worker. The members' area is a new SvelteKit route group
beside `(site)`, sharing the theme, design system, and deploy pipeline. A separate
`team.ecxc.ski` Worker was considered and rejected: at roster scale (a few dozen
people), a second deploy surface and a duplicated identity layer buy nothing.

New infrastructure:

- **D1 `ecxc-team`**: people, sessions/log blocks, push subscriptions, broadcast
  records, chat history. Separate from the cairn auth D1, which stays admin-only.
- **One Durable Object namespace** for chat channels (one DO per channel).
- **Web app manifest + service worker**: the site becomes installable, with real web
  push on modern iOS and Android.
- **An SMS provider (Twilio-class)** for sign-in codes and fallback broadcasts.
  Requires US A2P 10DLC campaign registration, an external approval that takes days to
  weeks and therefore starts during pass 1.

Existing infrastructure (cairn auth D1, R2 media, Resend) is untouched. cairn itself is
touched only where it is the right tool: the plans concept.

## Identity and roster

Accounts are coach-created, never self-service. A person row: name, role
(`coach | athlete | booster`), cell and/or email, and for athletes a level/group label.
Only a rostered contact can sign in.

Sign-in: the person enters their cell or email. A cell gets a six-digit SMS code; an
email gets a magic link. Both land in the same long-lived session (~90 days), so
sign-in is roughly once a season per device.

Parents are not a role in v1. A parent who should sign in is rostered as a booster;
otherwise parents are reached by the email copy of broadcasts, using contact data
registration already holds.

## Training log

The schema is the product; the grammar is locked above. The entry screen is built for a
parking lot: pick modality (and technique), tap in blocks, done in fifteen seconds on a
phone.

- **Athlete view:** own week and season; hours by modality; time in zone.
- **Coach view:** team table (every athlete, hours by modality, week and season), with
  per-athlete detail and zone distribution one tap deep.

## Plans

A new cairn concept `plans`: title, level label, week range, markdown body. A workout
directive renders the same block grammar the log uses, so "6×3 min L3" reads identically
in the published plan and in the athlete's log. Public pages under their own section; no
login to read your week. Multiple concurrent plans at different levels are just multiple
entries. The admin editing surface comes free with the concept.

## Broadcast

Composed in the members' area by a coach. Audiences: whole team, a level group, boosters,
or the parent email list. Athlete-audience messages go to push subscriptions first; any
athlete without a live subscription gets the SMS. Adult audiences go by email (Resend).
Every broadcast is recorded in D1 with its delivery outcomes.

## Chat

A simplified Slack/Discord, per Geoff: a channel list, a room view with scrollback,
@mentions, emoji reactions. No threads, no DMs, no integrations.

Channels are coach-created and named, each typed to an audience:

- **Athlete channels**: a named subset of athletes (whole team or a level group) + all
  coaches.
- **Booster channels**: a named subset of boosters + coaches. Athletes and boosters
  never share a channel in v1.

Defaults created at launch: `#team`, one per level group, `#boosters`. Coaches can add
more (`#talkeetna-camp`, `#volunteers`) without a deploy.

Full history retained in D1. Mechanically: one Durable Object per channel holding live
connections, history persisted to D1. An actual room with an actual scrollback, which is
the "more effective than Remind" bar.

### SafeSport posture

CrewLAB carries this today as a vendor claim; building our own comms makes the posture
ECXC's to state and keep. The design is the defensible shape: no 1:1 adult-to-minor
messaging exists in the system, every channel includes coaches, adult roles and minors
share no unsupervised space, and history is retained. This posture gets written into the
site's own documentation as ECXC policy when pass 3 ships.

## Race rosters (Zone4 export)

Coach-only race entry management: create a race, check off which rostered athletes are
entered, assign each a class and seed, export the entry CSV Zone4 accepts.

The format is known from a real export (Geoff's `eastxc.csv`, 2026-07-30; not committed
because it holds real minors' names). Eight columns:

```
First Name, Last Name, Grade, Gender, School, Class, Group, Notes
```

`Grade` is the word (`freshman`…`senior`, may be blank), `School` is constant (`East`),
`Class` is the race class (`Girls A/B/C/Open`, `Boys A/B/C/Open`), `Group` is the seed
position within the class (1..n, blank for Open classes), `Notes` is free text
("Sat only"). No DOB, no license numbers.

Consequences for the schema: athlete profiles gain `grade` and `gender` (both already in
registration data); a race entry is per-athlete `class` + `seed` + `notes`. Class and
seed are per-race assignments, though the UI should prefill from the previous race.

## Not building

Deliberate cuts, not oversights: attendance tracking, race results and timing, analytics
beyond the rollups above, parent logins, payments, a native app, any 1:1 messaging,
coach workout assignment.

## Sequencing

Four passes, each with its own spec-level detail and implementation plan:

1. **Plans content type.** No dependencies, no auth, pure cairn. Ships value alone.
   The 10DLC registration starts during this pass so approval never blocks pass 2.
2. **Identity + training log.** The driver. Roster, contact-based auth, log entry,
   rollups, the PWA shell.
3. **Broadcast + chat.** Leans on pass 2's identity; cannot start before it.
4. **Race rosters + Zone4 export.** Leans on pass 2's roster; independent of pass 3 and
   can run either side of it.

## Open questions (plan-level, not blocking)

- SMS provider selection (Twilio vs. a cheaper A2P-capable alternative) and which legal
  entity registers the 10DLC campaign.
- Whether the level labels on plans, roster groups, and chat channels are one shared
  vocabulary (probably yes; decide when naming them). Race class is settled as NOT part
  of it (Geoff, 2026-07-30): class/seed are per-race fields distinct from training
  groups, so the roster carries both a training-group label and per-race class
  assignments.
- Session-cookie length and re-auth behavior on shared family devices.
- Whether ski-season Zone4 races use the same eight-column entry format as the running
  example, or different classes/columns (check against a ski-race export before pass 4
  freezes its schema).
