# Pass 5 — Directive Rendering Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a remark/rehype AST pipeline that renders inline container directives (`:::card`, `:::grid`, `:::alert`, `:::cta`, `::::split`/`:::panel`, `:::passage`) into the exact HTML the current `decorate*()` builders emit — fully unit-tested, exported as `renderMarkdown`, but **not yet wired into the site**. The cutover and page migration are Pass 6.

**Architecture:** A new `src/lib/markdown/render.ts` exposes `renderMarkdown(content)` running `remark-parse → remark-gfm → remark-directive → remark-ec-directives (mark) → remark-rehype(allowDangerousHtml) → rehype-raw → rehype-slug → rehype-ec-primitives (restructure) → rehype-stringify`. The mark step stamps each known directive node with `data-*` markers; the restructure step rewrites those marked hast elements into the kit's HTML, injecting icons as real `hastscript` SVG nodes. This pass adds code only — `markdownToHtml` and the pages are untouched, so the live site does not change. Pass 6 repoints `markdownToHtml` at `renderMarkdown`, deletes the `decorate*` machinery, and migrates the content.

**Tech Stack:** TypeScript · unified/remark/rehype (remark-directive@4, remark-rehype@11, rehype-raw@7, rehype-slug@6, rehype-stringify@10, hastscript@9) · Vitest.

**Spec:** `docs/superpowers/specs/2026-05-24-inline-directives-design.md`

**Render contract (target for the HTML this pipeline emits):** the same classes the `ecCard`/`ecCta`/alert/split builders produce. `data-section` attributes are intentionally dropped (no CSS/JS consumes them). Headings carry `rehype-slug` ids. Glyph path data is copied verbatim from the current `ICON`/`PANEL_ICONS` maps so glyphs are byte-identical.

---

## Reference: directive vocabulary

Two optional attributes throughout: `icon=NAME` (a key in `ICON_PATHS`) and `role=ROLE` (`primary` default · `secondary` · `caution`).

| Directive | Output |
|---|---|
| `:::card{icon=NAME role=ROLE}` | `<section class="card ec-card …">` → `.card-body` → `.ec-head`(icon + `h2.card-title`) + `.section-body` |
| `:::grid{icon=NAME role=ROLE}` | with an `h2`: a grid card (as card, body list → `ul.ec-grid`); without an `h2` (nested): the bare `ul.ec-grid` lifted out |
| `:::alert{role=caution}` | `<div role="alert" class="ec-alert ec-alert-caution">` → `.ec-alert-body` → `h2`(icon prepended inline) + body; `role` selects the variant + default icon (caution→warning) |
| `:::cta{icon=NAME}` | `<section class="card ec-card ec-cta …">` → `.card-body.items-center.text-center` → `span.ec-chip`(icon) + `h2.card-title` + `.section-body` (contained `a.download-link` gains `btn btn-primary`) |
| `::::split` ⊃ `:::panel{icon=NAME role=ROLE}` | card with `.ec-head`(title only, no icon) + `.section-body` → `.ec-split` of `.ec-panel`s (each: icon span + content) |
| `:::passage{icon=NAME}` | `<section class="ec-passage">` → `.ec-head`(icon + `h2.card-title`) + `.section-body` (no card chrome) |
| *(no directive)* | rendered as-is |

Nesting uses remark-directive's colon-count rule: a container holding other directives opens with **four** colons (`::::split`, `::::card`), inner ones use three.

`ICON_PATHS` keys (glyph name ← source in current `[slug]/+page.svelte`):
`path`←`ICON['what-we-do']` · `warning`←`ICON['risks']` · `users-three`←`ICON['who-can-join']` · `compass`←`ICON['program-philosophy']` · `flag`←`ICON['getting-started']` · `calendar-blank`←`ICON['schedule']` · `backpack`←`ICON['what-to-bring']` · `tent`←`ICON['talkeetna-camp']` · `chat-circle`←`ICON['why-we-use-it']` · `person-simple-run`←`ICON['for-athletes']` · `hand-coins`←`PANEL_ICONS[0]` · `handshake`←`PANEL_ICONS[1]`.

---

## File structure

- **Create** `src/lib/markdown/icons.ts` — `ICON_PATHS` map + `glyph(name)` returning a hast `svg` element.
- **Create** `src/lib/markdown/remark-ec-directives.ts` — mark step (mdast).
- **Create** `src/lib/markdown/rehype-ec-primitives.ts` — restructure step (hast).
- **Create** `src/lib/markdown/render.ts` — the `renderMarkdown(content)` pipeline.
- **Create** `src/tests/markdown/icons.test.ts`, `src/tests/markdown/directives.test.ts`.
- `src/lib/utils.ts`, `src/routes/[slug]/+page.svelte`, and content files are **NOT touched this pass.**

---

## Task 1: Add dependencies

**Files:** Modify `package.json` (+ lockfile).

- [ ] **Step 1: Install runtime + type deps**

Run:
```bash
cd /home/glw907/Projects/ecnordic-ski
npm install unified remark-parse remark-directive remark-rehype rehype-raw rehype-slug rehype-stringify hastscript hast-util-to-html
npm install -D @types/mdast @types/hast mdast-util-directive
```
Expected: installs succeed. `remark`, `remark-gfm`, and `remark-html` stay (remark-html is removed in Pass 6).

- [ ] **Step 2: Verify versions resolved to expected majors**

Run: `npm ls remark-directive remark-rehype rehype-raw rehype-slug rehype-stringify hastscript`
Expected: `remark-directive@4.x`, `remark-rehype@11.x`, `rehype-raw@7.x`, `rehype-slug@6.x`, `rehype-stringify@10.x`, `hastscript@9.x`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add remark/rehype directive pipeline dependencies"
```

---

## Task 2: Icon module

**Files:** Create `src/lib/markdown/icons.ts`; Test `src/tests/markdown/icons.test.ts`.

- [ ] **Step 1: Write the failing test**

`src/tests/markdown/icons.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { toHtml } from 'hast-util-to-html';
import { ICON_PATHS, glyph } from '$lib/markdown/icons';

describe('icons', () => {
  it('exposes every glyph the pages reference', () => {
    for (const name of [
      'path', 'warning', 'users-three', 'compass', 'flag', 'calendar-blank',
      'backpack', 'tent', 'chat-circle', 'person-simple-run', 'hand-coins', 'handshake',
    ]) {
      expect(ICON_PATHS[name], name).toBeTruthy();
    }
  });

  it('builds an ec-glyph svg with the path data', () => {
    const html = toHtml(glyph('flag'), { space: 'html' });
    expect(html).toContain('<svg class="ec-glyph" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">');
    expect(html).toContain(`<path d="${ICON_PATHS['flag']}">`);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/tests/markdown/icons.test.ts`
Expected: FAIL — cannot resolve `$lib/markdown/icons`.

- [ ] **Step 3: Create the module**

`src/lib/markdown/icons.ts` — copy each `d=""` path string verbatim from the `ICON` / `PANEL_ICONS` maps currently in `src/routes/[slug]/+page.svelte` (lines ~53–79), keyed by the glyph names below. Copying the exact strings keeps the rendered glyphs byte-identical.

```ts
import { s } from 'hastscript';
import type { Element } from 'hast';

// Phosphor (regular) path data, keyed by glyph name. Sourced verbatim from the
// pre-Pass-5 ICON / PANEL_ICONS maps so the rendered glyphs are unchanged.
export const ICON_PATHS: Record<string, string> = {
  path: 'M200,168a32.06,…',                 // ← ICON['what-we-do']
  warning: 'M236.8,188.09,…',               // ← ICON['risks']
  'users-three': 'M244.8,150.4a8,…',        // ← ICON['who-can-join']
  compass: 'M128,24A104,…',                 // ← ICON['program-philosophy']
  flag: 'M42.76,50A8,…',                    // ← ICON['getting-started']
  'calendar-blank': 'M208,32H184V24a8,…',   // ← ICON['schedule']
  backpack: 'M168,40.58V32A24,…',           // ← ICON['what-to-bring']
  tent: 'M255.31,188.75l-64-144A8,…',       // ← ICON['talkeetna-camp']
  'chat-circle': 'M128,24A104,104,0,0,0,36.18,…', // ← ICON['why-we-use-it']
  'person-simple-run': 'M120,56a32,…',      // ← ICON['for-athletes']
  'hand-coins': 'M230.33,141.06a24.43,…',   // ← PANEL_ICONS[0]
  handshake: 'M254.3,107.91,…',             // ← PANEL_ICONS[1]
};

// Build the inline SVG glyph as a real hast node (no raw-string injection).
// Mirrors the old svg() helper: class ec-glyph, 256 viewBox, currentColor fill.
export function glyph(name: string): Element {
  return s(
    'svg',
    { className: ['ec-glyph'], viewBox: '0 0 256 256', fill: 'currentColor', ariaHidden: 'true' },
    [s('path', { d: ICON_PATHS[name] })],
  );
}
```

> When implementing: open `src/routes/[slug]/+page.svelte`, copy the full `d` string for each listed source into the matching key. Do not abbreviate — the `…` above are placeholders for the real path data.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/tests/markdown/icons.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/markdown/icons.ts src/tests/markdown/icons.test.ts
git commit -m "Add Phosphor icon map + hast glyph builder"
```

---

## Task 3: Mark step + render pipeline + restructure scaffolding (card)

Wires the full pipeline end to end with the **card** primitive working, so every later primitive is just a new branch. The pipeline is exported as `renderMarkdown` and exercised directly by tests; nothing in the running site calls it yet.

**Files:** Create `src/lib/markdown/remark-ec-directives.ts`, `src/lib/markdown/rehype-ec-primitives.ts`, `src/lib/markdown/render.ts`; Test `src/tests/markdown/directives.test.ts`.

- [ ] **Step 1: Write the failing tests**

`src/tests/markdown/directives.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '$lib/markdown/render';

describe('pipeline baseline', () => {
  it('renders unmarked content as plain prose', async () => {
    const html = await renderMarkdown('Just a paragraph.\n');
    expect(html.trim()).toBe('<p>Just a paragraph.</p>');
  });

  it('adds slug ids to headings', async () => {
    const html = await renderMarkdown(':::card{icon=path}\n## Sign Up\n\nx\n:::\n');
    expect(html).toContain('id="sign-up"');
  });
});

describe('card directive', () => {
  it('renders a module card with icon + heading + body', async () => {
    const html = await renderMarkdown(':::card{icon=path}\n## What we do\n\nBody text.\n:::\n');
    expect(html).toContain('<section class="card ec-card bg-base-100 border border-base-300 shadow-sm"');
    expect(html).toContain('<div class="card-body">');
    expect(html).toContain('<div class="ec-head"><span class="ec-icon"><svg class="ec-glyph"');
    expect(html).toContain('<h2 class="card-title"');
    expect(html).toContain('What we do');
    expect(html).toContain('<div class="section-body"><p>Body text.</p></div>');
  });

  it('applies the secondary role to the icon', async () => {
    const html = await renderMarkdown(':::card{icon=users-three role=secondary}\n## Who\n\nx\n:::\n');
    expect(html).toContain('<span class="ec-icon ec-icon-secondary">');
  });

  it('staggers the first primitive at --rise:0.16s', async () => {
    const html = await renderMarkdown(':::card{icon=path}\n## A\n\nx\n:::\n');
    expect(html).toContain('style="--rise:0.16s"');
  });

  it('leaves a non-grid card list as a plain list', async () => {
    const html = await renderMarkdown(':::card{icon=path}\n## A\n\n- one\n- two\n:::\n');
    expect(html).toContain('<ul>\n<li>one</li>');
    expect(html).not.toContain('ec-grid');
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/tests/markdown/directives.test.ts`
Expected: FAIL — cannot resolve `$lib/markdown/render`.

- [ ] **Step 3: Create the mark step**

`src/lib/markdown/remark-ec-directives.ts`:
```ts
import type { Root } from 'mdast';
import type { ContainerDirective } from 'mdast-util-directive';
import { visit } from 'unist-util-visit';

const PRIMITIVES = new Set(['card', 'grid', 'alert', 'cta', 'split', 'panel', 'passage']);

// An alert's role picks its default icon (caution → the warning glyph).
const ALERT_DEFAULT_ICON: Record<string, string> = { caution: 'warning' };

// Stamp each known container directive with data-* markers carrying its
// primitive name, icon, and role. No structure is built here — rehype-ec-primitives
// rewrites the marked elements once their children have been converted to hast.
export default function remarkEcDirectives() {
  return (tree: Root) => {
    visit(tree, 'containerDirective', (node: ContainerDirective) => {
      if (!PRIMITIVES.has(node.name)) return;
      const attrs = node.attributes ?? {};
      const role = attrs.role || undefined;
      let icon = attrs.icon || undefined;
      if (node.name === 'alert' && !icon && role) icon = ALERT_DEFAULT_ICON[role];

      const properties: Record<string, string> = { dataPrimitive: node.name };
      if (icon) properties.dataIcon = icon;
      if (role) properties.dataRole = role;

      const data = node.data ?? (node.data = {});
      data.hName = 'div';
      data.hProperties = properties;
    });
  };
}
```

- [ ] **Step 4: Create the restructure step (scaffolding + card)**

`src/lib/markdown/rehype-ec-primitives.ts`:
```ts
import type { Root, Element, ElementContent } from 'hast';
import { h } from 'hastscript';
import { glyph } from './icons';

function isElement(node: ElementContent | undefined): node is Element {
  return !!node && node.type === 'element';
}

function riseStyle(idx: number): string {
  return `--rise:${(0.16 + idx * 0.04).toFixed(2)}s`;
}

// Bare glyph span; secondary role adds the cobalt modifier.
function iconSpan(name: string, role?: string): Element {
  const className = role === 'secondary' ? ['ec-icon', 'ec-icon-secondary'] : ['ec-icon'];
  return h('span', { className }, [glyph(name)]);
}

// Pull the section's <h2> out, retag it .card-title, and build the .ec-head row
// (optional icon + heading). Returns the head plus the remaining body children.
function splitHead(node: Element, withIcon: boolean): { head: Element; rest: ElementContent[] } {
  const children = node.children as ElementContent[];
  const i = children.findIndex((c) => isElement(c) && c.tagName === 'h2');
  const h2 = children[i] as Element;
  h2.properties = { ...h2.properties, className: ['card-title'] };
  const rest = children.filter((_, j) => j !== i);
  const icon = node.properties?.dataIcon as string | undefined;
  const role = node.properties?.dataRole as string | undefined;
  const headKids: ElementContent[] = [];
  if (withIcon && icon) headKids.push(iconSpan(icon, role));
  headKids.push(h2);
  return { head: h('div', { className: ['ec-head'] }, headKids), rest };
}

const CARD_CLASS = ['card', 'ec-card', 'bg-base-100', 'border', 'border-base-300', 'shadow-sm'];

function cardShell(classes: string[], rise: string | undefined, body: ElementContent[]): Element {
  const properties: Record<string, unknown> = { className: classes };
  if (rise) properties.style = rise;
  return h('section', properties, [h('div', { className: ['card-body'] }, body)]);
}

function buildCard(node: Element, rise?: string): Element {
  const { head, rest } = splitHead(node, true);
  return cardShell(CARD_CLASS, rise, [head, h('div', { className: ['section-body'] }, rest)]);
}

// Recurse into a node's children, transforming any nested primitive sections
// (a grid inside a card, panels inside a split) WITHOUT a rise stagger.
function transformChildren(children: ElementContent[]): ElementContent[] {
  return children.map((c) => {
    if (isElement(c) && c.properties?.dataPrimitive) return transform(c);
    if (isElement(c)) c.children = transformChildren(c.children as ElementContent[]);
    return c;
  });
}

function transform(node: Element, rise?: string): Element {
  node.children = transformChildren(node.children as ElementContent[]);
  switch (node.properties?.dataPrimitive as string) {
    case 'card': return buildCard(node, rise);
    default: return node; // other primitives added in later tasks
  }
}

// Top-level primitives get a document-order rise stagger; everything else
// (lede, intro paragraphs, the page-toc nav) passes through untouched.
export default function rehypeEcPrimitives() {
  return (tree: Root) => {
    let idx = 0;
    tree.children = (tree.children as ElementContent[]).map((child) => {
      if (isElement(child) && child.properties?.dataPrimitive) {
        return transform(child, riseStyle(idx++));
      }
      if (isElement(child)) child.children = transformChildren(child.children as ElementContent[]);
      return child;
    });
  };
}
```

- [ ] **Step 5: Create the pipeline**

`src/lib/markdown/render.ts`:
```ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkEcDirectives from './remark-ec-directives';
import rehypeEcPrimitives from './rehype-ec-primitives';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDirective)
  .use(remarkEcDirectives)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSlug)
  .use(rehypeEcPrimitives)
  .use(rehypeStringify);

export async function renderMarkdown(content: string): Promise<string> {
  const file = await processor.process(content);
  return String(file);
}
```

- [ ] **Step 6: Run to verify the tests pass**

Run: `npx vitest run src/tests/markdown/directives.test.ts`
Expected: PASS (baseline + card).

- [ ] **Step 7: Commit**

```bash
git add src/lib/markdown/remark-ec-directives.ts src/lib/markdown/rehype-ec-primitives.ts src/lib/markdown/render.ts src/tests/markdown/directives.test.ts
git commit -m "Add directive render pipeline with the card primitive"
```

---

## Task 4: Passage primitive

**Files:** Modify `src/lib/markdown/rehype-ec-primitives.ts`; Modify `src/tests/markdown/directives.test.ts`.

- [ ] **Step 1: Add the failing test**

Append to `src/tests/markdown/directives.test.ts`:
```ts
describe('passage directive', () => {
  it('renders a titled prose passage with no card chrome', async () => {
    const html = await renderMarkdown(':::passage{icon=chat-circle}\n## Why we use it\n\nReasons.\n:::\n');
    expect(html).toContain('<section class="ec-passage" style="--rise:0.16s">');
    expect(html).toContain('<div class="ec-head"><span class="ec-icon"><svg');
    expect(html).toContain('<h2 class="card-title"');
    expect(html).toContain('<div class="section-body"><p>Reasons.</p></div>');
    expect(html).not.toContain('ec-card');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/tests/markdown/directives.test.ts -t passage`
Expected: FAIL.

- [ ] **Step 3: Implement `buildPassage` and register it**

Add to `rehype-ec-primitives.ts` (after `buildCard`):
```ts
function buildPassage(node: Element, rise?: string): Element {
  const { head, rest } = splitHead(node, true);
  const properties: Record<string, unknown> = { className: ['ec-passage'] };
  if (rise) properties.style = rise;
  return h('section', properties, [head, h('div', { className: ['section-body'] }, rest)]);
}
```
Add the case in `transform`'s switch:
```ts
    case 'passage': return buildPassage(node, rise);
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/tests/markdown/directives.test.ts -t passage`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/markdown/rehype-ec-primitives.ts src/tests/markdown/directives.test.ts
git commit -m "Add passage primitive"
```

---

## Task 5: Alert primitive

**Files:** Modify `src/lib/markdown/rehype-ec-primitives.ts`; Modify `src/tests/markdown/directives.test.ts`.

- [ ] **Step 1: Add the failing test**

Append:
```ts
describe('alert directive', () => {
  it('renders a subtle caution alert with the icon inline in the label', async () => {
    const html = await renderMarkdown(':::alert{role=caution}\n## Risks\n\nFalls happen.\n:::\n');
    expect(html).toContain('<div role="alert" class="ec-alert ec-alert-caution" style="--rise:0.16s">');
    expect(html).toContain('<div class="ec-alert-body">');
    expect(html).toContain('<h2 id="risks"><svg class="ec-glyph"');
    expect(html).toContain('Risks</h2>');
    expect(html).toContain('<p>Falls happen.</p>');
    expect(html).not.toContain('card-title');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/tests/markdown/directives.test.ts -t alert`
Expected: FAIL.

- [ ] **Step 3: Implement `buildAlert` and register it**

Add to `rehype-ec-primitives.ts`:
```ts
function buildAlert(node: Element, rise?: string): Element {
  const children = node.children as ElementContent[];
  const i = children.findIndex((c) => isElement(c) && c.tagName === 'h2');
  const h2 = children[i] as Element;
  const icon = node.properties?.dataIcon as string | undefined;
  if (icon) (h2.children as ElementContent[]).unshift(glyph(icon)); // icon inline at the label head
  const rest = children.filter((_, j) => j !== i);
  const role = node.properties?.dataRole as string;
  const properties: Record<string, unknown> = { role: 'alert', className: ['ec-alert', `ec-alert-${role}`] };
  if (rise) properties.style = rise;
  return h('div', properties, [h('div', { className: ['ec-alert-body'] }, [h2, ...rest])]);
}
```
Add the case:
```ts
    case 'alert': return buildAlert(node, rise);
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/tests/markdown/directives.test.ts -t alert`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/markdown/rehype-ec-primitives.ts src/tests/markdown/directives.test.ts
git commit -m "Add alert primitive"
```

---

## Task 6: Grid primitive (grid card + nested bare grid)

**Files:** Modify `src/lib/markdown/rehype-ec-primitives.ts`; Modify `src/tests/markdown/directives.test.ts`.

- [ ] **Step 1: Add the failing tests**

Append:
```ts
describe('grid directive', () => {
  it('renders a grid card: heading + body list becomes ec-grid', async () => {
    const html = await renderMarkdown(
      ':::grid{icon=compass}\n## Philosophy\n\nIntro.\n\n- **One** a\n- **Two** b\n:::\n',
    );
    expect(html).toContain('<section class="card ec-card');
    expect(html).toContain('<div class="ec-head"><span class="ec-icon"><svg');
    expect(html).toContain('<div class="section-body"><p>Intro.</p>');
    expect(html).toContain('<ul class="ec-grid">');
    expect(html).toContain('<li><strong>One</strong> a</li>');
  });

  it('lifts a nested grid (no heading) to a bare ec-grid list', async () => {
    const html = await renderMarkdown(
      '::::card{icon=tent}\n## Camp\n\n### Logistics\n\n:::grid\n- **Travel** by car\n:::\n::::\n',
    );
    expect(html).toContain('<h3 id="logistics">Logistics</h3>');
    expect(html).toContain('<ul class="ec-grid"><li><strong>Travel</strong> by car</li></ul>');
    expect(html.match(/ec-card/g)?.length).toBe(1); // the nested grid did not become its own card
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/tests/markdown/directives.test.ts -t grid`
Expected: FAIL.

- [ ] **Step 3: Implement `buildGrid` and register it**

Add to `rehype-ec-primitives.ts`:
```ts
function markFirstList(children: ElementContent[]): Element | undefined {
  const ul = children.find((c) => isElement(c) && c.tagName === 'ul') as Element | undefined;
  if (ul) ul.properties = { ...ul.properties, className: ['ec-grid'] };
  return ul;
}

function buildGrid(node: Element, rise?: string): Element {
  const children = node.children as ElementContent[];
  const hasHeading = children.some((c) => isElement(c) && c.tagName === 'h2');
  const ul = markFirstList(children);
  if (!hasHeading) return ul ?? node; // nested use: emit the bare ec-grid list
  const { head, rest } = splitHead(node, true);
  return cardShell(CARD_CLASS, rise, [head, h('div', { className: ['section-body'] }, rest)]);
}
```
Add the case:
```ts
    case 'grid': return buildGrid(node, rise);
```

> `markFirstList` runs before `splitHead`, so the already-classed `ul.ec-grid` is what ends up in `rest`.

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/tests/markdown/directives.test.ts -t grid`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/markdown/rehype-ec-primitives.ts src/tests/markdown/directives.test.ts
git commit -m "Add grid primitive (grid card + nested bare grid)"
```

---

## Task 7: CTA primitive

**Files:** Modify `src/lib/markdown/rehype-ec-primitives.ts`; Modify `src/tests/markdown/directives.test.ts`.

- [ ] **Step 1: Add the failing test**

Append:
```ts
describe('cta directive', () => {
  it('renders a centered CTA card, chip icon, and promotes the download link', async () => {
    const html = await renderMarkdown(
      ':::cta{icon=flag}\n## Getting started\n\nDo this.\n\n<a href="/waiver" class="download-link">Get it →</a>\n:::\n',
    );
    expect(html).toContain('<section class="card ec-card ec-cta bg-base-100 border border-primary/30 shadow-sm" style="--rise:0.16s">');
    expect(html).toContain('<div class="card-body items-center text-center">');
    expect(html).toContain('<span class="ec-chip"><svg class="ec-glyph"');
    expect(html).toContain('<h2 class="card-title"');
    expect(html).toContain('class="download-link btn btn-primary"');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/tests/markdown/directives.test.ts -t cta`
Expected: FAIL.

- [ ] **Step 3: Implement `buildCta` and register it**

Add to `rehype-ec-primitives.ts`:
```ts
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

const CTA_CLASS = ['card', 'ec-card', 'ec-cta', 'bg-base-100', 'border', 'border-primary/30', 'shadow-sm'];

function buildCta(node: Element, rise?: string): Element {
  const children = node.children as ElementContent[];
  const i = children.findIndex((c) => isElement(c) && c.tagName === 'h2');
  const h2 = children[i] as Element;
  h2.properties = { ...h2.properties, className: ['card-title'] };
  const rest = children.filter((_, j) => j !== i);
  promoteDownloadLink(rest);
  const icon = node.properties?.dataIcon as string;
  const properties: Record<string, unknown> = { className: CTA_CLASS };
  if (rise) properties.style = rise;
  return h('section', properties, [
    h('div', { className: ['card-body', 'items-center', 'text-center'] }, [
      h('span', { className: ['ec-chip'] }, [glyph(icon)]),
      h2,
      h('div', { className: ['section-body'] }, rest),
    ]),
  ]);
}
```
Add the case:
```ts
    case 'cta': return buildCta(node, rise);
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/tests/markdown/directives.test.ts -t cta`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/markdown/rehype-ec-primitives.ts src/tests/markdown/directives.test.ts
git commit -m "Add cta primitive"
```

---

## Task 8: Split + panel primitives; pipeline complete

**Files:** Modify `src/lib/markdown/rehype-ec-primitives.ts`; Modify `src/tests/markdown/directives.test.ts`.

- [ ] **Step 1: Add the failing test**

Append:
```ts
describe('split + panel directives', () => {
  it('renders a card with a heading and two iconned panels', async () => {
    const html = await renderMarkdown(
      '::::split\n## Costs\n\n:::panel{icon=hand-coins}\n**Free.** No fee.\n:::\n\n:::panel{icon=handshake role=secondary}\n**Help.** Pitch in.\n:::\n::::\n',
    );
    expect(html).toContain('<section class="card ec-card');
    expect(html).toContain('<div class="ec-head"><h2 class="card-title"'); // head has no icon
    expect(html).toContain('<div class="section-body"><div class="ec-split">');
    expect(html).toContain('<div class="ec-panel"><span class="ec-icon"><svg');
    expect(html).toContain('<div class="ec-panel"><span class="ec-icon ec-icon-secondary"><svg');
    expect(html).toContain('<strong>Free.</strong> No fee.');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/tests/markdown/directives.test.ts -t split`
Expected: FAIL.

- [ ] **Step 3: Implement `buildPanel` + `buildSplit` and register them**

Add to `rehype-ec-primitives.ts`:
```ts
function buildPanel(node: Element): Element {
  const icon = node.properties?.dataIcon as string | undefined;
  const role = node.properties?.dataRole as string | undefined;
  const kids: ElementContent[] = [];
  if (icon) kids.push(iconSpan(icon, role));
  kids.push(...(node.children as ElementContent[]));
  return h('div', { className: ['ec-panel'] }, kids);
}

function buildSplit(node: Element, rise?: string): Element {
  // Panels were already turned into .ec-panel divs by transformChildren.
  const children = node.children as ElementContent[];
  const i = children.findIndex((c) => isElement(c) && c.tagName === 'h2');
  const h2 = children[i] as Element;
  h2.properties = { ...h2.properties, className: ['card-title'] };
  const panels = children.filter(
    (c) => isElement(c) && Array.isArray(c.properties?.className) && c.properties.className.includes('ec-panel'),
  );
  const head = h('div', { className: ['ec-head'] }, [h2]); // no icon at the split head
  const body = h('div', { className: ['section-body'] }, [h('div', { className: ['ec-split'] }, panels)]);
  return cardShell(CARD_CLASS, rise, [head, body]);
}
```
Add the cases:
```ts
    case 'split': return buildSplit(node, rise);
    case 'panel': return buildPanel(node);
```

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: PASS — every directive suite + icons green.

- [ ] **Step 5: Type check**

Run: `npm run check`
Expected: no errors. (The `decorate*` code in `+page.svelte` is untouched and still type-checks; it is removed in Pass 6.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/markdown/rehype-ec-primitives.ts src/tests/markdown/directives.test.ts
git commit -m "Add split + panel primitives; directive pipeline complete"
```

---

## Self-review notes

- **Spec coverage (this pass = the mechanism):** deps (1) · icon module byte-identical glyphs (2) · mark step (3) · `renderMarkdown` pipeline incl. rehype-raw/rehype-slug ordering (3) · all primitives card/passage/alert/grid/cta/split/panel (3–8) · nested bare grid for the Logistics case (6) · explicit split panels (8) · `--rise` stagger in document order (3) · `data-section` omitted by construction. The cutover, content migration, `decorate*`/`wrapSections`/`boldParasToGrid` deletion, docs, and screenshot regression are **Pass 6** (`2026-05-24-pass-6-directive-cutover.md`).
- **No placeholders:** the `…` in the icon map are explicit "copy verbatim from the named source" instructions, not vague TODOs.
- **Type/name consistency:** `transform`/`transformChildren`/`splitHead`/`cardShell`/`iconSpan`/`riseStyle`/`markFirstList`/`promoteDownloadLink`/`buildCard…buildPassage` defined once (3–8) and referenced consistently; `ICON_PATHS`/`glyph` (2) consumed by the rehype plugin; `renderMarkdown` (3) is the single public entry, consumed by tests this pass and by `markdownToHtml` in Pass 6.
