# ecnordic cairn-cms 0.10 migration design

## Context

ecnordic-ski pins `@glw907/cairn-cms` at an exact `0.6.0`. The engine has moved four minor
versions since: `0.7.0` (public delivery surface, the `renderPreview`-to-`render` adapter rename),
`0.8.0` (dated-slug identity and per-concept URL policy in YAML), `0.9.0` (the CodeMirror editor swap,
which drops the `preview` prop), and `0.10.0` (the site UI component registry: typed `attributes` plus
named `slots`, the guided-insert form, and `generateComponentReference`). ecnordic carries the only
real component surface across the two consumer sites: seven `ComponentDef`s in
`src/lib/markdown/components.ts`, all built on the old "first `## ` heading is the title" convention
through the engine's `splitHead` helper. 907-life has no components.

This design is the roadmap for bringing ecnordic onto `0.10.0`, including its adoption of the new
component schema. It completes the cairn-cms site-component initiative on the site side. The engine
side shipped with `0.10.0`.

## Goal

Move ecnordic from `0.6.0` to `^0.10.0` with zero change to its live URLs or rendered output, adopt the
delivery surface and the dated URL policy, convert its seven components to the typed attributes-and-slots
schema, and generate a component reference file an author can hand to claude.ai. Each rendered page must
look byte-identical before and after the component conversion.

## Shape: ecnordic site-passes, not one combined change

The work spans distinct verification surfaces (routing, dated URLs, the editor, feeds, then component
rendering), so it runs as a series of ecnordic site-passes rather than one change. Each is the site's own
`site-pass`, tracked in ecnordic's `STATUS.md`, run from the ecnordic directory. Pass plans are written
just-in-time after the prior pass lands, the same cadence the cairn-cms plans use.

### Pass 1: catch-up and delivery surface

The foundational, highest-blast-radius pass. It lands and deploys on its own, with the seven components
left on the heading convention so they keep compiling against `0.10.0`.

- Bump `@glw907/cairn-cms` from `0.6.0` to `^0.10.0`.
- Rename the adapter's `renderPreview` to `render` (the `0.7.0` rename).
- Drop the `preview` prop wherever the admin editor is mounted (the `0.9.0` breaking change).
- Adopt the public delivery surface: the catch-all `[...path]` route behind the engine's `byPermalink`
  resolver, plus feeds, sitemap, and SEO. Delete the hand-rolled `src/lib/posts.ts` and
  `src/lib/feed.ts`.
- Set the per-concept URL policy in the existing `src/lib/site.config.yaml`: posts get
  `datePrefix: month` and the permalink `/:year/:month/:slug`, which preserves the current
  `[year]/[month]/[slug]` route and every existing post URL.
- Gate: the site builds, every existing URL resolves unchanged, feeds and sitemap emit, the admin editor
  loads and saves.

### Pass 2: component conversion

The component-initiative deliverable. The `build()` refactor and the content rewrite are coupled, since
rendering breaks if the definitions and the content disagree, so they ride in one pass.

- Convert the seven `ComponentDef`s to typed `attributes` plus named `slots` with `description` and `use`.
- Refactor each `build()` to read named slots instead of `splitHead` and h2-sniffing.
- Rewrite the five content files that use directives to the new slot syntax.
- Gate: render-agreement tests (serialize a component, render through `build()`, assert the HTML) prove
  byte-identical output against a pre-conversion snapshot.

### Pass 3: component reference file

Small and additive. A site script runs `generateComponentReference(ecnordicRegistry)` and writes
`docs/cairn-components.md`. An author points claude.ai at that one file. It may fold into the tail of
Pass 2 if that reads cleaner at execution time.

### 907-life follow-on

After ecnordic lands, 907-life gets its own catch-up `site-pass`: the version bump to `^0.10.0`, the
`renderPreview`-to-`render` rename, the delivery surface, and the dated URL policy with `datePrefix: day`
and `/:year/:month/:day/:slug`. It has no components, so there is no component conversion and no reference
file. This is the per-site catch-up already noted in the cairn-cms STATUS open-decisions list.

## The seven component shapes (Pass 2 detail)

The label shorthand `:::card[Title]` fills the `title` slot, which replaces the `## Title` heading. The
default body is the unmarked content. Render-agreement is the contract: each refactored `build()` emits
the same HTML it does today.

| Component | attributes | slots | notes |
|-----------|------------|-------|-------|
| `card` | `icon` (icon) | `title` (inline) + body | head plus `section-body`, output unchanged |
| `passage` | `icon` (icon) | `title` (inline) + body | `<section class="ec-passage">`, no card chrome |
| `cta` | `icon` (icon) | `title` (inline) + body | chip icon plus `card-title`; `promoteDownloadLink` runs over the body slot |
| `alert` | `role` (select), `icon` (icon) | `title` (inline) + body | the role-to-icon default moves into `build()` |
| `grid` | `icon` (icon) | `title` (inline) + `items` (repeatable) | the grid list becomes an explicit repeatable slot |
| `split` | none | `title` (inline) + body | the body holds nested `:::panel` directives |
| `panel` | `icon` (icon), `role` (select) | body only | stays its own component, dispatched inside `split` |

Three calls are worth recording.

1. **`grid` items become a repeatable slot.** Today the first markdown list inside a grid is implicitly
   the grid. The new model makes it an explicit single-field repeatable slot, which is the v1 repeatable
   use case the engine was built for, and which drives the guided form's add-and-remove list. The nested
   bare-list fallback (a `grid` with no heading) is dropped.
2. **`split` and `panel` stay two components.** A panel carries an icon, a role, and content, so it is
   multi-field and cannot be a v1 single-field repeatable slot of `split`. Keeping `panel` standalone,
   with `split`'s body holding nested `:::panel` directives, preserves the current structure and respects
   the one-level repeatable bound. Merging panel into split is a possible later simplification.
3. **`alert`'s role-to-icon default moves into `build()`.** The engine's typed `ComponentDef` does not
   carry the old bespoke `defaultIconByRole` key, so the default is applied in the build function. The
   `role` enum values for `alert` and `panel`, and the `icon` set, are enumerated from actual ecnordic
   usage when the Pass 2 plan is written.

## Content rewrite (Pass 2 detail)

Five files use directives: `src/content/pages/{about,resources,volunteers,training,crewlab}.md`. The
rewrite changes only directive syntax, not prose, so the rendered HTML and the URLs do not move. The old
shape

```
::::card{icon=path}
## What we do

Body copy.
::::
```

becomes

```
:::card[What we do]{icon="path"}

Body copy.
:::
```

A `grid` moves its list into the `items` repeatable slot, and a `split` keeps its nested `:::panel`
children. The engine's `serializeComponent` defines the exact serialization, which the Pass 2 plan
follows. No back-compatibility shim is kept: carrying the dead heading-convention path in a reusable
engine works against the long-term-quality goal, and five files is a small, safe rewrite. The content
prose is untouched, so ecnordic's content style guard does not enter into it.

## Testing and verification

- **Pass 1:** a build, a route check that every existing URL still resolves, and a confirmation that
  feeds and sitemap emit. The admin editor loads and a save round-trips. Best proven against a real Worker
  with `wrangler dev`.
- **Pass 2:** render-agreement tests in the engine's style (serialize, build, assert HTML), plus a
  page-level snapshot of all five rewritten pages compared before and after. The output is byte-identical
  or the pass is not done.
- **Pass 3:** the reference file generates and covers all seven components.

## Risks and mitigations

- **The version jump crosses breaking changes.** Pass 1 isolates them from the component work, so a
  regression surfaces against routing and the editor alone, not tangled with rendering.
- **A `build()` refactor silently changes output.** Render-agreement and the page snapshot are the guard;
  the pass gate is byte-identical HTML, not "looks the same."
- **The delivery surface is itself substantial.** Pass 1's plan breaks it into tasks (route, resolver,
  feeds, sitemap, SEO) so each lands and verifies independently.

## Out of scope

- Round-trip editing of an existing directive in the form (designed-for through `parseComponent`, not
  shipped).
- Multi-field repeatable items (the panel-in-split case stays nested components).
- Cross-field or content-body validation beyond names, attribute types and enums, and required slots.
- Any visual or design change to the rendered components.
