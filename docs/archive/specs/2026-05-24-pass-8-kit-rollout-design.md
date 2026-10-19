# Pass 8 — Kit rollout to Svelte components (design)

**Date:** 2026-05-24
**Initiative:** Idiomatic 2026 Exemplar (`ROADMAP.md`, passes 7–9)
**Status:** approved-pending-implementation

---

## Goal

Bring the design-language kit to the three surfaces still hand-built as Svelte
components — **contact**, **tags** (`/tags` + `/tags/[tag]`), and **post detail**
(`[year]/[month]/[slug]`) — so they read as one system with the five directive
pages. Correctness (idiom, single source of truth) is the priority, not visual
expansion.

## Scope

**In:** the three component surfaces above and the components they render
(`ContactForm`, `ArchiveList`), the shared cascade helper, and any `app.css`
token/class work those surfaces require.

**Out:** the five frozen directive pages; new written content (copy stays as-is
beyond removing a duplicate heading); the waiver page (BACKLOG #12 owns its
colors); remote functions (Pass 9); rebuilding the markdown pipeline.

---

## The governing decision — kit-as-CSS-contract (approach C)

The kit already lives in two layers, and only one is coupled to markdown:

1. **Styling** — global CSS in `src/app.css`: the `@theme` tokens
   (`--color-*`, `--font-*`, the type scale) plus global classes (`.ec-card`,
   `.ec-alert`, `.ec-grid`, `.ec-icon`/`.ec-chip`/`.ec-glyph`, `.page-title`,
   `.post-body`, `.post-tags`/`.post-tag`, `.back-link`). This layer is
   **pipeline-agnostic** — plain CSS selectors that style any matching DOM.
2. **Markup** — `src/lib/markdown/rehype-ec-primitives.ts` builds hast nodes for
   *markdown* content.

Only layer 2 is markdown-specific. Svelte component surfaces therefore consume
**layer 1 directly**; they do not need a Svelte re-implementation of layer 2.

### Two markup builders is correct, not a smell

SvelteKit renders markdown to an HTML string at build and injects it via
`{@html post.html}`. Svelte components cannot be mounted inside `{@html}`. The
remark/rehype→HTML-string pipeline is the right tool for prose authored in
markdown (prerenders, zero client JS); Svelte components are the right tool for
interactive/data-driven shells (the contact form's `use:enhance`, `{#each}` over
loaded posts). Unifying the markup layer would require either mounting Svelte
inside `{@html}` (impossible) or recompiling markdown→Svelte (a far larger
change, more client JS, Pass 9+/out of scope).

**Principle: do not unify markup — unify style. The class-name contract is the
shared interface between the two builders.**

### One source of truth per layer

| Layer | Source of truth | Consumers |
|-------|-----------------|-----------|
| Tokens + visual rules | `src/app.css` (`@theme` + global classes) | every component & the rehype output |
| Prose/content markup | `rehype-ec-primitives.ts` (hast) | markdown pages via `{@html}` |
| Shell markup (forms, lists, post chrome) | the Svelte components themselves | their routes |
| Cascade timing math | one shared TS helper (new) | rehype builder **and** Svelte pages |

### Why not the alternatives

- **A — parallel Svelte primitive library** (`<Card>`/`<Alert>`/`<Grid>`/…):
  duplicates the primitive markup `rehype-ec-primitives.ts` already owns → two
  definitions of one primitive → structural drift. These surfaces barely use
  the content primitives anyway. Rejected.
- **B — hand-inline the global classes** in each component: correct pixels today
  but copy-pastes each primitive's class *composition* by hand → the same drift,
  by hand. Rejected.

C is the only option that makes drift between two definitions of a primitive
**structurally impossible** rather than merely discouraged, and it is the least
code — it deletes bespoke divergences instead of adding abstractions.

### What "express the kit" means for these surfaces

These are utility pages (a form, a tag cloud, an archive list, a post reader),
not content pages. The kit's own rule applies: *prose is the default; reach for a
primitive deliberately; don't box every section.* So expressing the kit here
means **aligning tokens, shared chrome classes, the documented Action primitive,
icons, and the entrance cascade** — not introducing cards/ledes the content's
job doesn't warrant. We do **not** build a Svelte version of the content
primitives.

---

## Shared cascade helper (new)

The entrance cascade is in-scope for these pages, implemented the
single-source-of-truth way.

- **Extract** the per-module delay math currently inlined as `riseStyle(idx)` in
  `rehype-ec-primitives.ts` into a shared util — `riseStyle(idx: number): string`
  in `src/lib/motion.ts` (returns `--rise:<n>s`, the `0.16 + idx*0.04`,
  2-decimal step from the design language). The rehype builder imports it instead
  of defining its own copy; Svelte pages import the same function.
- **Promote the keyframes to global.** Today `page-rise` / `module-rise` and
  their `prefers-reduced-motion` reset are **scoped inside the frozen
  `[slug]/+page.svelte`** (component-hashed), so they are not reusable. Pass 8
  adds byte-identical global copies (`page-rise`, `module-rise`, reduced-motion
  reset) to `app.css` as the single source for any non-`[slug]` page. The frozen
  `[slug]` page is **not touched** (scope); its private scoped copy becomes
  redundant with the global one — logged to BACKLOG as a deferred dedup, to close
  when `[slug]` is next unfrozen. Each consuming page adds a `module-rise` rule
  scoped to its module wrapper and emits `style={riseStyle(i)}` per module,
  exactly as the directive pages do.
- **Honor `prefers-reduced-motion`** on every page that opts in (non-negotiable,
  per the design language).

This shares the *math* (a function) and the *keyframes* (global CSS); only the
scoping selector differs per page — the mechanism the design language already
documents as page-agnostic.

---

## Per-surface plan

### Contact — `src/routes/contact/+page.svelte` + `ContactForm.svelte`

The biggest divergence from the kit.

1. **Remove the duplicate heading.** `ContactForm` renders its own
   `<h2 class="contact-heading">Contact</h2>` while the page already supplies
   `<h1 class="page-title">Contact</h1>`. Delete the form's `<h2>` (and the
   now-orphan `.contact-heading` style). The form should not own a page title.
2. **Adopt the kit Action primitive.** Replace the bespoke `.submit-btn` (which
   sits on `--color-body` and is not part of the kit) with DaisyUI
   `btn btn-primary` — the kit's single documented action treatment (crimson =
   the one "act" color). Keep the submitting/disabled states.
3. **Derive field + label type from tokens/scale.** Labels currently borrow
   `.post-date`; keep them on the eyebrow/label ramp (Nunito 700, uppercase,
   tracked) referencing tokens, not ad-hoc values. Inputs reference
   `var(--color-*)` only (already mostly true) — no hardcoded sizes that drift
   from the scale.
4. **Form-level messages** (`.form-success`, `.form-error`) keep their role
   colors via tokens (success = pine, error = vermilion) — already conformant;
   verify, don't rewrite.
5. **Optional cascade:** the page is short (title + form). Treat the form as one
   module; emit a single `--rise`. Low priority — apply only if it reads as
   consistent with the other pages, not for its own sake.

### Tags index — `src/routes/tags/+page.svelte`

A tag-cloud / wayfinding list. Keep its shape (flex-wrap list of tag links);
fix its values.

1. **Pull type from the scale**, not hardcoded `font-size: 0.92rem` / `0.65em`.
   Tag names sit on the label register; counts are caption/meta. Reference the
   scale's roles so a change to the standard propagates here.
2. **Color from tokens** — `--color-tag`, `--color-heading`, `--color-muted`,
   `--color-faint` (already used; confirm none are ad-hoc).
3. No card, no icon (the page is a flat index; nothing's job warrants a
   primitive). Optional cascade as a single module if it aids consistency.

### Tag detail — `src/routes/tags/[tag]/+page.svelte` + `ArchiveList.svelte`

Already largely conformant (`.page-title`, `ArchiveList`, `.back-link`).

1. **Tighten the footer/back-link** against the shared chrome — `.back-link` is
   global; the `.tag-footer` border should use the shared border token
   (`--color-border-subtle`, already does) — verify, keep minimal.
2. **`ArchiveList` type/colors** derive from the scale and tokens (entry title,
   date, tag chips). It already references tokens; confirm the entry-tag chip
   matches the `.post-tag` / entry-tag register used elsewhere so tags look
   identical site-wide.
3. Optional cascade scoped to the archive-year sections.

### Post detail — `src/routes/[year]/[month]/[slug]/+page.svelte`

Already leans on `.post-body` / `.page-title` / `.post-tags` / `.back-link`; the
body itself gets directive primitives via the pipeline.

1. **Header eyebrow.** The date (`.post-date`) above the title should sit on the
   eyebrow/label ramp — verify it matches the date treatment on the homepage /
   archive so dates read with one voice.
2. **Tag footer.** `.post-tags` / `.post-tag` are global; confirm the post-detail
   tag list uses them (it does) and renders identically to tags elsewhere.
3. **Back-link** is global `.back-link` — confirm.
4. Optional cascade: title + lede + body as the cascade, matching the directive
   pages' page-rise → module sequence.

---

## Non-goals / explicit "don't"

- Don't build `<Card>`/`<Alert>`/`<Grid>`/`<Split>` Svelte components.
- Don't touch the five directive pages or the rehype builder's output (only the
  `riseStyle` extraction, which must produce byte-identical `--rise` values).
- Don't rewrite copy or add new content beyond deleting the duplicate heading.
- Don't hardcode `oklch()`, hex, `rgb()`, or DaisyUI v4 short vars; reference
  `var(--color-*)` (binding rule, `design-system.md`).
- Don't redeclare a shared class's values in a component `<style>` — use the
  global class.

---

## Verification

Per the design language's "Refining a page — process" step 6, for each surface:

1. `npx svelte-check` clean.
2. `npm run build` succeeds.
3. The cascade extraction is proven non-regressing: the directive pages' emitted
   HTML (the `--rise` values) is byte-identical pre/post the `riseStyle` move
   (the existing exact-HTML tests cover this; extend if a gap exists).
4. Headless screenshot of each **built** surface on `:8787` (rebuild first):
   desktop + mobile, dark mode, vertical rhythm, and color confined to chrome
   (no accent-colored running text). The contact submit button reads as the
   crimson Action; the duplicate Contact heading is gone.

**Done means:** the three surfaces are indistinguishable in craft from the
directive pages — coherence felt without any single choice being noticed — and
every value traces to a token or the scale, with no bespoke divergence left.
