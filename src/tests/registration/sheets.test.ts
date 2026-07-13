import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appendRegistrationRow } from '../../theme/registration/sheets';

/**
 * Build a throwaway base64 service-account key JSON: a real WebCrypto RSA keypair exported
 * to PKCS#8 PEM, so the module under test signs a JWT with a real key shape without any
 * hardcoded-looking private key in the test source.
 */
async function makeServiceAccountKeyB64(clientEmail: string): Promise<string> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  );
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(pkcs8)));
  const lines = b64.match(/.{1,64}/g) ?? [b64];
  const pem = `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`;
  return btoa(JSON.stringify({ client_email: clientEmail, private_key: pem }));
}

/** Decode a base64url JWT segment (no padding, URL-safe alphabet) back to a UTF-8 string. */
function base64urlDecode(segment: string): string {
  const padded = segment + '='.repeat((4 - (segment.length % 4)) % 4);
  return atob(padded.replaceAll('-', '+').replaceAll('_', '/'));
}

function decodeJwtClaims(jwt: string): Record<string, unknown> {
  return JSON.parse(base64urlDecode(jwt.split('.')[1]));
}

const SA_EMAIL = 'sheets-sa@example.iam.gserviceaccount.com';

describe('appendRegistrationRow', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('signs a JWT with the expected claims and appends the row to the correct range', async () => {
    const keyB64 = await makeServiceAccountKeyB64(SA_EMAIL);
    let capturedAssertion = '';

    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url === 'https://oauth2.googleapis.com/token') {
        const params = new URLSearchParams(init.body as string);
        capturedAssertion = params.get('assertion') ?? '';
        return new Response(JSON.stringify({ access_token: 'test-access-token' }), { status: 200 });
      }
      return new Response('{}', { status: 200 });
    });

    await appendRegistrationRow(
      { GOOGLE_SA_KEY_B64: keyB64, REGISTRATION_SHEET_ID: 'sheet-123' },
      'Talkeetna Camp',
      ['Alice Athlete', '2010-01-01'],
    );

    const claims = decodeJwtClaims(capturedAssertion);
    expect(claims.iss).toBe(SA_EMAIL);
    expect(claims.scope).toBe('https://www.googleapis.com/auth/spreadsheets');
    expect(claims.aud).toBe('https://oauth2.googleapis.com/token');
    expect(typeof claims.iat).toBe('number');
    expect(claims.exp).toBe((claims.iat as number) + 3600);

    const appendCall = fetchMock.mock.calls.find(([url]) => (url as string).includes('sheets.googleapis.com'));
    expect(appendCall).toBeDefined();
    const [appendUrl, appendInit] = appendCall as [string, RequestInit];
    expect(appendUrl).toContain('sheet-123');
    expect(appendUrl).toContain(encodeURIComponent(`'Talkeetna Camp'!A1`));
    expect(appendUrl).toContain('valueInputOption=RAW');
    expect(JSON.parse(appendInit.body as string)).toEqual({
      values: [['Alice Athlete', '2010-01-01']],
    });
  });

  it('rejects with a message naming the token-exchange step on a non-2xx token response', async () => {
    const keyB64 = await makeServiceAccountKeyB64(SA_EMAIL);
    fetchMock.mockResolvedValue(new Response('invalid_grant', { status: 401 }));

    await expect(
      appendRegistrationRow({ GOOGLE_SA_KEY_B64: keyB64, REGISTRATION_SHEET_ID: 'sheet-123' }, 'Training', ['x']),
    ).rejects.toThrow(/token exchange/);
  });

  it('rejects with a message naming the append step on a non-2xx append response', async () => {
    const keyB64 = await makeServiceAccountKeyB64(SA_EMAIL);
    fetchMock.mockImplementation(async (url: string) => {
      if (url === 'https://oauth2.googleapis.com/token') {
        return new Response(JSON.stringify({ access_token: 'test-access-token' }), { status: 200 });
      }
      return new Response('permission denied', { status: 403 });
    });

    await expect(
      appendRegistrationRow({ GOOGLE_SA_KEY_B64: keyB64, REGISTRATION_SHEET_ID: 'sheet-123' }, 'Training', ['x']),
    ).rejects.toThrow(/append/);
  });
});
