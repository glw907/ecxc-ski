# CrewLAB onboarding: how it actually works

Research record for the CrewLAB invite integration (2026-07-13), from CrewLAB primary sources
only, fetched and verified the same day. Claims CrewLAB does not document publicly are marked
so, rather than guessed at. This doc is the reference for operating the invite loop, and the
evidence that the site's flow follows CrewLAB's documented, intended usage.

## Joining a team

Joining is link- or code-based, with no approval queue. Whoever holds a valid link or code is
in the team space immediately; removal after the fact is the only membership control
("Only Coaches and Captains can remove members").

- **Invite link** (the primary mechanism): "If you've been invited to join an existing team,
  tap the invite link first. It will walk you through account creation and automatically
  connect you to the right group." — https://crewlab.io/guide/quickstart-guide/
- **Team Code** (fallback): Home → team name → "Add a Team" → "Join a Team" → enter code. "Any
  Team Member can share it with you." A bare code auto-joins the person as an **Athlete**, with
  no role control. — https://crewlab.io/guide/your-account-and-teams/
- **QR code**: a display form of the invite link.

## The coach-side invite tooling (what Geoff operates)

From the sidebar, **Invite Teammates** lets a coach pick a role from an "Invite as" menu
(**Coach, Captain, Athlete, Supporter, Parent**), producing a **role-tagged link**. The coach
then "Copy Link"s it into his own text message or email, uses the Share sheet, or shows the QR
code. — https://crewlab.io/guide/quickstart-guide/, https://crewlab.io/guide/roster-and-squads/

Three facts shape the site flow:

1. **There is no targeted email invite.** No documented way exists to type a person's address
   into CrewLAB and have it invite them; every path is a link the coach delivers himself. The
   "vetted" flow is therefore: review the request on our side, then send the role-tagged link
   to the verified address, one person at a time.
2. **Texting the link is normal, not a workaround.** The guides name text and email equally,
   and CrewLAB's own comms use "SMS, emails, and push notifications." This is why the
   registration form collects athlete email *or* cell.
3. **A role-tagged link is a shared credential, not a ticket.** Anyone forwarded the link joins
   with that role. Rotation, revocation, and expiration are **not documented anywhere public**;
   whether the old public link (`crewlab.app.link/5g7vhhYEn3b`) can be invalidated is a
   question for CrewLAB support. Until answered, that link remains live for anyone holding it.

## Roles

Five roles, assigned by whichever link admits the person (editable by a coach afterward):
**Coach** (full oversight), **Captain** (athlete + limited roster/calendar management),
**Athlete** (check-ins, training log, communications, personal analytics), **Supporter**
(view-only: limited calendar, restricted roster; "for fans, alumni, and administrators"),
**Parent** (Supporter plus visibility into their child's activity and communication, including
"automatic view-only access to their child's direct messages for SafeSport compliance").
— https://crewlab.io/guide/user-roles/

## Parent–athlete linking (the post-join step our copy must set up)

Joining with a Parent link does **not** link the parent to their child. The parent goes to
their profile → "Connected Athletes" → "Find Athlete" and sends a connection invitation; the
athlete confirms it under their own "Parents" dropdown. What the search keys on (name,
username, email) is not documented. The parent can alternatively send the athlete a join
invitation from that screen if the athlete isn't in the app yet.
— https://crewlab.io/guide/user-roles/

## What CrewLAB collects at signup (what the site must NOT re-collect)

Account creation collects **name, email, phone number, date of birth, gender, username,
password**, plus a profile photo prompt. — https://crewlab.io/resources/privacy-policy/
(effective 2025-09-13), https://crewlab.io/guide/quickstart-guide/

The site collects only what the coach needs to vet and deliver: registration already holds the
family record, and the one genuinely new datum is where the athlete's invite should go.

## Age handling

"CrewLAB's Services are not intended for children under 13 years of age"; discovered under-13
accounts are deleted and terminated (COPPA). No parental-consent mechanism for ages 13–17 is
documented beyond a general statement that collection "may be limited" for under-18s.
— https://crewlab.io/resources/privacy-policy/

Not a form concern for ECXC: the program serves 9th–12th grade plus college returnees, so a
sub-13 athlete is structurally impossible, and registration holds the real DOB.

## SafeSport-aligned communication controls (context for the parents' copy)

CrewLAB's communication structure "was designed in alignment with SafeSport guidelines,
preventing 1:1 Coach-to-minor-Athlete messaging"; it is MAAPP-compliant ("any direct message
with a minor athlete automatically includes a parent"), with "no unmonitored spaces" and no
private athlete-to-athlete messaging.
— https://crewlab.io/blog/crewlab-partners-with-weridetogether-and-usa-swimming-to-advance-athlete-safety-in-coaching-software/
(2026-04-13)

These controls govern behavior **inside** the team space; nothing ties them to the join
mechanism. Who gets in is entirely a function of who holds a link, which is the gap the site's
vetted flow closes.

## CrewLAB's own recommended onboarding, and why we deliberately diverge

CrewLAB's Get Started flow is explicitly broadcast-a-link: "Share your team invite… Watch your
team roster magically fill up," pitched as sub-2-minute low friction.
— https://crewlab.io/get-started/, https://crewlab.io/faqs/getting-started/

ECXC uses the same primitives (role-tagged links, the coach's own email/text) but aims them one
person at a time after vetting. Everything the site does composes documented CrewLAB behavior;
nothing relies on an undocumented feature. The divergence is only in *distribution* of the
link, which CrewLAB leaves entirely to the coach.

## Post-join coach tasks (nothing the forms need to collect)

Squad assignment (one squad per member, coach-assigned, movable anytime) and position happen
inside the app after joining; roles are editable "during the invitation process or afterward."
No invite-time datum beyond the role tag affects any of it.
— https://crewlab.io/guide/roster-and-squads/

## Explicitly not documented by CrewLAB (verified absences, not oversights)

- Link/code rotation, revocation, or expiration.
- Any coach-approval queue for joins.
- A targeted "invite this email address" feature.
- What "Find Athlete" searches by.
- Per-role signup differences (whether a Supporter skips DOB, etc.).
- Parental-consent mechanics for ages 13–17.
