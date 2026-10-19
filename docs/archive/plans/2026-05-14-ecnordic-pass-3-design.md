# ECN Nordic — Pass 3: Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full visual treatment for ecnordic.ski — refined color tokens, typography scale, nav layout, homepage layout, and calendar page design — produced via `/frontend-design` before any implementation begins.

**Architecture:** Design-first. Task 1 runs `/frontend-design` and produces a spec; Tasks 2–5 implement it. The placeholder theme from Pass 2 (crimson/navy stub tokens, Alegreya Sans / iA Writer fonts) is replaced with the final design. No new routes or data layer work — this pass is purely visual.

**Tech Stack:** Tailwind CSS v4 · DaisyUI v5 · oklch color tokens · Svelte 5 scoped styles

---

> **Working directory:** All tasks run inside `~/Projects/ecnordic-ski/`. Pass 2 must be complete and the site live at ecnordic.ski before starting.

---

## File Map

Files are design-dependent and will be confirmed during Task 1. Expected scope:

| Path | Action | Responsibility |
|---|---|---|
| `src/app.css` | Modify | Final color tokens, font sizes, DaisyUI theme overrides |
| `src/routes/+layout.svelte` | Modify | Nav layout, footer layout |
| `src/lib/components/Nav.svelte` | Modify | Nav design, mobile menu, logo treatment |
| `src/routes/+page.svelte` | Modify | Homepage layout (featured post, post list) |
| `src/routes/calendar/+page.svelte` | Modify | Calendar page layout and event list styling |
| `src/routes/[slug]/+page.svelte` | Possibly modify | Static page layout |
| `src/routes/[year]/[month]/[slug]/+page.svelte` | Possibly modify | Post detail layout |

---

## Task 1: Run `/frontend-design` and produce the design spec

- [ ] **Step 1: Open the ecnordic-ski repo in Claude Code**

```bash
cd ~/Projects/ecnordic-ski
claude
```

- [ ] **Step 2: Invoke the frontend-design skill**

Type `/frontend-design` in the Claude Code prompt. Follow the brainstorming process — it will ask questions about the visual direction before producing a design.

Key inputs to provide during the process:
- **Personality:** Outdoor sport / nonprofit / community — approachable but serious about training
- **Color anchors:** Crimson red (ECN primary), navy blue (accent), warm off-white (background)
- **Fonts:** Alegreya Sans (body), iA Writer Quattro S (display), iA Writer Mono S (mono) — already installed
- **Pages to design:** Homepage (blog-style), Calendar, Nav, static pages (About, etc.)
- **Reference:** ECN is affiliated with Bettye Davis East Anchorage High School — colors are inspired by school colors but ECN's own interpretation

- [ ] **Step 3: Review and approve the design spec**

The `/frontend-design` skill will produce a spec document. Review it and request changes before approving. The spec is the source of truth for all implementation tasks below.

- [ ] **Step 4: Note the spec file path**

The spec will be saved to `docs/superpowers/specs/YYYY-MM-DD-ecnordic-design.md`. Record the path here for reference in subsequent tasks.

---

## Task 2: Implement color tokens

**Files:**
- Modify: `src/app.css` (token values only — structure from Pass 2 stays)

- [ ] **Step 1: Open the design spec**

Read the color token section of the spec produced in Task 1.

- [ ] **Step 2: Update `--color-*` values in `src/app.css`**

Replace the placeholder token values in the `@theme` block with the final values from the spec. Also update the `@plugin "daisyui/theme"` blocks for `ecn` and `ecn-dark` with the final overrides.

All values must use `oklch()`. No hex, no `rgb()`.

- [ ] **Step 3: Verify tokens render correctly**

```bash
npm run dev
```

Visit the homepage, calendar, and about page. Check both light (`ecn`) and dark (`ecn-dark`) themes. Verify color contrast feels correct for text, links, borders, and surfaces.

- [ ] **Step 4: Commit**

```bash
git add src/app.css
git commit -m "Apply final ECN color tokens from design spec"
```

---

## Task 3: Implement typography and global styles

**Files:**
- Modify: `src/app.css` (body, heading sizes, line heights, post-body styles)

- [ ] **Step 1: Read the typography section of the design spec**

Note: font families are already set in Pass 2. This task covers sizes, weights, line heights, and spacing.

- [ ] **Step 2: Update typographic scale in `src/app.css`**

Apply the spec's values for:
- `body` font-size and line-height
- Heading sizes (h1–h4) via `@theme` or scoped styles
- `.post-body` prose styles (paragraph spacing, list styles, blockquote)
- `.post-date` and `.post-tags` refinements if specified

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Read a post at `/2026/05/welcome/`. Verify body text is comfortable to read, headings have clear hierarchy, and code blocks use iA Writer Mono S.

- [ ] **Step 4: Commit**

```bash
git add src/app.css
git commit -m "Apply final ECN typography from design spec"
```

---

## Task 4: Implement nav and layout

**Files:**
- Modify: `src/routes/+layout.svelte`
- Modify: `src/lib/components/Nav.svelte`

- [ ] **Step 1: Read the nav and layout section of the design spec**

- [ ] **Step 2: Implement nav design in `src/lib/components/Nav.svelte`**

Apply the spec's nav treatment — logo/wordmark, link styles, active state, mobile breakpoint behaviour. Use `var(--color-*)` tokens and DaisyUI v5 classes. No hardcoded `oklch()` values.

- [ ] **Step 3: Update footer in `src/routes/+layout.svelte`**

Apply spec's footer design if it differs from the placeholder.

- [ ] **Step 4: Verify nav across pages**

```bash
npm run dev
```

Visit homepage, calendar, about, contact. Check nav active states, mobile layout, and theme toggle (if present).

- [ ] **Step 5: Commit**

```bash
git add src/routes/+layout.svelte src/lib/components/Nav.svelte
git commit -m "Apply final ECN nav and layout from design spec"
```

---

## Task 5: Implement homepage and page layouts

**Files:**
- Modify: `src/routes/+page.svelte` (homepage)
- Modify: `src/routes/calendar/+page.svelte` (calendar page)
- Possibly modify: `src/routes/[slug]/+page.svelte`, `src/routes/[year]/[month]/[slug]/+page.svelte`

- [ ] **Step 1: Read the homepage and page layout sections of the design spec**

- [ ] **Step 2: Implement homepage layout in `src/routes/+page.svelte`**

Apply the spec's homepage design — featured post treatment, post list styling, spacing. Use `var(--color-*)` tokens throughout.

- [ ] **Step 3: Implement calendar page layout**

Apply spec's calendar page design — grid container sizing, event list styling, ICS subscribe button treatment.

- [ ] **Step 4: Update post detail and static page layouts if specified**

If the spec includes changes to post detail or static page layouts, apply them now.

- [ ] **Step 5: Full visual review in browser**

```bash
npm run dev
```

Walk every route: homepage, post detail, calendar, about, talkeetna-camp, resources, contact, tag page. Check both themes. Verify the site looks intentional and consistent.

- [ ] **Step 6: Run svelte-check**

```bash
npx svelte-check
```

Fix any type errors before committing.

- [ ] **Step 7: Commit**

```bash
git add src/routes/
git commit -m "Apply final ECN page layouts from design spec"
```

---

## Task 6: Final build and deploy

- [ ] **Step 1: Full build**

```bash
npm run build && npx pagefind --site .svelte-kit/cloudflare
```

Fix any build errors.

- [ ] **Step 2: Run all tests**

```bash
npm test
```

All tests must pass.

- [ ] **Step 3: Update `docs/STATUS.md`**

Mark Pass 3 complete and note the design spec path:

```markdown
| 3 | Design: /frontend-design visual treatment | ✓ Done |
```

- [ ] **Step 4: Push**

```bash
git add docs/STATUS.md
git commit -m "Pass 3 complete: ECN visual design"
git push
```

Watch `https://github.com/glw907/ecnordic-ski/actions`. Verify the deploy completes and `https://ecnordic.ski` looks correct.

Pass 3 complete.
