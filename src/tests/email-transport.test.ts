import { beforeEach, describe, expect, it, vi } from 'vitest';
import { magicLinkSender, resendSender } from '$theme/email-transport';
import type { AuthEnv, MagicLinkMessage } from '@glw907/cairn-cms';

describe('resendSender', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  it('posts to the Resend API with a bearer token and the message fields', async () => {
    await resendSender('re_test_key').send({
      to: 'coach@ecxc.ski',
      from: 'noreply@ecxc.ski',
      subject: 'Hello',
      text: 'Plain body',
      html: '<p>Plain body</p>',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer re_test_key');
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      from: 'noreply@ecxc.ski',
      to: 'coach@ecxc.ski',
      subject: 'Hello',
      text: 'Plain body',
      html: '<p>Plain body</p>',
    });
  });

  it('composes "Name <addr>" for the from field when fromName is set', async () => {
    await resendSender('re_test_key').send({
      to: 'coach@ecxc.ski',
      from: 'noreply@ecxc.ski',
      fromName: 'ECXC Registration',
      subject: 'Hello',
      text: 'Plain body',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.from).toBe('ECXC Registration <noreply@ecxc.ski>');
  });

  it('maps cc, bcc, and replyTo through, replyTo as reply_to', async () => {
    await resendSender('re_test_key').send({
      to: 'coach@ecxc.ski',
      from: 'noreply@ecxc.ski',
      subject: 'Hello',
      text: 'Plain body',
      cc: 'amy@example.com',
      bcc: ['archive@example.com'],
      replyTo: 'contact@ecxc.ski',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.cc).toBe('amy@example.com');
    expect(body.bcc).toEqual(['archive@example.com']);
    expect(body.reply_to).toBe('contact@ecxc.ski');
  });

  it('throws on a non-2xx response, naming the status and Resend error, never the key or message', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ name: 'validation_error', message: 'to must be valid' }), { status: 422 }),
    );

    let error: unknown;
    try {
      await resendSender('re_super_secret_key').send({
        to: 'coach@ecxc.ski',
        from: 'noreply@ecxc.ski',
        subject: 'Secret subject line',
        text: 'Secret body content',
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(Error);
    const message = (error as Error).message;
    expect(message).toContain('422');
    expect(message).toContain('validation_error');
    expect(message).toContain('to must be valid');
    expect(message).not.toContain('re_super_secret_key');
    expect(message).not.toContain('Secret subject line');
    expect(message).not.toContain('Secret body content');
  });
});

describe('magicLinkSender', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const message: MagicLinkMessage = {
    to: 'geoff-login@907.life',
    from: 'noreply@ecxc.ski',
    subject: 'Sign in to ECXC',
    html: '<p>link</p>',
    text: 'link',
  };

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  it('sends through Resend when RESEND_API_KEY is present', async () => {
    const env = { RESEND_API_KEY: 're_test_key' } as unknown as AuthEnv;

    await magicLinkSender(env, message);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  });

  it('throws a clear, content-free error when RESEND_API_KEY is absent', async () => {
    const env = {} as AuthEnv;

    await expect(magicLinkSender(env, message)).rejects.toThrow('RESEND_API_KEY is not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
