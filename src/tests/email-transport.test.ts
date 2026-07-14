import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cfEmailSender,
  cfSendEmailSender,
  magicLinkSender,
  resendSender,
} from '$theme/email-transport';
import type { AuthEnv, MagicLinkMessage } from '@glw907/cairn-cms';

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

/** Decode a raw MIME message's Subject header back to plain text (mimetext always RFC2047s it). */
function decodeSubject(raw: string): string {
  const match = raw.match(/^Subject: (.+)$/m);
  if (!match) return '';
  const encoded = match[1].trim().match(/^=\?utf-8\?B\?(.+)\?=$/i);
  return encoded ? Buffer.from(encoded[1], 'base64').toString('utf-8') : match[1].trim();
}

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

describe('cfSendEmailSender', () => {
  const sendEmailMock = vi.fn();

  beforeEach(() => {
    captured = [];
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue(undefined);
  });

  it('builds a MIME message and hands it to the binding as an EmailMessage', async () => {
    await cfSendEmailSender({ send: sendEmailMock }).send({
      to: 'coach@ecxc.ski',
      from: 'noreply@ecxc.ski',
      fromName: 'ECXC Registration',
      subject: 'Registration: Alice Athlete (Training)',
      text: 'Athlete\nAthlete Full Name: Alice Athlete',
    });

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(captured).toHaveLength(1);
    expect(captured[0].from).toBe('noreply@ecxc.ski');
    expect(captured[0].to).toBe('coach@ecxc.ski');
    expect(decodeSubject(captured[0].raw)).toBe('Registration: Alice Athlete (Training)');
    expect(captured[0].raw).toContain('Alice Athlete');
  });

  it('throws when the underlying binding rejects', async () => {
    sendEmailMock.mockRejectedValueOnce(new Error('binding unavailable'));
    await expect(
      cfSendEmailSender({ send: sendEmailMock }).send({
        to: 'coach@ecxc.ski',
        from: 'noreply@ecxc.ski',
        subject: 'Hello',
        text: 'Body',
      }),
    ).rejects.toThrow('binding unavailable');
  });
});

describe('cfEmailSender', () => {
  it('passes the plain OutboundMessage straight to the binding', async () => {
    const sendMock = vi.fn().mockResolvedValue({ ok: true });
    const message = { to: 'parent@example.com', from: 'noreply@ecxc.ski', subject: 'Hello', text: 'Body' };

    await cfEmailSender({ send: sendMock }).send(message);

    expect(sendMock).toHaveBeenCalledWith(message);
  });

  it('resolves to undefined regardless of what the binding resolves to', async () => {
    const sendMock = vi.fn().mockResolvedValue({ ok: true, id: 'abc' });
    const result = await cfEmailSender({ send: sendMock }).send({
      to: 'parent@example.com',
      from: 'noreply@ecxc.ski',
      subject: 'Hello',
      text: 'Body',
    });
    expect(result).toBeUndefined();
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

  it('delegates to the EMAIL binding, unchanged, when RESEND_API_KEY is absent', async () => {
    const emailSend = vi.fn().mockResolvedValue(undefined);
    const env = { EMAIL: { send: emailSend } } as unknown as AuthEnv;

    await magicLinkSender(env, message);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(emailSend).toHaveBeenCalledWith(message);
  });

  it('throws when RESEND_API_KEY is absent and the EMAIL binding is also missing', async () => {
    const env = {} as AuthEnv;
    await expect(magicLinkSender(env, message)).rejects.toThrow('EMAIL binding is not configured');
  });

  it('prefers Resend over the EMAIL binding when RESEND_API_KEY is present', async () => {
    const emailSend = vi.fn().mockResolvedValue(undefined);
    const env = { EMAIL: { send: emailSend }, RESEND_API_KEY: 're_test_key' } as unknown as AuthEnv;

    await magicLinkSender(env, message);

    expect(emailSend).not.toHaveBeenCalled();
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
});
