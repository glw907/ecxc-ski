# Development notes

Toolchain and framework gotchas this site has hit, each checked against the code on 2026-10-14. Design decisions live in `docs/architecture.md`.

## Testing remote functions under vitest

`vitest.config.ts` loads only the Svelte plugin, not `sveltekit()`, so `$app/server` does not resolve. A module that imports it at the top level (a `.remote.ts` file, or a component that imports one) needs `vi.mock('$app/server', ...)` at the top of the test file. `src/tests/registration/remote.test.ts` is the worked example.

`invalid()` always throws a `ValidationError` whose `.message` is the fixed string "Validation failed". Assert on `.issues[].message`, as `remote.test.ts` does.

A component test that mocks `form()` must define `fields`, `pending`, `result`, and `submitted` as non-enumerable, as the real `RemoteForm` does. Otherwise `{...action}` on the `<form>` tries to stringify the `fields` proxy as an attribute. `src/tests/registration/components.test.ts` carries the stub.

## Remote-form schemas and markup

- A `*.remote.ts` file may export only remote functions. A plain helper or type export passes `svelte-check` and vitest but breaks `vite dev` and `vite build` at module init. The pipeline core lives in `src/theme/registration/handler.ts` for this reason.
- Remote `form()` converts checkboxes and numbers before Valibot sees them, so schema fields are `v.optional(v.boolean(), false)` and optional numbers, never string-parsing pipes (`src/theme/registration/schema.ts`).
- A checkbox that does not go through `RemoteFormField.as('checkbox')` needs its `b:` name prefix by hand. Without it the server receives the string "on" and `v.boolean()` rejects it. The waiver checkboxes in `WaiverText.svelte` are the case. Field names use `_`, as in `b:agree_<id>`, because a hyphen is an invalid path segment and kills hydration.
- A field set built from a runtime array loses literal key types. Type the consumer with a hand-written interface (`SharedParsedFields` in `schema.ts`) instead of `v.InferOutput`.
- A `window.turnstile` declaration cannot live in a `.svelte` script block. It sits in `src/theme/turnstile.d.ts`.

## Styles across routes

A `:global()` rule in one route's `<style>` ships only in that route's CSS chunk. `[...path]/+page.svelte` owns `.page-title`, so `/talkeetna` and `/training` duplicate the rule with a comment. A rule several routes must share belongs in `ecxc-theme.css`.

`ORIGIN` and `SITE_DESCRIPTION` in `src/chassis/content.ts` are theme literals despite the directory. A site that forgets them publishes canonical URLs and feed entries for the starter's placeholder host.

## Google service-account token

`src/theme/registration/sheets.ts` signs its RS256 JWT with WebCrypto and no dependency. Google keys arrive as PKCS#8 PEM, so it skips the PKCS#1 conversion that cairn-cms's GitHub App signer needs. Tests generate a throwaway RSA keypair with `crypto.subtle.generateKey`, never a literal key.

## Local admin-guard smoke

`wrangler.toml` declares `custom_domain = true`, so plain `wrangler dev` resolves the host to `ecxc.ski` and the guard's `isLocalHost` check fails. Run `wrangler dev --local-protocol https`, and keep it alive with `sleep infinity | npx wrangler dev ... &` (it exits on stdin EOF).

The guard needs a session cookie, and there is no seed script. Insert a row into the `session` table of the local D1 file (`find .wrangler -iname "*.sqlite" -path "*D1DatabaseObject*"`), using the engine's own insert shape (`id, email, expires_at, created_at`, in `node_modules/@glw907/cairn-cms/dist/auth/store.js`). The session id is the cookie value, unhashed. Under https the cookie is named `__Host-cairn_session`. Expect `/admin/posts` without a cookie to answer 303 to `/admin/login`, and `/admin` with one to answer 307 to `/admin/posts`. Delete the row afterward.
