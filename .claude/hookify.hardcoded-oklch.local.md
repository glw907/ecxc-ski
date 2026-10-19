---
name: hardcoded-oklch
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.(svelte|css)$
  - field: new_text
    operator: regex_match
    pattern: (?<!--)oklch\([^)]+\)
---

**Hardcoded oklch() value detected. Use a design token instead.**

All colors should reference CSS custom properties defined in the `@theme` block in `src/app.css`.

**Allowed exceptions:**
- `oklch()` inside `@theme { }` -- token definitions
- `oklch()` inside `[data-theme="..."] { }` -- theme overrides
- `oklch()` with alpha for one-off overlay/shadow effects

**Use tokens like:**
- `var(--color-heading)` for titles and strong text
- `var(--color-body)` for body prose
- `var(--color-muted)` for secondary/quiet text
- `var(--color-border)` for borders and rules
- `var(--color-surface)` for code/input backgrounds

If you need a new color role, add a token to the `@theme` block in `src/app.css` and its dim override in `[data-theme="dim"]`.

Full token reference: `docs/specs/2026-04-07-css-token-system-design.md`
