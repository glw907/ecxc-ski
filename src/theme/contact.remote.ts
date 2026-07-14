// ECXC's contact form action, a SvelteKit remote function (svelte.config.js opts into
// `experimental.remoteFunctions`). The must-succeed message to Geoff and the soft-fail copy to
// Amy both go through email-transport.ts's Resend transport, matching registration/handler.ts's
// own rule. CONTACT_EMAIL is a Worker secret, set by name only (`wrangler secret put
// CONTACT_EMAIL`), not a committed var.
import * as v from 'valibot';
import { invalid } from '@sveltejs/kit';
import { form, getRequestEvent } from '$app/server';
import { textToHtml } from './registration/emails';
import { resendSender, type SendCapable } from './email-transport';

const SENDER = 'noreply@ecxc.ski';
const SENDER_NAME = 'ECXC Contact';

async function verifyTurnstile(token: string, ip: string, secret: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const { success } = (await res.json()) as { success: boolean };
  return success;
}

export const sendMessage = form(
  v.object({
    name: v.pipe(v.string(), v.trim(), v.nonEmpty('Please enter your name.')),
    email: v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email('Please enter a valid email address.')),
    message: v.pipe(v.string(), v.trim(), v.nonEmpty('Please enter a message.')),
    // Injected by the Turnstile widget via its `data-response-field-name` override in
    // ContactForm.svelte, not a rendered field. The default name, `cf-turnstile-response`,
    // is unusable: SvelteKit's remote-form client parses every posted FormData key as an
    // identifier path and throws synchronously on a hyphen, before any request is sent, on
    // every real submission (see registration/schema.ts's `turnstileToken` for the full story).
    turnstileToken: v.optional(v.string(), ''),
  }),
  async ({ name, email, message, turnstileToken: token }) => {
    const { platform, getClientAddress } = getRequestEvent();

    // Fail closed, matching registration/handler.ts: a deploy missing the Turnstile secret
    // must not silently accept every submission unchecked.
    const secret = platform?.env?.TURNSTILE_SECRET_KEY;
    if (!secret) {
      invalid('The contact form is temporarily unavailable. Please try again later.');
    }
    if (!(await verifyTurnstile(token, getClientAddress(), secret))) {
      invalid('Spam check failed. Please try again.');
    }

    const contactEmail = platform?.env?.CONTACT_EMAIL;
    const resendApiKey = platform?.env?.RESEND_API_KEY;
    const resend: SendCapable | undefined = resendApiKey ? resendSender(resendApiKey) : undefined;

    if (!contactEmail || !resend) {
      invalid('Mail service not configured.');
    }

    const subject = `Contact from ${name}`;
    const body = `From: ${name} <${email}>\n\n${message}`;

    await resend.send({ to: contactEmail, from: SENDER, fromName: SENDER_NAME, subject, text: body });

    // Amy's copy rides the same Resend transport, soft-fail so it can never block the message or
    // mask the must-succeed send above (the registration pipeline's own pattern).
    const mailCc = platform?.env?.MAIL_CC;
    if (mailCc) {
      try {
        await resend.send({ to: mailCc, from: SENDER, subject, text: body, html: textToHtml(body) });
      } catch (error) {
        console.error('contact copy failed', error);
      }
    }

    return { success: true };
  },
);
