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
//   4. Optional but recommended: GOOGLE_SA_KEY_B64 sourced in the environment (the same
//      service-account key the Worker uses, `source ~/.local/secrets`) so the script can read
//      the roster spreadsheet back and prove the appended row's CrewLAB invite cells, not just
//      the on-page success state. Without it, sheet verification is skipped with a note.
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

// The committed roster spreadsheet ID (wrangler.toml's REGISTRATION_SHEET_ID); a live tab per
// form kind, matching src/theme/registration/handler.ts's SHEET_TAB map.
const REGISTRATION_SHEET_ID =
  process.env.REGISTRATION_SHEET_ID || '1WUpt5DpYdnOw1umPJeDRnbqWVWW5_55Mqf2H_yHomKM';
const SHEET_TAB = { training: 'Training', camp: 'Talkeetna Camp' };

/** Encode bytes as unpadded base64url, the JWT wire format. */
function bytesToB64url(bytes) {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

/** Sign a service-account JWT for the Sheets read scope, mirroring sheets.ts's signJwt. */
async function signServiceAccountJwt(key) {
  const encoder = new TextEncoder();
  const iat = Math.floor(Date.now() / 1000) - 60;
  const header = bytesToB64url(encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = {
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat,
    exp: iat + 3600,
  };
  const payload = bytesToB64url(encoder.encode(JSON.stringify(claims)));
  const signingInput = `${header}.${payload}`;
  const pkcs8 = Uint8Array.from(
    atob(key.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')),
    (c) => c.charCodeAt(0),
  );
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pkcs8,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signingInput),
  );
  return `${signingInput}.${bytesToB64url(new Uint8Array(signature))}`;
}

/**
 * Read the roster tab back and confirm the most recent `TEST ROW - DELETE ME` row carries the
 * five CrewLAB invite values in its last five cells, proving the append (not just the on-page
 * success state, which returns before we can be sure the sheet write landed). Requires
 * GOOGLE_SA_KEY_B64 in the environment; skips with a note if it is not set.
 */
async function verifyCrewlabRow(kind, expected) {
  const keyB64 = process.env.GOOGLE_SA_KEY_B64;
  if (!keyB64) {
    console.log('SHEET VERIFY: skipped (GOOGLE_SA_KEY_B64 not set; source ~/.local/secrets)');
    return;
  }
  // Fixed message carrying no part of the input: JSON.parse's SyntaxError embeds a fragment
  // of the decoded string, which here is the service-account key (the same guard sheets.ts's
  // decodeServiceAccountKey documents), and the caller's catch prints error text.
  let key;
  try {
    key = JSON.parse(atob(keyB64.replace(/\s+/g, '')));
  } catch {
    throw new Error('GOOGLE_SA_KEY_B64 did not decode to valid JSON');
  }
  const jwt = await signServiceAccountJwt(key);
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const { access_token: accessToken } = await tokenRes.json();
  const range = encodeURIComponent(`'${SHEET_TAB[kind]}'`);
  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${REGISTRATION_SHEET_ID}/values/${range}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const { values } = await valuesRes.json();
  const testRows = (values || []).filter((row) => row[1] === 'TEST ROW - DELETE ME');
  const row = testRows[testRows.length - 1];
  if (!row) {
    console.log(`SHEET VERIFY: FAIL (no TEST ROW - DELETE ME row found in ${SHEET_TAB[kind]})`);
    return;
  }
  const actual = row.slice(-5);
  const pass = expected.every((value, i) => actual[i] === value);
  console.log(pass ? 'SHEET VERIFY: PASS' : 'SHEET VERIFY: FAIL', { expected, actual });
}

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
// CrewLAB invite fields: both athlete contacts filled (only one is required), the parent
// opt-in checked, and a full second-parent pair, so the submit exercises every new column.
await set('athleteEmail', process.env.E2E_PARENT_EMAIL || 'geoff-login@907.life');
await set('athleteCell', '907-555-0199');
await form.locator('#parentCrewlabInvite').check();
await set('secondParentName', 'Test Second Parent - Delete');
await set('secondParentEmail', process.env.E2E_PARENT_EMAIL || 'geoff-login@907.life');
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

let succeeded = false;
try {
  await page.waitForSelector('#register .registration-success:not([hidden])', { timeout: 30000 });
  succeeded = true;
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

if (succeeded) {
  try {
    await verifyCrewlabRow(variant, [
      process.env.E2E_PARENT_EMAIL || 'geoff-login@907.life',
      '907-555-0199',
      'Yes',
      'Test Second Parent - Delete',
      process.env.E2E_PARENT_EMAIL || 'geoff-login@907.life',
    ]);
  } catch (error) {
    console.log('SHEET VERIFY: error', String(error).slice(0, 300));
  }
}

await browser.close();
