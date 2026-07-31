# ecxc.ski: Project Status

## Current state (2026-07-13)

On `@glw907/cairn-cms ^0.84.1` (upgraded from 0.81.0 on 2026-07-13, full gate and admin-guard
smoke green), backlog triaged the same day from 16 open items to 7 (see History).

Rebuilt from scratch on the Waymark starter template and deployed to production
(`https://ecxc.ski`, the pre-rebuild 0.62.2-era app retired). Design waves (CTA-label
contrast fix, site-wide hover vocabulary, a six-pick design pass) shipped and deployed the
same day, gated green and confirmed live at 1440.

> **Architecture note.** cairn-cms is an embedded magic-link CMS library published as
> `@glw907/cairn-cms`; this site is a standalone repo consuming it via its own adapter. The
> engine's rolling status is `../cairn-cms/docs/STATUS.md`.

### Next up

**Team platform initiative (2026-07-30, requirements ratified).** The CrewLAB
replacement grew into a standalone multi-team training platform on a neutral domain
(its own repo/Worker; ECXC tenant 1 by end of October, East High tenant 2 in Nov–Dec).
Authority: `docs/superpowers/specs/2026-07-30-team-platform-requirements.md`; the
immediate next action is executing
`docs/superpowers/plans/2026-07-30-team-platform-pass-1.md` (foundation: repo, cairn
mount, schema, member auth, roster) in a fresh Opus 5 session, starting with the plan's
T0 question batch to Geoff. The same-day design draft in specs/ is superseded; the
requirements doc wins.

**Resend cutover COMPLETE (2026-07-14, same day as the outage below).** Geoff freed the Resend
domain slot (aksailingclub.org off the account) and added ecxc.ski; auto-configure planted the
DNS, the domain verified, `sync.sh --worker ecxc` put `RESEND_API_KEY` (routing + registry
updated in dotfiles), and all outbound ecxc mail now rides Resend. Live-proven: camp e2e ran
twice against production, `RESULT: SUCCESS` + `SHEET VERIFY: PASS` both times, zero Worker send
errors in the window (the CF path was still quota-dead, so success itself proves the transport),
test rows deleted, Turnstile secret rotated back. The 2026-07-14 registrant's missed parent copy
was resent through Resend and confirmed `delivered`. The residue closed the same day: the
cleanup pass stripped the CF fallback and both `[[send_email]]` bindings (#37 done, #35 died
with the binding, `mimetext` and the `cloudflare:email` vite externals dropped), and both forms
plus contact now reset the Turnstile widget on a failed submission so a retry mints a fresh
token (#38 done; the spent-token loop from the outage cannot recur).

What else remains is Geoff's own, from the pre-publish checklist below
(#22 closed 2026-07-13: Geoff revoked the old public join link the day the invite-only flow
shipped):

- Magic-link login and the full authed `/admin` checklist on the deployed Worker, then the old
  `cairn-ecnordic-auth` D1 decommission. **BLOCKED by cairn engine bug #36** (2026-07-13,
  live-diagnosed): the deployed confirm flow succeeds server-side, but `GET /admin`'s
  immediate 307 abandons the shell's streamed GitHub token mint and the engine's module-global
  token cache then serves that dead promise isolate-wide, hanging `/admin/posts`. The
  rebuild-era "content-list hangs in this sandbox = environment limitation" note was this same
  bug, misattributed. Handoff: `../cairn-cms/docs/internal/2026-07-13-admin-token-cache-poisoning.md`.
  Unblocks by upgrading to the fixed cairn release, then running the full authed checklist.
- Attorney review of the waiver. Delete the two CrewLAB-pass test emails (delivery itself was
  confirmed live 2026-07-13, closing the older carried check).

Small candidates for a future pass: a site-wide varied-phrasing sweep of the repeated
contact-us formula (content-review finding, 2026-07-13) and the `roster` directive once real
photos exist (#19). (The `alert-note` gap closed 2026-07-13: the waiver's eight plain-terms
summaries now ride that tier.)

---

## History

- **Mail-quota outage + dual-transport email layer (2026-07-14)** — Cloudflare Email Service's
  daily sending quota exhausted and blocked the must-succeed registration email; a transitional
  dual-transport layer shipped, later fully cut over to Resend. Full text: docs/status-archive.md.
- **Registration-forms design refinement + font fix + coach copy (2026-07-13)** — A live
  design arc on the /training and /talkeetna forms plus a site-wide font-coverage fix and
  age-gated parent/guardian section. Full text: docs/status-archive.md.
- **CrewLAB invite integration + nav grouping (2026-07-13)** — Invite-only CrewLAB onboarding
  routed through the existing registration forms, plus a nav restructure. Full text:
  docs/status-archive.md.
- **cairn 0.84.1 upgrade + backlog triage (2026-07-13)** — Upgraded `@glw907/cairn-cms`
  ^0.81.0 → ^0.84.1 and triaged the backlog from 16 open items to 7. Full text:
  docs/status-archive.md.
- **Registration forms + digital waiver (2026-07-13)** — Training and Talkeetna Camp
  registration forms sharing one code-owned digital waiver, backed by a Sheets + email
  pipeline. Full text: docs/status-archive.md.
- **Architecture/design-language rewrite (2026-07-06)** — Rewrote `docs/architecture.md` and
  `docs/design-language.md` from scratch against the post-rebuild chassis/theme reality. Full
  text: docs/status-archive.md.
- **Docs landing sweep (2026-07-06)** — Corrected stale pre-rebuild references in CLAUDE.md
  and docs following the Waymark rebuild. Full text: docs/status-archive.md.
- **CTA fix, hover system, and design pass (2026-07-06)** — Three deployed waves: a CTA-label
  contrast fix, a site-wide one-vocabulary hover system, and six locked design picks. Full
  text: docs/status-archive.md.
- **Chassis restructure (2026-07-05)** — Split `src/lib` into `src/chassis`/`src/theme`, plus
  three sanctioned fixes carried from the fidelity trial. Full text: docs/status-archive.md.
- **Rebuild from Waymark (2026-07-05)** — Full rebuild on the Waymark starter template and
  `@glw907/cairn-cms ^0.80.0`, deployed 2026-07-06. Full text: docs/status-archive.md.
- **cairn 0.59 → 0.62.2 (2026-06-25)** — Editor copy-edit, per-field description hints, the
  `/admin/help` Help home, a non-blocking address-collision advisory. Full text:
  docs/status-archive.md.
- **cairn 0.57 → 0.62.2 (2026-06-15/25)** — Media end to end: R2 upload + resolver, then bulk
  delete + orphan collection. Full text: docs/status-archive.md.
- **cairn 0.50 → 0.56.2 (2026-06-12/15)** — Single-mount admin, preview-knob fidelity,
  editor-takes-the-shell, component-picker system. Full text: docs/status-archive.md.
- **Coach voice drafting system (2026-06-09)** — Generative guide, briefs, corpus; full site
  rewrite. Full text: docs/status-archive.md.
- **Rename 1–6 (2026-06-08/09)** — Full ECXC rebrand: identity sweep, new `cairn-ecxc-auth` D1,
  domain cutover with 301, brand mark, repo rename to `ecxc-ski`. Full text:
  docs/status-archive.md.

## Passes

| Pass | Goal | Status |
|------|------|--------|
| 1–9, 0.10–0.37 | Scaffold through cairn upgrades | ✓ Done |
| Refresh 1–3 | Six-page content rebuild | ✓ Done |
| Rename 1–6 | Full ECXC rebrand through repo rename | ✓ Done |
| Drafting system | Coach voice system + site rewrite | ✓ Done |
| cairn 0.50–0.62.2 | Single-mount admin + component-picker system + media + editor/help | ✓ Done |
| Rebuild from Waymark | Fresh scaffold on cairn ^0.80.0, ecxc-theme.css, media library | ✓ Deployed 2026-07-06 |
| Chassis restructure | `src/lib` → `src/chassis`/`src/theme` + the spectrum bar/inline FAQ/archives-chips fixes | ✓ Deployed 2026-07-06 |
| CTA fix, hover system, design pass | CTA-label contrast fix, site-wide hover vocabulary, six locked design picks | ✓ Deployed 2026-07-06 |
| Docs landing sweep | `CLAUDE.md`/DX-findings/STATUS audited against the rebuild; stale pre-rebuild references corrected | ✓ Done 2026-07-06 |
| Registration forms + digital waiver | Training + Talkeetna forms, code-owned digital waiver, Sheets + email pipeline | ✓ Deployed 2026-07-13 |
| cairn 0.84.1 + backlog triage | Upgrade 0.81→0.84.1 gated + smoked; 16 backlog items → 7; favicon set, strict prerender, stale-waiver content sweep | ✓ Done 2026-07-13 |
| CrewLAB invite integration | Invite-only onboarding through the existing forms; five schema fields, four content pages, nav grouping; live e2e green | ✓ Deployed 2026-07-13 |
| Registration-forms refinement | Live design arc (field grid, cards, waiver document), phone/email normalization, coach copy, font fix, workflow review | ✓ Deployed 2026-07-13 |

### Pre-publish checklist (gate before announcing)

- Magic-link login confirmed on ecxc.ski (deployed https Worker), then old `cairn-ecnordic-auth` D1
  decommission.
- Attorney review of the waiver.
- CrewLAB confirmations: join link and signing flow (#22), collection model (#21, live `[ASK]`).
- Real photos in place of any remaining placeholders (the hero and hero migration landed in this
  rebuild; the profile photo uploaded but stays unplaced pending a confirmed identity, per task 4).

**Deploy:** Live at **https://ecxc.ski**, the rebuild plus the CTA fix, hover system, and design
pass, all on `main` as of 2026-07-06. The pre-publish checklist above is still open.
