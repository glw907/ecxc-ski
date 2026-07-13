import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  handleRegistration,
  type ParsedCampFields,
  type ParsedRegistrationFields,
  type RegistrationDeps,
  type RegistrationEnv,
} from '$theme/registration/handler';

// registration.remote.ts's top-level `form(...)` calls need a static `$app/server` import to
// satisfy SvelteKit's remote-function build step, but `$app/server` only resolves inside a full
// SvelteKit dev/build (the vite-plugin's virtual module), not under plain vitest. This suite
// never calls the two form() actions themselves, only handleRegistration, so the stub below
// exists solely to let the module import succeed; `form()` and `getRequestEvent()` here are
// never invoked with real request handling.
vi.mock('$app/server', () => ({
  form: () => undefined,
  getRequestEvent: () => {
    throw new Error('getRequestEvent is not available outside a request; this suite never calls it');
  },
}));

// handleRegistration is the testable core the two form() actions wrap; this suite drives it
// directly with plain fakes, so none of these tests touch $app/server's getRequestEvent. The
// Sheets step still runs the real appendRegistrationRow (a real RSA key, a stubbed global
// fetch), matching sheets.test.ts's own approach, so "sheets called" is an observable network
// call rather than something invented for the test. The two email steps run the real
// sendRecordEmail/sendParentCopy too; only the outer SEND_EMAIL/EMAIL bindings are fakes,
// matching emails.test.ts's own cloudflare:email mock.

/** One `EmailMessage(from, to, raw)` construction, captured by the `cloudflare:email` mock. */
interface CapturedMessage {
  from: string;
  to: string;
  raw: string;
}

let captured: CapturedMessage[] = [];

vi.mock('cloudflare:email', () => ({
  EmailMessage: class {
    from: string;
    to: string;
    raw: string;
    constructor(from: string, to: string, raw: string) {
      this.from = from;
      this.to = to;
      this.raw = raw;
      captured.push({ from, to, raw });
    }
  },
}));

/**
 * Build a throwaway base64 service-account key JSON: a real WebCrypto RSA keypair exported to
 * PKCS#8 PEM, so appendRegistrationRow signs a real-shaped JWT (matching sheets.test.ts's own
 * helper).
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

function baseFields(): ParsedRegistrationFields {
  return {
    athleteFullName: 'Riley Athlete',
    athleteDob: '2008-05-01',
    parentName: 'Pat Parent',
    parentRelationship: 'Mother',
    address: '123 Main St',
    city: 'Anchorage',
    state: 'AK',
    zip: '99501',
    homePhone: '',
    cellPhone: '907-555-0100',
    parentEmail: 'pat@example.com',
    emergencyName: 'Emery Contact',
    emergencyRelationship: 'Aunt',
    emergencyPhone: '907-555-0101',
    emergencyEmail: '',
    insuranceProvider: 'Premera',
    policyNumber: 'POL-123',
    groupNumber: '',
    physicianName: '',
    physicianPhone: '',
    medications: 'none',
    allergies: 'none',
    conditions: 'none',
    tetanus: '',
    photoRelease: 'grant',
    athleteSignature: '',
    parentSignature: 'Pat Parent',
    parentConsent: true,
    athleteConsent: true,
    'cf-turnstile-response': '',
  };
}

function campFields(): ParsedCampFields {
  return { ...baseFields(), dietary: '', carpool: 'self', gearNotes: '' };
}

describe('handleRegistration', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let order: string[];

  /** A record-email/parent-copy env pair that each push a label onto `order` when called. */
  function makeDeps(overrides: Partial<RegistrationEnv> = {}): RegistrationDeps {
    return {
      env: {
        CONTACT_EMAIL: 'coach@ecxc.ski',
        SEND_EMAIL: {
          send: vi.fn(async (_msg: unknown) => {
            order.push('record-email');
          }),
        },
        EMAIL: {
          send: vi.fn(async (_msg: unknown) => {
            order.push('parent-copy');
          }),
        },
        ...overrides,
      },
      ip: '203.0.113.5',
      userAgent: 'test-agent/1.0',
      now: () => '2026-07-13T12:00:00.000Z',
    };
  }

  beforeEach(() => {
    captured = [];
    order = [];
    fetchMock = vi.fn(async (url: string) => {
      if (url === 'https://oauth2.googleapis.com/token') {
        return new Response(JSON.stringify({ access_token: 'test-access-token' }), { status: 200 });
      }
      if (url.includes('sheets.googleapis.com')) {
        order.push('sheets');
        return new Response('{}', { status: 200 });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('calls the Sheets append, then the record email, then the parent copy, in order', async () => {
    const keyB64 = await makeServiceAccountKeyB64('sa@example.iam.gserviceaccount.com');
    const deps = makeDeps({ GOOGLE_SA_KEY_B64: keyB64, REGISTRATION_SHEET_ID: 'sheet-1' });

    const result = await handleRegistration('training', baseFields(), deps);

    expect(result).toEqual({ success: true, parentCopySent: true });
    expect(order).toEqual(['sheets', 'record-email', 'parent-copy']);
  });

  it('uses the Talkeetna Camp tab for a camp submission', async () => {
    const keyB64 = await makeServiceAccountKeyB64('sa@example.iam.gserviceaccount.com');
    const deps = makeDeps({ GOOGLE_SA_KEY_B64: keyB64, REGISTRATION_SHEET_ID: 'sheet-1' });

    await handleRegistration('camp', campFields(), deps);

    const appendCall = fetchMock.mock.calls.find(([url]) => (url as string).includes('sheets.googleapis.com'));
    expect(appendCall).toBeDefined();
    const [url] = appendCall as [string];
    expect(url).toContain(encodeURIComponent(`'Talkeetna Camp'!A1`));
  });

  it('still returns success when the Sheets append fails, and flags it in the record email', async () => {
    const keyB64 = await makeServiceAccountKeyB64('sa@example.iam.gserviceaccount.com');
    fetchMock.mockImplementation(async (url: string) => {
      if (url === 'https://oauth2.googleapis.com/token') {
        return new Response(JSON.stringify({ access_token: 'test-access-token' }), { status: 200 });
      }
      return new Response('quota exceeded', { status: 429 });
    });
    const deps = makeDeps({ GOOGLE_SA_KEY_B64: keyB64, REGISTRATION_SHEET_ID: 'sheet-1' });

    const result = await handleRegistration('training', baseFields(), deps);

    expect(result).toEqual({ success: true, parentCopySent: true });
    expect(captured).toHaveLength(1);
    expect(captured[0].raw).toContain('SHEETS APPEND FAILED');
    expect(captured[0].raw).toContain('sheets append failed');
  });

  it('treats a missing Sheets configuration as a capturable error, not a rejection', async () => {
    const deps = makeDeps();

    const result = await handleRegistration('training', baseFields(), deps);

    expect(result).toEqual({ success: true, parentCopySent: true });
    expect(captured[0].raw).toContain('SHEETS APPEND FAILED');
    expect(captured[0].raw.toLowerCase()).toContain('not configured');
  });

  it('rejects when the record email fails, and never attempts the parent copy', async () => {
    const parentCopy = vi.fn();
    const deps = makeDeps();
    deps.env.SEND_EMAIL = { send: vi.fn().mockRejectedValue(new Error('smtp down')) };
    deps.env.EMAIL = { send: parentCopy };

    // invalid() throws a ValidationError whose own .message is always the fixed string
    // "Validation failed"; the user-facing text lives on .issues[].message instead.
    const rejection: { issues: { message: string }[] } = await handleRegistration(
      'training',
      baseFields(),
      deps,
    ).then(
      () => {
        throw new Error('expected handleRegistration to reject');
      },
      (error: unknown) => error as { issues: { message: string }[] },
    );

    expect(rejection.issues[0]?.message).toMatch(/Nothing was recorded/);
    expect(parentCopy).not.toHaveBeenCalled();
  });

  it('swallows a parent-copy failure and reports it in the result', async () => {
    const deps = makeDeps();
    deps.env.EMAIL = { send: vi.fn().mockRejectedValue(new Error('parent inbox full')) };

    const result = await handleRegistration('training', baseFields(), deps);

    expect(result).toEqual({ success: true, parentCopySent: false });
  });
});
