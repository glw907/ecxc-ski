# Site Refresh Plan 1: Structural Floor and Shared Components

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the six-page nav, the editable Home, an `/archives` page, and the shared content directives (`aside`, `figure`, `gallery`), so the later content plans have a complete skeleton to write into.

**Architecture:** This is the first of three plans from `docs/superpowers/specs/2026-06-04-site-refresh-design.md`. It is structure and code, not page prose. Nav is the `primary` menu in `src/lib/site.config.yaml`. Pages are filename-routed markdown under `src/content/pages/`, rendered through cairn's public surface; explicit SvelteKit routes (Home `/`, `/contact`, `/archives`) override the catch-all. Directives are registered in `src/lib/markdown/components.ts` and exercised by vitest.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Tailwind 4 + DaisyUI 5, `@glw907/cairn-cms` (`^0.24.0`), vitest.

**Two refinements to the spec, applied here:**
- **Roster is deferred.** Its value is a name/role/photo card. With no photos staged, it duplicates `split`/`panel`. The Volunteers page (Plan 2) uses `split`/`panel` for the three bios for now; `roster` gets built when real coach photos land. The spec's Plan 1 roster line is superseded by this note.
- **Contact copy is inline.** Contact already has a bespoke route with a form. Its short intro copy goes in that route, not a second content page. Contact therefore lands in this plan (Task 6), and Plan 2 covers the three substantive carry-over pages (About, CrewLAB, Volunteers).

**Conventions this plan honors:**
- Design system (`.claude/rules/design-system.md`): `oklch()` only, no hex/rgb, no DaisyUI v4 short vars, color via `--color-*` tokens, fonts via `--font-*` tokens.
- New directives append to the registry in document order; the `ecnordicRegistry.names` test asserts the exact list, so each component task updates it.
- After any content file add/remove, regenerate the committed manifest with `npm run cairn:manifest`; `verifyManifest` (in `src/lib/content.ts`) fails the build on drift.

**Project gate (run before every commit):**

```bash
npm run check && npm test && npm run build
```

Expected: `check` 0 errors, `test` all passing, `build` exits 0.

---

## Task 1: Six-page nav, footer Archives link, welcome-post link repoint

**Files:**
- Modify: `src/lib/site.config.yaml` (the `menus.primary` list)
- Modify: `src/routes/+layout.svelte:25-57` (footer)
- Modify: `src/content/posts/2026-05-welcome.md:13`
- Run: `npm run cairn:manifest`

- [ ] **Step 1: Update the primary menu**

In `src/lib/site.config.yaml`, replace the `menus.primary` block with the six-page nav. Add Home first, drop Resources, retitle Volunteers to "Volunteers & Coaches" (the URL stays `/volunteers`):

```yaml
menus:
  primary:
    - { label: Home, url: / }
    - { label: About, url: /about }
    - { label: Training, url: /training }
    - { label: Volunteers & Coaches, url: /volunteers }
    - { label: CrewLAB, url: /crewlab }
    - { label: Contact, url: /contact }
```

- [ ] **Step 2: Add an Archives link to the footer**

In `src/routes/+layout.svelte`, add an Archives text link to the `.footer-links` row, after the email link (before the closing `</div>` at line 55). Use a plain anchor styled like the existing icon links:

```svelte
    <a href="/archives" class="footer-icon-link">
      <Icon label="Archives">
        {#snippet children()}
          <path d="M3 7h18v13H3z"/>
          <path d="M3 7l2-3h14l2 3"/>
          <line x1="10" y1="12" x2="14" y2="12"/>
        {/snippet}
      </Icon>
      <span class="footer-label">archives</span>
    </a>
```

- [ ] **Step 3: Repoint the welcome post's waiver link to CrewLAB**

In `src/content/posts/2026-05-welcome.md` line 13, change the `/waiver` link to the CrewLAB token. The sentence becomes:

```markdown
Summer training starts soon. Join us on [CrewLAB](cairn:pages/crewlab) for the schedule and the first session, and sign your [liability waiver](cairn:pages/crewlab) in CrewLAB before you show up.
```

- [ ] **Step 4: Regenerate the manifest**

Run: `npm run cairn:manifest`
Expected: `src/content/.cairn/index.json` regenerates. The welcome post already lists `crewlab` in its `links`, so the diff should be empty or trivial. Review with `git diff src/content/.cairn/index.json`.

- [ ] **Step 5: Run the gate**

Run: `npm run check && npm test && npm run build`
Expected: all green. The `url-inventory` and `url-policy` tests still pass (no content files added or removed yet; the nav change is config only).

- [ ] **Step 6: Commit**

```bash
git add src/lib/site.config.yaml src/routes/+layout.svelte src/content/posts/2026-05-welcome.md src/content/.cairn/index.json
git commit -m "Set six-page nav, footer archives link, repoint welcome waiver to CrewLAB

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: `aside` directive and the `info` glyph

A semantic `<aside>` for glosses (spenst, OD, SafeSport), styled lighter than a card. Optional title, optional icon. Never used for warnings.

**Files:**
- Modify: `src/lib/markdown/icons.ts` (add `info`)
- Modify: `src/lib/markdown/components.ts` (add `buildAside`, register `aside`)
- Modify: `src/tests/markdown/components.test.ts:7` (registry names)
- Modify: `src/tests/markdown/icons.test.ts:8-11` (assert `info` exists)
- Modify: `docs/directive-syntax.md` (document `aside` and `info`)

- [ ] **Step 1: Write the failing tests**

In `src/tests/markdown/components.test.ts`, update the names assertion and add an `aside` render test:

```ts
	it('registers the primitives in document order', () => {
		expect(ecnordicRegistry.names).toEqual([
			'card', 'grid', 'alert', 'cta', 'split', 'panel', 'passage', 'aside',
		]);
	});

	it('builds an :::aside into a semantic aside.ec-aside with the body', async () => {
		const html = await renderMarkdown(':::aside[Spenst]{icon="info"}\nExplosive, plyometric work.\n:::\n');
		expect(html).toContain('<aside class="ec-aside"');
		expect(html).toContain('Explosive, plyometric work.');
	});

	it('builds a titleless :::aside without an h2', async () => {
		const html = await renderMarkdown(':::aside\nA quick note.\n:::\n');
		expect(html).toContain('<aside class="ec-aside"');
		expect(html).not.toContain('<h2');
	});
```

In `src/tests/markdown/icons.test.ts`, add `'info'` to the name list at line 8 so the set includes it.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/tests/markdown/components.test.ts src/tests/markdown/icons.test.ts`
Expected: FAIL. `info` is undefined; `aside` is not in `names`; the aside renders nothing.

- [ ] **Step 3: Add the `info` glyph**

In `src/lib/markdown/icons.ts`, add this entry to `ICON_PATHS` (Phosphor "info", regular, 256 viewBox):

```ts
  // ← aside gloss
  info: 'M128,24A104,104,0,1,0,232,128,104.13,104.13,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z',
```

- [ ] **Step 4: Add `buildAside` and register the directive**

In `src/lib/markdown/components.ts`, add the build after `buildPassage`:

```ts
function buildAside(ctx: Ctx): Element {
	const icon = strAttr(ctx, 'icon');
	const role = strAttr(ctx, 'role');
	const title = ctx.slot('title');
	const kids: ElementContent[] = [];
	if (title.length > 0) {
		const headKids: ElementContent[] = [];
		if (icon) headKids.push(makeIcon(icon, role));
		headKids.push(h('h2', { className: ['card-title'] }, title));
		kids.push(h('div', { className: ['ec-head'] }, headKids));
	} else if (icon) {
		kids.push(makeIcon(icon, role));
	}
	kids.push(h('div', { className: ['section-body'] }, ctx.slot('body')));
	return h('aside', { className: ['ec-aside'] }, kids);
}
```

Add an optional-title slot constant near the slot constants:

```ts
const OPTIONAL_TITLE_SLOT = { name: 'title', label: 'Title', kind: 'inline' as const };
```

Append to the `components` array (after `passage`):

```ts
	{
		name: 'aside',
		label: 'Aside',
		description: 'A lightweight semantic aside for a gloss or side note. Not for warnings.',
		insertTemplate: ':::aside[Term]{icon="info"}\nA short definition or note.\n:::',
		build: buildAside,
		attributes: [ICON_ATTR, ROLE_ATTR],
		slots: [OPTIONAL_TITLE_SLOT, BODY_SLOT],
	},
```

- [ ] **Step 5: Style the aside**

Add aside styling to `src/app.css` near the other `.ec-*` block styles (find an existing `.ec-passage` or `.ec-alert` rule and place it alongside). Lighter than a card, an inline offset block:

```css
.ec-aside {
  border-inline-start: 3px solid var(--color-border);
  background: var(--color-base-200);
  border-radius: 0 8px 8px 0;
  padding: 0.85rem 1.1rem;
  margin-block: 1.25rem;
  font-size: 0.92rem;
}
.ec-aside .ec-head { margin-block-end: 0.4rem; }
.ec-aside .section-body { color: var(--color-body); }
```

If the codebase keeps `.ec-*` rules in a dedicated file rather than `src/app.css`, follow that location. Grep for `.ec-passage` to find where component styles live.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test -- src/tests/markdown/components.test.ts src/tests/markdown/icons.test.ts`
Expected: PASS.

- [ ] **Step 7: Verify the glyph renders**

Run: `npm run dev`, open a scratch page or the preview, confirm the `info` glyph draws a clean circle-i and is not a blank box. If it renders wrong, replace the path with the verified Phosphor "info" regular path from the Phosphor source. Stop the dev server.

- [ ] **Step 8: Document the directive**

In `docs/directive-syntax.md`: add `aside` to the directives table (optional title, `icon`/`role`, renders a semantic `<aside>`), add `info` to the valid icon-names list, and add a one-line note that `aside` is for glosses and never for warnings.

- [ ] **Step 9: Run the full gate and commit**

```bash
npm run check && npm test && npm run build
git add src/lib/markdown/icons.ts src/lib/markdown/components.ts src/app.css src/tests/markdown/components.test.ts src/tests/markdown/icons.test.ts docs/directive-syntax.md
git commit -m "Add aside directive and info glyph

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: `figure` and `gallery` directives

A captioned image and a small image set. Both wrap a standard markdown image in their body, so no new attribute type is needed. With no photos staged, these are built and tested now and used by later plans once real photos exist.

**Files:**
- Modify: `src/lib/markdown/components.ts` (add `buildFigure`, `buildGallery`, register both)
- Modify: `src/tests/markdown/components.test.ts` (names + render tests)
- Modify: `src/app.css` (figure/gallery styles)
- Modify: `docs/directive-syntax.md`

- [ ] **Step 1: Write the failing tests**

In `src/tests/markdown/components.test.ts`, update the names list and add render tests:

```ts
	it('registers the primitives in document order', () => {
		expect(ecnordicRegistry.names).toEqual([
			'card', 'grid', 'alert', 'cta', 'split', 'panel', 'passage', 'aside', 'figure', 'gallery',
		]);
	});

	it('wraps a :::figure body image in a figure with a figcaption', async () => {
		const html = await renderMarkdown(':::figure[Athletes at East]\n![Athletes warming up](/images/east.webp)\n:::\n');
		expect(html).toContain('<figure class="ec-figure"');
		expect(html).toContain('<img');
		expect(html).toContain('<figcaption>Athletes at East</figcaption>');
	});

	it('wraps a :::gallery body in an ec-gallery container', async () => {
		const html = await renderMarkdown(':::gallery[Camp]\n![One](/a.webp)\n![Two](/b.webp)\n:::\n');
		expect(html).toContain('<div class="ec-gallery"');
		expect(html).toContain('/a.webp');
		expect(html).toContain('/b.webp');
	});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/tests/markdown/components.test.ts`
Expected: FAIL (figure/gallery not registered).

- [ ] **Step 3: Add the builds and register**

In `src/lib/markdown/components.ts`, add after `buildAside`:

```ts
function buildFigure(ctx: Ctx): Element {
	const caption = ctx.slot('title');
	const kids: ElementContent[] = [...ctx.slot('body')];
	if (caption.length > 0) kids.push(h('figcaption', {}, caption));
	return h('figure', { className: ['ec-figure'] }, kids);
}

function buildGallery(ctx: Ctx): Element {
	const kids: ElementContent[] = [];
	if (ctx.slot('title').length > 0) kids.push(h('h2', { className: ['card-title'] }, ctx.slot('title')));
	kids.push(h('div', { className: ['ec-gallery'] }, ctx.slot('body')));
	return h('section', { className: ['ec-gallery-section'] }, kids);
}
```

Append to the `components` array after `aside`:

```ts
	{
		name: 'figure',
		label: 'Figure',
		description: 'A captioned image. The body holds a markdown image; the title is the caption.',
		insertTemplate: ':::figure[Caption]\n![Alt text](/images/photo.webp)\n:::',
		build: buildFigure,
		slots: [OPTIONAL_TITLE_SLOT, BODY_SLOT],
	},
	{
		name: 'gallery',
		label: 'Gallery',
		description: 'A small set of images laid out in a responsive grid.',
		insertTemplate: ':::gallery[Title]\n![One](/images/one.webp)\n![Two](/images/two.webp)\n:::',
		build: buildGallery,
		slots: [OPTIONAL_TITLE_SLOT, BODY_SLOT],
	},
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/tests/markdown/components.test.ts`
Expected: PASS. If `<figcaption>` assertion fails because the body image is wrapped in a `<p>`, that is fine; the test only checks the figcaption and img are present. Do not unwrap the paragraph unless a later visual pass calls for it.

- [ ] **Step 5: Style figure and gallery**

In the same `.ec-*` styles location as Task 2:

```css
.ec-figure {
  margin: 1.5rem 0;
}
.ec-figure img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 10px;
}
.ec-figure figcaption {
  font-size: 0.82rem;
  color: var(--color-muted);
  margin-block-start: 0.5rem;
  text-align: center;
}
.ec-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
  margin-block: 1.25rem;
}
.ec-gallery img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  aspect-ratio: 4 / 3;
}
```

- [ ] **Step 6: Document and commit**

Add `figure` and `gallery` to `docs/directive-syntax.md` (body holds a markdown image, title is the caption/heading). Then:

```bash
npm run check && npm test && npm run build
git add src/lib/markdown/components.ts src/tests/markdown/components.test.ts src/app.css docs/directive-syntax.md
git commit -m "Add figure and gallery directives

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: `/archives` page and the Home "see all posts" link

A single utility page in the 907.life mold: a tag index, posts grouped by year (reusing `ArchiveList.svelte`), and feed links. Not in primary nav; reached from the footer and from Home.

**Files:**
- Create: `src/routes/archives/+page.server.ts`
- Create: `src/routes/archives/+page.svelte`
- Modify: `src/routes/+page.svelte` (the existing "more news" link points to `/archives`)

- [ ] **Step 1: Write the archives loader**

Create `src/routes/archives/+page.server.ts`:

```ts
import type { PageServerLoad } from './$types';
import { postList } from '$lib/content';
import { posts } from '$lib/content';

export const prerender = true;

export const load: PageServerLoad = () => {
  return { posts: postList(), tags: posts.allTags() };
};
```

- [ ] **Step 2: Write the archives page**

Create `src/routes/archives/+page.svelte`. Reuse `ArchiveList` for the by-year section; render the tag index from `data.tags`; add feed links at the foot. Match the existing label/anchor styling:

```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import ArchiveList from '$lib/components/ArchiveList.svelte';
  import { tagUrl } from '$lib/utils';
  import { SITE_TITLE } from '$lib/config';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Archives — {SITE_TITLE}</title>
</svelte:head>

<h1 class="page-title">Archives</h1>

{#if data.tags.length > 0}
  <nav class="tag-index" aria-label="Tags">
    {#each data.tags as t}
      <a href={tagUrl(t.tag)} class="tag-chip">{t.tag} <span class="tag-count">{t.count}</span></a>
    {/each}
  </nav>
{/if}

<ArchiveList posts={data.posts} />

<div class="feeds">
  <a href="/feed.xml">RSS</a>
  <a href="/feed.json">JSON</a>
  <a href="/contact">Email</a>
</div>

<style>
  .tag-index {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-block: 1.5rem 0.5rem;
  }
  .tag-chip {
    font-family: var(--font-display);
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-body);
    background: var(--color-base-200);
    border-radius: 999px;
    padding: 0.25rem 0.7rem;
    text-decoration: none;
    transition: color 0.15s ease;
  }
  .tag-chip:hover { color: var(--color-primary); }
  .tag-count { color: var(--color-muted); }
  .feeds {
    display: flex;
    gap: 1.25rem;
    margin-block-start: 2rem;
    font-family: var(--font-display);
    font-size: 0.78rem;
  }
  .feeds a { color: var(--color-secondary); text-decoration: none; }
  .feeds a:hover { opacity: 0.75; }
</style>
```

- [ ] **Step 3: Verify the tag shape**

Run: `npm run check`
Expected: 0 errors. If `posts.allTags()` returns plain strings rather than `{ tag, count }` objects, adjust the tag-index loop to `{#each data.tags as tag}` with `tagUrl(tag)` and drop the count. Confirm by reading the type of `allTags()` in `src/lib/content.ts` or the cairn `delivery` types. The existing `/tags` route uses the same `posts.allTags()`, so match whatever `src/routes/tags/+page.svelte` does.

- [ ] **Step 4: Point Home's "more news" link at Archives**

In `src/routes/+page.svelte`, change the recent-posts card link from `href="#news"` to `href="/archives"` and its text to "see all posts →":

```svelte
    <a href="/archives" class="recent-more">see all posts →</a>
```

- [ ] **Step 5: Verify and commit**

Run: `npm run check && npm test && npm run build`
Expected: green. `url-inventory` is unaffected (archives is an explicit route, not a content page). Visit `/archives` in `npm run dev` to confirm it renders the tag index, the year groups, and the feed links.

```bash
git add src/routes/archives/+page.server.ts src/routes/archives/+page.svelte src/routes/+page.svelte
git commit -m "Add archives page; point Home see-all-posts link to it

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Editable Home content

Move the Home welcome copy out of the `WELCOME_BLURB` constant into a CMS-editable `home` page. The bespoke layout and the post feed stay; only the welcome-card body becomes content-driven.

**Note (cairn DX finding, recorded in Task 7):** this cairn version has no reusable-content-fragment concept, so the Home intro must be a routed page. That makes `/home` resolve as a bare page in addition to `/`. Acceptable in beta; a `/home` -> `/` redirect is a launch-time BACKLOG item.

**Files:**
- Create: `src/content/pages/home.md`
- Modify: `src/routes/+page.server.ts`
- Modify: `src/routes/+page.svelte` (render the home body in the welcome card)
- Modify: `src/lib/config.ts` (remove `WELCOME_BLURB`)
- Run: `npm run cairn:manifest`

- [ ] **Step 1: Write the home content page**

Create `src/content/pages/home.md`. The body is the welcome-card intro: the identity line plus a short what-we-do snapshot, in the coach voice. Activities named per the canonical-facts block. No directives needed; this renders into the existing card:

```markdown
---
title: "Home"
---
East Community Nordic is a free, volunteer-run summer training group for Anchorage high school Nordic skiers and cross-country runners. We meet three times a week from June through August to run, ride mountain bikes, lift, and roller-ski, building the fitness and skills that carry a season.

Any high school athlete is welcome, from rising 9th graders to graduates home from college for the summer. No skiing background needed.
```

- [ ] **Step 2: Render the home body in the loader**

In `src/routes/+page.server.ts`, render the `home` page body alongside the post feed. Add the `pages` and `linkResolver` imports and a `welcomeHtml` field:

```ts
import type { PageServerLoad } from './$types';
import { postList, posts, pages, linkResolver } from '$lib/content';
import { cairn } from '$lib/cairn.config';

export const load: PageServerLoad = async () => {
  const list = postList();
  const first = list[0];
  const home = pages.byId('home');
  const welcomeHtml = home ? await cairn.render(home.body, { resolve: linkResolver }) : '';
  const featured = first
    ? {
        permalink: first.permalink,
        title: first.title,
        date: first.date,
        tags: first.tags,
        html: await cairn.render(posts.byId(first.id)!.body, { resolve: linkResolver }),
      }
    : null;
  return { posts: list, featured, welcomeHtml };
};
```

- [ ] **Step 3: Render the body in the welcome card**

In `src/routes/+page.svelte`, replace the `WELCOME_BLURB` paragraph with the rendered home body, and drop the `WELCOME_BLURB` import. The welcome-body block becomes:

```svelte
    <div class="welcome-body">
      <h2 class="welcome-heading">Welcome</h2>
      <div class="welcome-blurb post-body">{@html data.welcomeHtml}</div>
      <a href="/about" class="welcome-link">Learn more →</a>
    </div>
```

Update the import line to drop `WELCOME_BLURB`:

```svelte
  import { HOMEPAGE_FEATURED_COUNT } from '$lib/config';
```

If `.welcome-blurb` styles assume a `<p>`, confirm the rendered `<div class="welcome-blurb post-body">` still looks right in dev; the `post-body` class carries prose styling. Adjust the `.welcome-blurb` rule if needed (it may target a `p`).

- [ ] **Step 4: Remove the dead constant**

In `src/lib/config.ts`, delete the `WELCOME_BLURB` export (lines 47-52) and its comment. Grep to confirm nothing else imports it:

Run: `grep -rn WELCOME_BLURB src`
Expected: no matches after the edits.

- [ ] **Step 5: Regenerate the manifest**

Run: `npm run cairn:manifest`
Expected: `src/content/.cairn/index.json` gains a `home` page entry (concept `pages`, permalink `/home`). Review with `git diff`.

- [ ] **Step 6: Verify and commit**

Run: `npm run check && npm test && npm run build`
Expected: green. `url-inventory` now expects `/home` from the new file and `site.all()` includes it, so they match. `verifyManifest` passes against the regenerated manifest. Visit `/` in dev: the welcome card shows the home body, and the post feed is unchanged.

```bash
git add src/content/pages/home.md src/routes/+page.server.ts src/routes/+page.svelte src/lib/config.ts src/content/.cairn/index.json
git commit -m "Make Home welcome copy CMS-editable via a home content page

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Contact page copy

Add the intro copy to the existing Contact route. Short, inline, no content page. The waiver is signed in CrewLAB, not returned here.

**Files:**
- Modify: `src/routes/contact/+page.svelte`

- [ ] **Step 1: Add the intro paragraph above the form**

In `src/routes/contact/+page.svelte`, add an intro paragraph between the `<h1>` and the `.contact-module` div. Coach voice, per the brief's Contact section:

```svelte
  <h1 class="page-title">Contact</h1>
  <p class="contact-intro">
    Questions about joining, donations, or volunteering? Send them here and a coach will get back to you.
    One thing this form does not do: the liability waiver is signed in CrewLAB, not returned through Contact.
    If your question is about the waiver, you will find it in CrewLAB.
  </p>
  <div class="contact-module" style={riseStyle(0)}>
    <ContactForm />
  </div>
```

Add a scoped style for `.contact-intro`:

```svelte
  .contact-intro {
    font-size: 1rem;
    line-height: 1.6;
    color: var(--color-body);
    max-width: 42rem;
    margin-block: 0 1.5rem;
  }
```

- [ ] **Step 2: Verify the copy passes the content guard and reads in voice**

The brief bans "not X, it's Y" and tacked-on em-dash fragments. Re-read the intro for those. The draft above uses a colon, not an em dash. Keep it that way.

- [ ] **Step 3: Verify and commit**

Run: `npm run check && npm test && npm run build`
Expected: green. Visit `/contact` in dev: the intro sits above the form.

```bash
git add src/routes/contact/+page.svelte
git commit -m "Add Contact page intro copy

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Wrap-up: DX findings, BACKLOG, STATUS

Record what Plan 1 surfaced and leave the tree ready for Plan 2.

**Files:**
- Modify: `docs/cairn-dx-findings.md`
- Modify: `BACKLOG.md`
- Modify: `docs/STATUS.md`

- [ ] **Step 1: Append the cairn DX finding**

In `docs/cairn-dx-findings.md`, append a dated finding: this cairn version has no reusable-content-fragment concept, so page-fragment copy like the Home welcome intro must be modeled as a routed page, which creates a redundant `/home` URL. The site wants a fragment concept (content that renders into a bespoke layout without owning a public route). Note that `src/lib/config.ts` already flagged this in its `WELCOME_BLURB` comment before this plan removed the constant.

- [ ] **Step 2: Add BACKLOG items**

In `BACKLOG.md`, using the `/log-issue` structured format, add:
- A launch-time redirect for `/home` -> `/` (the editable Home page also resolves at `/home`).
- The launch-time redirects for `/resources` and `/waiver` (deferred per the spec).
- A reminder that `roster` is deferred until real coach photos exist (Volunteers uses `split`/`panel` until then).

- [ ] **Step 3: Update STATUS**

In `docs/STATUS.md`, record that Plan 1 of the site refresh is done (nav, footer archives link, `aside`/`figure`/`gallery` directives, `/archives` page, editable Home, Contact copy), and that Plan 2 (About, CrewLAB, Volunteers content) is the immediate next action via subagent-driven-development. Keep the prose within the writing-voice rules (no em dashes; the `prose-guard` hook covers this path).

- [ ] **Step 4: Commit**

```bash
git add docs/cairn-dx-findings.md BACKLOG.md docs/STATUS.md
git commit -m "Record Plan 1 outcomes: cairn DX finding, BACKLOG redirects, STATUS

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-review against the spec

- **IA / nav:** Task 1 (six-page menu, footer archives, welcome repoint). ✓
- **Retire resources:** deferred to Plan 2's CrewLAB task, which re-homes the waiver/handbook/gear content before deleting the file (avoids a content gap). Task 7 BACKLOGs the launch redirect. Recorded here so it is not lost.
- **`aside` + `info` glyph:** Task 2. ✓
- **`figure` / `gallery`:** Task 3. ✓
- **`roster`:** deferred (documented at the top and BACKLOGged in Task 7). ✓
- **`/archives` page:** Task 4. ✓
- **Home editable wiring:** Task 5. ✓
- **Contact copy:** Task 6. ✓
- **cairn DX findings:** Task 7. ✓

**Type consistency:** `OPTIONAL_TITLE_SLOT` defined in Task 2 is reused in Task 3. The registry `names` array grows card→...→passage→aside (Task 2) →figure→gallery (Task 3); each task sets the full expected list. `welcomeHtml` is produced in Task 5 Step 2 and consumed in Step 3.

**Out of scope for Plan 1:** the `toc` and optional `schedule` components (Plan 3), and all page prose beyond Home and Contact (Plans 2 and 3).
