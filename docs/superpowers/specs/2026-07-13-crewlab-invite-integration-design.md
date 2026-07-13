# CrewLAB invite integration

**Date:** 2026-07-13
**Status:** Approved direction (fold into registration; no new forms)

## Problem

ecxc.ski publishes a public CrewLAB join deep link (`crewlab.app.link/5g7vhhYEn3b`) on
`/crewlab`. Anyone who finds the link joins the team space instantly, with removal as the only
recourse. Geoff wants a vetted flow: the site collects what he needs, and he personally sends
each person the right CrewLAB invite link.

## What the research established (primary sources, 2026-07-13)

The full research record, with a source URL per claim and the verified absences (what CrewLAB
does not document), is `docs/crewlab-onboarding-research.md`. It doubles as the operating
reference for the invite loop. The load-bearing facts:

- CrewLAB has **no targeted email-invite feature**. A coach generates a **role-tagged invite
  link** ("Invite as" Coach/Captain/Athlete/Supporter/Parent) and pastes it into his own email
  or text. Texting the link is a documented, normal channel. (crewlab.io/guide/quickstart-guide,
  /guide/roster-and-squads)
- Any link or Team Code admits the holder **instantly**; there is no approval queue. A bare Team
  Code auto-joins the person as Athlete. Link rotation/expiration is **not documented**; whether
  the old public link can be revoked is a question for CrewLAB support.
- CrewLAB signup itself collects name, email, phone, DOB, gender, username, password, photo
  (crewlab.io/resources/privacy-policy). The site must not re-collect any of it except a
  delivery address.
- Parent accounts link to athletes by a **two-sided in-app confirmation** (parent: Connected
  Athletes → Find Athlete; athlete confirms under Parents). Site copy should set that
  expectation. (crewlab.io/guide/user-roles)
- Under-13 accounts are blocked (COPPA). Not a form concern here: the program serves 9th–12th
  grade plus college returnees, so a sub-13 athlete is structurally impossible, and registration
  holds the real DOB.

## Design decisions (settled with Geoff)

0. **The seamlessness bar (Geoff, 2026-07-13): sign-up for all things is one obvious act per
   constituency.** A family registers once and everything flows from it (waiver, athlete
   invite, parent invites, both households). An older athlete (18+, college returnee) takes
   the same form's adult path and it must read clean for them: no parent-shaped friction, the
   parent-invite and second-parent fields presented as the family case, skippable without
   thought. A booster has one step: the contact form with a clear ask ("say how you're
   connected"), reached from a real CTA, not a buried mention. No page anywhere offers two
   competing sign-up paths, and every page that mentions signing up points at the same single
   entry point for that reader. This principle governs the copy and form-layout work; grade
   the flow against it.

1. **No new forms.** The site keeps exactly its three: contact, training registration, camp
   registration. Registration doubles as the CrewLAB request for athletes and parents;
   supporters and other non-registrants go through the contact form.
2. Registration is the vetting. A registered athlete has a waiver on file and full family info
   on the roster sheet; nothing needs re-collecting.
   The constituencies map onto the three forms with no additions:
   - **Athletes, including returning college athletes**: the registration forms. A college
     returnee registers through the existing adult-athlete path (the waiver applies to anyone
     at practice), so they need no special handling; whether a past summer's CrewLAB account
     still works is Geoff's call at invite time.
   - **Parents, including separate households**: the signing parent opts in on the
     registration form; a second parent/guardian gets the optional invite pair there too.
   - **Non-parent boosters, alumni, family friends**: the contact form, saying how they're
     connected; Geoff sends the Supporter link by hand.
3. **No auto-reply.** Geoff's personal invite email or text is the confirmation.
4. Geoff's operational loop: process a registration (or contact-form request), generate the
   matching role-tagged link in CrewLAB, send it to the collected address, and for parents
   expect the Connected Athletes confirmation to follow inside the app.

## Changes

### Registration forms (one edit; training and camp share the schema module)

Registration today collects no athlete contact at all (only the parent's). Add one fieldset,
worded around the CrewLAB invite:

- **Athlete email** and **athlete cell** — both individually optional, **at least one
  required** (valibot refinement). Label copy explains this is where the CrewLAB invite goes,
  and that either works (the link can be texted).
- **Parent invite opt-in** — one boolean, "send me a parent invite too." Parent email is
  already on the record; the checkbox tells Geoff which families want the Parent-role link
  without guessing.
- **Second parent/guardian invite** — an optional name + email pair for a parent in another
  household (or any second guardian) who should get their own Parent invite. Covers
  separate-parent families without sending one household through the contact form. Both fields
  blank is fine; a name without an email (or vice versa) is a field-level validation error.

Field names must be hyphen-free (the SvelteKit remote-form identifier-path constraint the
registration pass hit). The new fields ride the existing pipeline unchanged: five new columns
on the roster sheet row (athlete email, athlete cell, parent opt-in, second-parent name,
second-parent email), a new labeled group in the record email, same Turnstile and validation
posture. No new module, route, secret, or sheet tab.

The fieldset must read as one coherent moment on the form, not bolted-on: a short "Your CrewLAB
invite" group with one-sentence lead-in copy, placed with the contact fields rather than after
the waiver, so the family answers it while contact details are already in hand.

### Content (four files; web-content register, content-review gated)

- **crewlab.md** — remove the public-link CTA and the "tap the invite below" getting-started
  copy. New getting-started: register and the invite comes to you; parents get their own invite
  when they check the box, and should expect the in-app Connected Athletes confirmation step;
  not registering (boosters, alumni, family friends) → use the contact form and say how you're
  connected. CTA points at registration or contact, not an external link.
- **home.md** — the "Sign up on CrewLAB" action line becomes a register-for-training line.
- **about.md** — "Then join CrewLAB…" becomes invite-sent-on-registration language.
- **training.md** — "Read the CrewLAB page to join" becomes invite language; the registration
  section may note the invite rides sign-up.

No content page anywhere retains a self-service join path.

### Out of scope

- A structured supporter form (contact form suffices at program scale; revisit on volume).
- Revoking the old public link: Geoff asks CrewLAB support (or checks Invite Teammates for a
  regenerate option). Until then the old link remains a live credential for anyone holding it.
- Backlog #21 (payments through CrewLAB) is untouched.
- Any change to the waiver, the Sheets writer's structure, or the email pipeline beyond the new
  fields.

## Acceptance criteria

- Full gate green (`npm run check` 0/0, `npm test` exit 0, `npm run build`); manifest
  regenerated for content edits.
- Both registration forms submit end to end (JS and no-JS paths) with the new fields; a
  submission with neither athlete email nor cell is rejected with a field-level message, as is
  a half-filled second-parent pair; the roster sheet row and the record email both carry the
  new values; live e2e per `docs/registration-e2e.md` extended to cover them.
- `grep -ri crewlab.app.link src/` finds nothing.
- Edited pages pass an independent content-review gate; snapshots N/A (none exist); render
  reads at desktop and mobile widths for the changed form section and crewlab page.
- BACKLOG #22 re-scoped (join-link half superseded by this change; donations half stays).
