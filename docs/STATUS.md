# ecxc.ski: Project Status

## Current state

Live at https://ecxc.ski, rebuilt on the Waymark starter template and deployed from `main`
(push to `main` runs GitHub Actions: build, pagefind, `wrangler deploy`, live in about 2
minutes). The site consumes `@glw907/cairn-cms ^0.95.0` from the npm registry; the engine's own
status is `../cairn-cms/docs/STATUS.md`. Outbound mail rides Resend. Registration forms for
training and Talkeetna camp share one code-owned digital waiver and write to a roster
spreadsheet. Pass history lives in git and PR bodies; older narrative is in
`docs/status-archive.md`.

## Next action

Upgrade to the cairn release that fixes engine bug #36, then run the full authed `/admin`
checklist on the deployed Worker. Until then, magic-link login on the deployed Worker stays
unconfirmed: the immediate 307 from `GET /admin` abandons the shell's streamed GitHub token
mint, and the engine's module-global token cache then serves that dead promise isolate-wide,
hanging `/admin/posts`. Handoff:
`../cairn-cms/docs/internal/2026-07-13-admin-token-cache-poisoning.md`. After the checklist
passes, decommission the old `cairn-ecnordic-auth` D1.

## Open decisions and owed items

- **Pre-publish checklist (gate before announcing).** The authed admin checklist above;
  attorney review of the waiver (and deleting the two CrewLAB-pass test emails); the CrewLAB
  collection model (#21, live `[ASK]`); real photos in place of remaining placeholders (the
  profile photo is uploaded but unplaced pending a confirmed identity).
- **Team platform initiative.** The CrewLAB replacement is live at https://xcathletes.org (repo
  `~/Projects/xcathletes-org`, private), and that repo's `docs/STATUS.md` is the canonical live
  state. This repo keeps the
  initiative's authority docs, and
  `docs/superpowers/specs/2026-07-30-team-platform-requirements.md` wins over everything.
  ecxc-ski itself still owes a hand-off link at `ecxc.ski/team` (links, never data) and
  retiring CrewLAB at the pass 5 cutover.
- **Small candidates.** A site-wide varied-phrasing sweep of the repeated contact-us formula,
  and the `roster` directive once real photos exist (#19).

## Standing facts

- The `ecxc` Worker needs six secrets re-put after any rename; the list and sync recipe are in
  `CLAUDE.md` ("Worker & Secrets").
- Registration submissions fail closed without `TURNSTILE_SECRET_KEY`, by design.
- Content edits change the committed manifest: run `npm run cairn:manifest` and commit
  `src/content/.cairn/index.json` with them.
- Pass process is the global `site-pass` skill; the backlog is `BACKLOG.md`, strategy
  `ROADMAP.md`.
