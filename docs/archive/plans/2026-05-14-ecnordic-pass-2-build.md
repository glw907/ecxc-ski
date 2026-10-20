# ECN Nordic — Pass 2: Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all ECN-specific features on top of the Pass 1 scaffold: 3-segment post URLs, events data layer, @schedule-x calendar, ICS endpoint, file-driven static pages, standalone contact page, placeholder theme, and first production deploy to ecnordic.ski.

**Architecture:** Adapts 907.life's posts pipeline to 3-segment URLs (`/year/month/slug/`). Adds a parallel events pipeline (`src/lib/events.ts`) feeding both the @schedule-x calendar and an ICS endpoint. Static pages are file-driven from `src/content/pages/`. Contact form is a standalone route. Placeholder ECN theme (crimson/navy) defers visual polish to Pass 3.

**Tech Stack:** SvelteKit 2 · TypeScript · Tailwind CSS v4 · DaisyUI v5 · @schedule-x/svelte · remark + remark-gfm · Pagefind · adapter-cloudflare · Cloudflare Email Workers · Turnstile · Vitest

---

> **Working directory:** All tasks run inside `~/Projects/ecnordic-ski/`. Pass 1 must be complete before starting.

---

## File Map

| Path | Action | Responsibility |
|---|---|---|
| `src/lib/types.ts` | Modify | Drop `day`; add `CalendarEvent`, `EventType`, `StaticPage` |
| `src/lib/utils.ts` | Modify | `postUrl` → 3-segment; add `eventDateRange` |
| `src/lib/posts.ts` | Modify | 3-segment filename parse; `getPost(year, month, slug)` |
| `src/lib/events.ts` | Create | Events data layer |
| `src/lib/ics.ts` | Create | RFC 5545 ICS generator |
| `src/lib/pages.ts` | Create | Static pages data layer |
| `src/routes/[year]/[month]/[day]/[slug]/` | Delete | Replaced by 3-segment route |
| `src/routes/[year]/[month]/[slug]/+page.server.ts` | Create | Load post by year/month/slug |
| `src/routes/[year]/[month]/[slug]/+page.svelte` | Create | Post detail page |
| `src/routes/calendar/+page.server.ts` | Create | Load upcoming events |
| `src/routes/calendar/+page.svelte` | Create | @schedule-x grid + event list + ICS link |
| `src/routes/calendar.ics/+server.ts` | Create | ICS feed endpoint |
| `src/routes/[slug]/+page.server.ts` | Create | Load static page, 404 if missing |
| `src/routes/[slug]/+page.svelte` | Create | Static page renderer |
| `src/routes/contact/+page.server.ts` | Create | Form action (Turnstile + Email Workers) |
| `src/routes/contact/+page.svelte` | Create | Contact form |
| `src/routes/+layout.svelte` | Modify | ECN nav links, footer contact href |
| `src/app.css` | Modify | ECN fonts, placeholder color tokens, DaisyUI ecn themes |
| `src/hooks.server.ts` | Modify | Theme names: `silk`/`dim` → `ecn`/`ecn-dark` |
| `src/content/posts/2026-05-14-welcome.md` | Create | Placeholder post |
| `src/content/events/2026-12-06-kincaid-classic.md` | Create | Sample event |
| `src/content/events/2026-11-22-early-season-camp.md` | Create | Sample event |
| `src/content/pages/about.md` | Create | About page content |
| `src/content/pages/talkeetna-camp.md` | Create | Talkeetna Camp page content |
| `src/content/pages/resources.md` | Create | Resources page content |
| `vitest.config.ts` | Create | Vitest config with `$lib` alias |
| `src/tests/events.test.ts` | Create | Unit tests for events data layer |
| `src/tests/ics.test.ts` | Create | Unit tests for ICS generator |
| `.github/workflows/deploy.yml` | Verify | Confirm secrets names are correct |

---

## Task 1: Update types and URL helpers

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/utils.ts`

- [ ] **Step 1: Rewrite `src/lib/types.ts`**

ECN post filenames are `YYYY-MM-slug.md` — no `day` field needed.

```typescript
interface PostBase {
  slug: string;
  year: string;
  month: string;
  title: string;
  /** ISO date string from frontmatter, e.g. "2026-05-14" */
  date: string;
  draft: boolean;
  description: string;
  tags: string[];
}

export type PostSummary = PostBase;
export type PostDetail = PostBase & { html: string };
export type Post = PostSummary | PostDetail;

export type EventType = 'race' | 'camp' | 'clinic' | 'training' | 'social';

export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO date string, e.g. "2026-12-06" */
  start: string;
  /** ISO date string (inclusive), e.g. "2026-12-07" */
  end: string;
  location?: string;
  type: EventType;
  description?: string;
}

export interface StaticPage {
  slug: string;
  title: string;
  html: string;
}
```

- [ ] **Step 2: Rewrite `src/lib/utils.ts`**

```typescript
import { SITE_LOCALE } from '$lib/config';
import type { PostSummary, CalendarEvent } from '$lib/types';

function parseUtcDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day ?? 1));
}

export function formatDate(iso: string): string {
  return parseUtcDate(iso).toLocaleDateString(SITE_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatShortDate(iso: string): string {
  return parseUtcDate(iso).toLocaleDateString(SITE_LOCALE, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function toRFC822(iso: string): string {
  return parseUtcDate(iso).toUTCString();
}

export function toISODateTime(iso: string): string {
  return iso + 'T00:00:00Z';
}

/** Returns the canonical relative URL for a post, e.g. /2026/05/spring-dryland/ */
export function postUrl(post: Pick<PostSummary, 'year' | 'month' | 'slug'>): string {
  return `/${post.year}/${post.month}/${post.slug}/`;
}

/** Returns the canonical relative URL for a tag page, e.g. /tags/training/ */
export function tagUrl(tag: string): string {
  return `/tags/${tag}/`;
}

/** Returns a formatted date range string for a calendar event. */
export function eventDateRange(event: CalendarEvent): string {
  if (event.start === event.end) return formatDate(event.start);
  return `${formatDate(event.start)} – ${formatDate(event.end)}`;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/utils.ts
git commit -m "Update types and URL helpers for 3-segment post URLs"
```

---

## Task 2: Update posts data layer

**Files:**
- Modify: `src/lib/posts.ts`

- [ ] **Step 1: Rewrite `src/lib/posts.ts`**

Filename format: `YYYY-MM-slug.md`. Parse into `{year, month, slug}`. `getPost` takes `(year, month, slug)`.

```typescript
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
import type { PostDetail, PostSummary } from './types.js';

const rawFiles = import.meta.glob<string>('/src/content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
});

let _cachedPosts: PostSummary[] | null = null;

function parseFilepath(filepath: string): Pick<PostSummary, 'year' | 'month' | 'slug'> {
  const filename = filepath.split('/').pop()!.replace('.md', '');
  const [year, month, ...slugParts] = filename.split('-');
  return { year, month, slug: slugParts.join('-') };
}

function buildSummary(
  coords: Pick<PostSummary, 'year' | 'month' | 'slug'>,
  data: Record<string, unknown>
): PostSummary {
  return {
    ...coords,
    title: data.title as string ?? '',
    date: data.date instanceof Date
      ? data.date.toISOString().slice(0, 10)
      : String(data.date ?? ''),
    draft: data.draft as boolean ?? false,
    description: data.description as string ?? '',
    tags: data.tags as string[] ?? []
  };
}

export function getAllPosts(includeDrafts = false): PostSummary[] {
  if (!includeDrafts && _cachedPosts) return _cachedPosts;

  const posts: PostSummary[] = [];
  for (const [filepath, raw] of Object.entries(rawFiles)) {
    const coords = parseFilepath(filepath);
    const { data } = matter(raw);
    if (!includeDrafts && data.draft) continue;
    posts.push(buildSummary(coords, data));
  }
  const sorted = posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!includeDrafts) _cachedPosts = sorted;
  return sorted;
}

export function getAllTags(): { tag: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

export function getPostsByTag(tag: string): PostSummary[] {
  return getAllPosts().filter(p => p.tags.includes(tag));
}

export async function getPost(
  year: string,
  month: string,
  slug: string
): Promise<PostDetail | null> {
  const filepath = `/src/content/posts/${year}-${month}-${slug}.md`;
  const raw = rawFiles[filepath];
  if (!raw) return null;

  const { data, content } = matter(raw);
  const processed = await remark().use(remarkGfm).use(remarkHtml).process(content);

  return {
    ...buildSummary({ year, month, slug }, data),
    html: processed.toString()
  };
}
```

- [ ] **Step 2: Update `src/lib/feed.ts`**

Open `src/lib/feed.ts`. Find any calls to `postUrl` that pass a `day` argument and remove it. The function signature changed to `postUrl({ year, month, slug })`. Also find the sender address `noreply@907.life` and change it to `noreply@ecnordic.ski` if present.

- [ ] **Step 3: Commit**

```bash
git add src/lib/posts.ts src/lib/feed.ts
git commit -m "Update posts data layer for 3-segment URLs"
```

---

## Task 3: Replace post route with 3-segment version

**Files:**
- Delete: `src/routes/[year]/[month]/[day]/[slug]/`
- Create: `src/routes/[year]/[month]/[slug]/+page.server.ts`
- Create: `src/routes/[year]/[month]/[slug]/+page.svelte`

- [ ] **Step 1: Remove the 4-segment route**

```bash
rm -rf "src/routes/[year]/[month]/[day]"
```

- [ ] **Step 2: Create `src/routes/[year]/[month]/[slug]/+page.server.ts`**

```typescript
import { error } from '@sveltejs/kit';
import { getPost } from '$lib/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const post = await getPost(params.year, params.month, params.slug);
  if (!post) error(404, 'Post not found');
  return { post };
};
```

- [ ] **Step 3: Create `src/routes/[year]/[month]/[slug]/+page.svelte`**

```svelte
<script lang="ts">
  import { SITE_TITLE } from '$lib/config';
  import { formatDate } from '$lib/utils';

  let { data } = $props();
  let { post } = $derived(data);
</script>

<svelte:head>
  <title>{post.title} — {SITE_TITLE}</title>
  <meta name="description" content={post.description} />
</svelte:head>

<article>
  <header>
    <time class="post-date" datetime={post.date}>{formatDate(post.date)}</time>
    <h1 class="page-title">{post.title}</h1>
  </header>

  <div class="post-body">
    {@html post.html}
  </div>

  {#if post.tags.length}
    <ul class="post-tags">
      {#each post.tags as tag}
        <li class="post-tag"><a href="/tags/{tag}">#{tag}</a></li>
      {/each}
    </ul>
  {/if}
</article>

<p class="back-link"><a href="/">← Home</a></p>
```

- [ ] **Step 4: Check tag pages still compile**

Open `src/routes/tags/[tag]/+page.svelte` and verify it uses `postUrl(post)` rather than manually constructing the URL with `post.day`. If it constructs the URL manually, update it to use `postUrl`.

- [ ] **Step 5: Commit**

```bash
git add "src/routes/[year]/"
git commit -m "Replace 4-segment post route with 3-segment [year]/[month]/[slug]"
```

---

## Task 4: Set up Vitest and events data layer

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/events.ts`
- Create: `src/content/events/2026-12-06-kincaid-classic.md`
- Create: `src/content/events/2026-11-22-early-season-camp.md`
- Create: `src/tests/events.test.ts`

- [ ] **Step 1: Install Vitest**

```bash
npm install --save-dev vitest
```

- [ ] **Step 2: Add test scripts to `package.json`**

In the `scripts` section, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '$lib': resolve(__dirname, 'src/lib'),
    },
  },
  test: {
    include: ['src/tests/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 4: Write the failing tests**

Create `src/tests/events.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseEventFrontmatter, sortEvents, filterUpcoming } from '$lib/events';
import type { CalendarEvent } from '$lib/types';

describe('parseEventFrontmatter', () => {
  it('parses a complete event', () => {
    const data = {
      title: 'Kincaid Classic',
      date: new Date('2026-12-06'),
      end_date: new Date('2026-12-07'),
      location: 'Kincaid Park',
      type: 'race',
    };
    const result = parseEventFrontmatter('2026-12-06-kincaid-classic', data);
    expect(result).toEqual({
      id: '2026-12-06-kincaid-classic',
      title: 'Kincaid Classic',
      start: '2026-12-06',
      end: '2026-12-07',
      location: 'Kincaid Park',
      type: 'race',
      description: undefined,
    });
  });

  it('defaults end to start when end_date is absent', () => {
    const data = { title: 'Dryland', date: new Date('2026-09-10'), type: 'training' };
    const result = parseEventFrontmatter('2026-09-10-dryland', data);
    expect(result.start).toBe('2026-09-10');
    expect(result.end).toBe('2026-09-10');
  });

  it('defaults type to training when absent', () => {
    const data = { title: 'Practice', date: new Date('2026-09-10') };
    const result = parseEventFrontmatter('2026-09-10-practice', data);
    expect(result.type).toBe('training');
  });
});

describe('sortEvents', () => {
  it('sorts by start date ascending', () => {
    const events: CalendarEvent[] = [
      { id: 'b', title: 'B', start: '2026-12-10', end: '2026-12-10', type: 'training' },
      { id: 'a', title: 'A', start: '2026-11-05', end: '2026-11-05', type: 'camp' },
    ];
    expect(sortEvents(events)[0].id).toBe('a');
  });
});

describe('filterUpcoming', () => {
  it('excludes events whose end < today', () => {
    const events: CalendarEvent[] = [
      { id: 'past', title: 'Past', start: '2026-01-01', end: '2026-01-01', type: 'training' },
      { id: 'future', title: 'Future', start: '2027-03-01', end: '2027-03-01', type: 'race' },
    ];
    expect(filterUpcoming(events, '2026-06-01').map(e => e.id)).toEqual(['future']);
  });

  it('includes multi-day events still in progress', () => {
    const events: CalendarEvent[] = [
      { id: 'ongoing', title: 'Camp', start: '2026-05-10', end: '2026-05-20', type: 'camp' },
    ];
    expect(filterUpcoming(events, '2026-05-15')).toHaveLength(1);
  });
});
```

- [ ] **Step 5: Run tests — verify they fail**

```bash
npm test
```

Expected: failures — `parseEventFrontmatter`, `sortEvents`, `filterUpcoming` not found.

- [ ] **Step 6: Create `src/lib/events.ts`**

```typescript
import matter from 'gray-matter';
import type { CalendarEvent, EventType } from './types.js';

const rawFiles = import.meta.glob<string>('/src/content/events/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
});

let _cachedEvents: CalendarEvent[] | null = null;

function isoFromValue(value: unknown, fallback?: string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && value) return value;
  return fallback ?? '';
}

export function parseEventFrontmatter(id: string, data: Record<string, unknown>): CalendarEvent {
  const start = isoFromValue(data.date);
  const end   = isoFromValue(data.end_date, start);
  return {
    id,
    title: String(data.title ?? ''),
    start,
    end,
    location: data.location as string | undefined,
    type: (data.type as EventType) ?? 'training',
    description: data.description as string | undefined,
  };
}

export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => a.start.localeCompare(b.start));
}

export function filterUpcoming(events: CalendarEvent[], today: string): CalendarEvent[] {
  return events.filter(e => e.end >= today);
}

export function getAllEvents(): CalendarEvent[] {
  if (_cachedEvents) return _cachedEvents;

  const events: CalendarEvent[] = [];
  for (const [filepath, raw] of Object.entries(rawFiles)) {
    const id = filepath.split('/').pop()!.replace('.md', '');
    const { data } = matter(raw);
    events.push(parseEventFrontmatter(id, data));
  }

  _cachedEvents = sortEvents(events);
  return _cachedEvents;
}

export function getUpcomingEvents(): CalendarEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  return filterUpcoming(getAllEvents(), today);
}
```

- [ ] **Step 7: Run tests — verify they pass**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 8: Create sample event files**

`src/content/events/2026-12-06-kincaid-classic.md`:

```markdown
---
title: "Kincaid Classic"
date: 2026-12-06
end_date: 2026-12-07
location: "Kincaid Park, Anchorage"
type: race
description: "Annual classic-technique race at Kincaid Park."
---
```

`src/content/events/2026-11-22-early-season-camp.md`:

```markdown
---
title: "Early Season Camp"
date: 2026-11-22
end_date: 2026-11-23
location: "Hillside Ski Area"
type: camp
description: "First snow camp — technique focus and fitness testing."
---
```

- [ ] **Step 9: Commit**

```bash
git add src/lib/events.ts src/tests/events.test.ts vitest.config.ts src/content/events/ package.json package-lock.json
git commit -m "Add events data layer with unit tests"
```

---

## Task 5: ICS generator and endpoint

**Files:**
- Create: `src/lib/ics.ts`
- Create: `src/routes/calendar.ics/+server.ts`
- Create: `src/tests/ics.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/tests/ics.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateICS } from '$lib/ics';
import type { CalendarEvent } from '$lib/types';

describe('generateICS', () => {
  it('produces a valid VCALENDAR structure', () => {
    const output = generateICS([]);
    expect(output).toContain('BEGIN:VCALENDAR');
    expect(output).toContain('END:VCALENDAR');
    expect(output).toContain('VERSION:2.0');
  });

  it('includes a VEVENT for each event', () => {
    const events: CalendarEvent[] = [
      { id: 'test-event', title: 'Test', start: '2026-12-06', end: '2026-12-07', type: 'race' },
    ];
    const output = generateICS(events);
    expect(output).toContain('BEGIN:VEVENT');
    expect(output).toContain('SUMMARY:Test');
    expect(output).toContain('DTSTART;VALUE=DATE:20261206');
    expect(output).toContain('DTEND;VALUE=DATE:20261208'); // exclusive end: +1 day
  });

  it('escapes commas in title', () => {
    const events: CalendarEvent[] = [
      { id: 'e', title: 'Race, Day 2', start: '2026-12-07', end: '2026-12-07', type: 'race' },
    ];
    expect(generateICS(events)).toContain('SUMMARY:Race\\, Day 2');
  });

  it('includes LOCATION when present', () => {
    const events: CalendarEvent[] = [
      { id: 'e', title: 'Race', start: '2026-12-06', end: '2026-12-06', type: 'race', location: 'Kincaid Park' },
    ];
    expect(generateICS(events)).toContain('LOCATION:Kincaid Park');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: failures — `generateICS` not found.

- [ ] **Step 3: Create `src/lib/ics.ts`**

```typescript
import type { CalendarEvent } from './types.js';

function icsDate(iso: string): string {
  return iso.replace(/-/g, '');
}

function addOneDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function escapeICS(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

export function generateICS(events: CalendarEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ECN Nordic//ecnordic.ski//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:ECN Nordic',
  ];

  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@ecnordic.ski`,
      `DTSTART;VALUE=DATE:${icsDate(event.start)}`,
      `DTEND;VALUE=DATE:${addOneDay(event.end)}`,
      `SUMMARY:${escapeICS(event.title)}`,
    );
    if (event.location)    lines.push(`LOCATION:${escapeICS(event.location)}`);
    if (event.description) lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Create `src/routes/calendar.ics/+server.ts`**

```typescript
import { getAllEvents } from '$lib/events';
import { generateICS } from '$lib/ics';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
  const ics = generateICS(getAllEvents());
  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ecnordic.ics"',
    },
  });
};
```

- [ ] **Step 6: Verify in dev**

```bash
npm run dev
```

Visit `http://localhost:5173/calendar.ics`. Confirm the browser downloads an `.ics` file containing the two sample events.

- [ ] **Step 7: Commit**

```bash
git add src/lib/ics.ts src/routes/calendar.ics/ src/tests/ics.test.ts
git commit -m "Add ICS calendar endpoint with unit tests"
```

---

## Task 6: Calendar page with @schedule-x

**Files:**
- Create: `src/routes/calendar/+page.server.ts`
- Create: `src/routes/calendar/+page.svelte`

- [ ] **Step 1: Install @schedule-x**

```bash
npm install @schedule-x/svelte @schedule-x/theme-default
```

- [ ] **Step 2: Create `src/routes/calendar/+page.server.ts`**

```typescript
import type { PageServerLoad } from './$types';
import { getUpcomingEvents } from '$lib/events';

export const load: PageServerLoad = () => ({
  events: getUpcomingEvents(),
});
```

- [ ] **Step 3: Create `src/routes/calendar/+page.svelte`**

@schedule-x requires the DOM — disable SSR for this route and initialise in `onMount`.

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { SITE_TITLE } from '$lib/config';
  import { eventDateRange } from '$lib/utils';
  import type { CalendarEvent } from '$lib/types';

  export const ssr = false;

  let { data } = $props();
  let { events } = $derived(data);

  let calendarEl: HTMLDivElement;

  onMount(async () => {
    const { createCalendar, viewMonthGrid } = await import('@schedule-x/svelte');
    await import('@schedule-x/theme-default/dist/index.css');

    const calendar = createCalendar({
      views: [viewMonthGrid],
      defaultView: viewMonthGrid.name,
      events: events.map((e: CalendarEvent) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
      })),
    });

    calendar.render(calendarEl);
    return () => calendar.destroy();
  });
</script>

<svelte:head>
  <title>Calendar — {SITE_TITLE}</title>
</svelte:head>

<h1 class="page-title">Calendar</h1>

<p>
  <a href="/calendar.ics" class="btn btn-sm btn-outline">Subscribe (ICS)</a>
</p>

<div bind:this={calendarEl} class="calendar-container"></div>

{#if events.length === 0}
  <p>No upcoming events.</p>
{:else}
  <section class="event-list">
    <h2>Upcoming Events</h2>
    <ul>
      {#each events as event}
        <li>
          <strong>{event.title}</strong>
          <span class="post-date">{eventDateRange(event)}</span>
          {#if event.location}<span>{event.location}</span>{/if}
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .calendar-container {
    margin-block: 2rem;
    min-height: 600px;
  }

  .event-list ul {
    list-style: none;
    padding: 0;
  }

  .event-list li {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-block: 0.75rem;
    border-bottom: 1px solid var(--color-border-subtle);
  }
</style>
```

> **Note:** If the dynamic CSS import (`import '@schedule-x/theme-default/dist/index.css'`) fails in Vite, move it to a static import at the top of the `<script>` block. If @schedule-x has Svelte 5 compatibility issues, check the [schedule-x SvelteKit docs](https://schedule-x.dev/docs/frameworks/svelte) for the current recommended API.

- [ ] **Step 4: Verify calendar renders**

```bash
npm run dev
```

Open `http://localhost:5173/calendar/`. The @schedule-x monthly grid should appear with the two sample events. Fix any import errors before continuing.

- [ ] **Step 5: Commit**

```bash
git add src/routes/calendar/ package.json package-lock.json
git commit -m "Add calendar page with @schedule-x monthly grid"
```

---

## Task 7: Static page routing

**Files:**
- Create: `src/lib/pages.ts`
- Create: `src/routes/[slug]/+page.server.ts`
- Create: `src/routes/[slug]/+page.svelte`
- Create: `src/content/pages/about.md`
- Create: `src/content/pages/talkeetna-camp.md`
- Create: `src/content/pages/resources.md`

- [ ] **Step 1: Create `src/lib/pages.ts`**

```typescript
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
import type { StaticPage } from './types.js';

const rawFiles = import.meta.glob<string>('/src/content/pages/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
});

export async function getPage(slug: string): Promise<StaticPage | null> {
  const filepath = `/src/content/pages/${slug}.md`;
  const raw = rawFiles[filepath];
  if (!raw) return null;

  const { data, content } = matter(raw);
  const processed = await remark().use(remarkGfm).use(remarkHtml).process(content);

  return {
    slug,
    title: String(data.title ?? slug),
    html: processed.toString(),
  };
}
```

- [ ] **Step 2: Create `src/routes/[slug]/+page.server.ts`**

```typescript
import { error } from '@sveltejs/kit';
import { getPage } from '$lib/pages';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const page = await getPage(params.slug);
  if (!page) error(404, 'Page not found');
  return { page };
};
```

- [ ] **Step 3: Create `src/routes/[slug]/+page.svelte`**

```svelte
<script lang="ts">
  import { SITE_TITLE } from '$lib/config';

  let { data } = $props();
  let { page } = $derived(data);
</script>

<svelte:head>
  <title>{page.title} — {SITE_TITLE}</title>
</svelte:head>

<h1 class="page-title">{page.title}</h1>

<div class="post-body">
  {@html page.html}
</div>
```

- [ ] **Step 4: Create placeholder page content**

`src/content/pages/about.md`:

```markdown
---
title: "About ECN Nordic"
---

East Community Nordic (ECN) supports year-round Nordic ski training for high school and junior high students in Anchorage, Alaska. We are affiliated with Bettye Davis East Anchorage High School.

More about the program coming soon.
```

`src/content/pages/talkeetna-camp.md`:

```markdown
---
title: "Talkeetna Camp"
---

Annual late-season ski camp in Talkeetna, Alaska.

Details for the upcoming camp will be posted here.
```

`src/content/pages/resources.md`:

```markdown
---
title: "Resources"
---

Training plans, gear recommendations, and links for ECN athletes and families.

Content coming soon.
```

- [ ] **Step 5: Verify pages load**

```bash
npm run dev
```

Visit `/about/`, `/talkeetna-camp/`, `/resources/`. Each should render with correct title and body. Visit `/nonexistent/` — confirm it returns 404.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pages.ts "src/routes/[slug]/" src/content/pages/
git commit -m "Add file-driven static page routing"
```

---

## Task 8: Standalone contact page

**Files:**
- Create: `src/routes/contact/+page.server.ts`
- Create: `src/routes/contact/+page.svelte`

- [ ] **Step 1: Create `src/routes/contact/+page.server.ts`**

```typescript
export const prerender = false;

import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { createMimeMessage } from 'mimetext';

export const load: PageServerLoad = () => ({});

async function verifyTurnstile(token: string, ip: string, secret: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const data = await res.json() as { success: boolean };
  return data.success;
}

export const actions: Actions = {
  default: async ({ request, platform, getClientAddress }) => {
    const fd = await request.formData();
    const name    = String(fd.get('name')    ?? '').trim();
    const email   = String(fd.get('email')   ?? '').trim();
    const message = String(fd.get('message') ?? '').trim();
    const token   = String(fd.get('cf-turnstile-response') ?? '');

    const values = { name, email, message };

    if (!name || !email || !message) {
      return fail(400, { error: 'All fields are required.', values });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(400, { error: 'Please enter a valid email address.', values });
    }

    const secret = platform?.env?.TURNSTILE_SECRET_KEY;
    if (secret) {
      const valid = await verifyTurnstile(token, getClientAddress(), secret);
      if (!valid) {
        return fail(400, { error: 'Spam check failed. Please try again.', values });
      }
    }

    const contactEmail = platform?.env?.CONTACT_EMAIL;
    const sendEmail    = platform?.env?.SEND_EMAIL;

    if (!contactEmail || !sendEmail) {
      return fail(500, { error: 'Mail service not configured.' });
    }

    const msg = createMimeMessage();
    msg.setSender({ name: 'ECN Nordic Contact', addr: 'noreply@ecnordic.ski' });
    msg.setRecipient(contactEmail);
    msg.setSubject(`Contact from ${name}`);
    msg.addMessage({ contentType: 'text/plain', data: `From: ${name} <${email}>\n\n${message}` });

    const { EmailMessage } = await import('cloudflare:email');
    await sendEmail.send(new EmailMessage('noreply@ecnordic.ski', contactEmail, msg.asRaw()));

    return { success: true };
  },
};
```

- [ ] **Step 2: Create `src/routes/contact/+page.svelte`**

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import { SITE_TITLE } from '$lib/config';

  let { form } = $props();
</script>

<svelte:head>
  <title>Contact — {SITE_TITLE}</title>
</svelte:head>

<h1 class="page-title">Contact</h1>

{#if form?.success}
  <p class="form-success">Message sent. We'll be in touch soon.</p>
{:else}
  {#if form?.error}
    <p class="form-error">{form.error}</p>
  {/if}

  <form method="POST" use:enhance>
    <label>
      Name
      <input type="text" name="name" value={form?.values?.name ?? ''} required />
    </label>
    <label>
      Email
      <input type="email" name="email" value={form?.values?.email ?? ''} required />
    </label>
    <label>
      Message
      <textarea name="message" rows="6" required>{form?.values?.message ?? ''}</textarea>
    </label>

    <div
      class="cf-turnstile"
      data-sitekey="1x00000000000000000000AA"
      data-theme="auto"
    ></div>

    <button type="submit" class="btn btn-primary">Send Message</button>
  </form>

  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
{/if}
```

> Replace `1x00000000000000000000AA` with the real Turnstile site key once the widget is registered for ecnordic.ski.

- [ ] **Step 3: Commit**

```bash
git add src/routes/contact/
git commit -m "Add standalone contact page"
```

---

## Task 9: Update layout and nav

**Files:**
- Modify: `src/routes/+layout.svelte`
- Modify: `src/lib/components/Nav.svelte`

- [ ] **Step 1: Update the footer contact link in `src/routes/+layout.svelte`**

Find the footer `<a>` with `href="/about#contact"` and change it to `href="/contact"`.

- [ ] **Step 2: Update nav links in `src/lib/components/Nav.svelte`**

Open `src/lib/components/Nav.svelte`. Replace the existing nav link list with ECN links. Preserve the existing component structure (props, slots, mobile menu if present) — only change the `href` and label values:

| Label | href |
|---|---|
| Home | `/` |
| Calendar | `/calendar` |
| About | `/about` |
| Talkeetna Camp | `/talkeetna-camp` |
| Resources | `/resources` |
| Contact | `/contact` |

Remove any links to `/archives/`.

- [ ] **Step 3: Commit**

```bash
git add src/routes/+layout.svelte src/lib/components/Nav.svelte
git commit -m "Update nav and footer links for ECN routes"
```

---

## Task 10: Placeholder theme

**Files:**
- Modify: `src/app.css`
- Modify: `src/hooks.server.ts`

- [ ] **Step 1: Replace font-face declarations in `src/app.css`**

Remove all existing `@font-face` blocks (Spectral, Karla, Monaspace Neon). Add ECN fonts — all files are already in `static/fonts/`:

```css
@import "tailwindcss";
@plugin "daisyui" {
  themes: ecn --default, ecn-dark --prefersdark;
}

@font-face {
  font-family: 'Alegreya Sans';
  src: url('/fonts/AlegreyaSans-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Alegreya Sans';
  src: url('/fonts/AlegreyaSans-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Alegreya Sans';
  src: url('/fonts/AlegreyaSans-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'iA Writer Quattro S';
  src: url('/fonts/iAWriterQuattroS-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'iA Writer Quattro S';
  src: url('/fonts/iAWriterQuattroS-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'iA Writer Mono S';
  src: url('/fonts/iAWriterMonoS-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'iA Writer Mono S';
  src: url('/fonts/iAWriterMonoS-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

- [ ] **Step 2: Replace `@theme` and DaisyUI theme blocks in `src/app.css`**

Remove the existing `@theme` block and all `@plugin "daisyui/theme"` blocks. Replace with:

```css
@theme {
  --font-body: 'Alegreya Sans', system-ui, sans-serif;
  --font-display: 'iA Writer Quattro S', Georgia, serif;
  --font-mono: 'iA Writer Mono S', ui-monospace, monospace;
  --default-font-family: 'Alegreya Sans', system-ui, sans-serif;
  --default-mono-font-family: 'iA Writer Mono S', ui-monospace, monospace;

  /* Placeholder ECN tokens — Pass 3 design will refine these */
  --color-heading: oklch(20% 0.02 15);
  --color-body: oklch(25% 0.01 230);
  --color-muted: oklch(52% 0.01 230);
  --color-faint: oklch(65% 0.008 230);
  --color-border: oklch(80% 0.006 230);
  --color-border-subtle: oklch(88% 0.004 230);
  --color-surface: oklch(94% 0.004 230);
  --color-link: oklch(38% 0.16 15);
  --color-link-hover: oklch(28% 0.18 15);
  --color-tag: oklch(40% 0.14 15);
  --color-tag-hash: oklch(60% 0.008 230);
  --color-focus-ring: oklch(55% 0.12 15 / 0.15);
  --color-success: oklch(42% 0.012 145);
  --color-error: oklch(45% 0.02 25);
  --color-error-bg: oklch(96% 0.008 25);
  --color-error-border: oklch(85% 0.015 25);
  --color-highlight: oklch(75% 0.10 15 / 0.25);
}

@plugin "daisyui/theme" {
  name: "ecn";
  default: true;
  color-scheme: light;
  --color-base-content: oklch(22% 0.015 15);
}

@plugin "daisyui/theme" {
  name: "ecn-dark";
  prefersdark: true;
  color-scheme: dark;
  --color-base-content: oklch(82% 0.01 230);
  --color-heading: oklch(88% 0.01 15);
  --color-body: oklch(78% 0.01 230);
  --color-muted: oklch(58% 0.008 230);
  --color-faint: oklch(45% 0.008 230);
  --color-border: oklch(32% 0.012 230);
  --color-border-subtle: oklch(28% 0.008 230);
  --color-surface: oklch(26% 0.012 230);
  --color-link: oklch(68% 0.14 15);
  --color-link-hover: oklch(78% 0.16 15);
  --color-tag: oklch(62% 0.12 15);
  --color-tag-hash: oklch(45% 0.008 230);
  --color-focus-ring: oklch(55% 0.08 15 / 0.2);
  --color-success: oklch(62% 0.012 145);
  --color-error: oklch(65% 0.02 25);
  --color-error-bg: oklch(26% 0.012 25);
  --color-error-border: oklch(35% 0.015 25);
  --color-highlight: oklch(50% 0.12 15 / 0.35);
}
```

- [ ] **Step 3: Update theme names in `src/hooks.server.ts`**

Open `src/hooks.server.ts`. Find any references to `'silk'` and `'dim'` (the theme names from 907.life) and replace with `'ecn'` and `'ecn-dark'`.

- [ ] **Step 4: Commit**

```bash
git add src/app.css src/hooks.server.ts
git commit -m "Placeholder ECN theme: fonts, color tokens, DaisyUI ecn/ecn-dark"
```

---

## Task 11: Placeholder post and first clean build

**Files:**
- Create: `src/content/posts/2026-05-14-welcome.md`

- [ ] **Step 1: Create a placeholder post**

`src/content/posts/2026-05-14-welcome.md`:

```markdown
---
title: "Welcome to ECN Nordic"
date: 2026-05-14
draft: false
description: "East Community Nordic is online."
tags: ["announcement"]
---

Welcome to the East Community Nordic website. Training updates, race results, and camp information will be posted here throughout the season.
```

- [ ] **Step 2: Run the full build**

```bash
npm run build 2>&1
```

Fix any TypeScript errors before proceeding. Common issues:
- `post.day` references in `feed.ts` or homepage — remove
- `postUrl` call sites that pass `day` — update to `{ year, month, slug }`
- Theme names `silk`/`dim` still in `hooks.server.ts` — change to `ecn`/`ecn-dark`

- [ ] **Step 3: Run all tests**

```bash
npm test
```

All tests must pass before proceeding.

- [ ] **Step 4: Commit**

```bash
git add src/content/posts/2026-05-14-welcome.md
git commit -m "Add welcome post; full build and tests passing"
```

---

## Task 12: Register domain, configure Cloudflare, and deploy

This task has manual steps in the Cloudflare dashboard. Do each step before the next.

- [ ] **Step 1: Register `ecnordic.ski` via Cloudflare Registrar**

```bash
cd ~/Projects/cloudflare-sites && claude
```

Ask Claude to check availability and register `ecnordic.ski` via the Cloudflare Registrar API (~$50.20/year at-cost). If the `cloudflare-sites` project doesn't have the registrar command, use:

```bash
npx wrangler registrar domains purchase --domain ecnordic.ski
```

Confirm the domain is available before purchasing.

- [ ] **Step 2: Register a Turnstile widget for ecnordic.ski**

In the Cloudflare dashboard → Turnstile → Add site → Domain: `ecnordic.ski`. Copy the **Site Key** and replace `1x00000000000000000000AA` in `src/routes/contact/+page.svelte`. Commit the change:

```bash
git add src/routes/contact/+page.svelte
git commit -m "Set real Turnstile site key for ecnordic.ski"
```

- [ ] **Step 3: Add GitHub Actions secrets**

In `https://github.com/glw907/ecnordic-ski/settings/secrets/actions`, add:
- `CLOUDFLARE_API_TOKEN` — same token as 907.life
- `CLOUDFLARE_ACCOUNT_ID` — same as 907.life

- [ ] **Step 4: Set Worker secrets**

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put CONTACT_EMAIL
```

Enter the Turnstile **secret key** (not the site key) and the ECN contact email address when prompted.

- [ ] **Step 5: Push and verify deploy**

```bash
git push
```

Watch `https://github.com/glw907/ecnordic-ski/actions`. When the deploy completes, visit `https://ecnordic.ski` and verify the site loads with the welcome post, calendar, and all nav links working.

Pass 2 complete. Open `~/Projects/ecnordic-ski/` in a new Claude Code session and run Pass 3 when ready for the design work.
