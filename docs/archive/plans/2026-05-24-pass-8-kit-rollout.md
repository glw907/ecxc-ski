# Pass 8 — Kit rollout to Svelte components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make contact, tags (`/tags` + `/tags/[tag]`), and post detail read as one system with the five directive pages by consuming the kit's shared CSS contract — not by building a parallel Svelte primitive library.

**Architecture:** Kit-as-CSS-contract (spec approach C). Style lives once in `src/app.css` (tokens + global classes); markup lives in whichever builder is idiomatic per surface (rehype for prose, Svelte for shells); class names are the seam. The entrance-cascade *math* is shared via one util; its *keyframes* are promoted to global CSS. No `<Card>`/`<Alert>`/`<Grid>` Svelte components are built.

**Tech Stack:** SvelteKit · Svelte 5 (runes) · TypeScript · Tailwind v4 · DaisyUI v5 · Vitest · hast/hastscript (existing rehype pipeline)

**Spec:** `docs/superpowers/specs/2026-05-24-pass-8-kit-rollout-design.md`

---

## File structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/motion.ts` | **Create** | Single source for the cascade delay math: `riseStyle(idx)` |
| `src/tests/motion.test.ts` | **Create** | Unit tests for `riseStyle` |
| `src/lib/markdown/rehype-ec-primitives.ts` | Modify | Import `riseStyle` from `$lib/motion` instead of defining it locally |
| `src/app.css` | Modify | Add global `page-rise` / `module-rise` keyframes + reduced-motion reset |
| `src/routes/contact/+page.svelte` | Modify | Cascade shell; owns the only page title |
| `src/lib/components/ContactForm.svelte` | Modify | Drop duplicate `<h2>`; adopt `btn btn-primary`; token-align fields |
| `src/routes/tags/+page.svelte` | Modify | Token/scale-align the tag cloud; cascade |
| `src/routes/tags/[tag]/+page.svelte` | Modify | Tighten footer/back-link; cascade |
| `src/lib/components/ArchiveList.svelte` | Modify | Confirm tag chip + type derive from tokens/scale |
| `src/routes/[year]/[month]/[slug]/+page.svelte` | Modify | Header eyebrow + tag footer to shared chrome; cascade |
| `BACKLOG.md` | Modify | Log deferred dedup of `[slug]`'s private keyframes |

**Not touched (scope):** `src/routes/[slug]/+page.svelte` (frozen) and the rehype builder's HTML output.

---

## Reference values (do not paraphrase — copy exactly)

The cascade math, lifted verbatim from `rehype-ec-primitives.ts:17-19`:

```ts
// 0.16 + idx*0.04, two decimals — the design-language stagger step
`--rise:${(0.16 + idx * 0.04).toFixed(2)}s`
```

The keyframes + reduced-motion, lifted verbatim from `[slug]/+page.svelte` (so the global copies are byte-identical):

```css
@keyframes page-rise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}
@keyframes module-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}
```

The kit Action primitive (design-language "Action — `btn btn-primary`"): crimson DaisyUI button, one per view.

---

## Task 1: Extract the cascade math to a shared util

**Files:**
- Create: `src/lib/motion.ts`
- Create: `src/tests/motion.test.ts`
- Modify: `src/lib/markdown/rehype-ec-primitives.ts:1-19` and `:186`

- [ ] **Step 1: Write the failing test**

Create `src/tests/motion.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { riseStyle } from '$lib/motion';

describe('riseStyle', () => {
  it('staggers the first module at 0.16s', () => {
    expect(riseStyle(0)).toBe('--rise:0.16s');
  });

  it('steps each subsequent module by 0.04s', () => {
    expect(riseStyle(1)).toBe('--rise:0.20s');
    expect(riseStyle(2)).toBe('--rise:0.24s');
  });

  it('keeps two decimal places', () => {
    expect(riseStyle(11)).toBe('--rise:0.60s');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/motion.test.ts`
Expected: FAIL — `Failed to resolve import "$lib/motion"`.

- [ ] **Step 3: Create the util**

Create `src/lib/motion.ts`:

```ts
/**
 * Per-module entrance-cascade delay, as an inline `--rise` custom property.
 *
 * The page resolves as one top-to-bottom cascade: each module rises in on its
 * own delay, a tight `0.16 + index * 0.04s` step so the stack reads as a single
 * wave (see docs/design-language.md → Motion). Consumed by both the markdown
 * pipeline (rehype-ec-primitives) and the Svelte component pages, so the timing
 * has one source of truth. Paired with the global `module-rise` keyframes in
 * src/app.css.
 */
export function riseStyle(idx: number): string {
  return `--rise:${(0.16 + idx * 0.04).toFixed(2)}s`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/motion.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Point the rehype builder at the shared util**

In `src/lib/markdown/rehype-ec-primitives.ts`, add the import beside the existing imports at the top (after the `./icons` import on line 3):

```ts
import { riseStyle } from '$lib/motion';
```

Then delete the now-duplicate local definition (lines 17-19):

```ts
function riseStyle(idx: number): string {
  return `--rise:${(0.16 + idx * 0.04).toFixed(2)}s`;
}
```

Leave the call site (`return transform(child, riseStyle(idx++));`) unchanged — it now resolves to the imported function.

- [ ] **Step 6: Verify the rehype output is unchanged**

Run: `npx vitest run src/tests/markdown/directives.test.ts`
Expected: PASS — including `staggers the first primitive at --rise:0.16s`. The emitted HTML is byte-identical because the math is identical.

- [ ] **Step 7: Commit**

```bash
git add src/lib/motion.ts src/tests/motion.test.ts src/lib/markdown/rehype-ec-primitives.ts
git commit -m "Extract cascade riseStyle to shared \$lib/motion

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Promote the cascade keyframes to global CSS

**Files:**
- Modify: `src/app.css` (append a motion block near the end, before the final closing of the file)
- Modify: `BACKLOG.md`

- [ ] **Step 1: Add the global keyframes + reduced-motion reset**

Append to `src/app.css` (anywhere at top level outside `@theme`; place it after the existing keyframe-free rules, e.g. just before the file's end). The keyframes are byte-identical to the frozen `[slug]` copies so the system is coherent:

```css
/* ─── Entrance cascade — shared motion ────────────────────────
   Single source for the page-entrance keyframes (docs/design-language.md →
   Motion). Pages emit a per-module `--rise` delay via riseStyle() ($lib/motion)
   and reference these keyframes. The frozen [slug] page keeps its own scoped
   copy (BACKLOG dedup); every other page uses these. */
@keyframes page-rise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}
@keyframes module-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}
```

> Reduced-motion is honored per-page (each consuming page's `<style>` carries its own `@media (prefers-reduced-motion: reduce) { … animation: none }`, scoped to its own elements — see Tasks 3-6), matching how `[slug]` does it. No global animation-disabling rule is added, to avoid reaching into unrelated components.

- [ ] **Step 2: Verify the build still compiles the CSS**

Run: `npm run build`
Expected: build succeeds (Tailwind/PostCSS processes `app.css` with no errors).

- [ ] **Step 3: Log the deferred dedup in the backlog**

The `[slug]/+page.svelte` page now has scoped `page-rise`/`module-rise` keyframes that duplicate the new global ones. It is frozen, so leave it; record the cleanup. Invoke the `log-issue` skill, or add directly under `## Low` in `BACKLOG.md` using the existing structured format:

```markdown
**#N** Dedup `[slug]` cascade keyframes against the global ones #cleanup #ecnordic — 2026-05-24
`page-rise`/`module-rise` now live globally in `app.css` (Pass 8). `src/routes/[slug]/+page.svelte` still defines its own scoped copies; remove them and reference the globals when the frozen directive pages are next unfrozen. Zero-output-change refactor (CSS-only).
```

- [ ] **Step 4: Commit**

```bash
git add src/app.css BACKLOG.md
git commit -m "Promote entrance-cascade keyframes to global app.css

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Contact — kill the duplicate heading, adopt the Action primitive

**Files:**
- Modify: `src/lib/components/ContactForm.svelte`
- Modify: `src/routes/contact/+page.svelte`

The page already renders `<h1 class="page-title">Contact</h1>`; the form must not render a second title. The submit becomes the kit's crimson `btn btn-primary`.

- [ ] **Step 1: Remove the form's duplicate heading**

In `src/lib/components/ContactForm.svelte`, delete the heading line inside `<section id="contact" class="contact-section">` (currently `<h2 class="contact-heading">Contact</h2>`). Also delete the now-orphan `.contact-heading` rule from the `<style>` block (the `.contact-heading { … }` selector).

- [ ] **Step 2: Replace the bespoke submit button with the Action primitive**

In `ContactForm.svelte`, change the submit button's class from the bespoke `submit-btn` to the DaisyUI Action primitive, and delete the `.submit-btn`, `.submit-btn:hover:not(:disabled)`, and `.submit-btn:disabled` rules from `<style>` (DaisyUI supplies hover/disabled). Result markup:

```svelte
<button type="submit" class="btn btn-primary" disabled={submitting}>
  {submitting ? 'Sending…' : 'Send message'}
</button>
```

Keep `align-self: flex-start` so the button doesn't stretch the flex column — add a one-line scoped rule keyed to the kit button instead of the deleted class:

```css
.contact-form .btn { align-self: flex-start; }
```

- [ ] **Step 3: Remove the now-redundant top border/heading spacing**

The `.contact-section` previously separated itself from the form's own `<h2>` with `margin-block-start: 3.5rem; padding-block-start: 3rem; border-top: …`. With the page title now the only heading, that top border reads as a stray rule under the `.page-title`. Set `.contact-section` to sit directly under the title:

```css
.contact-section {
  margin-block-start: 0;
}
```

Delete the old `padding-block-start` and `border-top` declarations from `.contact-section`.

- [ ] **Step 4: Add the entrance cascade to the contact page**

In `src/routes/contact/+page.svelte`, wrap the page so the title rises and the form is one module. Update the markup and add a scoped `<style>`:

```svelte
<script lang="ts">
  import { SITE_TITLE } from '$lib/config';
  import ContactForm from '$lib/components/ContactForm.svelte';
  import { riseStyle } from '$lib/motion';

  let { form } = $props();
</script>

<svelte:head>
  <title>Contact — {SITE_TITLE}</title>
</svelte:head>

<div class="contact-page">
  <h1 class="page-title">Contact</h1>
  <div class="contact-module" style={riseStyle(0)}>
    <ContactForm {form} />
  </div>
</div>

<style>
  .contact-page {
    animation: page-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .contact-module {
    animation: module-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--rise, 0s);
  }
  @media (prefers-reduced-motion: reduce) {
    .contact-page,
    .contact-module {
      animation: none;
    }
  }
</style>
```

- [ ] **Step 5: Type-check**

Run: `npx svelte-check --tsconfig ./tsconfig.json`
Expected: 0 errors, 0 warnings.

- [ ] **Step 6: Build and screenshot the built contact page**

Run: `npm run build && npx pagefind --site .svelte-kit/cloudflare` then serve on `:8787` (per the project's local-preview convention — `wrangler dev`, keeping stdin open). Screenshot `/contact` desktop + mobile, light + dark.
Expected: a single "Contact" title (no duplicate); the submit button is crimson (`btn-primary`); fields unchanged; form rises in once.

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/ContactForm.svelte src/routes/contact/+page.svelte
git commit -m "Contact: drop duplicate heading, adopt btn-primary Action, cascade

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Tags index — derive type from the scale, add the cascade

**Files:**
- Modify: `src/routes/tags/+page.svelte`

Keep the tag-cloud shape; replace ad-hoc values with token/scale-derived ones and add the cascade. The tag name sits on the display/label register; the count is caption/meta.

- [ ] **Step 1: Token/scale-align the tag-cloud styles and add the cascade**

Replace the `<style>` block's `.tags-page`, `.tag-entry`, `.tag-count` rules and add the cascade. The tag name keeps `--color-tag` (its semantic token) and the display font; the count uses `--color-muted` (meta). The page-level `padding-block-start: 3rem` is replaced by the title's own rhythm (the global `.page-title` already carries `margin: 0 0 2rem`). New `<style>`:

```svelte
<style>
  .tags-page {
    animation: page-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .tags-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 1.25rem;
    animation: module-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--rise, 0s);
  }

  .tag-entry {
    font-family: var(--font-display);
    font-size: 0.92rem;
    font-weight: 400;
    color: var(--color-tag);
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .tag-entry:hover {
    color: var(--color-heading);
  }

  .tag-count {
    font-size: 0.65em;
    font-weight: 400;
    color: var(--color-muted);
    vertical-align: super;
    margin-inline-start: 0.1em;
  }

  @media (prefers-reduced-motion: reduce) {
    .tags-page,
    .tags-list {
      animation: none;
    }
  }
</style>
```

> The `0.92rem` body size and `0.65em` count are the existing values, retained deliberately: `0.92rem` IS the sitewide body standard (design-language type scale) and `0.65em` is a relative step. They already match the scale; the change is dropping the page's bespoke top padding and adding the cascade, not re-tuning type.

- [ ] **Step 2: Emit the module `--rise` on the list**

Update the markup so the list carries the delay:

```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import { tagUrl } from '$lib/utils';
  import { SITE_TITLE } from '$lib/config';
  import { riseStyle } from '$lib/motion';

  let { data }: { data: PageData } = $props();
</script>
```

and on the `<ul>`:

```svelte
  <ul class="tags-list" aria-label="All tags" style={riseStyle(0)}>
```

Leave the `{#each}` body unchanged.

- [ ] **Step 3: Type-check**

Run: `npx svelte-check --tsconfig ./tsconfig.json`
Expected: 0 errors, 0 warnings.

- [ ] **Step 4: Build and screenshot `/tags`**

Build + serve on `:8787`; screenshot `/tags` desktop + mobile, light + dark.
Expected: tag cloud unchanged in look, sits directly under the title with the title's standard rhythm, rises in once.

- [ ] **Step 5: Commit**

```bash
git add src/routes/tags/+page.svelte
git commit -m "Tags index: scale-align type, add entrance cascade

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Tag detail + ArchiveList — tighten chrome, add the cascade

**Files:**
- Modify: `src/routes/tags/[tag]/+page.svelte`
- Modify: `src/lib/components/ArchiveList.svelte` (verify only — see Step 1)

- [ ] **Step 1: Confirm ArchiveList already derives from tokens/scale**

Read `src/lib/components/ArchiveList.svelte`. Confirm every color is a `var(--color-*)` and there are no hex/`rgb()`/`oklch()` literals or DaisyUI v4 short vars. It already uses `--color-heading`, `--color-muted`, `--color-body`, `--color-faint`, `--color-border-subtle`. **Make no change** unless a literal is found; if one is found, replace it with the matching token. Record the finding either way (in the commit body).

- [ ] **Step 2: Add the cascade to the tag-detail page**

In `src/routes/tags/[tag]/+page.svelte`, drop the bespoke `padding-block-start: 3rem` (the title's global rhythm covers it) and add the cascade: title rises, the archive list is one module. New file:

```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import ArchiveList from '$lib/components/ArchiveList.svelte';
  import { SITE_TITLE } from '$lib/config';
  import { riseStyle } from '$lib/motion';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.tag} — {SITE_TITLE}</title>
  <meta name="description" content={`Posts tagged "${data.tag}".`} />
</svelte:head>

<div class="tag-page">
  <h1 class="page-title">Posts tagged &#8220;{data.tag}&#8221;</h1>
  <div class="tag-module" style={riseStyle(0)}>
    <ArchiveList posts={data.posts} />
  </div>
  <footer class="tag-footer">
    <a href="/tags/" class="back-link">← All tags</a>
  </footer>
</div>

<style>
  .tag-page {
    animation: page-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .tag-module {
    animation: module-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--rise, 0s);
  }

  .tag-footer {
    margin-block-start: 3rem;
    padding-block-start: 1.75rem;
    border-top: 1px solid var(--color-border-subtle);
  }

  @media (prefers-reduced-motion: reduce) {
    .tag-page,
    .tag-module {
      animation: none;
    }
  }
</style>
```

> `ArchiveList` adds its own `margin-block-start: 2.5rem`; wrapping it in `.tag-module` does not change that. The `.back-link` is the global chrome class — unchanged.

- [ ] **Step 3: Type-check**

Run: `npx svelte-check --tsconfig ./tsconfig.json`
Expected: 0 errors, 0 warnings.

- [ ] **Step 4: Build and screenshot `/tags/<an-existing-tag>`**

Pick a real tag (e.g. from `src/content/posts/`), build + serve, screenshot desktop + mobile, light + dark.
Expected: archive list + back link unchanged in look; sits under the title with standard rhythm; rises in once.

- [ ] **Step 5: Commit**

```bash
git add src/routes/tags/[tag]/+page.svelte src/lib/components/ArchiveList.svelte
git commit -m "Tag detail: title rhythm + entrance cascade; verify ArchiveList tokens

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Post detail — shared chrome + cascade

**Files:**
- Modify: `src/routes/[year]/[month]/[slug]/+page.svelte`

The page already uses `.post-date`, `.page-title`, `.post-body`, `.post-tags`/`.post-tag`, `.back-link` (all global). The body's internal primitives come from the pipeline. The only additions are the cascade and confirming nothing is bespoke.

- [ ] **Step 1: Confirm no bespoke styles, add the cascade**

The current file has no `<style>` block (it relies entirely on global classes — correct). Add the cascade: the header (date + title) rises as the page, the body is one module, the tag footer follows. New file:

```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import { SITE_TITLE } from '$lib/config';
  import { formatDate, tagUrl } from '$lib/utils';
  import { riseStyle } from '$lib/motion';

  let { data }: { data: PageData } = $props();
  let { post } = $derived(data);
</script>

<svelte:head>
  <title>{post.title} — {SITE_TITLE}</title>
  {#if post.description}
    <meta name="description" content={post.description} />
  {/if}
</svelte:head>

<article class="post">
  <header>
    <time class="post-date" datetime={post.date}>{formatDate(post.date)}</time>
    <h1 class="page-title">{post.title}</h1>
  </header>

  <div class="post-module" style={riseStyle(0)}>
    <div class="post-body">
      {@html post.html}
    </div>

    {#if post.tags.length}
      <ul class="post-tags">
        {#each post.tags as tag}
          <li class="post-tag"><a href={tagUrl(tag)}>#{tag}</a></li>
        {/each}
      </ul>
    {/if}
  </div>
</article>

<a href="/" class="back-link">← Home</a>

<style>
  .post {
    animation: page-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .post-module {
    animation: module-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--rise, 0s);
  }
  @media (prefers-reduced-motion: reduce) {
    .post,
    .post-module {
      animation: none;
    }
  }
</style>
```

> The `#{tag}` link markup is unchanged. `.post-tag` is global; the `#` prefix is part of the existing post-detail markup (it differs from the homepage's bare tag text — leave it as-is; changing tag copy is out of scope).

- [ ] **Step 2: Type-check**

Run: `npx svelte-check --tsconfig ./tsconfig.json`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Build and screenshot a real post**

Pick a post URL (year/month/slug from `src/content/posts/`), build + serve, screenshot desktop + mobile, light + dark.
Expected: date eyebrow + title + body + tag footer + back link all unchanged in look; page rises top-to-bottom once.

- [ ] **Step 4: Commit**

```bash
git add "src/routes/[year]/[month]/[slug]/+page.svelte"
git commit -m "Post detail: add entrance cascade over shared chrome

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Full verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Full type check**

Run: `npx svelte-check --tsconfig ./tsconfig.json`
Expected: 0 errors, 0 warnings.

- [ ] **Step 2: Full test suite**

Run: `npm test`
Expected: all suites pass — `motion.test.ts` (new) plus the existing markdown/content tests. The directive exact-HTML tests confirm the rehype output is unchanged after the `riseStyle` extraction.

- [ ] **Step 3: Production build + pagefind**

Run: `npm run build && npx pagefind --site .svelte-kit/cloudflare`
Expected: build + index succeed.

- [ ] **Step 4: Regression check the frozen pages**

Serve `:8787`; screenshot one directive page (e.g. `/about`) light + dark.
Expected: byte-for-byte unchanged — the only shared edit (global keyframes added to `app.css`) does not affect `[slug]`, which still uses its own scoped keyframes. Confirms no bleed.

- [ ] **Step 5: Cross-surface coherence check**

View `/contact`, `/tags`, a `/tags/<tag>`, and a post side by side with `/about`.
Expected: titles, type scale, tag chips, links, and the entrance motion read as one system. The contact submit is the crimson Action; no duplicate headings; no accent-colored running text.

---

## Self-review notes (for the executor)

- **Spec coverage:** Task 1 = shared cascade math; Task 2 = global keyframes + backlog dedup; Task 3 = contact (duplicate heading, Action primitive, field tokens, cascade); Task 4 = tags index (scale, cascade); Task 5 = tag detail + ArchiveList (chrome, cascade, token audit); Task 6 = post detail (chrome, cascade); Task 7 = verification + frozen-page regression. The spec's "don't build a Svelte primitive library" non-goal is satisfied by construction (no such files created).
- **Frozen-page discipline:** `[slug]/+page.svelte` is never edited. The redundant scoped keyframes are logged, not removed (Task 2 Step 3).
- **Naming consistency:** `riseStyle` is the single name everywhere (`$lib/motion`, rehype import, every page). Keyframe names `page-rise` / `module-rise` and the easing `cubic-bezier(0.22, 1, 0.36, 1)` match the `[slug]` reference exactly.
- **No unit tests for Svelte visual changes** — by design; those are verified via `svelte-check` + built-page screenshots (the design-language "verify before claiming done" step), not assertions.
