# Brief: Training page rewrite (registration pass, 2026-07-13)

Rewrite of `src/content/pages/training.md`. The camp section moves to the new `/talkeetna`
page; registration and the waiver move from CrewLAB to the on-page form (rendered by the
route below the content, anchor `#register`). CrewLAB remains the team app for the weekly
plan and day-of logistics. Almost all prose on the current page is shipped, Geoff-approved
first-party text: reuse it verbatim where it still fits; only the registration mechanics and
the camp handoff change.

## Verifiable facts

Program (all from the shipped page, first-party):
- Group practice Mon/Wed/Fri mornings, June 1 to August 19, 2026. No practice camp week
  (July 21 to 24).
- Practice starts 10:30; group leaves the lot at 10:30. Mon 10:30-12:15 strength/core/spenst
  at East High. Wed 10:30-12:15 hill intervals and bounding. Fri 10:30-12:30 long OD run in
  the mountains.
- Tue/Thu/weekends independent; plan posted in CrewLAB.
- Monday always East High. Wed/Fri rotate: Hillside (Hilltop lot), Kincaid, Bartlett,
  Chugach front-range trailheads. Spot can change the night before; check CrewLAB.
- Carpool: leaves East High 10:00 on trailhead days, returns to East. In the lot by 10:00 =
  ride.
- Helmets required for every roller-ski and mountain-bike session, no exceptions.
- Three training groups: Foundation, Devos, Comp (Besh Cup glossary aside exists).
- Who: entering 9th-12th grade, plus college grads home for summer. No junior high.
- No skiing experience needed; summer is dryland.
- Bring: water, snacks, trail shoes, helmet on wheel days, layers. Loaner roller skis/poles
  available.
- Free; donations optional and need-blind.
- Camp: July 21-24, lake near Talkeetna, four days three nights. Full details now at
  /talkeetna.

New mechanics (this pass):
- Registration and the waiver are one form at the bottom of this page (`#register`). Parent
  or guardian and athlete both sign (typed names). Athletes 18+ sign for themselves.
- The signed record is emailed to the family as a copy.
- The waiver must be on file before the first practice.
- Camp registers separately on the /talkeetna page, even for athletes doing the summer.
- CrewLAB is no longer where you sign up or sign the waiver. It stays the team app: weekly
  plan, meeting-spot updates, check-ins. The CrewLAB page covers joining it.

## Audience questions

- Athlete, night before day one: where do I go, when, what do I bring, will I be slowest?
- Parent: what does it cost, who supervises, what am I signing, how do I register my kid?
- Both: what happened to CrewLAB sign-up? (Returning families knew the old flow.)
- Parent of a senior who just turned 18: does my signature still matter?

## The one next step

Register (and sign the waiver) in the form at the bottom of the page.

## Container plan

Same as the shipped page minus the camp section: lede, `programs` pair (summer tile anchors
down-page; camp tile now links to /talkeetna), `week` + `day` tiles, `aside` glossary x2,
`alert` (carpool, structural) + `alert` (helmets, caution), `spectrum`/`zone` x3, checklist,
`cta` (label "Register for summer training", url "#register"), FAQ. Registration lead-in is
a short passage before the CTA. FAQ gains one answer about the new sign-up flow; drops
nothing else.
