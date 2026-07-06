# ecxc.ski: Project Status

## Current state (2026-06-25)

The ECXC rebrand is complete (six passes; specs archived), and the engine is on cairn `^0.62.2`: the
single-mount admin, the iframed editor preview, the component-picker system, and end-to-end media (R2
upload, content-hashed delivery, public resolver). All five pages are rewritten through the coach
voice drafting system.

**cairn 0.59 → 0.62.2 bump, 2026-06-25.** Pin to `^0.62.2`. The whole span is additive, no consumer
action: editor copy-edit (spellcheck on by default; Tidy opt-in, left off), per-field `description`
hints, the `/admin/help` Help home, and a non-blocking address-collision advisory. The `supportContact`
seam stays unset (Geoff is the sole editor; the Help home shows its self-serve line). Manifest
regenerated with no drift. Gate green (check 543 0/0, 62 tests, build). Admin login email is
**geoff@907.life** (runtime D1 allowlist, not code). Live `cairn-doctor --probe` after deploy.

### Next starter prompt

> **Goal.** Harvest Geoff's first edits. After he edits any rewritten page, run the corpus harvest
> ("feed my edits back"): diff against the draft commit, promote the strongest passages to
> First-party gold, and turn any twice-made fix into a guide rule.
>
> **Also open:** confirm magic-link login on ecxc.ski (to geoff@907.life), the pre-publish checklist
> below, backlog #21/#30/#15, and the optional Tidy seam (`tidy.enabled` + `ANTHROPIC_API_KEY`).
>
> **Approach.** Harvest is a small pass, no plan needed. For new initiatives, invoke site-pass.

---

## History

- **cairn 0.57 → 0.62.2 (2026-06-15/25).** Media end to end (0.57 R2 upload + resolver, 0.59 bulk
  delete + orphan collection), then the additive 0.60–0.62.2 span. No content change.
- **cairn 0.50 → 0.56.2 (2026-06-12/15).** Single-mount admin (0.50), preview-knob fidelity (0.51),
  editor-takes-the-shell (0.54), component-picker system (0.56.2). Each deploy green; doctor
  `--probe` 11/0/1 (the one skip is the D1 check, no `account_id`).
- **Coach voice drafting system (2026-06-09).** Generative guide, briefs, corpus; full rewrite.
- **Rename 1–6 (2026-06-08/09).** Full ECXC rebrand: identity sweep, new `cairn-ecxc-auth` D1,
  domain cutover with 301, brand mark, repo rename to `ecxc-ski`.

## Passes

| Pass | Goal | Status |
|------|------|--------|
| 1–9, 0.10–0.37 | Scaffold through cairn upgrades | ✓ Done |
| Refresh 1–3 | Six-page content rebuild | ✓ Done |
| Rename 1–6 | Full ECXC rebrand through repo rename | ✓ Done |
| Drafting system | Coach voice system + site rewrite | ✓ Done |
| cairn 0.50–0.56.2 | Single-mount admin + component-picker system | ✓ Done |
| cairn 0.57–0.62.2 | Media end to end + additive editor/help bumps | ✓ Done |

### Pre-publish checklist (gate before announcing)

- Magic-link login confirmed on ecxc.ski, then old `cairn-ecnordic-auth` D1 decommission.
- Attorney review of the waiver.
- CrewLAB confirmations: join link and signing flow (#22), collection model (#21, live `[ASK]`).
- Launch-time redirects: `/resources` and `/waiver` to CrewLAB (#18), `/home` to `/` (#17).
- Real photos in place of the placeholders.

**Deploy:** Live at **https://ecxc.ski**. Push to `main` auto-deploys.
