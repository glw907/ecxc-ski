# Plan: optimize ecxc's components for the cairn 0.56.2 component system

Bump the cairn-cms pin to `^0.56.2` and bring every component in
`src/lib/markdown/components.ts` up to the new picker and round-trip features: a picker glyph
(`icon`), a catalog `group`, a structured `preview` sample (opts the guided form into the two-pane
live preview), `hidden` on the four nested-only components, and a light `href` validation.

## Why each field

- **`preview`** is the headline. ecxc's components all carry schemas, so insert already opens the
  guided form; declaring `preview` makes that form two-pane with the configured component rendered
  live. It also drives the live preview when a component is round-trip-edited. Every component gets
  one (the nested-only ones get it for their round-trip edit, even though they are hidden from the
  insert catalog).
- **`icon`** + **`group`** give the catalog a glyph per row and category headings. There are 15
  visible components (over the search threshold), so grouping earns its place.
- **`hidden`** drops the four nested-only components (`panel`, `program`, `day`, `zone`) from the
  top-level insert catalog; they are still inserted as part of their container's scaffold and remain
  individually round-trip-editable (the Edit-block control resolves them regardless of `hidden`).
- **`href` pattern** catches a mistyped program link (anchor, path, `cairn:`, or URL).

## The scheme (group, icon, hidden)

| component | group | icon | hidden |
|---|---|---|---|
| card | Cards | info | |
| grid | Cards | path | |
| cta | Cards | flag | |
| split | Cards | handshake | |
| panel | Cards | hand-coins | hidden |
| alert | Callouts | warning | |
| aside | Callouts | chat-circle | |
| passage | Callouts | compass | |
| section | Page structure | flag | |
| programs | Page structure | users-three | |
| program | Page structure | person-simple-run | hidden |
| week | Page structure | calendar-blank | |
| day | Page structure | calendar-blank | hidden |
| spectrum | Page structure | users-three | |
| zone | Page structure | person-simple-run | hidden |
| figure | Media | info | |
| gallery | Media | info | |
| checklist | Lists | backpack | |
| faq | Lists | question | |

All glyph names exist in `ICON_PATHS`. Within a group, declaration order is the catalog order.

## The preview rule

Each component's `preview` is the structured equivalent of its existing `insertTemplate`: parse the
template's `{attrs}` into `preview.attributes`, its `[label]` into `preview.slots.title`, and its
content into `preview.slots.body` (for a container, the body holds the nested-directive markdown, the
same scaffold the template shows). The sample must render through the site pipeline and, for the
round-trip-editable (non-container) components, be round-trip-safe by construction (it uses only
declared attributes and slots). Example for `card`:

```ts
preview: { attributes: { icon: 'flag' }, slots: { title: 'Title', body: 'Body copy.' } }
```

The `insertTemplate` stays (harmless; the schema/form path is what insert uses).

## Tasks

1. Apply the scheme to `src/lib/markdown/components.ts`: add `group`, `icon`, `hidden`, and `preview`
   to each `ComponentDef`, and a `pattern` to `HREF_ATTR`
   (`{ source: '^(#|/|cairn:|https?://)', message: 'Use an anchor (#id), a path (/page), a cairn: link, or a full URL.' }`).
   Bump the cairn-cms pin to `^0.56.2`, reinstall. Clear the gate: `npm run check` 0/0, `npm test`
   exit 0, `npm run build`.
2. (main loop) Local visual smoke of the picker on the dev server, then pass-end: an architecture
   note, STATUS update, archive this plan, commit, push (auto-deploys), and `cairn-doctor --probe
   https://ecxc.ski`.
