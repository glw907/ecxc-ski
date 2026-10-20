# Pass 5 — Inline Container Directives (design)

**Date:** 2026-05-24
**Status:** approved for planning
**Supersedes mechanism in:** `src/routes/[slug]/+page.svelte` (`decorateAbout` /
`decorateTraining` / `decorateCrewlab`, `parseSections`, `wrapSections`,
`boldParasToGrid`, the slug→primitive inference, `SECONDARY_SECTIONS`).

---

## Goal

Replace the implicit slug→primitive mapping with **explicit inline container
directives** in the markdown, so each page's styling is visible in the file and
robust to heading renames. This refactors *how* styling is selected, not the
look: About / Training / CrewLAB must render **pixel-identical** to today
(regression-verified by headless screenshots).

## What's in / out

**In:** a `remark-directive`-based AST pipeline; a custom remark "mark" step and
a custom rehype "restructure" step that produce the existing HTML primitives from
directives; migration of **all five static pages** (`about.md`, `training.md`,
`crewlab.md`, `resources.md`, `volunteers.md`) to directives; deletion of the
old `wrapSections` path entirely; documentation of the vocabulary in
`docs/design-language.md`.

**Out:** new page content; visual change to the three worked pages (About /
Training / CrewLAB render identically); the rollout to contact / tags / post
detail (those are Svelte components, not markdown pages — separate work).

`resources.md` / `volunteers.md` are **migrated now** rather than deferred, so no
transitional fallback is needed and the HTML-string machinery is deleted in full.
Their migration is a small, deliberate visual change (from the generic legacy
`.page-section` card to the proper kit) — see *Migrating the deferred pages*.

## Settled decisions (do not re-litigate)

- Styling is selected by **inline container directives**, not frontmatter, not
  slugs. Unmarked content = plain prose.
- Primitives and the type scale are **unchanged** — the three worked pages
  (About / Training / CrewLAB) render pixel-identical; the directive plugins
  emit the same classes the `decorate*` builders did.
- Architecture is a **pure AST pipeline**. No regex/string-replacement on
  rendered HTML. `parseSections`, `wrapSections`, `boldParasToGrid`, and the
  three `decorate*` functions are deleted outright — every page goes through the
  directive pipeline, with no fallback path.
- The work is substantial-refactor-welcome: the long-term win is deleting the
  HTML-string machinery, not minimizing the diff.

---

## Ecosystem (validated May 2026)

`remark-directive@4` remains the standard for `:::` generic directives in a
non-MDX, build-time, no-runtime-JS pipeline; MDX/mdsvex/Markdoc do not fit. The
`hName`/`hProperties`/`hChildren` mapping is still canonical against
`mdast-util-to-hast@13`. For trusted build-time content, `allowDangerousHtml` +
`rehype-raw` with **no** `rehype-sanitize` is the correct config (sanitize would
strip our inline SVGs). Target majors: `remark-directive@4`, `remark-rehype@11`,
`rehype-raw@7`, `rehype-stringify@10`, `rehype-slug@6`, `hastscript@9`.

**Key constraint that shapes the architecture:** setting `data.hChildren` on a
directive node *fully bypasses* recursive mdast→hast conversion of that node's
children. Rather than hand-build children at the mdast layer, we do the
structural work in a **rehype pass on already-converted hast**.

---

## Pipeline

```
remark-parse
  → remark-gfm
  → remark-directive
  → remark-ec-directives        (mark: directive node → <section> + data-* + base classes)
  → remark-rehype (allowDangerousHtml: true)
  → rehype-raw                  (reparse authored raw HTML, e.g. training.md page-toc nav)
  → rehype-slug                 (auto heading IDs: "## Schedule" → id="schedule")
  → rehype-ec-primitives        (restructure hast: ec-head, icon, section-body, grid, split, cta)
  → rehype-stringify
```

This replaces the single `remark().use(remarkGfm).use(remarkHtml,{sanitize:false})`
call in `src/lib/utils.ts → markdownToHtml`. The same pipeline serves posts and
pages; posts simply contain no directives.

### `remark-ec-directives` (mark step, mdast)

For each `containerDirective` node, follow the remark-directive README pattern:
build `h(node.name, node.attributes)`, then set `data.hName = 'section'` and
`data.hProperties` carrying:

- `data-primitive` = the directive name (`card`, `grid`, `alert`, `cta`,
  `split`, `panel`, `passage`)
- `data-icon` = the `icon` attribute, if present
- `data-role` = the `role` attribute, if present

It does **not** set `hChildren` (so children convert normally downstream). It
adds only the marker; all visible structure is built in the rehype step. Unknown
directive names are left untouched (defensive, but not expected).

### `rehype-ec-primitives` (restructure step, hast)

Visits `<section data-primitive=…>` elements (children already converted to
hast) and rewrites each to the exact HTML the current builders emit. One handler
per primitive (mirrors today's `ecCard` / `ecCta` / alert / split logic). The
`--rise` stagger index is assigned here in document order across top-level
primitives, reproducing `riseStyle(idx)` (`0.16 + idx*0.04s`). Icons are injected
as `{type:'raw', value: svgString}` nodes (parsed by an earlier `rehype-raw`;
note ordering — see *Open implementation question* below) or built with
`hastscript`. Phosphor SVG sources move to a small named map module shared by the
plugin.

---

## Directive vocabulary

Authored in `src/content/pages/*.md`. Two optional attributes throughout:
`icon=NAME` (a Phosphor glyph name from the icon map; omit = no icon) and
`role=ROLE` (`primary` default · `secondary` people/cobalt · `caution`
alert/amber).

| Directive | Primitive | Output |
|---|---|---|
| `:::card{icon=NAME role=ROLE}` | Module card | `.ec-card` → `.ec-head` (icon + h2) + `.section-body` |
| `:::grid{icon=NAME role=ROLE}` | Grid card | `.ec-card` whose contained list becomes `.ec-grid` cells |
| `:::alert{role=caution}` | Subtle alert | `.ec-alert.ec-alert-caution`; icon inline in label; `role` selects the variant and its default icon (caution→warning), overridable with `icon` |
| `:::cta{icon=NAME}` | CTA card | `.ec-cta` centered, `.ec-chip` icon tile, contained link → `btn btn-primary` |
| `::::split` ⊃ `:::panel{icon=NAME role=ROLE}` ×2 | Paired panels | `.ec-split` of `.ec-panel`s, each leading with its own icon |
| `:::passage{icon=NAME}` | Titled prose passage | `.ec-passage` (ec-head + body, no card chrome) |
| *(no directive)* | Bare prose | rendered as-is — lede, intro paragraphs |

Nesting uses remark-directive's colon-count rule: the `split` container opens
with four colons (`::::split`) so its `:::panel` children nest cleanly.

### Content-shape changes required for identical render

- **Grid wraps a real markdown list.** Training's *Logistics* block (the
  `**Travel:** …` paragraphs) is rewritten as a `- **Travel** …` list inside
  `:::grid`. This deletes `boldParasToGrid` — grid only ever transforms a list.
  Rendered cells are unchanged.
- **Split panels are explicit.** About's *Costs & volunteers* becomes
  `::::split` with two `:::panel{icon=hand-coins}` / `:::panel{icon=handshake
  role=secondary}` children, replacing the paragraph-splitting regex.
- **Heading IDs auto-generate** (`rehype-slug`), so Training's manual
  `<h2 id="schedule">` tags become plain `## Schedule`; the `page-toc` anchors
  (`#schedule`, …) still resolve. The `page-toc` nav itself stays authored raw
  HTML (handled by `rehype-raw`).

### Worked example — About, first three sections

```markdown
:::card{icon=path}
## What we do
The high school ski season is short…
:::

:::alert{role=caution}
## Risks
Running, mountain biking, roller-skiing…
:::

:::card{icon=users-three role=secondary}
## Who can join
The group is open to students…
:::
```

---

## Per-page mapping (must reproduce today's render exactly)

**About** — `card{icon=path}` · `alert{role=caution}` · `card{icon=users-three
role=secondary}` · `grid{icon=compass}` · `split`(panels `hand-coins` /
`handshake role=secondary`, no head icon) · `cta{icon=flag}`.

**Training** — `card{icon=calendar-blank}` (Schedule) · `grid{icon=path}` (What
we do) · `card{icon=users-three role=secondary}` (Who can join) ·
`card{icon=backpack}` (What to bring) · `card{icon=tent}` (Talkeetna camp, with a
nested `:::grid` around the Logistics list) · `cta{icon=flag}` (Sign up).

**CrewLAB** — `passage{icon=chat-circle}` (Why we use it) ·
`grid{icon=person-simple-run}` (For athletes) · `card{icon=users-three
role=secondary}` (For parents & supporters) · `cta{icon=flag}` (Getting started).
The lede stays a plain (non-emphatic) intro paragraph.

Icon names map to the existing `ICON` entries; the glyph→meaning matrix in
`docs/design-language.md` is unchanged. `data-section` attributes are dropped
unless a consumer is found (none in current CSS/JS — to verify during
implementation).

---

## Migrating the deferred pages

`resources.md` and `volunteers.md` move onto the kit now, so `wrapSections` is
deleted with everything else. They render today via the legacy generic
`.page-section` card; migrating them is a small, intentional change to the proper
kit (prose-default + selective primitives), consistent with "new pages adopt
directives from the start." Both pages are short and reuse already-registered
icons, so no new glyphs are introduced.

**`resources.md`** — lede stays unmarked prose. The single `## Forms` section
becomes `:::card` (a self-contained forms unit), **no icon**: on a one-section
page a wayfinding glyph would be near-decorative, and the icon checklist says
skip it. The waiver `<a class="download-link">` stays a plain link inside the
card (it is *not* the page's one CTA, so no `btn` promotion — authored raw HTML,
handled by `rehype-raw`).

**`volunteers.md`** — lede stays unmarked prose. `## This Summer's Volunteers`
(roster TK) becomes `:::passage{icon=users-three role=secondary}` — prose, no
card chrome, pending the roster; it becomes the *person/profile card* primitive
(see design-language candidates) in a future pass when the roster is written.
`## Help Out` becomes `:::grid{icon=handshake role=secondary}`: the three ways to
help (Drive / Train alongside / Teach) are parallel titled points, the same grid
primitive as About's philosophy; the surrounding intro/closing paragraphs stay
as body prose around the grid. Both icons (`users-three`, `handshake`) and the
secondary role are already in the matrix; no-icon-repeat is per-page, so reusing
them here is fine. The manual `<h2 id>` tags drop (rehype-slug regenerates them).

These two pages have **no pixel-identical target** (the legacy treatment is the
thing being replaced); they are screenshot-checked for kit-correct rendering, not
against the old look.

---

## Verification (the main burden — identical render is re-verified, not inherited)

1. `npx svelte-check` clean.
2. `npm run build` succeeds.
3. Rebuild, serve the built site on `:8787` (wrangler), and headless-screenshot
   with `--force-prefers-reduced-motion`, **desktop + mobile**, **light + dark**:
   - About / Training / CrewLAB — diff against the current live render and
     reconcile every difference until **identical**.
   - Resources / Volunteers — check for **kit-correct** rendering (not against
     the old `.page-section` look, which is being replaced).
4. Confirm the Training `page-toc` anchors still scroll to the right sections
   (heading IDs via `rehype-slug`).
5. Confirm posts (no directives) render unchanged.

---

## Open implementation question (resolve in the plan, not here)

Plugin ordering vs. icon injection: `rehype-raw` runs before
`rehype-ec-primitives`, so raw SVG nodes emitted *by* the primitive step won't be
reparsed by that earlier `rehype-raw`. Resolution options: (a) build icon SVGs as
real `hastscript` element trees in the restructure step (no raw nodes needed);
(b) run a second `rehype-raw` after restructure; (c) inject icons earlier. Prefer
(a) — pure hast, no second parse. Decide in the plan.

---

## Files touched

- `src/lib/utils.ts` — rewrite `markdownToHtml` to the new pipeline.
- `src/lib/` — new `remark-ec-directives` (mark), `rehype-ec-primitives`
  (restructure), and a Phosphor icon-map module (moved from the Svelte component).
- `src/routes/[slug]/+page.svelte` — delete the entire `<script module>`
  decorate machinery; keep the page shell and the scoped CSS (unchanged).
  `bodyHtml` collapses to `page.html` for every page (decoration now happens in
  `markdownToHtml`, so the rendered html already carries the primitives).
- `src/content/pages/{about,training,crewlab}.md` — add directives; convert
  Logistics paragraphs to a list; drop manual `<h2 id>`.
- `src/content/pages/{resources,volunteers}.md` — add directives; drop manual
  `<h2 id>` (see *Migrating the deferred pages*).
- `package.json` — add `remark-directive`, `remark-rehype`, `rehype-raw`,
  `rehype-stringify`, `rehype-slug`, `hastscript`; remove `remark-html`.
- `docs/design-language.md` — document the directive vocabulary (new section)
  and update the *Worked example* / *Refining a page* references from
  `decorate*` to directives.
