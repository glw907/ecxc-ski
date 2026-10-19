# Idiomatic 2026 Exemplar — Design

**Status:** Approved scope (brainstormed 2026-05-24). Decomposed into a ROADMAP
initiative spanning multiple passes.

## Goal

Make ecnordic.ski an exemplar of *stable* idiomatic 2026 SvelteKit · Tailwind CSS v4 ·
DaisyUI v5 · TypeScript — clean code and architecture throughout — and finish bringing
the design-language kit to the Svelte-component surfaces deferred since Pass 4. The
codebase should read as a project others could learn from: current idiom, tight types,
clear module boundaries, no dead or stale patterns.

**No behavior change** beyond the kit styling on the three component surfaces.

## Context

The render pipeline, content layer, and five directive pages are already done and frozen
(Passes 5–6, plus the 2026-05-24 architecture cleanup: mdsvex removed, frontmatter
build-gated, explicit prerender `entries()`). The Claude infrastructure was just
modernized: the official **Svelte MCP** (`mcp.svelte.dev`) is wired via `.mcp.json`,
giving live version-accurate Svelte 5 / SvelteKit docs, and 11 hookify rules enforce
Svelte-5 / Tailwind-v4 / DaisyUI-v5 idiom at the regex level.

This work verifies and tightens what those regex rules can only approximate, using the
MCP as the reference of record.

**Decision (ADR):** Adopt only *stable* idioms; defer SvelteKit remote functions.
**Rationale:** Remote functions are experimental as of 2026 (require
`kit.experimental.remoteFunctions` + `compilerOptions.experimental.async`, explicitly
"subject to change without notice," outside semver). ecnordic.ski is a live production
site; a model production project should not depend on a breaking-change-prone API.
**Tradeoff:** We forgo the flagship 2026 SvelteKit feature for now; it gets a dedicated,
clearly-labeled experimental spike later.
**Date:** 2026-05-24

## Scope

**In:** whole-codebase conformance + hardening across three stable tracks, then the kit
rollout to the three remaining Svelte surfaces.

**Out:** remote functions (deferred to a later spike); new content; the five directive
pages (frozen); any behavior change beyond kit styling.

## Decomposition into passes

| Pass | Goal | Visual change? |
|------|------|----------------|
| **7 — Conformance & hardening sweep** | Tracks 1–3 across the whole codebase. Idiomatic Svelte 5, current Tailwind v4 / DaisyUI v5, tight types + clean module boundaries. | **None** — every surface stays AE=0 vs. current. |
| **8 — Kit rollout to components** | Bring the kit to `ContactForm`/contact, the tag pages, and post detail (the original Pass 7 goal). | **Yes, by design** on those three surfaces only. |
| **9 — Remote functions spike** *(deferred, optional)* | Evaluate `form()`/`query()` behind experimental flags, contact form first. Greenlit only after Pass 8. | Behavior change — isolated. |

The clean boundary is between Pass 7 (provably no visual change) and Pass 8 (intentional
visual change). Each pass is independently shippable and reviewable.

## Pass 7 — conformance criteria

What "idiomatic" means per track. Every pattern in question is confirmed against the
Svelte MCP (`get_documentation`) before a change is made.

**Track A — Type / structure hardening** (done first; establishes a clean base):
- No loose casts (`as string`, `as boolean`) where a validated/narrowed type is available.
- Exhaustive types; discriminated unions over optional-field soup where it clarifies.
- Module boundaries: each file has one clear purpose; split anything that has grown to do
  several things.
- Test coverage raised toward exemplar level where logic is testable.

**Track B — Tailwind v4 / DaisyUI v5 sweep:**
- Every utility class current for v4; no v3-era class names or config-file assumptions.
- DaisyUI v5 class and CSS-variable names only (no v4 short vars like `--p`, `--bc`).
- `@theme` tokens used for color; no stray hex/`rgb()`/hardcoded `oklch()` in components.
- Arbitrary-value utilities reviewed and replaced with tokens where one exists.

**Track C — Svelte 5 idiom sweep:**
- Runes correctness: `$state` / `$derived` / `$props` / `$effect` used for their intended
  jobs; no leftover Svelte-4 reactive (`$:`) or `export let`.
- Snippets + `{@render}` instead of slots where the component takes content.
- `{@attach}` attachments over imperative actions where it fits.
- `$bindable()` only where two-way binding is genuinely needed.

## Pass 8 — kit rollout approach

**Open decision to settle first (per surface):** how the kit's look is expressed in
`.svelte`, since the directive vocabulary (`:::card`, `:::grid`, …) is markdown-only.
Three options, decided per surface before coding:

1. **Reuse the global `.ec-*` classes** from `src/app.css` directly in component markup
   (lowest new surface area — preferred where the primitive is class-only).
2. **Small shared Svelte components** wrapping a primitive (e.g. `<EcAlert>`), where the
   primitive needs structure/props.
3. **Svelte equivalents of the directive primitives**, only if 1–2 prove insufficient.

Default preference: option 1, escalating to 2 only when a primitive carries structure a
bare class can't. Surfaces: `ContactForm.svelte` + contact page; `/tags` + `/tags/[tag]`;
post detail (`[year]/[month]/[slug]`).

## Method

- **MCP-audited:** confirm the current idiom from the Svelte MCP before changing a Svelte
  or SvelteKit pattern. The MCP must be active (server approved) before Track C / Pass 8.
- **Hookify backstop:** the regex rules stay on; this work catches the semantic and
  structural issues regex can't, and verifies the rules' assumptions still hold.
- Each track lands as its own reviewable commit within Pass 7.

## Verification

- `npm run check` (svelte-check) 0 errors / 0 warnings.
- `npm test` (vitest) green; new unit tests where hardening adds testable logic.
- `npm run build` clean + `npx pagefind --site .svelte-kit/cloudflare`.
- **Pass 7 regression gate:** all surfaces (the five directive pages *and* the three
  component surfaces) stay AE=0 against pre-pass screenshots — Pass 7 changes how the
  code reads, never how it renders.
- **Pass 8:** the three component surfaces change visually by design; their screenshots
  are a review aid, and the five directive pages must still be AE=0.

## Risks

- **MCP availability:** the Svelte MCP server must be approved/active in the session, or
  Track C loses its reference. Mitigation: smoke-test the MCP before starting Track C.
- **Scope creep in hardening:** "tighten everything" can sprawl. Mitigation: hardening is
  bounded to loose casts, file-boundary splits, and test gaps that already affect the
  touched code — not speculative refactors.
- **Kit-rollout visual drift:** the three surfaces are unverified against the kit today.
  Mitigation: settle the per-surface approach first; screenshot review before commit.

## Deferred

- **Remote functions** (Pass 9 spike) — experimental; greenlit only after Pass 8, behind
  experimental flags, contact form first, with an explicit understanding it may break on
  upstream releases. To be logged in `BACKLOG.md` + `ROADMAP.md` when this initiative is
  recorded.
