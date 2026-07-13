# Registration forms: live end-to-end test runbook

The registration pipeline (Training at `/training`, Talkeetna Camp at `/talkeetna`) has one path
no unit test or static review can cover: a real browser filling the form, the Worker verifying
Turnstile, appending the roster row, and sending both emails. `scripts/e2e-registration.mjs`
drives that path. Run it after any change to `src/theme/registration/**`, the form component, or
the waiver schema, and as the final gate before announcing the forms.

## What the automated gates already prove (so this test is scoped)

- Schema validation, record assembly, the Sheets JWT/append client, and both email builders:
  the vitest suite (`src/tests/registration/*.test.ts`).
- The Sheets `values.append` round trip with the real service account: proven directly against
  the roster spreadsheet during provisioning (a probe row, appended and cleared).
- The record email mechanism (`SEND_EMAIL` + `cloudflare:email` `EmailMessage`): the same path
  the live contact form uses.
- HTTP, rendering, the `/waiver` 301, and form hydration: the deploy verification sweep.

The one mechanism nothing else exercises is the **parent-copy send through the unrestricted
`EMAIL` binding**, plus the full browser-to-Worker submit. That is what this runbook is for.

## Prerequisites

1. **Playwright with Chromium.** Not a project dependency (the app has no browser tests). Install
   transiently: `npm i -D playwright && npx playwright install chromium`, or point `NODE_PATH` at
   a scratchpad install. The workstation already has Chromium builds under `~/.cache/ms-playwright`.

2. **The always-passes Turnstile test secret, temporarily.** A headless browser cannot solve a
   real Turnstile challenge, and the Worker fails closed without a valid token (by design). Swap in
   Cloudflare's documented test secret for the run, then restore the real one:

   ```bash
   # Set the test secret (accepts any token):
   printf '1x0000000000000000000000000000000AA' | npx wrangler secret put TURNSTILE_SECRET_KEY

   # ... run the test ...

   # Restore the real secret. Recover its value from the Turnstile API (rotate with a grace
   # period so the live widget keeps working), then put it back:
   curl -s -X POST \
     "https://api.cloudflare.com/client/v4/accounts/120c269ad6d3dfbe6d63a0bb53758ca0/challenges/widgets/0x4AAAAAADPWAhVwEJvGQqhh/rotate_secret" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" \
     -d '{"invalidate_immediately": false}' | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['secret'])" \
     | tr -d '\n' | npx wrangler secret put TURNSTILE_SECRET_KEY
   ```

   Leaving the test secret on production defeats the fail-closed guard, so restore it the moment
   the run is done. Prefer running against a preview deployment over production when you can.

3. **A parent email you control**, so the confirmation copy lands somewhere you can check and
   delete. Pass it with `E2E_PARENT_EMAIL`; it defaults to `geoff-login@907.life`.

## Run

```bash
node scripts/e2e-registration.mjs camp https://ecxc.ski        # camp form (the fuller one)
node scripts/e2e-registration.mjs training https://ecxc.ski    # training form
```

A pass prints `RESULT: SUCCESS state reached` plus the on-page confirmation. Then verify the
side effects by hand: the row landed in the roster spreadsheet's `Training` / `Talkeetna Camp`
tab, the record email reached `CONTACT_EMAIL`, and the parent copy reached the address you used.

## Clean up every run

- Delete the `TEST ROW - DELETE ME` row from the spreadsheet.
- Delete the two test emails.
- Restore the real Turnstile secret (see above).

## Gotchas the script encodes (learned the hard way, 2026-07-13)

- **The page has more than one `<form>`.** The search-modal dialog is `form` index 0 with
  `method="dialog"`; the registration form is a later one with `method="POST"`. Scope every query
  to `#register form`, never `document.querySelector('form')`, or you drive the wrong form and see
  a valid-but-empty submit that never fires.
- **Wait for `load`, then for hydration.** Under `waitUntil: 'domcontentloaded'` the client bundle
  has not run, so the remote form is still `method="dialog"` and swallows the submit with no POST
  and no error. The script waits for the method to flip to `POST` before touching the form.
- **Not `networkidle`.** The Turnstile widget keeps a connection open, so `networkidle` never
  fires; wait on a real field selector instead.
- **Waiver checkboxes are `b:agree_<id>` (underscore).** SvelteKit remote-form field names are
  parsed as identifier paths; a hyphen is an invalid path segment that throws at hydration and
  silently breaks the whole form island. This bit us live once already.
