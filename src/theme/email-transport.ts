// Transitional dual-transport email. The site currently sends every outbound message through
// two Cloudflare `[[send_email]]` bindings (wrangler.toml's SEND_EMAIL, destination-restricted,
// and EMAIL, unrestricted). We are migrating to Resend, but the Resend sending domain is not
// verified yet, so every send seam here (registration, contact, magic links) selects Resend when
// a `RESEND_API_KEY` Worker secret is set and falls back to the existing Cloudflare bindings when
// it is not. No mixed mode: a given request uses one transport for both its must-succeed and
// soft-fail sends. Once the domain verifies and the secret is set, the cutover needs no call-site
// change, only the secret.
import { createMimeMessage } from 'mimetext';
import type { AuthEnv, EmailRecipient, MagicLinkMessage, SendMagicLink } from '@glw907/cairn-cms';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/**
 * The plain message shape every non-magic-link send seam in this site builds: the registration
 * record/parent/coach copies (registration/emails.ts) and the contact form's message and Amy's
 * copy (contact.remote.ts). `fromName` carries a display name through to whichever transport
 * composes the final sender header ("Name <addr>" for Resend, the MIME sender field for the
 * Cloudflare-binding adapter). `cc`/`bcc`/`replyTo` are unused by any current call site but ride
 * along for a future one; the Resend transport maps them through when present.
 */
export interface OutboundMessage {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
  fromName?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

/** A transport whose send() resolves once the message is handed off; the shape every call site
 *  above already expects. */
export interface SendCapable {
  send(msg: OutboundMessage): Promise<void>;
}

/**
 * A raw Cloudflare Email Sending binding. `SEND_EMAIL` (restricted destination) and `EMAIL`
 * (unrestricted) carry two different `send()` overload sets in `@cloudflare/workers-types`, so
 * this stays permissive the same way registration/handler.ts's old `toSendCapable` did: `never`
 * lets either binding's concrete parameter type satisfy this one structural position.
 */
interface CloudflareBinding {
  send(msg: never): Promise<unknown>;
}

/** The body of a non-2xx Resend API response, per its documented error shape. */
interface ResendErrorBody {
  name?: string;
  message?: string;
}

/**
 * POST one message to the Resend API. Throws on a non-2xx response, carrying the HTTP status and
 * Resend's own error `name`/`message` only; never the API key or the outgoing message content,
 * since a thrown error's text reaches structured logs.
 */
async function postToResend(apiKey: string, body: Record<string, unknown>): Promise<void> {
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (res.ok) return;

  const errorBody = (await res.json().catch(() => ({}))) as ResendErrorBody;
  throw new Error(
    `Resend send failed (${res.status}, ${errorBody.name ?? 'unknown_error'}): ${errorBody.message ?? 'no message'}`,
  );
}

/** Compose a "Name <addr>" sender header when a display name is given, a bare address otherwise. */
function composeFrom(from: string, fromName?: string): string {
  return fromName ? `${fromName} <${from}>` : from;
}

/** Build a SendCapable that posts through the Resend API: the transport this site prefers once
 *  `RESEND_API_KEY` is set. */
export function resendSender(apiKey: string): SendCapable {
  return {
    async send(msg) {
      await postToResend(apiKey, {
        from: composeFrom(msg.from, msg.fromName),
        to: msg.to,
        subject: msg.subject,
        text: msg.text,
        ...(msg.html ? { html: msg.html } : {}),
        ...(msg.cc ? { cc: msg.cc } : {}),
        ...(msg.bcc ? { bcc: msg.bcc } : {}),
        ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
      });
    },
  };
}

/**
 * Build a SendCapable over a destination-restricted Cloudflare Email Sending binding (wrangler
 * .toml's `SEND_EMAIL`), which requires a hand-built MIME message via `mimetext` plus the ambient
 * `cloudflare:email` module's `EmailMessage` class rather than a plain object. Ports the MIME
 * construction that used to live inline in registration/emails.ts's `sendRecordEmail` and
 * contact.remote.ts, so both call sites now build a plain `OutboundMessage` and this adapter owns
 * the wire format.
 */
export function cfSendEmailSender(binding: CloudflareBinding): SendCapable {
  return {
    async send(msg) {
      const mime = createMimeMessage();
      mime.setSender({ name: msg.fromName ?? msg.from, addr: msg.from });
      mime.setRecipient(msg.to);
      mime.setSubject(msg.subject);
      mime.addMessage({ contentType: 'text/plain', data: msg.text });

      const { EmailMessage } = await import('cloudflare:email');
      await binding.send(new EmailMessage(msg.from, msg.to, mime.asRaw()) as never);
    },
  };
}

/** Build a SendCapable over Cloudflare's unrestricted Email Sending binding (wrangler.toml's
 *  `EMAIL`): today's pass-through, since the binding already accepts the plain object shape. */
export function cfEmailSender(binding: CloudflareBinding): SendCapable {
  return {
    async send(msg) {
      await binding.send(msg as never);
    },
  };
}

/** Format one Email Sending API recipient (a bare address, or a `{ email, name }` pair) as the
 *  address string Resend's `cc`/`bcc` fields accept. */
function formatRecipient(recipient: EmailRecipient): string {
  return typeof recipient === 'string' ? recipient : composeFrom(recipient.email, recipient.name);
}

/** Format a `cc`/`bcc` value (one recipient or a list) for Resend, collapsing a single-item list
 *  to a bare string since Resend accepts either. */
function toResendRecipients(recipients: EmailRecipient | EmailRecipient[]): string | string[] {
  const list = Array.isArray(recipients) ? recipients : [recipients];
  const formatted = list.map(formatRecipient);
  return formatted.length === 1 ? formatted[0] : formatted;
}

/** Send a magic-link message through Resend, mapping `cc`/`bcc`/`replyTo` through to Resend's own
 *  fields (`reply_to` for `replyTo`); attachments are out of scope, since no flow that uses this
 *  sender sets one. */
async function sendMagicLinkViaResend(apiKey: string, message: MagicLinkMessage): Promise<void> {
  await postToResend(apiKey, {
    from: message.from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    ...(message.cc ? { cc: toResendRecipients(message.cc) } : {}),
    ...(message.bcc ? { bcc: toResendRecipients(message.bcc) } : {}),
    ...(message.replyTo ? { reply_to: message.replyTo } : {}),
  });
}

/**
 * Cloudflare's own EMAIL-binding send for the magic-link message, replicated rather than
 * imported: `@glw907/cairn-cms`'s `cloudflareSend` is the engine's internal default (the send it
 * uses when a site passes no `auth.send` at all) but is not part of the package's public export
 * surface (no subpath resolves `email.js`), so a custom `send` that wants to fall back to it at
 * call time has to carry the same one-liner itself. Matches the engine's own implementation:
 * throw when the binding is missing, otherwise hand the message straight to `EMAIL.send`.
 */
async function sendMagicLinkViaCloudflare(env: AuthEnv, message: MagicLinkMessage): Promise<void> {
  if (!env.EMAIL) {
    throw new Error('EMAIL binding is not configured');
  }
  await env.EMAIL.send(message);
}

/**
 * The magic-link `SendMagicLink` this site mounts (src/chassis/cairn.server.ts): Resend when the
 * request's env carries `RESEND_API_KEY`, the existing Cloudflare EMAIL binding otherwise.
 * `AuthEnv` does not declare `RESEND_API_KEY` (it is a structural subset of the real
 * `platform.env`, per its own doc comment), so it is read through a widening cast; the real env
 * always carries whatever `app.d.ts` declares on `Platform.env`.
 */
export const magicLinkSender: SendMagicLink = async (env, message) => {
  const apiKey = (env as AuthEnv & { RESEND_API_KEY?: string }).RESEND_API_KEY;
  if (apiKey) {
    await sendMagicLinkViaResend(apiKey, message);
    return;
  }
  await sendMagicLinkViaCloudflare(env, message);
};
