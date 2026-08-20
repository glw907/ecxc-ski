// ECXC's component registry (Contract v2 idiom, rebuilt on the fresh Waymark scaffold). Under the
// redo amendment ("ecxc is the test of Waymark's design flexibility"), the site's identity is
// reached through the seams, not a rebuilt engine: `alert`, `cta`, and `callout` reuse Waymark's
// own showcase shapes verbatim (same class names, same DOM structure), so they render through
// chassis/prose.css's existing rules with zero new CSS. `faq` reuses Waymark's question/answer
// shape but drops the `<details>` disclosure (Task 4 of the chassis-restructure plan restores the
// pre-rebuild site's inline answers): both the question and the answer always show, so
// ecxc-theme.css's own override strips the chassis default's pointer cursor instead of adding a
// disclosure marker. `passage`, `aside` (a footnote gloss), `checklist`, and the training-specific
// domain set (`programs`/`program`, `week`/`day`, `spectrum`/`zone`) have no Waymark equivalent and
// are declared as this site's own components, styled by `ecxc-components.css` on the same token
// layer.
//
// Two deliberate widenings from the pure Waymark shape, both real content needs rather than
// oversights (component-friction findings for the morning report):
//   - `cta.url` is `fields.text` with a link-shape pattern, not `fields.url`: `fields.url`'s
//     validator (URL_RE) accepts only an absolute http(s) URL, so it cannot express an internal
//     link like `/crewlab` or a `cairn:` reference, both of which ECXC's real content needs from
//     the same attribute.
//   - `cta` gains a `newTab` boolean: one real link (the CrewLAB app-install deep link) must open
//     in a new tab, which Waymark's showcase cta has no attribute for.
import { h } from 'hastscript';
import type { Element, ElementContent } from 'hast';
import { defineRegistry, defineComponent, fields, glyph, type ComponentDef } from '@glw907/cairn-cms';
import { cardShell, headRow, isElement, strAttr, type ComponentContext } from '@glw907/cairn-cms/render';
import { makeIconRenderer } from '$chassis/render.js';
import { ICON_PATHS } from './icons.js';

const ecGlyph = (name: string): Element => glyph(name, ICON_PATHS);
// The chassis wires the icon set into the render helpers; this theme owns only the glyph data
// (ICON_PATHS) and where each build() function calls makeIcon.
const makeIcon = makeIconRenderer(ICON_PATHS);

// A path attribute a program or a cta can point at: an in-page anchor, a site path, a cairn:
// reference, or a full URL. See the header comment for why this replaces `fields.url` here.
const LINK_PATTERN = '^(#|/|cairn:|https?://)';
const LINK_HELP = 'Use an anchor (#id), a path (/page), a cairn: link, or a full URL.';

// ─── Alert: Waymark's shape, widened with a third "structural" role ────────
// The escalating-chrome pass (2026-07-06) adds `structural`, a plain-bordered tier with no tint
// and no icon, for organizational grouping that carries no urgency at all; `note` stays the
// soft info-tinted tier and `caution` the heaviest, per ecxc-theme.css's own three-tier chrome.
const alert = defineComponent({
  name: 'alert',
  label: 'Alert',
  description: 'A bordered note whose icon defaults from its role.',
  use: 'Flag a caution in the flow of a page.',
  group: 'Notices',
  icon: 'warning',
  defaultIconByRole: { caution: 'warning' },
  build: (ctx) => {
    const name = strAttr(ctx, 'icon');
    const role = strAttr(ctx, 'role');
    const icon = role !== 'structural' && name ? makeIcon(name, role) : undefined;
    return cardShell(['alert', `alert-${role ?? 'note'}`], [
      headRow(ctx.slot('title'), icon),
      h('div', { className: ['alert-body'] }, ctx.slot('body')),
    ]);
  },
  attributes: {
    role: fields.select({ label: 'Role', options: ['structural', 'note', 'caution'] }),
    icon: fields.icon({ label: 'Icon' }),
  },
  slots: [
    { name: 'title', label: 'Title', kind: 'inline', required: true },
    { name: 'body', label: 'Body', kind: 'markdown' },
  ],
  preview: { attributes: { role: 'caution' }, slots: { title: 'Heads up', body: 'Watch out.' } },
});

// ─── CTA: Waymark's shape, widened for an internal link and a new-tab open ──
const cta = defineComponent({
  name: 'cta',
  label: 'Call to action',
  description: 'A single prominent link, for pointing the reader at the one next step that matters.',
  use: 'Send the reader toward one destination: another page, an external tool, a sign-up form.',
  group: 'Actions',
  icon: 'arrow-right',
  build: (ctx) => {
    const label = strAttr(ctx, 'label') ?? '';
    const url = strAttr(ctx, 'url') ?? '';
    const variant = strAttr(ctx, 'variant') || 'primary';
    const newTab = ctx.attributes.newTab === true;
    return h('p', { className: ['cta'] }, [
      h(
        'a',
        {
          className: ['cta-link', `cta-${variant}`],
          href: url,
          ...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
        },
        [label, makeIcon('arrow-right')],
      ),
    ]);
  },
  attributes: {
    label: fields.text({ label: 'Label', required: true }),
    url: fields.text({ label: 'Link', required: true, pattern: LINK_PATTERN, help: LINK_HELP }),
    variant: fields.select({ label: 'Variant', options: ['primary', 'secondary'] }),
    newTab: fields.boolean({ label: 'Open in a new tab' }),
  },
  preview: { attributes: { label: 'Sign up', url: '/contact', variant: 'primary' } },
});

// ─── FAQ: the question and its answer sit inline, no accordion ─────────────
// Task 4 of the chassis-restructure plan restores the pre-rebuild site's own FAQ presentation:
// every answer always shows, rather than behind a `<details>`/`<summary>` disclosure the Waymark
// shape used. The question stays a plain, always-visible label; ecxc-theme.css's own override
// strips the chassis default's pointer cursor to match (see that file's header comment).
const faq = defineComponent({
  name: 'faq',
  label: 'FAQ question',
  description: 'One question and its answer, always shown inline.',
  use: 'Answer a question a reader is likely to have without lengthening the main flow.',
  group: 'Structure',
  icon: 'question',
  build: (ctx) => {
    const question = strAttr(ctx, 'question') ?? '';
    return h('div', { className: ['faq'] }, [
      h('p', { className: ['faq-question'] }, [question]),
      h('div', { className: ['faq-answer'] }, ctx.slot('body')),
    ]);
  },
  attributes: {
    question: fields.text({ label: 'Question', required: true }),
  },
  slots: [{ name: 'body', label: 'Answer', kind: 'markdown', required: true }],
  preview: { attributes: { question: 'Does this cost anything?' }, slots: { body: 'No, everything here is free.' } },
});

// ─── Callout: Waymark's shape, unchanged ────────────────────────────────────
const callout = defineComponent({
  name: 'callout',
  label: 'Callout',
  description: 'A highlighted note, optionally with a short list of points.',
  use: 'Draw the reader to a handful of related ideas worth calling out together.',
  group: 'Callouts',
  icon: 'info',
  build: (ctx) =>
    h('aside', { className: ['callout', `callout-${String(ctx.attributes.tone ?? 'note')}`] }, [
      h('p', { className: ['callout-title'] }, ctx.slot('title')),
      h('div', { className: ['callout-body'] }, ctx.slot('body')),
      h('ul', { className: ['callout-points'] }, ctx.items('points').map((item) => h('li', item))),
    ]),
  attributes: {
    tone: fields.select({ label: 'Tone', required: true, options: ['note', 'tip', 'warning'] }),
    icon: fields.icon({ label: 'Icon' }),
  },
  slots: [
    { name: 'title', label: 'Title', kind: 'inline', required: true },
    { name: 'body', label: 'Body', kind: 'markdown' },
    { name: 'points', label: 'Points', kind: 'repeatable', itemFields: { text: fields.text({ label: 'Item' }) } },
  ],
  preview: {
    attributes: { tone: 'note' },
    slots: { title: 'What we ask', body: 'Intro sentence.', points: ['First point', 'Second point'] },
  },
});

// ─── Passage: a titled prose block, flat by default (site-declared) ────────
// Waymark has no plain "titled section" primitive; the pre-rebuild site's `card` and `passage`
// directives collapsed into this one. The selective-de-carding pass (2026-07-06) replaced the
// engine's previous uniform carding of every instance: the default (no `variant`) is now ordinary
// headed prose, no chrome and no icon, since a plain narrative passage reads as a continuation of
// the article, not a separate object. `variant="card"` earns the club's resting-card recipe for a
// passage that reads as a standalone object (e.g. a roster entry); `variant="emphasis"` earns a
// lighter left-rule accent for advisory content that is still narrative. Both opt-in variants keep
// the icon; the flat default drops it, matching the plain-heading treatment (docs/STATUS.md).
function buildPassage(ctx: ComponentContext): Element {
  const variant = strAttr(ctx, 'variant');
  const icon = variant ? strAttr(ctx, 'icon') : undefined;
  const iconEl = icon ? ecGlyph(icon) : undefined;
  const className = variant ? ['ec-passage', `ec-passage-${variant}`] : ['ec-passage'];
  return h('section', { className }, [
    headRow(ctx.slot('title'), iconEl),
    h('div', { className: ['ec-passage-body'] }, ctx.slot('body')),
  ]);
}

const passage = defineComponent({
  name: 'passage',
  label: 'Passage',
  description: 'A titled block of prose, flat by default.',
  use: "Give a stretch of prose its own heading. Reach for the card or emphasis variant only when the passage earns extra visual weight.",
  build: buildPassage,
  attributes: {
    icon: fields.icon({ label: 'Icon' }),
    variant: fields.select({ label: 'Variant', options: ['card', 'emphasis'] }),
  },
  slots: [
    { name: 'title', label: 'Title', kind: 'inline', required: true },
    { name: 'body', label: 'Body', kind: 'markdown' },
  ],
  group: 'Page structure',
  icon: 'compass',
  preview: {
    attributes: { icon: 'compass', variant: 'card' },
    slots: { title: 'Title', body: 'Body copy.' },
  },
});

// ─── Aside: a quiet footnote gloss (site-declared) ──────────────────────────
// Waymark ships no footnote primitive. A glossed term in the running prose links here as a plain
// markdown anchor (`[†](#gloss-term)`); this component is the landing target, identified by its
// own `id` attribute. Not a `callout`: a callout draws attention to an important idea, while a
// gloss is the opposite, a definition that stays out of the way until the reader follows the link.
function buildAside(ctx: ComponentContext): Element {
  const title = ctx.slot('title');
  const id = strAttr(ctx, 'id');
  const kids: ElementContent[] = [];
  if (title.length > 0) kids.push(h('span', { className: ['ec-aside-term'] }, title));
  kids.push(h('div', { className: ['ec-aside-def'] }, ctx.slot('body')));
  const asideEl = h('aside', { className: ['ec-aside'] }, kids);
  if (id) asideEl.properties.id = id;
  return asideEl;
}

const aside = defineComponent({
  name: 'aside',
  label: 'Gloss',
  description: 'A quiet term-and-definition note, linked from a footnote dagger elsewhere on the page.',
  use: "Define a term inline without breaking the reader's flow through the main text.",
  build: buildAside,
  attributes: {
    id: fields.text({ label: 'Anchor id', help: 'Matched by a footnote link elsewhere on the page, e.g. gloss-term.' }),
  },
  slots: [
    { name: 'title', label: 'Term', kind: 'inline' },
    { name: 'body', label: 'Definition', kind: 'markdown' },
  ],
  group: 'Callouts',
  icon: 'info',
  preview: { slots: { title: 'Term', body: 'A short definition or note.' } },
});

// ─── Checklist: a flat or grouped gear list (site-declared) ────────────────
function markFirstListAs(children: ElementContent[], cls: string): Element | undefined {
  const ul = children.find((c) => isElement(c) && c.tagName === 'ul') as Element | undefined;
  if (ul) {
    ul.properties = { ...ul.properties, className: [cls] };
    ul.children = (ul.children as ElementContent[]).filter((c) => !(c.type === 'text' && /^\s*$/.test(c.value)));
  }
  return ul;
}

/**
 * A checklist category: a `####` heading immediately followed by its bullet list, both found
 *  among the checklist's body children. Grouping is opt-in: a body with no `####` heading keeps
 *  the flat, uncarded rendering `buildChecklist` has always produced.
 */
interface ChecklistGroup {
  title: ElementContent[];
  list: Element;
}

function extractChecklistGroups(children: ElementContent[]): ChecklistGroup[] {
  const groups: ChecklistGroup[] = [];
  for (const [index, node] of children.entries()) {
    if (!isElement(node) || node.tagName !== 'h4') continue;
    const list = children.slice(index + 1).find(isElement);
    if (list && list.tagName === 'ul') groups.push({ title: node.children as ElementContent[], list });
  }
  return groups;
}

function buildChecklistGroup({ title, list }: ChecklistGroup): Element {
  list.properties = { ...list.properties, className: ['ec-checklist'] };
  list.children = (list.children as ElementContent[]).filter((c) => !(c.type === 'text' && /^\s*$/.test(c.value)));
  return h('div', { className: ['ec-checklist-group'] }, [
    h('div', { className: ['ec-checklist-group-head'] }, [
      ecGlyph('backpack'),
      h('span', { className: ['ec-checklist-group-title'] }, title),
    ]),
    list,
  ]);
}

function buildChecklist(ctx: ComponentContext): Element {
  const body = ctx.slot('body');
  const twoCol = strAttr(ctx, 'cols') === '2';
  const groups = extractChecklistGroups(body);
  if (groups.length > 0) {
    const className = twoCol ? ['ec-checklist-card', 'ec-checklist-2col'] : ['ec-checklist-card'];
    return h('div', { className }, groups.map(buildChecklistGroup));
  }
  const ul = markFirstListAs(body, 'ec-checklist');
  if (ul && twoCol && Array.isArray(ul.properties?.className)) {
    (ul.properties.className as string[]).push('ec-checklist-2col');
  }
  return ul ?? h('div', {}, body);
}

const checklist = defineComponent({
  name: 'checklist',
  label: 'Checklist',
  description:
    'A check-box list for gear. `cols="2"` lays it out in two columns. A `####` heading before a ' +
    'sub-list groups the items under that category, with one quiet icon per category.',
  use: 'List what to bring, under a heading of its own.',
  insertTemplate: '::::checklist\n- First item\n- Second item\n::::',
  build: buildChecklist,
  attributes: {
    cols: fields.select({ label: 'Columns', options: ['1', '2'] }),
  },
  slots: [{ name: 'body', label: 'Items', kind: 'markdown' }],
  group: 'Lists',
  icon: 'backpack',
  preview: { slots: { body: '- First item\n- Second item' } },
});

// ─── Domain set: programs/program, week/day, spectrum/zone (site-declared) ─
// Training-specific composites: ECXC's own vocabulary, named by the plan as the site's domain
// set. Each container recovers its typed children from the shared render slot by the class its
// own nested `build()` applies (the `childrenByClass` pattern), the same technique any composite
// directive uses under the v2 grammar.
function hasClass(node: ElementContent, cls: string): boolean {
  return isElement(node) && Array.isArray(node.properties?.className) && node.properties.className.includes(cls);
}

function childrenByClass(ctx: ComponentContext, cls: string): ElementContent[] {
  return ctx.slot('body').filter((c) => hasClass(c, cls));
}

function buildProgram(ctx: ComponentContext): Element {
  const icon = strAttr(ctx, 'icon');
  const href = strAttr(ctx, 'href') ?? '#';
  const meta = strAttr(ctx, 'meta');
  const ctaLabel = strAttr(ctx, 'cta');
  const role = strAttr(ctx, 'role');
  const headKids: ElementContent[] = [];
  if (icon) headKids.push(makeIcon(icon, role));
  headKids.push(h('span', { className: ['ec-program-name'] }, ctx.slot('title')));
  const kids: ElementContent[] = [h('div', { className: ['ec-program-head'] }, headKids)];
  if (meta) kids.push(h('span', { className: ['ec-program-meta'] }, meta));
  kids.push(h('div', { className: ['ec-program-blurb'] }, ctx.slot('body')));
  if (ctaLabel) {
    kids.push(h('span', { className: ['ec-program-go'] }, [ctaLabel, ' ', h('span', { className: ['ec-arr'] }, '→')]));
  }
  const className = ['ec-program'];
  if (role) className.push(`ec-program-${role}`);
  return h('a', { className, href }, kids);
}

function buildPrograms(ctx: ComponentContext): Element {
  return h('div', { className: ['ec-programs'] }, childrenByClass(ctx, 'ec-program'));
}

function buildDay(ctx: ComponentContext): Element {
  const kind = strAttr(ctx, 'kind') ?? 'solo';
  const time = strAttr(ctx, 'time');
  const kids: ElementContent[] = [
    h('div', { className: ['ec-week-day'] }, ctx.slot('title')),
    h('div', { className: ['ec-week-time'] }, time ? [time] : []),
    h('div', { className: ['ec-week-focus'] }, ctx.slot('body')),
  ];
  return h('div', { className: ['ec-week-row', `ec-week-${kind}`] }, kids);
}

function buildWeek(ctx: ComponentContext): Element {
  const rows = childrenByClass(ctx, 'ec-week-row');
  const foot = ctx.slot('body').filter((c) => isElement(c) && !hasClass(c, 'ec-week-row'));
  const kids: ElementContent[] = [h('div', { className: ['ec-week-rows'] }, rows)];
  if (foot.length > 0) kids.push(h('div', { className: ['ec-week-foot'] }, foot));
  return h('div', { className: ['ec-week'] }, kids);
}

function buildZone(ctx: ComponentContext): Element {
  return h('div', { className: ['ec-zone'] }, [
    h('div', { className: ['ec-zone-name'] }, ctx.slot('title')),
    h('div', { className: ['ec-zone-who'] }, ctx.slot('body')),
  ]);
}

function buildSpectrum(ctx: ComponentContext): Element {
  const zones = childrenByClass(ctx, 'ec-zone');
  const bar = h('div', { className: ['ec-spectrum-bar'] }, zones.map(() => h('span')));
  return h('div', { className: ['ec-spectrum'] }, [bar, h('div', { className: ['ec-spectrum-zones'] }, zones)]);
}

const HREF_ATTR = fields.text({ label: 'Link', pattern: LINK_PATTERN, help: LINK_HELP });
const ROLE_ATTR = fields.select({ label: 'Role', options: ['primary', 'secondary'] });
const TITLE_SLOT = { name: 'title', label: 'Title', kind: 'inline' as const, required: true };
const BODY_SLOT = { name: 'body', label: 'Body', kind: 'markdown' as const };

const programs = defineComponent({
  name: 'programs',
  label: 'Program cards',
  description: 'A row of side-by-side program cards (nested :::program blocks).',
  use: 'List the training programs the page describes, each a link into its own section.',
  insertTemplate:
    '::::programs\n:::program[Summer training]{icon="path" href="#summer-training" meta="Jun–Aug" cta="See summer training"}\nWhat it is.\n:::\n::::',
  build: buildPrograms,
  slots: [BODY_SLOT],
  group: 'Page structure',
  icon: 'users-three',
});

const program = defineComponent({
  name: 'program',
  label: 'Program card',
  description: 'A clickable program-offering card (used inside :::programs).',
  use: 'One entry inside a :::programs row.',
  insertTemplate: ':::program[Name]{icon="path" href="#anchor" meta="Dates" cta="Learn more"}\nShort blurb.\n:::',
  build: buildProgram,
  attributes: {
    icon: fields.icon({ label: 'Icon' }),
    href: HREF_ATTR,
    meta: fields.text({ label: 'Meta line' }),
    cta: fields.text({ label: 'Link label' }),
    role: ROLE_ATTR,
  },
  slots: [TITLE_SLOT, BODY_SLOT],
  group: 'Page structure',
  icon: 'person-simple-run',
  hidden: true,
});

const week = defineComponent({
  name: 'week',
  label: 'Weekly schedule',
  description: 'A seven-day schedule rail (nested :::day blocks).',
  use: 'Show what a typical week of practice looks like.',
  insertTemplate: '::::week\n:::day[Mon]{kind="group" time="10:30–12:15"}\nFocus for the day.\n:::\n::::',
  build: buildWeek,
  slots: [BODY_SLOT],
  group: 'Page structure',
  icon: 'calendar-blank',
});

const day = defineComponent({
  name: 'day',
  label: 'Schedule day',
  description: 'One day-row of the weekly schedule (used inside :::week).',
  use: 'One row inside a :::week rail.',
  insertTemplate: ':::day[Mon]{kind="group" time="10:30–12:15"}\nFocus for the day.\n:::',
  build: buildDay,
  attributes: {
    kind: fields.select({ label: 'Kind', options: ['group', 'solo', 'rest'] }),
    time: fields.text({ label: 'Time' }),
  },
  slots: [TITLE_SLOT, BODY_SLOT],
  group: 'Page structure',
  icon: 'calendar-blank',
  hidden: true,
});

const spectrum = defineComponent({
  name: 'spectrum',
  label: 'Training-group spectrum',
  description: 'A pace continuum with labelled zones (nested :::zone blocks).',
  use: 'Show the training groups as one continuum rather than separate tiers.',
  insertTemplate: '::::spectrum\n:::zone[Group one]\nWho it is for.\n:::\n::::',
  build: buildSpectrum,
  slots: [BODY_SLOT],
  group: 'Page structure',
  icon: 'users-three',
});

const zone = defineComponent({
  name: 'zone',
  label: 'Spectrum zone',
  description: 'One zone of the training-group spectrum (used inside :::spectrum).',
  use: 'One entry inside a :::spectrum continuum.',
  insertTemplate: ':::zone[Group name]\nWho it is for.\n:::',
  build: buildZone,
  slots: [TITLE_SLOT, BODY_SLOT],
  group: 'Page structure',
  icon: 'person-simple-run',
  hidden: true,
});

export const ecxcRegistry = defineRegistry({
  components: [alert, cta, faq, callout, passage, aside, checklist, programs, program, week, day, spectrum, zone],
});

/** Re-exported so a call site that only needs the type doesn't reach into the engine directly. */
export type { ComponentDef };
