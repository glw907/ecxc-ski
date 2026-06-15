# ecxc.ski: Project Status

## Current state (2026-06-15)

The ECXC rebrand is complete (six passes; specs archived), and the engine is on cairn `^0.56.2` with
the single-mount admin, the iframed editor preview, the editor-takes-the-shell admin, and the 0.56.2
component-picker system. All five pages are rewritten through the coach voice drafting system.

**cairn 0.56.2 bump + component optimization, 2026-06-15.** Pin to `^0.56.2`, and every directive
component in `src/lib/markdown/components.ts` now declares the new picker fields: an `icon` glyph and
a `group` for the insert catalog, a structured `preview` that opts the guided form into the two-pane
live preview, `hidden` on the four nested-only components (`panel/program/day/zone`), and an `href`
validation `pattern`. Additive, no content change. Gate green (check 509 0/0, 63 tests, build).
Manual editor check pending: open `/admin`, insert and round-trip-edit a component, confirm the live
preview renders. Live `cairn-doctor --probe` after deploy.

### Next starter prompt

> **Goal.** Harvest Geoff's first edits. After he edits any rewritten page, run the corpus harvest
> ("feed my edits back"): diff against the draft commit, promote the strongest passages to
> First-party gold, and turn any twice-made fix into a guide rule.
>
> **Also open:** the pre-publish checklist below, and backlog #21 (crewlab payment `[ASK]` ships
> visibly), #30 favicon fallback, #15 heading skip.
>
> **Approach.** Harvest is a small pass, no plan needed. For new initiatives, invoke site-pass.

---

## History

- **cairn 0.50 → 0.56.2 (2026-06-12/15).** Single-mount admin retrofit (0.50, live-proven:
  `sent`/`throttled`, doctor 9/9), preview-knob fidelity (0.51), editor-takes-the-shell (0.54),
  component-picker system (0.56.2). Each deploy green; doctor `--probe` 11/0/1 (the one skip is the
  D1 check, no `account_id`).
- **Coach voice drafting system (2026-06-09).** Generative guide, briefs, corpus; full rewrite as
  the acceptance test.
- **Rename 1–6 (2026-06-08/09).** Full ECXC rebrand: identity sweep, new `cairn-ecxc-auth` D1,
  domain cutover with 301, brand mark, repo rename to `ecxc-ski`.
- **cairn 0.33–0.37 (2026-06-07/09).** Admin isolated, HTTPS forced, CSRF owned by cairn, logging.

## Passes

| Pass | Goal | Status |
|------|------|--------|
| 1–9, 0.10–0.37 | Scaffold through cairn upgrades | ✓ Done |
| Refresh 1–3 | Six-page content rebuild | ✓ Done |
| Rename 1–6 | Full ECXC rebrand through repo rename | ✓ Done |
| Drafting system | Coach voice system + site rewrite | ✓ Done |
| cairn 0.50–0.56.2 | Single-mount admin + component-picker system | ✓ Done |

### Pre-publish checklist (gate before announcing)

- Magic-link login confirmed on ecxc.ski, then old `cairn-ecnordic-auth` D1 decommission.
- Attorney review of the waiver.
- CrewLAB confirmations: join link and signing flow (#22), collection model (#21, live `[ASK]`).
- Launch-time redirects: `/resources` and `/waiver` to CrewLAB (#18), `/home` to `/` (#17).
- Real photos in place of the placeholders.

**Deploy:** Live at **https://ecxc.ski**. Push to `main` auto-deploys.
