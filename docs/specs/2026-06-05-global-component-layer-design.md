# Global component layer: consolidating the EC Nordic design system

Date: 2026-06-05
Status: Approved design, ready for an implementation plan

## Problem

The EC Nordic theme is meant to be one design language shared across the site. Most of
it already works that way. The design tokens, the typography, and the bulk of the
`.ec-*` component styles live in the global stylesheet (`src/app.css`) and apply on
every page.

A chunk does not. A set of reusable component rules lives inside the page route's scoped
`<style>` block (`src/routes/[...path]/+page.svelte`), locked behind page selectors like
`[data-page="about"]` or `:is([data-page="about"], [data-page="training"],
[data-page="crewlab"])`. A component picks up that styling only on a page named in the
selector. Any page outside the list renders the component bare.

The Volunteers page pays for this. It uses `split` and `panel` for its three coach bios
and a titled `grid` for "Help out", but the `split`/`panel` layout and the `.ec-head`
row are scoped to the other pages. So Volunteers renders them unstyled: plain stacked
blocks with no side-by-side panels, and a grid heading with no icon row. Volunteers also
sits outside the entrance-cascade selector, so its modules get no entrance animation and
no top margin.

This is why the site-refresh component polish does not spread on its own. The next new
page hits the same wall.

## Goal

Finish the architecture so that `app.css` owns every reusable `.ec-*` component, global
and unscoped, and the route's `<style>` keeps only the page-level rules, the page shell
and the entrance cascade. Every component then renders the same wherever it appears,
Volunteers is fixed, and any future page inherits the whole language without per-page CSS.

A second goal is to adopt the gloss/footnote pattern on About and Volunteers for the
named terms that warrant a definition.

## Non-goals

- No section bands on the other pages. About and Volunteers are flat topical pages, not
  multi-act like Training, so the band structure does not fit them. This was settled
  during brainstorming.
- No changes to the functional pages (Home, Contact, Archives). They carry no directive
  modules and already inherit the theme.
- No content rewrites beyond the gloss footnotes.

## Target architecture

The work sorts the styles into two clear homes.

- `src/app.css` owns every `.ec-*` component, global and unscoped. Most already live
  here; the consolidation moves the stragglers in.
- The route's scoped `<style>` keeps only page-level rules: the `.static-page` wrapper
  and its max-width, the page title and its accent bar, the lede, and the entrance
  cascade (the `data-rise` delay map and the `module-rise` keyframes). These reference
  the page wrapper, so they stay route-level.

## The work

### 1. Lift the component rules to global

Move these rules from the route's scoped block into `app.css`, dropping the page scoping.

- The head row: `.ec-head` (flex, gap, margin), the `.ec-head h2` and `.ec-cta h2`
  sizing, and the `.ec-head .ec-glyph` size.
- The split and panel layout: `.ec-split` grid (with its mobile single column),
  `.ec-panel` layout, and the `.ec-panel` icon, glyph, paragraph, and strong rules.
- The CTA button margin (`.ec-cta .btn`).
- The passage padding (`.ec-passage`).
- The `.section-body > :first-child` margin reset.

Each rule loses two or three classes of specificity when it un-scopes. Where a rule must
still beat a generic prose rule, add a `.post-body` prefix so the global form keeps
winning. The clearest case is `.ec-cta h2` against `.post-body h2`: both set font-size at
equal specificity today, and the scoped form wins only on its extra page selectors.
Every moved rule gets a specificity check before it lands.

### 2. Generalize the entrance cascade and the module margin

Change the cascade selectors from `:is([data-page="about"], [data-page="training"],
[data-page="crewlab"])` to all `.static-page`, so Volunteers and any future content page
get the `module-rise` animation and the 1.4rem module margin. The `data-rise` delay map
already targets all static pages, so this aligns the animation and the margin with it.

### 3. Adopt the gloss/footnote pattern

Add `aside` glosses with `id="gloss-..."` and footnote daggers for the named terms on
About and Volunteers. Candidates on About: APU Nordic, Alaska Winter Stars, Junior
Nationals, Arctic Winter Games. Candidates on Volunteers: NSAA's Junior Nordic and the
named races. The exact set gets chosen during implementation, kept to terms a reader
needs defined. The footnote CSS is already general (`a[href^="#gloss-"]` and
`[id^="gloss-"]`), so this is content work only.

### 4. Remove dead rules

The `.page-section` base-card rules in the route block look unused, since the directive
system replaced the old `decorate*` markup. Confirm, then remove if dead.

## Verification

The characterization snapshot tests cover rendered HTML, not CSS, so they will not catch
a visual regression from a specificity or cascade shift. Verification is a manual,
page-by-page pass: build the site, serve it, and review About, CrewLAB, Training, and
Volunteers. The three reference pages should look identical to today, since their scoped
styles become global with matched specificity. Volunteers should gain the panel layout,
the grid head row, the module rhythm, and the entrance animation it lacks today.

## Risks

The main risk is a specificity shift. An un-scoped rule could drop below a competing
global rule and turn a style off on a page that currently relies on the high-specificity
scoped form. The per-rule specificity check in step 1 is the guard. The page-by-page
review in Verification is the backstop. The change is otherwise additive: the reference
pages keep their styling, and Volunteers gains what it was missing.

## Out of scope, noted for later

Whether the whole site should eventually adopt Training's section-band structure is a
separate, larger question. This work does not touch it.
