// ECXC's component registry (Contract v2 idiom, Task 2 of the rebuild-from-Waymark plan). The
// pre-rebuild registry (kept in git history at the commit before Task 1) declared eighteen
// directive types; this one rationalizes them per the plan's locked mapping: `alert`, `cta`, and
// `faq` take Waymark's starter shapes; the old `grid` (an intro plus a bulleted list) becomes
// `callout`, Waymark's shape, since its `points` slot is the same structure; the old `card` and
// `passage` collapse into one `passage` (a titled prose block, no card chrome); `split`/`panel`/
// `section` are gone entirely, since their content is either a `passage` per panel or plain
// markdown headings; `aside` stays a small site-declared component (a quiet gloss/footnote, not a
// callout: `docs/reference` has no footnote primitive, and the intent doesn't match a highlighted
// note); `checklist` stays for the same reason (a two-column gear list with its own marker style,
// needed by the training camp's packing list); and `programs`/`program`, `week`/`day`, and
// `spectrum`/`zone` are the plan's named domain set, carried over with an unchanged shape.
//
// Each build reproduces the directive to hast conversion the site's own CSS (app.css) already
// expects, composed from cairn-cms's shared render helpers (headRow/iconSpan/strAttr) plus this
// site's icon set. The engine owns the machinery (stamp, slot partition, dispatch, rise stagger,
// recursion); this file is site code that owns the presentation.
import { h } from 'hastscript';
import type { Element, ElementContent } from 'hast';
import { defineRegistry, defineComponent, fields, glyph, type ComponentDef } from '@glw907/cairn-cms';
import { headRow, iconSpan, isElement, strAttr, type ComponentContext, type MakeIcon } from '@glw907/cairn-cms/render';
import { ICON_PATHS } from './icons';

const ecGlyph = (name: string): Element => glyph(name, ICON_PATHS);
const makeIcon: MakeIcon = (name, role) => iconSpan(ecGlyph(name), role);

// A path attribute a program or a CTA can point at: an in-page anchor, a site path, a cairn:
// reference, or a full URL. `fields.url`'s validator (URL_RE) accepts only an absolute http(s)
// URL, so it cannot express an internal link like `/crewlab` or `#anchor`; a text field with this
// pattern is the v2 grammar's actual answer for a link that may stay on-site.
const LINK_PATTERN = '^(#|/|cairn:|https?://)';
const LINK_HELP = 'Use an anchor (#id), a path (/page), a cairn: link, or a full URL.';

// True when an element node carries the given class. Slot partitioning stamps a nested
// primitive's own build() output into the parent's body slot, so a container build (programs,
// week, spectrum) recovers its typed children by the class its own nested build() applies.
function hasClass(node: ElementContent, cls: string): boolean {
  return isElement(node) && Array.isArray(node.properties?.className) && node.properties.className.includes(cls);
}

function childrenByClass(ctx: ComponentContext, cls: string): ElementContent[] {
  return ctx.slot('body').filter((c) => hasClass(c, cls));
}

// Tag the first <ul> among children with a class and strip its whitespace-only text nodes so the
// bare list serializes without newlines. Returns that <ul>. Only `checklist` needs this now; the
// old `grid`/`faq` uses moved to callout's structured `points` slot and per-question `faq` blocks.
function markFirstListAs(children: ElementContent[], cls: string): Element | undefined {
  const ul = children.find((c) => isElement(c) && c.tagName === 'ul') as Element | undefined;
  if (ul) {
    ul.properties = { ...ul.properties, className: [cls] };
    ul.children = (ul.children as ElementContent[]).filter((c) => !(c.type === 'text' && /^\s*$/.test(c.value)));
  }
  return ul;
}

// ─── Alert: a caution box, Waymark's shape ──────────────────────────────────
function buildAlert(ctx: ComponentContext): Element {
  const icon = strAttr(ctx, 'icon');
  const role = strAttr(ctx, 'role') ?? 'caution';
  const titleKids: ElementContent[] = [];
  if (icon) titleKids.push(ecGlyph(icon));
  titleKids.push(...ctx.slot('title'));
  return h('div', { role: 'alert', className: ['ec-alert', `ec-alert-${role}`] }, [
    h('div', { className: ['ec-alert-body'] }, [h('h2', {}, titleKids), ...ctx.slot('body')]),
  ]);
}

const alert = defineComponent({
  name: 'alert',
  label: 'Alert',
  description: 'A callout box for a caution the reader must not miss.',
  use: 'Flag a safety or eligibility rule in the flow of a page.',
  insertTemplate: ':::alert[Heads up]{role="caution"}\nWhat to watch for.\n:::',
  build: buildAlert,
  defaultIconByRole: { caution: 'warning' },
  attributes: {
    role: fields.select({ label: 'Role', required: true, options: ['caution'] }),
    icon: fields.icon({ label: 'Icon' }),
  },
  slots: [
    { name: 'title', label: 'Title', kind: 'inline', required: true },
    { name: 'body', label: 'Body', kind: 'markdown' },
  ],
  group: 'Notices',
  icon: 'warning',
  preview: { attributes: { role: 'caution' }, slots: { title: 'Heads up', body: 'What to watch for.' } },
});

// ─── CTA: a single elevated link, Waymark's shape ───────────────────────────
// The old `cta` was a titled card wrapping rich markdown (an intro, an embedded HTML anchor, a
// postscript); Waymark's `cta` is attribute-only (label, url, variant), so a rich instance's
// framing prose moves to plain paragraphs around a bare `:::cta{...}:::` and the actual button
// is what the component now renders. `newTab` is ecxc's own addition: an external app-install
// link (CrewLAB) needs to open in a new tab, which Waymark's showcase example has no attribute
// for.
function buildCta(ctx: ComponentContext): Element {
  const label = strAttr(ctx, 'label') ?? '';
  const url = strAttr(ctx, 'url') ?? '';
  const variant = strAttr(ctx, 'variant') || 'primary';
  const newTab = ctx.attributes.newTab === true;
  const className = ['cta-link', 'download-link'];
  if (variant === 'secondary') className.push('cta-secondary');
  return h('p', { className: ['cta'] }, [
    h(
      'a',
      { className, href: url, ...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}) },
      [label, ' ', h('span', { className: ['ec-arr'] }, '→')],
    ),
  ]);
}

const cta = defineComponent({
  name: 'cta',
  label: 'Call to action',
  description: 'A single prominent button, for pointing the reader at the one next step that matters.',
  use: 'Send the reader toward one destination: a sign-up link, a form, another page.',
  insertTemplate: ':::cta{label="Sign up" url="/contact"}\n:::',
  build: buildCta,
  attributes: {
    label: fields.text({ label: 'Label', required: true }),
    url: fields.text({ label: 'Link', required: true, pattern: LINK_PATTERN, help: LINK_HELP }),
    variant: fields.select({ label: 'Variant', options: ['primary', 'secondary'] }),
    newTab: fields.boolean({ label: 'Open in a new tab' }),
  },
  group: 'Actions',
  icon: 'flag',
  preview: { attributes: { label: 'Sign up', url: '/contact', variant: 'primary' } },
});

// ─── FAQ: one question per block, Waymark's shape ───────────────────────────
// The old `faq` tagged a whole bullet list (`- **Q?** A.`); Waymark's is one native
// <details>/<summary> disclosure per question, so a list of Q&A pairs becomes one `:::faq{...}`
// block per pair. Individually expandable questions also read better with a screen reader than a
// single static list.
function buildFaq(ctx: ComponentContext): Element {
  const question = strAttr(ctx, 'question') ?? '';
  return h('details', { className: ['ec-faq'] }, [
    h('summary', { className: ['ec-faq-question'] }, [question]),
    h('div', { className: ['ec-faq-answer'] }, ctx.slot('body')),
  ]);
}

const faq = defineComponent({
  name: 'faq',
  label: 'FAQ question',
  description: 'One question and its answer, on a native disclosure widget.',
  use: 'Answer a question a reader is likely to have without lengthening the main flow.',
  insertTemplate: ':::faq{question="Does this cost anything?"}\nNo, it is free.\n:::',
  build: buildFaq,
  attributes: {
    question: fields.text({ label: 'Question', required: true }),
  },
  slots: [{ name: 'body', label: 'Answer', kind: 'markdown', required: true }],
  group: 'Lists',
  icon: 'question',
  preview: {
    attributes: { question: 'Does this cost anything?' },
    slots: { body: 'No, everything here is free.' },
  },
});

// ─── Callout: a highlighted note, optionally with a point list ─────────────
// The old `grid` (a titled card whose first list laid out as a responsive grid) becomes this:
// Waymark's `callout` already has a structured `points` slot for exactly "a set of parallel
// items worth calling out", so the old grid instances (all of them an intro sentence plus a short
// list) map onto it directly. `id` is ecxc's own addition, so a callout can still serve as a
// deep-link target the way the old `card`/`aside` occasionally did.
function buildCallout(ctx: ComponentContext): Element {
  const icon = strAttr(ctx, 'icon');
  const tone = strAttr(ctx, 'tone') ?? 'note';
  const id = strAttr(ctx, 'id');
  const iconEl = icon ? ecGlyph(icon) : undefined;
  const kids: ElementContent[] = [headRow(ctx.slot('title'), iconEl)];
  const body = ctx.slot('body');
  if (body.length > 0) kids.push(h('div', { className: ['section-body'] }, body));
  const points = ctx.items('points');
  if (points.length > 0) kids.push(h('ul', { className: ['ec-callout-points'] }, points.map((item) => h('li', item))));
  const el = h('div', { className: ['ec-callout', `ec-callout-${tone}`] }, kids);
  if (id) el.properties.id = id;
  return el;
}

const callout = defineComponent({
  name: 'callout',
  label: 'Callout',
  description: 'A highlighted note, optionally with a short list of points.',
  use: 'Draw the reader to a handful of related ideas worth calling out together.',
  insertTemplate: '::::callout[Title]{tone="note"}\nIntro sentence.\n\n:::points\n- First point\n- Second point\n:::\n::::',
  build: buildCallout,
  attributes: {
    tone: fields.select({ label: 'Tone', required: true, options: ['note', 'tip', 'warning'] }),
    icon: fields.icon({ label: 'Icon' }),
    id: fields.text({ label: 'Anchor id', help: 'Set only when another page links here by #id.' }),
  },
  slots: [
    { name: 'title', label: 'Title', kind: 'inline', required: true },
    { name: 'body', label: 'Body', kind: 'markdown' },
    { name: 'points', label: 'Points', kind: 'repeatable', itemFields: { text: fields.text({ label: 'Item' }) } },
  ],
  group: 'Callouts',
  icon: 'info',
  preview: {
    attributes: { tone: 'note' },
    slots: { title: 'Title', body: 'Intro sentence.', points: ['First point', 'Second point'] },
  },
});

// ─── Passage: a titled prose block, no card chrome ─────────────────────────
// Collapses the old `card` (a bordered module) and `passage` (the same content, no border) into
// one shape: neither ever carried a visual distinction content depended on (`card`'s `role`
// attribute was declared but never read by its build either), so the lighter of the two survives.
function buildPassage(ctx: ComponentContext): Element {
  const icon = strAttr(ctx, 'icon');
  const iconEl = icon ? ecGlyph(icon) : undefined;
  return h('section', { className: ['ec-passage'] }, [
    headRow(ctx.slot('title'), iconEl),
    h('div', { className: ['section-body'] }, ctx.slot('body')),
  ]);
}

const passage = defineComponent({
  name: 'passage',
  label: 'Passage',
  description: 'A titled block of prose, with no card chrome.',
  use: 'Give a stretch of prose its own heading without boxing it in a card.',
  insertTemplate: ':::passage[Title]{icon="compass"}\nBody copy.\n:::',
  build: buildPassage,
  attributes: {
    icon: fields.icon({ label: 'Icon' }),
  },
  slots: [
    { name: 'title', label: 'Title', kind: 'inline', required: true },
    { name: 'body', label: 'Body', kind: 'markdown' },
  ],
  group: 'Page structure',
  icon: 'compass',
  preview: { attributes: { icon: 'compass' }, slots: { title: 'Title', body: 'Body copy.' } },
});

// ─── Aside: a quiet gloss, kept as its own leftover ────────────────────────
// Not rationalized into `callout`: the intent doesn't match. A callout draws attention to an
// important idea; a gloss is the opposite, a term definition that stays out of the way until a
// footnote dagger (app.css's `[href^="#gloss-"]`/`[id^="gloss-"]` rules) sends the reader to it.
// Waymark's starter set ships no footnote primitive, so this stays a small site-declared component.
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
  use: 'Define a term inline without breaking the reader\'s flow through the main text.',
  insertTemplate: ':::aside[Term]{id="gloss-term"}\nA short definition or note.\n:::',
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

// ─── Checklist: a two-column gear list ─────────────────────────────────────
// Kept as its own leftover: the training camp's packing list genuinely needs the `cols` modifier
// and its own check-box marker, distinct from callout's points (which carries a title and no
// column layout) and from a plain markdown list (which carries no marker at all).
function buildChecklist(ctx: ComponentContext): Element {
  const body = ctx.slot('body');
  const ul = markFirstListAs(body, 'ec-checklist');
  if (ul && strAttr(ctx, 'cols') === '2' && Array.isArray(ul.properties?.className)) {
    (ul.properties.className as string[]).push('ec-checklist-2col');
  }
  return ul ?? h('div', {}, body);
}

const checklist = defineComponent({
  name: 'checklist',
  label: 'Checklist',
  description: 'A check-box list for gear. `cols="2"` lays it out in two columns.',
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

// ─── Domain set: programs/program, week/day, spectrum/zone ────────────────
// Training-specific composites, named in the plan as ecxc's own domain vocabulary, carried over
// with an unchanged shape (only the attribute and slot declarations move to the v2 record form).

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
  if (ctaLabel) kids.push(h('span', { className: ['ec-program-go'] }, [ctaLabel, ' ', h('span', { className: ['ec-arr'] }, '→')]));
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
