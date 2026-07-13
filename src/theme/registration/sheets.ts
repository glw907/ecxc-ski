// Google Sheets append client for registration submissions. Auth is a service-account JWT
// (RS256, signed with WebCrypto) exchanged for a short-lived OAuth access token, then one
// `spreadsheets.values.append` call per submission. This mirrors the RS256 JWT dance
// cairn-cms's own GitHub App signer uses (dist/github/signing.js), but a Google
// service-account key ships its private key already in PKCS#8 PEM, so no PKCS#1 conversion
// is needed here. No dependency additions: WebCrypto and fetch only, both ambient on
// Cloudflare Workers.

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_LIFETIME_SECONDS = 3600;
// Backdate `iat` by this much to tolerate the signing clock running slightly ahead of
// Google's; a `iat` that reads as "in the future" to the token endpoint is rejected outright,
// while a `iat` a minute in the past is well within Google's own tolerance.
const CLOCK_SKEW_SECONDS = 60;

const encoder = new TextEncoder();

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

interface TokenResponse {
  access_token?: string;
}

/** Encode bytes as unpadded base64url (RFC 4648 section 5), the JWT wire format. */
function bytesToB64url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

// TextEncoder/atob produce Uint8Arrays whose generic buffer type no longer satisfies Web
// Crypto's BufferSource under strict lib types; hand the underlying ArrayBuffer over.
function buf(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/** Strip PEM armor and decode to the raw PKCS#8 DER bytes Web Crypto's importKey expects. */
function pemToPkcs8(pem: string): Uint8Array {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Decode the base64-encoded service-account key JSON. Whitespace (a copy-pasted multi-line
 * secret, or a trailing newline from `wrangler secret put`) is stripped before decoding, since
 * `atob` rejects it outright. On any decode failure, throws a fixed message carrying no part of
 * the input: a raw `JSON.parse` error embeds a fragment of the bad input in its own message,
 * and this message ends up relayed to Geoff by email (see handler.ts's `sheetsError`), so it
 * must never carry key material.
 */
function decodeServiceAccountKey(b64: string): ServiceAccountKey {
  try {
    return JSON.parse(atob(b64.replace(/\s+/g, ''))) as ServiceAccountKey;
  } catch {
    throw new Error('service account key could not be decoded');
  }
}

/** Sign an RS256 JWT asserting the service account for the Sheets scope, valid one hour. */
async function signJwt(key: ServiceAccountKey): Promise<string> {
  const iat = Math.floor(Date.now() / 1000) - CLOCK_SKEW_SECONDS;
  const header = bytesToB64url(encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = {
    iss: key.client_email,
    scope: SHEETS_SCOPE,
    aud: TOKEN_URL,
    iat,
    exp: iat + TOKEN_LIFETIME_SECONDS,
  };
  const payload = bytesToB64url(encoder.encode(JSON.stringify(claims)));
  const signingInput = `${header}.${payload}`;

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    buf(pemToPkcs8(key.private_key)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    buf(encoder.encode(signingInput)),
  );
  return `${signingInput}.${bytesToB64url(new Uint8Array(signature))}`;
}

/** First 200 characters of a response body, for a failure message that never blocks on I/O. */
async function bodyExcerpt(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  return text.slice(0, 200);
}

/** Exchange a signed service-account JWT for a bearer access token. */
async function exchangeAccessToken(jwt: string): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    throw new Error(`token exchange failed (${res.status}): ${await bodyExcerpt(res)}`);
  }
  const body = (await res.json()) as TokenResponse;
  if (!body.access_token) {
    throw new Error('token exchange failed: response carried no access_token');
  }
  return body.access_token;
}

/**
 * Append one row to a tab of the registration spreadsheet.
 *
 * Decodes the base64-encoded service-account key, signs and exchanges a JWT for an access
 * token, then calls the Sheets v4 `values.append` endpoint against `'<tab>'!A1`. Throws on
 * any failure, with a message naming the failing step (token exchange or append) plus the
 * response status and a body excerpt; the caller decides whether the failure is fatal. No
 * retries at this submission volume.
 */
export async function appendRegistrationRow(
  env: { GOOGLE_SA_KEY_B64: string; REGISTRATION_SHEET_ID: string },
  tab: string,
  row: string[],
): Promise<void> {
  const key = decodeServiceAccountKey(env.GOOGLE_SA_KEY_B64);
  const jwt = await signJwt(key);
  const accessToken = await exchangeAccessToken(jwt);

  const range = encodeURIComponent(`'${tab}'!A1`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.REGISTRATION_SHEET_ID}/values/${range}:append?valueInputOption=RAW`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [row] }),
  });
  if (!res.ok) {
    throw new Error(`sheets append failed (${res.status}): ${await bodyExcerpt(res)}`);
  }
}
