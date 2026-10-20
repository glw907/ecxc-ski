# Pass 9 — Remote-functions spike (contact form)

**Date:** 2026-05-24
**Status:** approved (implement)

## Goal

Evaluate SvelteKit experimental remote functions (`form()`) on a real surface — the
contact form — and reach an adopt / defer / reject verdict. The decision from
brainstorming: **convert the live contact form** (most realistic test), keep it on this
branch, and adopt if it works without regressing the Turnstile + Email Workers path.

## Stability assessment (the verdict's evidence)

- Available since SvelteKit **2.27**; we're on **2.60.1** (~33 minors of iteration).
- Officially **experimental**: docs say "likely to contain bugs and subject to change
  without notice"; TS types say "may be changed or removed at any time."
- Strategic direction per core team (discussion #13897): an **additive** modern data-flow
  layer — `load` functions and form actions are *not* deprecated and "continue to work
  as is." Team has named pre-stable work (auto-batching, prefetching); **no stable date**
  as of May 2026.
- Requires opt-in: `kit.experimental.remoteFunctions`. Adds a Standard Schema dep
  (Valibot chosen — smaller than Zod).

## Why it helps this surface

1. **Type-safe client/server boundary** — replaces the hand-maintained `FormState`
   interface in `ContactForm.svelte` that can silently drift from the server's `values`.
2. **Declarative validation** — Valibot schema replaces the manual required-checks +
   email regex + per-error `fail()` + `values` repopulation plumbing.
3. **Built-in progressive enhancement** — `form()` ships the PE attachment and `pending`
   state, replacing the hand-written `use:enhance` + `submitting` flag.

`query.batch`/`live`/single-flight mutations don't apply to a fire-and-forget form.

## Design

- **`src/lib/contact.remote.ts`** — exports `sendMessage = form(schema, handler)`.
  Placed in `$lib` (not `$lib/server`, which is forbidden for remote files).
  - Schema (Valibot): `name` (trimmed, non-empty), `email` (trimmed, valid email),
    `message` (trimmed, non-empty), `cf-turnstile-response` (optional string — captured
    from the Turnstile widget's injected hidden input).
  - Handler: `getRequestEvent()` for `platform.env` + `getClientAddress()`; verify
    Turnstile; send via Email Workers binding (`createMimeMessage` + dynamic
    `cloudflare:email`). On Turnstile/mail failure, surface inline via `invalid(...)`
    (form-level issue) — mirrors the old inline `fail()` UX, avoids the `+error.svelte`
    full-page swap.
  - Returns `{ success: true }`.
- **`ContactForm.svelte`** — spread `{...sendMessage}`; fields via `.as('text'|'email')`;
  `sendMessage.fields.allIssues()` rendered as `.form-error` at top (covers field +
  form-level issues); success via `{#if sendMessage.result?.success}`; button disabled /
  label from `sendMessage.pending`. Drops `$lib/forms` `enhance`, the `FormState`
  interface, and manual `value=` repopulation.
- **`contact/+page.svelte`** — no longer receives a `form` prop; keeps the `riseStyle`
  entrance wrapper.
- **`contact/+page.server.ts`** — deleted (the form action moves into the remote
  function; no other server load needed).
- **`svelte.config.js`** — add `kit.experimental.remoteFunctions: true`. Add
  `compilerOptions.experimental.async` only if the build/`svelte-check` requires it
  (form() doesn't use component-level `await`).

## Verification

- `svelte-check` clean.
- `npm run build` succeeds (adapter-cloudflare generates the remote endpoint).
- Local `wrangler` preview at :8787: submit succeeds; invalid email blocks; Turnstile
  failure shows inline; no-JS fallback still posts (PE is the point).

## Out of scope

Site-wide migration, frozen directive pages, waiver page (BACKLOG #12), `query()`/
`command()` flavors.

## Verdict

Written at pass end in `docs/architecture.md` (adopt / defer / reject) based on the
hands-on result + the stability evidence above.
