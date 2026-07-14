// Resend is the site's only outbound email transport (cut over 2026-07-14; live-proven, see
// docs/STATUS.md). Every send seam here (registration, contact, magic links) posts through the
// Resend API and requires a `RESEND_API_KEY` Worker secret; there is no other transport to fall
// back to.
import type { EmailRecipient, MagicLinkMessage, SendMagicLink } from '@glw907/cairn-cms';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/**
 * The plain message shape every non-magic-link send seam in this site builds: the registration
 * record/parent/coach copies (registration/emails.ts) and the contact form's message and Amy's
 * copy (contact.remote.ts). `fromName` carries a display name through to the "Name <addr>"
 * sender header Resend expects. `cc`/`bcc`/`replyTo` are unused by any current call site but
 * ride along for a future one.
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

/** Build a SendCapable that posts through the Resend API: the site's one email transport. */
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
 * The magic-link `SendMagicLink` this site mounts (src/chassis/cairn.server.ts): always Resend.
 * `AuthEnv` does not declare `RESEND_API_KEY` (it is a structural subset of the real
 * `platform.env`, per its own doc comment), so it is read through a widening cast; the real env
 * always carries whatever `app.d.ts` declares on `Platform.env`. Throws a plain, content-free
 * error when the secret is missing, so a deploy without it fails loudly (reaching cairn's
 * structured logs) instead of silently dropping every magic link.
 */
export const magicLinkSender: SendMagicLink = async (env, message) => {
  const apiKey = (env as { RESEND_API_KEY?: string }).RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  await sendMagicLinkViaResend(apiKey, message);
};
