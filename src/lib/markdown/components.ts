// ECXC's component registry. This site's half of the render engine. Each
// ComponentDef reproduces the directive→hast build that lived in the old
// rehype-ec-primitives.ts, now composed from cairn-cms's shared helpers
// (cardShell/markFirstList/iconSpan) + this site's icon set + class names.
// cairn-cms (the engine) owns the machinery (stamp, slot partition, dispatch,
// rise stagger, recursion); this file is site code that owns the presentation.
//
// The engine passes each build a ComponentContext: declared attributes plus the
// partitioned slots. The title slot carries the directive [label] and renders into
// an <h2>; rehypeSlug runs after the dispatch, so an emitted <h2> picks up the same
// slug id the old `## heading` produced. The body slot carries the unmarked content.
import { h } from 'hastscript';
import type { Element, ElementContent } from 'hast';
import { defineRegistry, glyph, type ComponentDef } from '@glw907/cairn-cms';
import { iconSpan, cardShell, type MakeIcon } from '@glw907/cairn-cms/render';
import { ICON_PATHS } from './icons';

// Two small hast helpers this registry relies on. The 0.27.0 surface narrowing dropped
// isElement from the root barrel; 0.30.0 re-homed it under /render. The site keeps its own
// copies here because it also needs markFirstList, which the engine does not export, and both
// are pure (hast plus hastscript, already site deps).
function isElement(node: ElementContent | undefined): node is Element {
	return !!node && node.type === 'element';
}

// Tag the first <ul> among children with a class and strip its whitespace-only text
// nodes so the bare list serializes without newlines. Returns that <ul>.
function markFirstListAs(children: ElementContent[], cls: string): Element | undefined {
	const ul = children.find((c) => isElement(c) && c.tagName === 'ul') as Element | undefined;
	if (ul) {
		ul.properties = { ...ul.properties, className: [cls] };
		ul.children = (ul.children as ElementContent[]).filter(
			(c) => !(c.type === 'text' && /^\s*$/.test(c.value)),
		);
	}
	return ul;
}

function markFirstList(children: ElementContent[]): Element | undefined {
	return markFirstListAs(children, 'ec-grid');
}

// The structured input a build receives. Derived from the engine's ComponentDef so the
// site never needs the engine to export the ComponentContext type by name.
type Ctx = Parameters<ComponentDef['build']>[0];

const ecGlyph = (name: string): Element => glyph(name, ICON_PATHS);
const makeIcon: MakeIcon = (name, role) => iconSpan(ecGlyph(name), role);

const CARD_CLASS = ['card', 'ec-card', 'bg-base-100', 'border', 'border-base-300', 'shadow-sm'];
const CTA_CLASS = ['card', 'ec-card', 'ec-cta'];

// Read a string attribute, or undefined when absent or non-string.
function strAttr(ctx: Ctx, key: string): string | undefined {
	const value = ctx.attributes[key];
	return typeof value === 'string' ? value : undefined;
}

// The shared head row: `<div class="ec-head">` holding the optional icon span and the
// titled <h2> as direct siblings (no ec-head-text wrapper). The <h2> gets its slug id
// from rehypeSlug, which runs after this dispatch.
function head(ctx: Ctx): Element {
	const icon = strAttr(ctx, 'icon');
	const role = strAttr(ctx, 'role');
	const kids: ElementContent[] = [];
	if (icon) kids.push(makeIcon(icon, role));
	kids.push(h('h2', { className: ['card-title'] }, ctx.slot('title')));
	return h('div', { className: ['ec-head'] }, kids);
}

function buildCard(ctx: Ctx): Element {
	return cardShell(CARD_CLASS, [head(ctx), h('div', { className: ['section-body'] }, ctx.slot('body'))]);
}

function buildPassage(ctx: Ctx): Element {
	return h('section', { className: ['ec-passage'] }, [
		head(ctx),
		h('div', { className: ['section-body'] }, ctx.slot('body')),
	]);
}

// A quiet gloss: a small term label over a muted definition, no card chrome and no
// heading. The term is a styled <span>, not an <h2>, so a gloss stays out of the page
// heading outline and reads subordinate to body text.
function buildAside(ctx: Ctx): Element {
	const title = ctx.slot('title');
	const id = strAttr(ctx, 'id');
	const kids: ElementContent[] = [];
	if (title.length > 0) kids.push(h('span', { className: ['ec-aside-term'] }, title));
	kids.push(h('div', { className: ['ec-aside-def'] }, ctx.slot('body')));
	const aside = h('aside', { className: ['ec-aside'] }, kids);
	if (id) aside.properties.id = id;
	return aside;
}

// A gear checklist: the first body list, tagged for the check-box styling. It is a
// single column by default; `cols="2"` adds the two-column modifier for a long list
// like the camp packing list.
function buildChecklist(ctx: Ctx): Element {
	const body = ctx.slot('body');
	const ul = markFirstListAs(body, 'ec-checklist');
	if (ul && strAttr(ctx, 'cols') === '2' && Array.isArray(ul.properties.className)) {
		ul.properties.className.push('ec-checklist-2col');
	}
	return ul ?? h('div', body);
}

// A FAQ list: the first body list, tagged for the ruled question-and-answer styling.
function buildFaq(ctx: Ctx): Element {
	const body = ctx.slot('body');
	return markFirstListAs(body, 'ec-faq') ?? h('div', body);
}

// True when an element node carries the given class.
function hasClass(node: ElementContent, cls: string): boolean {
	return isElement(node) && Array.isArray(node.properties?.className) && node.properties.className.includes(cls);
}

// The built children of a container directive (panels, days, zones) arrive in the body
// slot already dispatched. Pull the ones carrying a given class, dropping whitespace.
function childrenByClass(ctx: Ctx, cls: string): ElementContent[] {
	return ctx.slot('body').filter((c) => hasClass(c, cls));
}

// A program offering as a calm clickable card. The head matches the site-wide row
// (a role-coloured glyph beside the name), then a meta eyebrow, a blurb, and a "go"
// link. `role="secondary"` is a no-op since the 2026-06-11 rebrand: every program card
// wears the working green, and fireweed stays reserved for actions.
function buildProgram(ctx: Ctx): Element {
	const icon = strAttr(ctx, 'icon');
	const href = strAttr(ctx, 'href') ?? '#';
	const meta = strAttr(ctx, 'meta');
	const cta = strAttr(ctx, 'cta');
	const role = strAttr(ctx, 'role');
	const headKids: ElementContent[] = [];
	if (icon) headKids.push(makeIcon(icon, role));
	headKids.push(h('span', { className: ['ec-program-name'] }, ctx.slot('title')));
	const kids: ElementContent[] = [h('div', { className: ['ec-program-head'] }, headKids)];
	if (meta) kids.push(h('span', { className: ['ec-program-meta'] }, meta));
	kids.push(h('div', { className: ['ec-program-blurb'] }, ctx.slot('body')));
	if (cta) kids.push(h('span', { className: ['ec-program-go'] }, [cta, ' ', h('span', { className: ['ec-arr'] }, '→')]));
	const className = ['ec-program'];
	if (role) className.push(`ec-program-${role}`);
	return h('a', { className, href }, kids);
}

// A major page section: a headed band wrapping its content (intro prose, subsection
// headings, and nested directives), so the page reads as distinct acts. The engine
// builds the nested directives first, so they arrive in the body slot already rendered.
// The title <h2> picks up its slug from rehypeSlug, so a program card can jump to it.
// `role="secondary"` is a no-op since the 2026-06-11 rebrand: every band header wears
// the working green, and fireweed stays reserved for actions.
function buildSection(ctx: Ctx): Element {
	const icon = strAttr(ctx, 'icon');
	const role = strAttr(ctx, 'role');
	const meta = strAttr(ctx, 'meta');
	const titleRow: ElementContent[] = [];
	if (icon) {
		const iconEl = makeIcon(icon, role);
		// Name hook so a single glyph can get an optical-seat nudge in CSS (e.g. the tent,
		// whose base sits high in its viewBox). Keyed to the glyph, so it travels with the
		// icon rather than the section's colour role.
		const cls = iconEl.properties.className;
		if (Array.isArray(cls)) cls.push(`ec-ico-${icon}`);
		titleRow.push(iconEl);
	}
	titleRow.push(h('h2', { className: ['ec-band-title'] }, ctx.slot('title')));
	const headKids: ElementContent[] = [];
	if (meta) headKids.push(h('span', { className: ['ec-band-eyebrow'] }, meta));
	headKids.push(h('div', { className: ['ec-band-titlerow'] }, titleRow));
	const className = ['ec-band'];
	if (role) className.push(`ec-band-${role}`);
	return h('section', { className }, [
		h('header', { className: ['ec-band-head'] }, headKids),
		h('div', { className: ['ec-band-body'] }, ctx.slot('body')),
	]);
}

function buildPrograms(ctx: Ctx): Element {
	return h('div', { className: ['ec-programs'] }, childrenByClass(ctx, 'ec-program'));
}

// One day-row of the weekly schedule: day, time, then focus. `kind` (group/solo/rest)
// is carried as a class for authors who want it, but the current rail styles every row
// the same; `time` is the optional time label.
function buildDay(ctx: Ctx): Element {
	const kind = strAttr(ctx, 'kind') ?? 'solo';
	const time = strAttr(ctx, 'time');
	const kids: ElementContent[] = [
		h('div', { className: ['ec-week-day'] }, ctx.slot('title')),
		h('div', { className: ['ec-week-time'] }, time ? [time] : []),
		h('div', { className: ['ec-week-focus'] }, ctx.slot('body')),
	];
	return h('div', { className: ['ec-week-row', `ec-week-${kind}`] }, kids);
}

// The schedule panel: the day rows, plus any trailing prose in the body rendered as a
// footer note (the off-day line). Both sit inside one `.ec-week` surface so the rail
// reads as a single UI unit rather than a list followed by a stray paragraph.
function buildWeek(ctx: Ctx): Element {
	const rows = childrenByClass(ctx, 'ec-week-row');
	// Anything else in the body (the trailing off-day paragraph) becomes the footer note.
	const foot = ctx.slot('body').filter((c) => isElement(c) && !hasClass(c, 'ec-week-row'));
	const kids: ElementContent[] = [h('div', { className: ['ec-week-rows'] }, rows)];
	if (foot.length > 0) kids.push(h('div', { className: ['ec-week-foot'] }, foot));
	return h('div', { className: ['ec-week'] }, kids);
}

// One zone of the training-group spectrum: a name and who it is for. The ordinal is a
// CSS counter, so authors never number them by hand.
function buildZone(ctx: Ctx): Element {
	return h('div', { className: ['ec-zone'] }, [
		h('div', { className: ['ec-zone-name'] }, ctx.slot('title')),
		h('div', { className: ['ec-zone-who'] }, ctx.slot('body')),
	]);
}

// The spectrum: a gradient bar with one segment per zone, then the zone labels. The bar
// communicates "one continuum, split by pace" rather than separate groups.
function buildSpectrum(ctx: Ctx): Element {
	const zones = childrenByClass(ctx, 'ec-zone');
	const bar = h(
		'div',
		{ className: ['ec-spectrum-bar'] },
		zones.map(() => h('span')),
	);
	return h('div', { className: ['ec-spectrum'] }, [bar, h('div', { className: ['ec-spectrum-zones'] }, zones)]);
}

function buildGallery(ctx: Ctx): Element {
	const kids: ElementContent[] = [];
	if (ctx.slot('title').length > 0)
		kids.push(h('div', { className: ['ec-head'] }, [h('h2', { className: ['card-title'] }, ctx.slot('title'))]));
	kids.push(h('div', { className: ['ec-gallery'] }, ctx.slot('body')));
	return h('section', {}, kids);
}

function buildGrid(ctx: Ctx): Element {
	const body = ctx.slot('body');
	const titled = ctx.slot('title').length > 0;
	const ul = markFirstList(body); // tags the first <ul> as ec-grid in place
	if (!titled) return ul ?? h('div', body); // nested use: emit the bare ec-grid list
	// Keep the whole body (intro paragraph plus the now-ec-grid list); the mutation above
	// already marked the list in place.
	return cardShell(CARD_CLASS, [head(ctx), h('div', { className: ['section-body'] }, body)]);
}

function buildAlert(ctx: Ctx): Element {
	let icon = strAttr(ctx, 'icon');
	const role = strAttr(ctx, 'role');
	// The stamper applies defaultIconByRole only to its special dataIcon marker, not to the
	// declared dataAttrIcon this build reads, so a caution alert with no explicit icon owns
	// its default here.
	if (!icon && role === 'caution') icon = 'warning';
	const titleKids: ElementContent[] = [];
	if (icon) titleKids.push(ecGlyph(icon)); // glyph inline at the label head
	titleKids.push(...ctx.slot('title'));
	const h2 = h('h2', {}, titleKids); // no card-title class; rehypeSlug adds the id
	return h('div', { role: 'alert', className: ['ec-alert', `ec-alert-${role}`] }, [
		h('div', { className: ['ec-alert-body'] }, [h2, ...ctx.slot('body')]),
	]);
}

// Append btn classes to the authored `a.download-link` (raw HTML, reparsed by
// rehype-raw), wherever it sits in the body.
function promoteDownloadLink(children: ElementContent[]): void {
	for (const c of children) {
		if (!isElement(c)) continue;
		const cls = c.properties?.className;
		if (c.tagName === 'a' && Array.isArray(cls) && cls.includes('download-link')) {
			c.properties.className = [...cls, 'btn', 'btn-primary'];
		} else {
			promoteDownloadLink(c.children as ElementContent[]);
		}
	}
}

function buildCta(ctx: Ctx): Element {
	const body = ctx.slot('body');
	promoteDownloadLink(body);
	const icon = strAttr(ctx, 'icon');
	const headKids: ElementContent[] = [];
	if (icon) headKids.push(makeIcon(icon));
	headKids.push(h('h2', { className: ['card-title'] }, ctx.slot('title')));
	return h('section', { className: CTA_CLASS }, [
		h('div', { className: ['card-body'] }, [
			h('div', { className: ['ec-cta-head'] }, headKids),
			h('div', { className: ['section-body'] }, body),
		]),
	]);
}

function buildPanel(ctx: Ctx): Element {
	const icon = strAttr(ctx, 'icon');
	const role = strAttr(ctx, 'role');
	const kids: ElementContent[] = [];
	if (icon) kids.push(iconSpan(ecGlyph(icon), role));
	kids.push(...ctx.slot('body'));
	return h('div', { className: ['ec-panel'] }, kids);
}

function buildSplit(ctx: Ctx): Element {
	// The body holds the nested panels, already turned into .ec-panel divs by the
	// dispatcher's recursion (panel is not a declared split slot, so it stays in body).
	const panels = childrenByClass(ctx, 'ec-panel');
	const headEl = h('div', { className: ['ec-head'] }, [h('h2', { className: ['card-title'] }, ctx.slot('title'))]); // no icon
	const body = h('div', { className: ['section-body'] }, [h('div', { className: ['ec-split'] }, panels)]);
	return cardShell(CARD_CLASS, [headEl, body]);
}

const ICON_ATTR = { key: 'icon', label: 'Icon', type: 'icon' as const };
const ROLE_ATTR = { key: 'role', label: 'Role', type: 'select' as const, options: ['primary', 'secondary'] };
const HREF_ATTR = {
	key: 'href',
	label: 'Link',
	type: 'text' as const,
	pattern: {
		source: '^(#|/|cairn:|https?://)',
		message: 'Use an anchor (#id), a path (/page), a cairn: link, or a full URL.',
	},
};
const META_ATTR = { key: 'meta', label: 'Meta line', type: 'text' as const };
const CTA_ATTR = { key: 'cta', label: 'Link label', type: 'text' as const };
const KIND_ATTR = { key: 'kind', label: 'Kind', type: 'select' as const, options: ['group', 'solo', 'rest'] };
const TIME_ATTR = { key: 'time', label: 'Time', type: 'text' as const };
const TITLE_SLOT = { name: 'title', label: 'Title', kind: 'inline' as const, required: true };
const OPTIONAL_TITLE_SLOT = { name: 'title', label: 'Title', kind: 'inline' as const };
const BODY_SLOT = { name: 'body', label: 'Body', kind: 'markdown' as const };

const components: ComponentDef[] = [
	{
		name: 'card',
		label: 'Card',
		description: 'A bordered card with a titled head row and body content.',
		insertTemplate: ':::card[Title]{icon="flag"}\nBody copy.\n:::',
		build: buildCard,
		attributes: [ICON_ATTR, ROLE_ATTR],
		slots: [TITLE_SLOT, BODY_SLOT],
		group: 'Cards',
		icon: 'info',
		preview: { attributes: { icon: 'flag' }, slots: { title: 'Title', body: 'Body copy.' } },
	},
	{
		name: 'grid',
		label: 'Grid',
		description: 'A card whose first list lays out as a responsive grid.',
		insertTemplate: ':::grid[Title]{icon="path"}\n- Item one\n- Item two\n:::',
		build: buildGrid,
		attributes: [ICON_ATTR, ROLE_ATTR],
		slots: [TITLE_SLOT, BODY_SLOT],
		group: 'Cards',
		icon: 'path',
		preview: { attributes: { icon: 'path' }, slots: { title: 'Title', body: '- Item one\n- Item two' } },
	},
	{
		name: 'alert',
		label: 'Alert',
		description: 'A callout box keyed to a role (e.g. caution).',
		insertTemplate: ':::alert[Heads up]{role="caution"}\nWhat to watch for.\n:::',
		build: buildAlert,
		attributes: [ICON_ATTR, { key: 'role', label: 'Role', type: 'select', required: true, options: ['caution'] }],
		slots: [TITLE_SLOT, BODY_SLOT],
		group: 'Callouts',
		icon: 'warning',
		preview: { attributes: { role: 'caution' }, slots: { title: 'Heads up', body: 'What to watch for.' } },
	},
	{
		name: 'cta',
		label: 'Call to action',
		description: 'A centered card with a chip icon and an emphasized link.',
		insertTemplate:
			':::cta[Get started]{icon="flag"}\n<a class="download-link" href="#">Sign up</a>\n:::',
		build: buildCta,
		attributes: [ICON_ATTR],
		slots: [TITLE_SLOT, BODY_SLOT],
		group: 'Cards',
		icon: 'flag',
		preview: {
			attributes: { icon: 'flag' },
			slots: { title: 'Get started', body: '<a class="download-link" href="#">Sign up</a>' },
		},
	},
	{
		name: 'split',
		label: 'Split',
		description: 'A card laying nested :::panel blocks side by side.',
		insertTemplate:
			'::::split[Title]\n:::panel{icon="hand-coins"}\nFirst panel.\n:::\n\n:::panel{icon="handshake"}\nSecond panel.\n:::\n::::',
		build: buildSplit,
		slots: [TITLE_SLOT, BODY_SLOT],
		group: 'Cards',
		icon: 'handshake',
		preview: {
			slots: {
				title: 'Title',
				body: ':::panel{icon="hand-coins"}\nFirst panel.\n:::\n\n:::panel{icon="handshake"}\nSecond panel.\n:::',
			},
		},
	},
	{
		name: 'panel',
		label: 'Panel',
		description: 'A single panel with an optional icon (used inside a split).',
		insertTemplate: ':::panel{icon="hand-coins"}\nPanel content.\n:::',
		build: buildPanel,
		attributes: [ICON_ATTR, ROLE_ATTR],
		slots: [BODY_SLOT],
		group: 'Cards',
		icon: 'hand-coins',
		hidden: true,
		preview: { attributes: { icon: 'hand-coins' }, slots: { body: 'Panel content.' } },
	},
	{
		name: 'passage',
		label: 'Passage',
		description: 'A lightweight titled section without the card chrome.',
		insertTemplate: ':::passage[Title]{icon="compass"}\nBody copy.\n:::',
		build: buildPassage,
		attributes: [ICON_ATTR, ROLE_ATTR],
		slots: [TITLE_SLOT, BODY_SLOT],
		group: 'Callouts',
		icon: 'compass',
		preview: { attributes: { icon: 'compass' }, slots: { title: 'Title', body: 'Body copy.' } },
	},
	{
		name: 'aside',
		label: 'Aside',
		description: 'A quiet gloss or side note: a small term over muted text. Not for warnings.',
		insertTemplate: ':::aside[Term]\nA short definition or note.\n:::',
		build: buildAside,
		attributes: [{ key: 'id', label: 'Anchor id', type: 'text' }],
		slots: [OPTIONAL_TITLE_SLOT, BODY_SLOT],
		group: 'Callouts',
		icon: 'chat-circle',
		preview: { slots: { title: 'Term', body: 'A short definition or note.' } },
	},
	{
		name: 'section',
		label: 'Section',
		description: 'A major page section: a headed band wrapping its content (prose and nested directives).',
		insertTemplate:
			':::::section[Section title]{icon="path" meta="Eyebrow"}\nSection content, including other directives.\n:::::',
		build: buildSection,
		attributes: [ICON_ATTR, ROLE_ATTR, META_ATTR],
		slots: [TITLE_SLOT, BODY_SLOT],
		group: 'Page structure',
		icon: 'flag',
		preview: {
			attributes: { icon: 'path', meta: 'Eyebrow' },
			slots: { title: 'Section title', body: 'Section content, including other directives.' },
		},
	},
	{
		name: 'programs',
		label: 'Program cards',
		description: 'A row of side-by-side program cards (nested :::program blocks).',
		insertTemplate:
			'::::programs\n:::program[Summer training]{icon="path" href="#summer-training" meta="Jun–Aug" cta="See summer training"}\nWhat it is.\n:::\n\n:::program[Talkeetna camp]{icon="tent" href="#talkeetna-camp" meta="July" cta="See the camp" role="secondary"}\nWhat it is.\n:::\n::::',
		build: buildPrograms,
		slots: [BODY_SLOT],
		group: 'Page structure',
		icon: 'users-three',
		preview: {
			slots: {
				body: ':::program[Summer training]{icon="path" href="#summer-training" meta="Jun–Aug" cta="See summer training"}\nWhat it is.\n:::\n\n:::program[Talkeetna camp]{icon="tent" href="#talkeetna-camp" meta="July" cta="See the camp" role="secondary"}\nWhat it is.\n:::',
			},
		},
	},
	{
		name: 'program',
		label: 'Program card',
		description: 'A clickable program-offering card (used inside :::programs).',
		insertTemplate: ':::program[Name]{icon="path" href="#anchor" meta="Dates" cta="Learn more"}\nShort blurb.\n:::',
		build: buildProgram,
		attributes: [ICON_ATTR, HREF_ATTR, META_ATTR, CTA_ATTR, ROLE_ATTR],
		slots: [TITLE_SLOT, BODY_SLOT],
		group: 'Page structure',
		icon: 'person-simple-run',
		hidden: true,
		preview: {
			attributes: { icon: 'path', href: '#anchor', meta: 'Dates', cta: 'Learn more' },
			slots: { title: 'Name', body: 'Short blurb.' },
		},
	},
	{
		name: 'week',
		label: 'Weekly schedule',
		description: 'A seven-day schedule rail (nested :::day blocks).',
		insertTemplate:
			'::::week\n:::day[Mon]{kind="group" time="10:30–12:15"}\n**Group practice.** Focus.\n:::\n:::day[Tue]{kind="solo" time="on your own"}\nSolo work.\n:::\n::::',
		build: buildWeek,
		slots: [BODY_SLOT],
		group: 'Page structure',
		icon: 'calendar-blank',
		preview: {
			slots: {
				body: ':::day[Mon]{kind="group" time="10:30–12:15"}\n**Group practice.** Focus.\n:::\n:::day[Tue]{kind="solo" time="on your own"}\nSolo work.\n:::',
			},
		},
	},
	{
		name: 'day',
		label: 'Schedule day',
		description: 'One day-row of the weekly schedule (used inside :::week).',
		insertTemplate: ':::day[Mon]{kind="group" time="10:30–12:15"}\nFocus for the day.\n:::',
		build: buildDay,
		attributes: [KIND_ATTR, TIME_ATTR],
		slots: [TITLE_SLOT, BODY_SLOT],
		group: 'Page structure',
		icon: 'calendar-blank',
		hidden: true,
		preview: {
			attributes: { kind: 'group', time: '10:30–12:15' },
			slots: { title: 'Mon', body: 'Focus for the day.' },
		},
	},
	{
		name: 'spectrum',
		label: 'Training-group spectrum',
		description: 'A pace continuum with labelled zones (nested :::zone blocks).',
		insertTemplate:
			'::::spectrum\n:::zone[Group one]\nWho it is for.\n:::\n\n:::zone[Group two]\nWho it is for.\n:::\n::::',
		build: buildSpectrum,
		slots: [BODY_SLOT],
		group: 'Page structure',
		icon: 'users-three',
		preview: {
			slots: { body: ':::zone[Group one]\nWho it is for.\n:::\n\n:::zone[Group two]\nWho it is for.\n:::' },
		},
	},
	{
		name: 'zone',
		label: 'Spectrum zone',
		description: 'One zone of the training-group spectrum (used inside :::spectrum).',
		insertTemplate: ':::zone[Group name]\nWho it is for.\n:::',
		build: buildZone,
		slots: [TITLE_SLOT, BODY_SLOT],
		group: 'Page structure',
		icon: 'person-simple-run',
		hidden: true,
		preview: { slots: { title: 'Group name', body: 'Who it is for.' } },
	},
	{
		name: 'gallery',
		label: 'Gallery',
		description: 'A small set of images laid out in a responsive grid.',
		insertTemplate: ':::gallery[Title]\n![One](/images/one.webp)\n![Two](/images/two.webp)\n:::',
		build: buildGallery,
		slots: [OPTIONAL_TITLE_SLOT, BODY_SLOT],
		group: 'Media',
		icon: 'info',
		preview: { slots: { title: 'Title', body: '![One](/images/one.webp)\n![Two](/images/two.webp)' } },
	},
	{
		name: 'checklist',
		label: 'Checklist',
		description: 'A check-box list for gear. `cols="2"` lays it out in two columns. Use under a heading.',
		insertTemplate: '::::checklist\n- First item\n- Second item\n::::',
		build: buildChecklist,
		attributes: [{ key: 'cols', label: 'Columns', type: 'select', options: ['1', '2'] }],
		slots: [BODY_SLOT],
		group: 'Lists',
		icon: 'backpack',
		preview: { slots: { body: '- First item\n- Second item' } },
	},
	{
		name: 'faq',
		label: 'FAQ list',
		description: 'A ruled question-and-answer list; each item leads with a bold question.',
		insertTemplate: '::::faq\n- **A question?** The answer.\n- **Another?** The answer.\n::::',
		build: buildFaq,
		slots: [BODY_SLOT],
		group: 'Lists',
		icon: 'question',
		preview: { slots: { body: '- **A question?** The answer.\n- **Another?** The answer.' } },
	},
];

export const ecxcRegistry = defineRegistry({ components });
