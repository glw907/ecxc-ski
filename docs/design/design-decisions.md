# Design decisions log

Settled design questions with their reasoning. Later passes do not re-litigate an entry
unless Geoff reopens it or the code it graded has changed. (Method: the `design-refinement`
skill's persistent artifacts.)

## Registration forms refinement arc (2026-07-13)

- **Field layout: single-column flow, 12-column lattice for related pairs.** The published
  form-UX consensus (Baymard, NN/g, GOV.UK) is single-column, with logically-related short
  fields as the one sanctioned row-share. Pairings: city/state/ZIP, home/cell phone,
  policy/group number, physician name/phone, the two CrewLAB contacts, emergency
  phone/email, the two signature blocks. A short field alone on a row is width-matched, not
  stretched. Everything collapses under 40rem.
- **Group chrome: quiet cards.** Each fieldset carries the submit-panel chrome (base-100,
  card border, radius-box, cairn shadow) with the eyebrow legend on the border. A nested
  group (Carpool) stays flat with a sentence-case subordinate legend; card-in-card reads as
  double chrome.
- **Row alignment: bottom-justified fields.** A wrapped label must not stagger its
  neighbor's input; slack collects above the label. `[hidden]` is restated on `.field`
  because an author display beats the UA hidden rule.
- **Waiver: one bordered document, no accordion.** Read-or-print-in-place stands (Geoff
  declined the accordion fork). Legal text sets one step down at snug leading with its own
  flow rhythm (the wrapper divorces it from prose.css's direct-child owl selector, so it
  carries its own: blocks xs, list items 2xs, list containers sized so markers and em
  indents scale). Section titles weight 700; separations l/l.
- **Plain-terms summaries: alert-note tier, caption label.** The summary boxes use the
  site's soft-wash readability-aid tier (first live alert-note instances). The repeated
  label is a display-face muted caption, deliberately NOT the small-caps eyebrow: it is a
  full sentence, and caps-with-tracking at sentence length slows reading (both review
  lenses flagged it independently).
- **Agree rows: washed chips.** The one action per waiver section sits on a base-200
  bordered chip so it cannot be skimmed past.
- **In-page registration CTAs: plain links.** A button that only scrolls over-promises and
  spends the act-color salience the real submit button needs; the jump affordance survives
  as a body link with the same words. Framed CTA panels remain where buttons truly navigate.
- **Field labels: display face 600 at calc(step--1 * 0.92).** Labels read as controls, not
  prose; the proportional calc rides the fluid scale instead of pinning a px value.
- **Required marking: derived, not authored.** Asterisks generate from the `required`
  attribute via `:has()`, so they cannot drift from what the schema enforces (the
  conditional carpool-seats mark follows its live required state); one form-top note
  explains the mark. Optional fields keep their "(optional)" wording.
- **Error summary: linked entries.** Summary errors anchor to their fields (GOV.UK
  pattern). Native `required` validation intercepts most empty-field submits client-side
  (the review's refuter proved this), so the links chiefly serve the server-only
  cross-field errors (CrewLAB either-contact, second-parent pair) and are kept for that.
- **Phones and emails regularize in the schema.** Canonical `XXX-XXX-XXXX` (leading 1
  accepted and dropped), emails lowercased after trim; the transforms live in valibot so
  the roster sheet and record emails receive regular values with no second pipeline.
- **Focus rings on form controls: fireweed.** `outline-color: var(--color-primary)`
  aligns controls with prose.css's link ring; pink = act includes focus.
- **Placeholders: muted ink, opacity 1, site-wide.** DaisyUI's default (base-content at
  .5 opacity) composites to 3.65:1, under AA; the muted token measures 5.35:1 on the same
  ground. Opacity must be restated because DaisyUI dims via opacity.
- **Turnstile at tiny widths: contained scroll.** The widget is a fixed 300px iframe; under
  ~350px it scrolls inside the submit card. `.site-main` carries `width: 100%` so a fixed
  descendant can never stretch the auto-sized flex item and scroll the page (the arc's
  root-cause fix for a pre-existing 9px overflow at 390).
- **Fonts: complete latin subsets.** The rebuild-era Alegreya Sans woff2 subsets were
  missing every capital except A (per-glyph fallback made bold capitals inconsistent,
  surfaced by the waiver's bold run-ins). Replaced with full latin subsets; when
  self-hosting subsets, verify cmap coverage (fontTools) before shipping.
