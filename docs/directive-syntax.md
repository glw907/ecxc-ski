# Directive syntax for page content

ECXC pages use container directives to lay out cards, grids, callouts, and split sections. This
is the markdown extension the render pipeline understands. Posts are plain markdown; directives are a
page-content tool.

**Source of truth.** The registry in `src/lib/markdown/components.ts` defines every directive: its
name, slots, attributes, and the `insertTemplate` the admin editor inserts. If this guide and that
file ever disagree, the file wins. The valid icon names live in `src/lib/markdown/icons.ts`. Read
both when adding or changing a directive; read this guide when drafting content with the directives
that already exist.

## How a container directive is written

A container directive opens with a colon fence and a name, and closes with a matching fence. The
syntax accepts three or more colons. ECXC's pages standardize on four at the top level, so any
block can host a nested one without a fence collision. Match that convention when you draft:

```
::::card[Card title]{icon="flag"}
Body copy goes here. It is ordinary markdown.
::::
```

The admin editor's insert templates use three colons, which renders the same. The pages use four, so
prefer four for consistency with what is already authored.

Three parts carry the content:

- `[label]` is the **title slot**. It renders as an `<h2>` heading inside the component. Most
  directives require it; `panel` has no title, and `aside` makes it optional.
- The lines between the fences are the **body slot**, parsed as markdown. Lists, links, and emphasis
  all work.
- `{...}` holds **attributes**, written as `key="value"`. The two attributes in play are `icon` and
  `role`.

Nesting uses colon count. The outer fence takes more colons than the inner one, so a `split` that
wraps two panels opens with four colons and the panels open with three:

```
::::split[How it works]
:::panel{icon="hand-coins"}
First panel copy.
:::

:::panel{icon="handshake"}
Second panel copy.
:::
::::
```

## The directives

| Name | Title | Body | Attributes | What it renders |
|------|-------|------|------------|-----------------|
| `card` | required | yes | `icon`, `role` | A bordered card with an icon-and-heading row above the body. |
| `grid` | required | yes | `icon`, `role` | A card whose first bullet list lays out as a responsive grid. |
| `alert` | required | yes | `icon`, `role` | A callout box keyed to a role: `structural` (plain border, no tint), `note` (soft tint, no border), or `caution` (heaviest: full border, thick rule, icon). |
| `cta` | required | yes | `icon` | A centered card with a chip icon and an emphasized button link. |
| `split` | required | yes | none | A card that lays its nested `panel` blocks side by side. |
| `panel` | none | yes | `icon`, `role` | A single panel with an optional icon. Use it inside `split`. |
| `passage` | required | yes | `icon`, `variant` | A titled section, flat by default. `variant="card"` or `variant="emphasis"` earns extra visual weight. |
| `aside` | optional | yes | none | A quiet gloss: a small term label over muted text. The title is the term. |
| `figure` | optional | yes | none | A captioned image. The body holds one markdown image; the title is the caption. |
| `gallery` | optional | yes | none | A small set of images in a responsive grid. The body holds the images; the title heads the set. |
| `programs` | none | yes | none | A row of side-by-side program cards. The body holds `program` blocks. |
| `program` | required | yes | `icon`, `href`, `meta`, `cta`, `role` | One program offering as a clickable card. Use inside `programs`. |
| `week` | none | yes | none | A light ruled schedule list (no card). The body holds `day` blocks. |
| `day` | required | yes | `kind`, `time` | One row: day, time, then focus. Use inside `week`. |
| `spectrum` | none | yes | none | A pace continuum with a bar plus labelled zones. The body holds `zone` blocks. |
| `zone` | required | yes | none | One zone of the spectrum. Use inside `spectrum`. |
| `checklist` | none | yes | `cols` | A check-box list for gear (single column; `cols="2"` for two). A `####` heading before a sub-list groups items under a category. |
| `faq` | none | yes | none | A ruled question-and-answer list. Wrap a bullet list whose items lead with a bold question. |

### Per-directive notes

`card` is the workhorse. Write `::::card[Title]{icon="flag"}`, then the body.

`grid` takes an optional intro line followed by a bullet list. The first list becomes the grid. A
typical open is `::::grid[What to bring]{icon="backpack"}`.

`alert` takes a `role` of `structural`, `note`, or `caution`, escalating in chrome weight with
urgency: `structural` is a plain border with no tint and no icon, for organizational grouping with
no urgency at all; `note` is a soft tint wash with no border, for a fact worth flagging; `caution`
is the heaviest, a full border, a thick rule, and an icon. A caution alert with no `icon` defaults
to the `warning` glyph, so you rarely set the icon by hand. Open it with
`::::alert[Heads up]{role="caution"}`.

`cta` promotes a link to a primary button. Put one link in the body with `class="download-link"`, as
in `<a class="download-link" href="/waiver">Sign the waiver</a>`. If the label ends in an arrow,
wrap it as `<span class="ec-arr">→</span>` so it picks up the site-wide hover nudge; a bare `→`
stays static.

`split` and `panel` work as a pair. A `panel` is only meaningful inside a `split`. A bare `panel`
renders, but the side-by-side layout comes from the `split` wrapper. Mind the colon count: four
outside, three inside.

`passage` is flat by default: an ordinary headed paragraph, no chrome and no icon. Two opt-in
variants earn extra weight: `variant="card"` for a passage that reads as a standalone object
(a roster entry, say), and `variant="emphasis"` for a left accent rule with no full box, for
advisory content that is still narrative. Both variants keep the `icon`; the flat default drops
it. Reach for a variant only when the passage earns it; most narrative passages stay flat.

`aside` is for a gloss or side note, like a one-line definition of spenst, OD, or SafeSport. It
renders a quiet semantic `<aside>`: the title becomes a small term label over muted text, marked by a
thin azure rule. It stays subordinate to body text and takes no icon. The title is optional, so a bare
`:::aside\nA quick note.\n:::` works. Never use it for a warning; that is what `alert` is for.

`figure` shows one image with a caption. Put a markdown image in the body and the caption in the
title: `:::figure[Athletes at East]\n![Skiers warming up](/images/east.webp)\n:::`. Drop the title
for an uncaptioned image. Always write real alt text in the image.

`gallery` shows a small set of images in a responsive grid. Put two or more markdown images in the
body and an optional heading in the title: `:::gallery[Spring camp]\n![Trailhead](/images/one.webp)\n\n![Cabin](/images/two.webp)\n:::`.
Separate each image with a blank line so each becomes its own paragraph; consecutive image lines collapse
into one paragraph and so render as a single grid cell. Per-image grid sizing gets refined in a later
visual pass once the image is unwrapped from its paragraph.

### The three container pairs

Three directives lay out repeating items the way `split` lays out `panel`s: a container holds child
blocks. The container takes four colons, the children three.

`programs` and `program` render the two program offerings as side-by-side clickable cards. Each `program`
takes an `icon`, an `href` (where the card links), a `meta` line (the dates-and-cadence eyebrow), and a
`cta` (the link label, which gets an arrow appended). `role="secondary"` swaps the crimson accent edge to
cobalt, so the two cards read as distinct.

```
::::programs
:::program[Summer training]{icon="path" href="#summer-training" meta="Jun 1–Aug 19" cta="See summer training"}
The blurb.
:::

:::program[Talkeetna camp]{icon="tent" href="#talkeetna-camp" meta="Jul 21–24" cta="See the camp" role="secondary"}
The blurb.
:::
::::
```

`week` and `day` render the schedule as a light ruled list, not a card: each row leads with the day and
its `time`, then the focus. `day` still accepts a `kind` of `group`, `solo`, or `rest` as a class hook,
but the current rail styles every row the same. The title is the day name; the body is the focus. List
only the days that carry detail (the group practices), and describe the off-days in prose beside the rail.

`spectrum` and `zone` render the training-group continuum: a gradient bar with one segment per zone, then
the zone labels. Each `zone` has a name (title) and a who-it-is-for line (body); the ordinal is numbered
for you. Write the intro line and any closing line as ordinary prose around the directive.

## Valid icon names

The `icon` attribute takes one of these names (Phosphor glyphs from `icons.ts`). A name outside this
list renders nothing, so it is a silent miss to watch for:

```
backpack  calendar-blank  car  chat-circle  compass  flag  hand-coins
handshake  info  path  person-simple-run  question  tent  users-three  warning
```

## The `role` attribute

For `alert`, `role` must be `caution`. For `card`, `grid`, `panel`, `passage`, and `aside`, `role` is
`primary` or `secondary` and tints the icon. Leave it off when the default sits fine.

## A worked example

```
::::card[Practice schedule]{icon="calendar-blank"}
We meet Monday through Thursday after school. Saturdays are for longer distance
sessions and the occasional race.
::::

::::alert[Dress for the cold]{role="caution"}
Layers matter more than a single heavy coat. Bring a change of socks.
::::
```

Both blocks render without any heading markdown, because the `[label]` is the heading. The alert sets
its required `role` and lets the `icon` default to `warning`.
