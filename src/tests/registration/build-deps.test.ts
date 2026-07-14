import { beforeEach, describe, expect, it, vi } from 'vitest';

// buildDeps() is the one place the registration pipeline selects a transport, so this suite
// drives it through a fake $app/server request event rather than handleRegistration's own
// already-selected fakes (remote.test.ts's approach). See app-server-vitest-resolution in
// agent memory: a .remote.ts/.ts file's top-level $app/server import needs this mock under
// plain vitest.
const getRequestEventMock = vi.fn();
vi.mock('$app/server', () => ({
  getRequestEvent: () => getRequestEventMock(),
}));

function fakeEvent(env: Record<string, unknown>) {
  return {
    platform: { env },
    getClientAddress: () => '203.0.113.5',
    request: { headers: new Headers({ 'user-agent': 'test-agent/1.0' }) },
  };
}

describe('buildDeps transport selection', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  it('selects Resend for both SEND_EMAIL and EMAIL when RESEND_API_KEY is set', async () => {
    getRequestEventMock.mockReturnValue(
      fakeEvent({
        RESEND_API_KEY: 're_test_key',
        CONTACT_EMAIL: 'coach@ecxc.ski',
      }),
    );

    const { buildDeps } = await import('$theme/registration/handler');
    const deps = buildDeps();

    await deps.env.SEND_EMAIL?.send({ to: 'coach@ecxc.ski', from: 'noreply@ecxc.ski', subject: 'S', text: 'T' });
    await deps.env.EMAIL?.send({ to: 'parent@example.com', from: 'noreply@ecxc.ski', subject: 'S', text: 'T' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', expect.anything());
  });

  it('leaves SEND_EMAIL/EMAIL undefined when RESEND_API_KEY is absent', async () => {
    getRequestEventMock.mockReturnValue(fakeEvent({ CONTACT_EMAIL: 'coach@ecxc.ski' }));

    const { buildDeps } = await import('$theme/registration/handler');
    const deps = buildDeps();

    expect(deps.env.SEND_EMAIL).toBeUndefined();
    expect(deps.env.EMAIL).toBeUndefined();
  });
});
