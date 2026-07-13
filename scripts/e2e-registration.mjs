// Live end-to-end test of a registration form submission (Training or Talkeetna Camp).
//
// This proves the one path no static gate can: a real browser filling and submitting the form,
// the Worker verifying Turnstile, appending the roster row, and sending both emails. Run it
// against production (or a preview) after any change to the registration pipeline, the schema,
// or the form component.
//
// Usage:
//   node scripts/e2e-registration.mjs [training|camp] [origin]
//   node scripts/e2e-registration.mjs camp https://ecxc.ski
//
// PREREQUISITES (see docs/registration-e2e.md for the full runbook):
//   1. playwright installed (npm i -D playwright, or a scratchpad install) with chromium.
//   2. The Worker's TURNSTILE_SECRET_KEY temporarily set to Cloudflare's always-passes test
//      secret (1x0000000000000000000000000000000AA), because a headless browser cannot solve a
//      real challenge. RESTORE the real secret afterward. The runbook has both commands.
//   3. All submitted values are TEST-flagged ("TEST ROW - DELETE ME") so the row and emails are
//      obviously disposable; delete the roster row and the test emails when done.
//
// Hard-won gotchas this script encodes (do not "simplify" them away):
//   - The page has MORE THAN ONE <form> (the search-modal dialog is form 0). Scope every query
//     to the registration form via the #register section, never document.querySelector('form').
//   - Wait on a real field selector, not networkidle: the Turnstile widget keeps the network
//     busy so networkidle never fires.
//   - Use waitUntil: 'load' AND wait for the form to hydrate (method flips dialog -> POST)
//     before filling/submitting. Under domcontentloaded the client bundle has not run yet, so
//     the submit does nothing and every field looks empty to the remote handler.
//   - Waiver agreement checkboxes are named b:agree_<id> (underscore). Hyphens are invalid
//     SvelteKit remote-form field paths and silently break form hydration.
//   - The Turnstile field is `turnstileToken`, NOT Cloudflare's default `cf-turnstile-response`.
//     SvelteKit's remote-form client (form-utils.js's `convert_formdata`/`split_path`) parses
//     EVERY posted FormData key as an identifier path and throws synchronously, client-side,
//     before any request is sent, on a key containing a hyphen. That bug is not specific to a
//     headless dummy injection: it fired for every real user's browser too (a genuine production
//     bug, fixed 2026-07-13 alongside this script by adding `data-response-field-name
//     ="turnstileToken"` to both `.cf-turnstile` divs and renaming the schema field to match).
//     A submit against stale code (or a future regression back to the default name) fails
//     silently the exact way this comment used to describe: checkValidity() true, click fires,
//     zero POSTs, and the page's error boundary swaps in a client-rendered 500 with no console
//     error printed by default (catch it via `page.on('pageerror')` or by reading
//     `document.body.innerText`, since the crash happens inside SvelteKit's own client runtime
//     before our code ever gets a chance to log anything).

import { chromium } from 'playwright';

const variant = process.argv[2] === 'training' ? 'training' : 'camp';
const origin = process.argv[3] || 'https://ecxc.ski';
const path = variant === 'training' ? '/training' : '/talkeetna';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 2600 } });
const posts = [];
page.on('request', (r) => {
  if (r.method() === 'POST' && r.url().startsWith(origin)) posts.push(r.url().slice(origin.length));
});
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 200)));

await page.goto(origin + path, { waitUntil: 'load' });
await page.waitForSelector('[name="athleteFullName"]', { timeout: 20000 });
// Wait for the form island to hydrate: an un-hydrated remote form has method="dialog" and
// swallows the submit; SvelteKit rewrites it to method="POST" once the client mounts.
await page.waitForFunction(
  () => document.querySelector('#register form')?.getAttribute('method')?.toLowerCase() === 'post',
  { timeout: 20000 },
);

// Scope to the registration form (form 0 is the search-modal dialog).
const form = page.locator('#register form');

const set = (name, value) => form.locator(`[name="${name}"]`).fill(value);
await set('athleteFullName', 'TEST ROW - DELETE ME');
await set('athleteDob', '2009-03-15');
await set('parentName', 'Test Parent - Delete');
await set('parentRelationship', 'Parent');
await set('address', '123 Test St');
await set('city', 'Anchorage');
await set('state', 'AK');
await set('zip', '99504');
await set('cellPhone', '907-555-0100');
await set('parentEmail', process.env.E2E_PARENT_EMAIL || 'geoff-login@907.life');
await set('emergencyName', 'Test Emergency');
await set('emergencyRelationship', 'Aunt');
await set('emergencyPhone', '907-555-0101');
await set('insuranceProvider', 'TestCare');
await set('policyNumber', 'TEST-123');
await set('medications', 'None (test)');
await set('allergies', 'None (test)');
await set('conditions', 'None (test)');
if (variant === 'camp') {
  await set('dietary', 'None (test submission)');
  await form.locator('#carpool-self').check();
}
await form.locator('input[name="photoRelease"][value="deny"]').check();
for (const box of await form.locator('input[name^="b:agree_"]').all()) await box.check();
await set('athleteSignature', 'TEST ROW - DELETE ME');
await set('parentSignature', 'Test Parent - Delete');
for (const box of await form.locator('input[name="b:athleteConsent"], input[name="b:parentConsent"]').all()) {
  await box.check();
}

// With the always-passes test secret set on the Worker, any token verifies; inject a dummy so
// we do not depend on solving a live challenge headless. The field is `turnstileToken` (the
// widget's `data-response-field-name` override), not Cloudflare's default
// `cf-turnstile-response`; see the header comment for why the default name is unusable here.
await form.evaluate((f) => {
  let el = f.querySelector('[name="turnstileToken"]');
  if (!el) {
    el = document.createElement('input');
    el.type = 'hidden';
    el.name = 'turnstileToken';
    f.appendChild(el);
  }
  el.value = 'test-token-e2e';
});

await form.locator('button[type="submit"]').click();

try {
  await page.waitForSelector('#register .registration-success:not([hidden])', { timeout: 30000 });
  console.log('RESULT: SUCCESS state reached');
  console.log('confirmation:', (await page.textContent('#register .registration-success')).trim().slice(0, 240));
} catch {
  console.log('RESULT: no success state');
  // A client-side crash (e.g. the hyphenated-field-name bug this script's header documents)
  // unmounts #register entirely and swaps in SvelteKit's error boundary, so check for that
  // before assuming the form is still there with an empty alert.
  if ((await page.title()).startsWith('500')) {
    console.log('CLIENT ERROR BOUNDARY (500):', (await page.textContent('body')).trim().slice(0, 400));
  } else {
    const alert = await page.locator('#register [role="alert"]').textContent().catch(() => '');
    console.log('alert:', (alert || '(empty)').trim().slice(0, 400));
  }
  console.log('POSTs to origin:', posts);
}
await browser.close();
