# 907.life SvelteKit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full 907.life SvelteKit site — post listing, post detail pages, archives, about+contact, search, CMS, and deployment pipeline.

**Architecture:** SvelteKit with adapter-cloudflare. Posts loaded at build time via `import.meta.glob` + remark. Special pages (about, archives) use mdsvex so Sveltia CMS can edit prose while Svelte components handle dynamic behavior. Contact form uses Cloudflare Email Workers `send_email` binding. Pagefind generates search index post-build.

**Tech Stack:** SvelteKit 2 · Svelte 5 · TypeScript · Tailwind CSS v4 · DaisyUI v5 · mdsvex · remark + remark-gfm · Pagefind · Sveltia CMS · @sveltejs/adapter-cloudflare · Cloudflare Email Workers

---

## File Map

**New files:**
- `package.json` — project manifest + scripts
- `svelte.config.js` — adapter-cloudflare + mdsvex preprocessing
- `vite.config.ts` — Tailwind v4 Vite plugin
- `tsconfig.json` — TypeScript config (extends .svelte-kit/tsconfig.json)
- `src/app.html` — SvelteKit HTML shell
- `src/app.css` — Tailwind v4 + DaisyUI import + Lora font-face declarations
- `src/lib/types.ts` — Post interface
- `src/lib/posts.ts` — getAllPosts(), getPost() using import.meta.glob + remark
- `src/lib/components/Nav.svelte` — top nav with search trigger
- `src/lib/components/SearchModal.svelte` — Pagefind UI wrapper
- `src/lib/components/ArchiveList.svelte` — year-grouped post list
- `src/lib/components/ContactForm.svelte` — Turnstile + form fields
- `src/routes/+layout.svelte` — global layout: Nav, SearchModal, slot
- `src/routes/+page.server.ts` — load all posts
- `src/routes/+page.svelte` — homepage: recent posts list
- `src/routes/[year]/[month]/[day]/[slug]/+page.server.ts` — load single post
- `src/routes/[year]/[month]/[day]/[slug]/+page.svelte` — post detail
- `src/routes/archives/+page.server.ts` — load all posts for archive listing
- `src/routes/archives/+page.md` — mdsvex: prose + ArchiveList component
- `src/routes/about/+page.server.ts` — contact form action
- `src/routes/about/+page.md` — mdsvex: about prose + ContactForm component
- `static/admin/index.html` — Sveltia CMS loader
- `static/admin/config.yml` — Sveltia CMS collection schema
- `.github/workflows/deploy.yml` — build + pagefind + wrangler deploy

**Modified files:**
- `wrangler.toml` — replace Hugo config with adapter-cloudflare config

---

### Task 1: Install plugins and create svelte-check skill

Install the three plugins named in the spec, then create a project-level `svelte-check` skill via skill-creator. These are session setup steps, not code.

**Files:** none (plugin and skill metadata only)

- [ ] **Step 1: Install plugins**

Run in the Claude Code session (not bash):
```
/plugin install commit-commands
/plugin install hookify
/plugin install security-guidance
/reload-plugins
```

- [ ] **Step 2: Create svelte-check skill via skill-creator**

Invoke the skill-creator skill and ask it to create a project-level skill named `svelte-check` that runs `npm run check` (i.e., `svelte-check --tsconfig ./tsconfig.json`) and reports errors. The skill should be saved under `.claude/skills/svelte-check.md` in this project.

- [ ] **Step 3: Commit**

```bash
git add .claude/
git commit -m "Add Claude skills and plugins for SvelteKit implementation"
```

---

### Task 2: Scaffold the SvelteKit project

Create all configuration files from scratch (no interactive scaffolder — we're in an existing git repo with content). Install all dependencies.

**Files:**
- Create: `package.json`
- Create: `svelte.config.js`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/app.html`

- [ ] **Step 1: Write package.json**

```json
{
  "name": "907-life",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-check --tsconfig ./tsconfig.json --watch"
  },
  "devDependencies": {
    "@sveltejs/adapter-cloudflare": "^5",
    "@sveltejs/kit": "^2",
    "@sveltejs/vite-plugin-svelte": "^5",
    "@tailwindcss/vite": "^4",
    "daisyui": "^5",
    "mdsvex": "^0.11",
    "svelte": "^5",
    "svelte-check": "^4",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vite": "^6"
  },
  "dependencies": {
    "gray-matter": "^4",
    "mimetext": "^3",
    "remark": "^15",
    "remark-gfm": "^4",
    "remark-html": "^16"
  },
  "type": "module"
}
```

- [ ] **Step 2: Write svelte.config.js**

```js
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md', '.svx'],
  preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: ['.md', '.svx']
    })
  ],
  kit: {
    adapter: adapter()
  }
};

export default config;
```

- [ ] **Step 3: Write vite.config.ts**

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()]
});
```

- [ ] **Step 4: Write tsconfig.json**

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true
  }
}
```

- [ ] **Step 5: Write src/app.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 6: Install dependencies**

```bash
npm install
```

Expected: installs without errors. `node_modules/` created. `.svelte-kit/` created.

- [ ] **Step 7: Verify SvelteKit generated its tsconfig**

```bash
cat .svelte-kit/tsconfig.json
```

Expected: JSON file with `"baseUrl"` and path aliases. If this file doesn't exist yet, run `npx svelte-kit sync` first.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json svelte.config.js vite.config.ts tsconfig.json src/app.html
git commit -m "Scaffold SvelteKit project with adapter-cloudflare and mdsvex"
```

---

### Task 3: Update wrangler.toml

Replace the Hugo-era config with adapter-cloudflare config. The `send_email` binding enables the contact form.

**Files:**
- Modify: `wrangler.toml`

- [ ] **Step 1: Replace wrangler.toml**

```toml
# 907.life — Cloudflare Workers (SvelteKit adapter-cloudflare)
name = "907-life"
compatibility_date = "2025-01-25"
compatibility_flags = ["nodejs_compat"]

main = "build/_worker.js"

[assets]
directory = "build"
binding = "ASSETS"

[[send_email]]
name = "SEND_EMAIL"
destination_address = "geoff@907.life"

[[routes]]
pattern = "907.life"
custom_domain = true
```

- [ ] **Step 2: Verify**

```bash
cat wrangler.toml
```

- [ ] **Step 3: Commit**

```bash
git add wrangler.toml
git commit -m "Update wrangler.toml for SvelteKit adapter-cloudflare"
```

---

### Task 4: Content pipeline — types and post loading

All post loading happens server-side. `import.meta.glob` bundles the markdown files at build time so no runtime filesystem access is needed (required for Cloudflare Workers).

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/posts.ts`

- [ ] **Step 1: Write src/lib/types.ts**

```typescript
export interface Post {
  /** URL slug, e.g. "early-march" (filename minus date prefix) */
  slug: string;
  /** Four-digit year string, e.g. "2026" */
  year: string;
  /** Zero-padded month string, e.g. "03" */
  month: string;
  /** Zero-padded day string, e.g. "06" */
  day: string;
  title: string;
  /** ISO date string from frontmatter, e.g. "2026-03-06" */
  date: string;
  draft: boolean;
  description: string;
  tags: string[];
  /** Rendered HTML — only present when loaded via getPost() */
  html?: string;
}
```

- [ ] **Step 2: Write src/lib/posts.ts**

```typescript
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
import type { Post } from './types.js';

// Bundled at build time — no runtime filesystem access needed.
// Keys are absolute paths like "/src/content/posts/2026-03-06-early-march.md"
const rawFiles = import.meta.glob<string>('/src/content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
});

function parseFilepath(filepath: string): Pick<Post, 'year' | 'month' | 'day' | 'slug'> {
  const filename = filepath.split('/').pop()!.replace('.md', '');
  const [year, month, day, ...slugParts] = filename.split('-');
  return { year, month, day, slug: slugParts.join('-') };
}

/** Returns all non-draft posts sorted newest-first. */
export async function getAllPosts(includeDrafts = false): Promise<Post[]> {
  const posts: Post[] = [];

  for (const [filepath, raw] of Object.entries(rawFiles)) {
    const { year, month, day, slug } = parseFilepath(filepath);
    const { data } = matter(raw);
    if (!includeDrafts && data.draft) continue;

    posts.push({
      slug,
      year,
      month,
      day,
      title: data.title ?? '',
      date: String(data.date ?? ''),
      draft: data.draft ?? false,
      description: data.description ?? '',
      tags: data.tags ?? []
    });
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Returns a single post with rendered HTML, or null if not found. */
export async function getPost(
  year: string,
  month: string,
  day: string,
  slug: string
): Promise<Post | null> {
  const filepath = `/src/content/posts/${year}-${month}-${day}-${slug}.md`;
  const raw = rawFiles[filepath];
  if (!raw) return null;

  const { data, content } = matter(raw);
  const processed = await remark().use(remarkGfm).use(remarkHtml).process(content);

  return {
    slug,
    year,
    month,
    day,
    title: data.title ?? '',
    date: String(data.date ?? ''),
    draft: data.draft ?? false,
    description: data.description ?? '',
    tags: data.tags ?? [],
    html: processed.toString()
  };
}
```

- [ ] **Step 3: Run svelte-check to verify types compile**

```bash
npm run check
```

Expected: 0 errors. (Warnings about `.svelte-kit/` not existing yet are OK; errors about type mismatches are not.)

If `svelte-check` can't resolve `$lib` aliases yet, run `npx svelte-kit sync` first to generate `.svelte-kit/tsconfig.json`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/posts.ts
git commit -m "Add content pipeline: Post type and remark-based post loading"
```

---

### Task 5: Base layout and styles

Global styles, Lora font, and the top-level layout component. The SearchModal is wired here so it's accessible from the Nav across all pages.

**Files:**
- Create: `src/app.css`
- Create: `src/lib/components/Nav.svelte`
- Create: `src/lib/components/SearchModal.svelte`
- Create: `src/routes/+layout.svelte`

- [ ] **Step 1: Write src/app.css**

```css
@import "tailwindcss";
@plugin "daisyui";

@font-face {
  font-family: 'Lora';
  src: url('/fonts/Lora-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Lora';
  src: url('/fonts/Lora-Italic.woff2') format('woff2');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: 'Lora';
  src: url('/fonts/Lora-SemiBold.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@theme {
  --font-serif: 'Lora', Georgia, 'Times New Roman', serif;
}

body {
  font-family: var(--font-serif);
}
```

- [ ] **Step 2: Write src/lib/components/Nav.svelte**

```svelte
<script lang="ts">
  let { onSearchOpen }: { onSearchOpen: () => void } = $props();
</script>

<header class="sticky top-0 z-30 bg-base-100 border-b border-base-200">
  <nav class="container mx-auto px-4 h-14 flex items-center justify-between max-w-3xl">
    <a href="/" class="font-semibold text-base hover:opacity-70 transition-opacity">
      907.life
    </a>
    <div class="flex items-center gap-5 text-sm">
      <a href="/archives" class="hover:opacity-70 transition-opacity">Archives</a>
      <a href="/about" class="hover:opacity-70 transition-opacity">About</a>
      <a href="/about#contact" class="hover:opacity-70 transition-opacity">Contact</a>
      <button
        onclick={onSearchOpen}
        class="hover:opacity-70 transition-opacity"
        aria-label="Search"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
    </div>
  </nav>
</header>
```

- [ ] **Step 3: Write src/lib/components/SearchModal.svelte**

Pagefind's built-in UI handles rendering results. The JS and CSS are only present post-build; in dev mode the modal just shows a message.

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  let { open = $bindable(false) }: { open: boolean } = $props();

  let initialized = false;

  onMount(async () => {
    if (initialized) return;
    try {
      // @ts-ignore — pagefind assets generated at build time, not present in dev
      const { PagefindUI } = await import('/pagefind/pagefind-ui.js');
      new PagefindUI({ element: '#pagefind-search', showSubResults: true });
      initialized = true;
    } catch {
      // dev mode — pagefind not built yet
    }
  });

  function close() {
    open = false;
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
    onclick={(e) => { if (e.target === e.currentTarget) close(); }}>
    <div class="bg-base-100 rounded-box shadow-2xl w-full max-w-2xl p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-semibold text-lg">Search</h2>
        <button onclick={close} class="btn btn-ghost btn-sm btn-circle" aria-label="Close">✕</button>
      </div>
      <div id="pagefind-search"></div>
      <link rel="stylesheet" href="/pagefind/pagefind-ui.css" />
    </div>
  </div>
{/if}
```

- [ ] **Step 4: Write src/routes/+layout.svelte**

```svelte
<script lang="ts">
  import '../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import SearchModal from '$lib/components/SearchModal.svelte';

  let { children } = $props();
  let searchOpen = $state(false);
</script>

<Nav onSearchOpen={() => { searchOpen = true; }} />
<SearchModal bind:open={searchOpen} />

<main class="container mx-auto px-4 max-w-3xl py-8">
  {@render children()}
</main>

<footer class="container mx-auto px-4 max-w-3xl py-8 mt-8 border-t border-base-200 text-sm text-base-content/60 text-center">
  907.life
</footer>
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: dev server at http://localhost:5173. It will show a 404 for `/` since there's no `+page.svelte` yet — that's fine. No red compile errors in the terminal.

Kill with Ctrl+C after confirming it starts.

- [ ] **Step 6: Run svelte-check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/app.css src/lib/components/Nav.svelte src/lib/components/SearchModal.svelte src/routes/+layout.svelte
git commit -m "Add base layout, global styles, and Lora font"
```

---

### Task 6: Homepage — recent post list

The homepage lists all non-draft posts sorted newest-first with title, date, description, and tags.

**Files:**
- Create: `src/routes/+page.server.ts`
- Create: `src/routes/+page.svelte`

- [ ] **Step 1: Write src/routes/+page.server.ts**

```typescript
import type { PageServerLoad } from './$types';
import { getAllPosts } from '$lib/posts';

export const load: PageServerLoad = async () => {
  const posts = await getAllPosts();
  return { posts };
};
```

- [ ] **Step 2: Write src/routes/+page.svelte**

```svelte
<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  }
</script>

<svelte:head>
  <title>907.life</title>
  <meta name="description" content="Writing from Alaska — adventures, books, music, technology." />
</svelte:head>

<div class="space-y-10">
  {#each data.posts as post}
    <article>
      <time class="text-sm text-base-content/60" datetime={post.date}>
        {formatDate(post.date)}
      </time>
      <h2 class="text-xl font-semibold mt-1">
        <a href="/{post.year}/{post.month}/{post.day}/{post.slug}/"
           class="hover:opacity-70 transition-opacity">
          {post.title}
        </a>
      </h2>
      {#if post.description}
        <p class="mt-1 text-base-content/80">{post.description}</p>
      {/if}
      {#if post.tags.length > 0}
        <div class="flex gap-2 mt-2 flex-wrap">
          {#each post.tags as tag}
            <span class="badge badge-ghost badge-sm">{tag}</span>
          {/each}
        </div>
      {/if}
    </article>
  {/each}
</div>
```

- [ ] **Step 3: Verify homepage loads**

```bash
npm run dev
```

Open http://localhost:5173. Expected: list of posts with titles, dates, descriptions. Kill with Ctrl+C.

- [ ] **Step 4: Run svelte-check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/routes/+page.server.ts src/routes/+page.svelte
git commit -m "Add homepage with post list"
```

---

### Task 7: Post detail page

The dynamic route `[year]/[month]/[day]/[slug]` loads the post from the content pipeline and renders it.

**Files:**
- Create: `src/routes/[year]/[month]/[day]/[slug]/+page.server.ts`
- Create: `src/routes/[year]/[month]/[day]/[slug]/+page.svelte`

- [ ] **Step 1: Write src/routes/[year]/[month]/[day]/[slug]/+page.server.ts**

```typescript
import type { PageServerLoad } from './$types';
import { getPost } from '$lib/posts';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const post = await getPost(params.year, params.month, params.day, params.slug);
  if (!post) throw error(404, 'Post not found');
  return { post };
};
```

- [ ] **Step 2: Write src/routes/[year]/[month]/[day]/[slug]/+page.svelte**

```svelte
<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  }
</script>

<svelte:head>
  <title>{data.post.title} — 907.life</title>
  {#if data.post.description}
    <meta name="description" content={data.post.description} />
  {/if}
</svelte:head>

<article>
  <header class="mb-8">
    <time class="text-sm text-base-content/60" datetime={data.post.date}>
      {formatDate(data.post.date)}
    </time>
    <h1 class="text-3xl font-semibold mt-1">{data.post.title}</h1>
    {#if data.post.tags.length > 0}
      <div class="flex gap-2 mt-3 flex-wrap">
        {#each data.post.tags as tag}
          <span class="badge badge-ghost badge-sm">{tag}</span>
        {/each}
      </div>
    {/if}
  </header>

  <div class="prose prose-lg max-w-none">
    {@html data.post.html}
  </div>

  <footer class="mt-12 pt-6 border-t border-base-200">
    <a href="/" class="text-sm hover:opacity-70 transition-opacity">← All posts</a>
  </footer>
</article>
```

- [ ] **Step 3: Verify a post loads**

```bash
npm run dev
```

Open http://localhost:5173/2026/03/06/early-march/. Expected: post renders with title, date, and body text. Kill with Ctrl+C.

- [ ] **Step 4: Run svelte-check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/routes/\[year\]/\[month\]/\[day\]/\[slug\]/
git commit -m "Add post detail page"
```

---

### Task 8: Archives page

The archives page is an mdsvex file with editable prose and an embedded `ArchiveList` component that receives posts from the server load function.

**Files:**
- Create: `src/lib/components/ArchiveList.svelte`
- Create: `src/routes/archives/+page.server.ts`
- Create: `src/routes/archives/+page.md`

- [ ] **Step 1: Write src/lib/components/ArchiveList.svelte**

```svelte
<script lang="ts">
  import type { Post } from '$lib/types';

  let { posts }: { posts: Post[] } = $props();

  // Group posts by year
  const byYear = $derived(
    posts.reduce<Record<string, Post[]>>((acc, post) => {
      (acc[post.year] ??= []).push(post);
      return acc;
    }, {})
  );

  const years = $derived(Object.keys(byYear).sort((a, b) => Number(b) - Number(a)));

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  }
</script>

<div class="space-y-8 mt-4">
  {#each years as year}
    <section>
      <h2 class="text-xl font-semibold mb-3">{year}</h2>
      <ul class="space-y-2">
        {#each byYear[year] as post}
          <li class="flex gap-4 items-baseline">
            <time class="text-sm text-base-content/60 w-16 shrink-0" datetime={post.date}>
              {formatDate(post.date)}
            </time>
            <a href="/{post.year}/{post.month}/{post.day}/{post.slug}/"
               class="hover:opacity-70 transition-opacity">
              {post.title}
            </a>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</div>
```

- [ ] **Step 2: Write src/routes/archives/+page.server.ts**

```typescript
import type { PageServerLoad } from './$types';
import { getAllPosts } from '$lib/posts';

export const load: PageServerLoad = async () => {
  const posts = await getAllPosts();
  return { posts };
};
```

- [ ] **Step 3: Write src/routes/archives/+page.md**

```markdown
---
title: Archives
---

<script>
  import ArchiveList from '$lib/components/ArchiveList.svelte';
  let { data } = $props();
</script>

<svelte:head>
  <title>Archives — 907.life</title>
</svelte:head>

# Archives

<ArchiveList posts={data.posts} />
```

- [ ] **Step 4: Verify archives page loads**

```bash
npm run dev
```

Open http://localhost:5173/archives. Expected: year-grouped post list. Kill with Ctrl+C.

- [ ] **Step 5: Run svelte-check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/ArchiveList.svelte src/routes/archives/
git commit -m "Add archives page with year-grouped post list"
```

---

### Task 9: About + Contact page

The about page is mdsvex with the prose from `src/content/pages/about.md` inlined, plus a `ContactForm` component at the `#contact` anchor. The form action validates the Turnstile token and sends email via the `SEND_EMAIL` Workers binding.

**Files:**
- Create: `src/lib/components/ContactForm.svelte`
- Create: `src/routes/about/+page.server.ts`
- Create: `src/routes/about/+page.md`

- [ ] **Step 1: Write src/lib/components/ContactForm.svelte**

The Turnstile widget is loaded from `challenges.cloudflare.com`. In dev, set `TURNSTILE_SITE_KEY` to Cloudflare's always-pass test key `1x00000000000000000000AA`.

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from '../routes/about/$types';

  let { form }: { form: ActionData } = $props();

  let submitting = $state(false);
</script>

<section id="contact" class="mt-12 pt-8 border-t border-base-200">
  <h2 class="text-2xl font-semibold mb-6">Contact</h2>

  {#if form?.success}
    <div class="alert alert-success">
      <span>Message sent. I'll get back to you soon.</span>
    </div>
  {:else}
    <form method="POST" use:enhance={() => {
      submitting = true;
      return async ({ update }) => {
        await update();
        submitting = false;
      };
    }}>
      {#if form?.error}
        <div class="alert alert-error mb-4">
          <span>{form.error}</span>
        </div>
      {/if}

      <div class="space-y-4">
        <div class="form-control">
          <label class="label" for="name"><span class="label-text">Name</span></label>
          <input
            id="name"
            name="name"
            type="text"
            class="input input-bordered w-full"
            required
            value={form?.values?.name ?? ''}
          />
        </div>

        <div class="form-control">
          <label class="label" for="email"><span class="label-text">Email</span></label>
          <input
            id="email"
            name="email"
            type="email"
            class="input input-bordered w-full"
            required
            value={form?.values?.email ?? ''}
          />
        </div>

        <div class="form-control">
          <label class="label" for="message"><span class="label-text">Message</span></label>
          <textarea
            id="message"
            name="message"
            class="textarea textarea-bordered w-full h-32"
            required
          >{form?.values?.message ?? ''}</textarea>
        </div>

        <div
          class="cf-turnstile"
          data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA'}
        ></div>

        <button type="submit" class="btn btn-primary" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>

    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  {/if}
</section>
```

- [ ] **Step 2: Write src/routes/about/+page.server.ts**

```typescript
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';
import { TURNSTILE_SECRET_KEY } from '$env/dynamic/private';

export const load: PageServerLoad = async () => {
  return {};
};

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip
    })
  });
  const data = await res.json<{ success: boolean }>();
  return data.success;
}

export const actions: Actions = {
  default: async ({ request, platform, getClientAddress }) => {
    const formData = await request.formData();
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const message = String(formData.get('message') ?? '').trim();
    const token = String(formData.get('cf-turnstile-response') ?? '');

    if (!name || !email || !message) {
      return fail(400, { error: 'All fields are required.', values: { name, email, message } });
    }

    const valid = await verifyTurnstile(token, getClientAddress());
    if (!valid) {
      return fail(400, { error: 'Spam check failed. Please try again.', values: { name, email, message } });
    }

    const contactEmail = platform?.env?.CONTACT_EMAIL;
    if (!contactEmail || !platform?.env?.SEND_EMAIL) {
      return fail(500, { error: 'Mail service not configured.' });
    }

    const msg = createMimeMessage();
    msg.setSender({ name: 'Contact Form', addr: 'noreply@907.life' });
    msg.setRecipient(contactEmail);
    msg.setSubject(`Contact from ${name}`);
    msg.addMessage({
      contentType: 'text/plain',
      data: `From: ${name} <${email}>\n\n${message}`
    });

    const emailMsg = new EmailMessage('noreply@907.life', contactEmail, msg.asRaw());
    await platform.env.SEND_EMAIL.send(emailMsg);

    return { success: true };
  }
};
```

- [ ] **Step 3: Write src/routes/about/+page.md**

The prose is taken directly from `src/content/pages/about.md` (omitting the Hugo `layout` frontmatter field). The `ContactForm` component is imported and rendered at the bottom.

```markdown
---
title: About
---

<script>
  import ContactForm from '$lib/components/ContactForm.svelte';
  let { data, form } = $props();
</script>

<svelte:head>
  <title>About — 907.life</title>
</svelte:head>

## About Geoffrey

I'm Geoffrey L. Wright, a technology professional living in Alaska. This blog is where I write about Alaska adventures, philosophical musings, technology, books, music, photography, and whatever else comes to mind.

After years of living in the Pacific Northwest, I've found a home in the Last Frontier, where the long summer days and quiet winter nights provide plenty of space for reflection and exploration.

This site is a place for me to share stories, thoughts, and discoveries from life at 907.

---

<ContactForm {form} />
```

- [ ] **Step 4: Add Cloudflare types to tsconfig so `cloudflare:email` resolves**

The `cloudflare:email` module is a Cloudflare Workers built-in. Add the Workers types package:

```bash
npm install --save-dev @cloudflare/workers-types
```

Then add to `tsconfig.json` under `compilerOptions`:
```json
"types": ["@cloudflare/workers-types"]
```

Full updated `tsconfig.json`:
```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "types": ["@cloudflare/workers-types"]
  }
}
```

- [ ] **Step 5: Verify about page loads in dev**

```bash
npm run dev
```

Open http://localhost:5173/about. Expected: about prose and contact form render. Form won't send in dev (no binding). Kill with Ctrl+C.

- [ ] **Step 6: Run svelte-check**

```bash
npm run check
```

Expected: 0 errors. If `cloudflare:email` still can't be resolved, add `"moduleResolution": "bundler"` to tsconfig `compilerOptions`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/ContactForm.svelte src/routes/about/ tsconfig.json package.json package-lock.json
git commit -m "Add about page with contact form (Turnstile + Cloudflare Email Workers)"
```

---

### Task 10: Pagefind search

Pagefind crawls the built HTML post-build. The `SearchModal` component (already written in Task 5) loads Pagefind UI dynamically. This task wires up the build command and verifies end-to-end.

**Files:**
- Modify: `package.json` — add `build:search` script

- [ ] **Step 1: Add build:search script to package.json**

Update the `scripts` section:
```json
"scripts": {
  "dev": "vite dev",
  "build": "vite build",
  "build:search": "vite build && npx pagefind --site build",
  "preview": "vite preview",
  "check": "svelte-check --tsconfig ./tsconfig.json",
  "check:watch": "svelte-check --tsconfig ./tsconfig.json --watch"
}
```

- [ ] **Step 2: Run a full build with Pagefind**

```bash
npm run build:search
```

Expected: build succeeds, then pagefind output like:
```
Running Pagefind v1.x.x
Found N files matching glob
Indexed N pages
Writing search index
```

- [ ] **Step 3: Test search in preview mode**

```bash
npm run preview
```

Open http://localhost:4173. Click the search icon in the nav. Type a word from a post (e.g., "Alaska"). Expected: search results appear. Kill with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "Add build:search script for Pagefind post-build indexing"
```

---

### Task 11: Sveltia CMS

Two files in `static/admin/`. The CMS is mounted at `/admin/` — GitHub OAuth is configured in the Cloudflare dashboard, not here.

**Files:**
- Create: `static/admin/index.html`
- Create: `static/admin/config.yml`

- [ ] **Step 1: Write static/admin/index.html**

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Content Manager</title>
  </head>
  <body>
    <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Write static/admin/config.yml**

```yaml
backend:
  name: github
  repo: glw907/907-life
  branch: main

media_folder: static/images
public_folder: /images

collections:
  - name: posts
    label: Posts
    folder: src/content/posts
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    fields:
      - { label: Title, name: title, widget: string }
      - { label: Date, name: date, widget: datetime, format: YYYY-MM-DD, time_format: false }
      - { label: Draft, name: draft, widget: boolean, default: false }
      - { label: Description, name: description, widget: string, required: false }
      - { label: Tags, name: tags, widget: list, required: false }
      - { label: Body, name: body, widget: markdown }

  - name: pages
    label: Pages
    files:
      - label: About
        name: about
        file: src/content/pages/about.md
        fields:
          - { label: Title, name: title, widget: string }
          - { label: Body, name: body, widget: markdown }
```

- [ ] **Step 3: Verify admin route serves the CMS**

```bash
npm run build:search && npm run preview
```

Open http://localhost:4173/admin/. Expected: Sveltia CMS login screen loads (it will ask for GitHub auth — that's expected). Kill with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add static/admin/
git commit -m "Add Sveltia CMS config (posts + pages collections)"
```

---

### Pass 6: Tagging feature

See `docs/superpowers/plans/2026-04-06-tagging.md`

Adds `getAllTags()` + `getPostsByTag()` to the data layer, makes tags clickable throughout, adds a tags block to the archives page, and builds `/tags/` index and `/tags/[tag]/` detail pages.

---

### Pass 7: RSS + JSON Feed

See `docs/superpowers/plans/2026-04-06-rss-json-feed.md`

Extracts all site-specific values into `src/lib/config.ts`, adds `postUrl()` / `tagUrl()` / `formatShortDate()` helpers to `utils.ts`, refactors existing code to use them, adds RSS 2.0 (`/feed.xml`) and JSON Feed 1.1 (`/feed.json`) endpoints via a shared `src/lib/feed.ts` data layer, redesigns the footer with icon links and feed autodiscovery, and installs a hookify rule to prevent future hardcoding.

---

### Task 12: GitHub Actions deployment

Push to `main` triggers: install → build → pagefind → wrangler deploy.

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write .github/workflows/deploy.yml**

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Build Pagefind index
        run: npx pagefind --site build

      - name: Deploy
        run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

- [ ] **Step 2: Verify YAML is valid**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))" && echo "YAML OK"
```

Expected: `YAML OK`

- [ ] **Step 3: Add GitHub Actions secrets**

These must be set in the GitHub repo settings (Settings → Secrets → Actions) before the workflow will succeed:
- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token with Workers Deploy permission
- `CLOUDFLARE_ACCOUNT_ID` — found in the Cloudflare dashboard URL or via `npx wrangler whoami`

This is a manual step. Confirm both secrets exist before merging.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions deploy workflow (build + pagefind + wrangler)"
```

---

### Task 13: Final build verification

Run the complete build pipeline locally end-to-end before first deploy.

- [ ] **Step 1: Full build + search index**

```bash
npm run build:search
```

Expected: clean build with no TypeScript errors, pagefind index written to `build/_pagefind/`.

- [ ] **Step 2: Smoke test all routes in preview**

```bash
npm run preview
```

Check each of these URLs:
- http://localhost:4173/ — post list renders
- http://localhost:4173/2026/03/06/early-march/ — post detail renders
- http://localhost:4173/archives — year-grouped archive renders
- http://localhost:4173/about — about prose + contact form renders
- http://localhost:4173/admin/ — Sveltia CMS loads

Kill with Ctrl+C after confirming each route.

- [ ] **Step 3: Test contact form locally via wrangler**

```bash
npx wrangler dev
```

Open http://localhost:8787/about. Fill in the contact form. Expected: Turnstile passes (dev test key), email binding logs the attempt (may error since the binding isn't configured in local dev — check wrangler output). Kill with Ctrl+C.

- [ ] **Step 4: Final commit (if any stray files)**

```bash
git status
```

If clean, no commit needed. If there are stray changes, stage and commit them.

- [ ] **Step 5: Push to main**

```bash
git push origin main
```

Expected: GitHub Actions workflow triggers. Watch at https://github.com/glw907/907-life/actions.

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| SvelteKit + TypeScript + adapter-cloudflare | Task 2 |
| Tailwind v4 + DaisyUI v5 | Tasks 2, 5 |
| remark + remark-gfm for posts | Task 4 |
| mdsvex for about + archives | Tasks 8, 9 |
| URL structure `/:year/:month/:day/:slug/` | Task 7 |
| Pagefind search | Task 10 |
| Contact form at `/about/#contact` | Task 9 |
| Cloudflare Email Workers (not Resend) | Task 9 |
| Turnstile spam protection | Task 9 |
| Sveltia CMS (posts + pages collections) | Task 11 |
| GitHub Actions deploy | Task 12 |
| Lora font (self-hosted woff2) | Task 5 |
| wrangler.toml updated | Task 3 |
| Plugin install (commit-commands, hookify, security-guidance) | Task 1 |
| svelte-check skill | Task 1 |

**Notes for the implementer:**

- The `cloudflare:email` module type resolution (Task 9) may need adjustment depending on the exact adapter-cloudflare version. If `@cloudflare/workers-types` conflicts with SvelteKit's own types, use `skipLibCheck: true` (already set) and import `EmailMessage` with `// @ts-ignore` if needed.
- The `VITE_TURNSTILE_SITE_KEY` environment variable in `ContactForm.svelte` must be set in `.env` for local dev. Use Cloudflare's always-pass test site key: `1x00000000000000000000AA`.
- DaisyUI v5 works with Tailwind v4 via `@plugin "daisyui"` in CSS. No `tailwind.config.js` needed.
- The `import.meta.glob` query syntax (`{ query: '?raw', import: 'default' }`) may need to be `{ as: 'raw' }` depending on the Vite version. If posts don't load, try changing to `{ as: 'raw', eager: true }`.
