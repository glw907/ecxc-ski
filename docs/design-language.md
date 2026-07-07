# ECXC: Design Language

Reference for ECXC's color, type, and directive kit, as rebuilt 2026-07-05/06 on the
`@glw907/cairn-cms` Waymark starter template. The identity is reached through Waymark's token and
component seams (`ecxc-theme.css`, `ecxc-components.css`, `src/theme/markdown/`), not a rebuilt
render pipeline; see `docs/architecture.md` for the chassis/theme split this rests on.

---

## Color system

Three brand hues with a value hierarchy, not a hue pair: fireweed is naturally lighter than
spruce, so black spruce carries the structural weight and fireweed is the flash on top of it.
Defined in `src/theme/ecxc-theme.css` as `oklch()` overrides of the chassis's `cairn`/`cairn-dark`
DaisyUI theme roles (the theme *names* stay `cairn`/`cairn-dark`, unchanged, so the inherited
light/dark toggle needs no edit; only the values under those names are ecxc's own).

| Role | Hue | Meaning |
|---|---|---|
| `primary` | fireweed, ~357° | The program and the one action: links, CTA buttons, active nav, the focus ring |
| `secondary` | black spruce, ~175°, near-black | People, community, wayfinding |
| `accent` | mid spruce, ~168° | Highlights and interactive accents (e.g. the section-header glyph) |
| `neutral` | spruce-slate, ~175° | Structural dark surfaces |
| `warning` | amber, ~72° | Caution |
| `error` | vermilion, ~30° | Error / destructive |
| `success` | pine, ~147° | Free / confirmed / "go", hue-separated from spruce |
| `info` | azure, ~245° | Neutral information |

Every status hue carries a matching on-surface ink token (`--cairn-<status>-ink`), a darker (light
mode) or lighter (dark mode) cut of the same hue, legible as small text where the fill itself
would be too saturated (alert titles, code-highlight tokens).

`oklch()` only, mixed in **oklab** when two hues blend (a cylindrical `oklch` mix walks the hue arc
and lands somewhere unintended). Both light and dark values live in `ecxc-theme.css`; dark applies
two ways, a `prefers-color-scheme: dark` media query guarded by `:not([data-theme])` for the system
default, and an unconditional `[data-theme='cairn-dark']` rule for the toggle's explicit choice.

---

## Typography

Three families, each by role, set once as unlayered `--font-*` custom properties so they beat the
chassis's own `@theme`-declared defaults regardless of source order:

- **Nunito** (display: headings, labels), self-hosted via Fontsource
- **Alegreya Sans** (body: prose), self-hosted `woff2` under `static/fonts/`, carried forward from
  the pre-rebuild identity, including a real italic face (400/italic) so `<em>` and blockquotes get
  the designed slant, never a browser-synthesized one
- **iA Writer Mono S** (code), self-hosted `woff2`

Reference via `--font-display`/`--font-body`/`--font-mono`; never hardcode a family name in a
component. Type scale, leading, and tracking otherwise follow the chassis's own Utopia-derived
`--text-step-*` ladder (`src/chassis/tokens.css`); ecxc does not run its own parallel scale.

---

## The re-expression pass (2026-07-06): six locked picks

Six design decisions Geoff locked as one coherent pass, layered onto the inherited Waymark chrome
in `ecxc-theme.css` (plain unlayered CSS beats the chassis's `@layer components` rules, so no
`!important` is needed against them; see that file's own header comment for the mechanism):

1. **A tighter masthead scale.** Every `.prose > h1` shrinks and tightens
   (`clamp(1.85rem, 1.65rem + 0.85vw, 2.3rem)`, line-height 1.1) so a realistic page title holds one
   line at 1440, rather than the chassis default's looser setting wrapping to two lines.
2. **Icon-led section headers on dated sections.** A `##` heading immediately followed by a
   paragraph holding only italic text (a date-and-cadence convention) gets one small accent-colored
   glyph before the heading via `:has()`, and the meta line promotes from a plain italic sentence to
   an uppercase, letter-spaced caption. No markup change needed; the pattern is detected
   structurally.
3. **Framed, neutral CTA panels.** `render/cta-panel.ts` is an after-render step (wired into
   `cairn.config.ts`'s render pipeline, the same seam `table-scroll.ts` uses) that groups a heading,
   its lead-in copy, and the trailing `cta` directive's button into one `.cta-panel` frame. Color
   stays on the button alone; the frame itself is a neutral resting card.
4. **A three-tier escalating alert chrome**, replacing a single blue-tinted default regardless of
   role: `structural` (no icon, no tint, a plain border only, for organizational grouping with no
   urgency), `note` (a soft info-tinted wash, no border, for a fact worth flagging), `caution` (the
   heaviest: a full border, a thicker left rule, and a small-caps title, so the hierarchy still
   reads without color vision).
5. **Grouped-card checklists keep the surrounding prose's type scale.** A checklist item no longer
   steps up to a separate, larger scale than the paragraph around it.
6. **Selective de-carding of the `passage` directive.** Flat by default (a plain headed prose
   block, no chrome, no icon): a passage reads as a continuation of the article unless the content
   is genuinely object-like (`variant="card"`, the club's resting-card recipe) or advisory
   (`variant="emphasis"`, a lighter left-rule accent). Both opt-in variants keep the icon; the flat
   default drops it.

## The hover system (2026-07-06)

One shared recipe for every clickable surface, chrome and prose alike, keyed off a single token
(`--cairn-hover-transition: 150ms ease`) so a future tuning pass touches one rule: body-link
underline reveal, nav-ink shift, tag-pill border/ink deepening, CTA brightness-plus-1px-rise, a
linked-card shadow-plus-1px-rise, and footer-icon shift. Motion (`translateY`, an arrow nudge) sits
behind each rule's own `prefers-reduced-motion` guard; a plain color, border, or shadow fade carries
no motion and keeps running under that preference.

---

## The directive kit

ecxc's markdown directive vocabulary, declared in `src/theme/markdown/components.ts`
(`defineRegistry`/`defineComponent`, the cairn-cms v2 component grammar) and rendered by
`createRenderer(ecxcRegistry)`. Four directives reuse Waymark's starter shapes (same class names,
same DOM structure, zero new CSS beyond the re-expression pass above); the rest are ecxc's own.

| Directive | Source | Use |
|---|---|---|
| `alert` | Waymark, widened with a `structural` role | Flag a caution (or a neutral grouping) in the flow of a page |
| `cta` | Waymark, widened for an internal link + new-tab open | Send the reader to one destination |
| `faq` | Waymark shape, answer shown inline (no `<details>` disclosure) | One question and its answer |
| `callout` | Waymark, unchanged | A highlighted note with optional points |
| `passage` | ecxc-declared | A titled prose block, flat by default (see pick 6 above) |
| `aside` | ecxc-declared | A quiet footnote gloss, linked from a `[†](#id)` in running text |
| `checklist` | ecxc-declared | A gear list; `####` sub-headings group items under a category |
| `programs` / `program` | ecxc-declared, training domain | A row of clickable program-offering cards |
| `week` / `day` | ecxc-declared, training domain | A seven-day schedule rail |
| `spectrum` / `zone` | ecxc-declared, training domain | A pace continuum with labeled zones |

Two widenings from the pure Waymark shape, both real content needs: `cta.url` is `fields.text` with
a link-shape pattern (`^(#|/|cairn:|https?://)`) rather than `fields.url`, since the latter's
validator accepts only an absolute `http(s)` URL and real content needs an internal `/crewlab` link
and a `cairn:` reference from the same attribute; `cta` also carries a `newTab` boolean for the one
external link (the CrewLAB app deep link) that must open in a new tab.

---

## Icon system (Phosphor)

Icons come from [Phosphor](https://phosphoricons.com) (regular weight), sourced as raw SVG path
data in `src/theme/markdown/icons.ts`'s `ICON_PATHS` map, carried over verbatim from the
pre-rebuild site so the rendered glyphs are unchanged. `src/chassis/render.ts`'s
`makeIconRenderer(ICON_PATHS)` wires the set into the engine's `iconSpan`/`glyph` helpers; a
directive's `build()` calls the returned function rather than importing `iconSpan`/`glyph`
directly, so swapping the icon set never touches a component's `build()`.

To add an icon: copy the path data from
`node_modules/@phosphor-icons/core/assets/regular/<name>.svg` into `ICON_PATHS`, then reference it
by name from the directive that needs it (an `icon` attribute, or a hardcoded call site like the
checklist group's `backpack` glyph).

---

## Verifying a design change

Before claiming a visual change done: `npx svelte-check` clean, `npm run build`, then a headless
screenshot of the **built** page (the adapter output, not the dev server) at desktop and mobile
widths, in both light and dark mode, checking that color stays confined to chrome (icon, border,
button) and never bleeds into running text. The family-wide responsive standard and the
fresh-context visual-verifier gate are described in `../cairn-cms/CLAUDE.md`; this site's own pass
log and verification notes for each design change live in `docs/STATUS.md`.
