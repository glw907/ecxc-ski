import * as v from 'valibot';
import { invalid } from '@sveltejs/kit';
import { form, getRequestEvent } from '$app/server';
import { createMimeMessage } from 'mimetext';
import { siteEmail } from './config';

const SENDER = siteEmail.sender ?? 'noreply@ecxc.ski';

async function verifyTurnstile(token: string, ip: string, secret: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const { success } = await res.json() as { success: boolean };
  return success;
}

export const sendMessage = form(
  v.object({
    name: v.pipe(v.string(), v.trim(), v.nonEmpty('Please enter your name.')),
    email: v.pipe(v.string(), v.trim(), v.email('Please enter a valid email address.')),
    message: v.pipe(v.string(), v.trim(), v.nonEmpty('Please enter a message.')),
    // Injected by the Turnstile widget, not a rendered field.
    'cf-turnstile-response': v.optional(v.string(), ''),
  }),
  async ({ name, email, message, 'cf-turnstile-response': token }) => {
    const { platform, getClientAddress } = getRequestEvent();

    const secret = platform?.env?.TURNSTILE_SECRET_KEY;
    if (secret && !(await verifyTurnstile(token, getClientAddress(), secret))) {
      invalid('Spam check failed. Please try again.');
    }

    const contactEmail = platform?.env?.CONTACT_EMAIL;
    const sendEmail = platform?.env?.SEND_EMAIL;
    if (!contactEmail || !sendEmail) {
      invalid('Mail service not configured.');
    }

    const msg = createMimeMessage();
    msg.setSender({ name: siteEmail.senderName ?? 'ECXC Contact', addr: SENDER });
    msg.setRecipient(contactEmail);
    msg.setSubject(`Contact from ${name}`);
    msg.addMessage({ contentType: 'text/plain', data: `From: ${name} <${email}>\n\n${message}` });

    const { EmailMessage } = await import('cloudflare:email');
    await sendEmail.send(new EmailMessage(SENDER, contactEmail, msg.asRaw()));

    return { success: true };
  },
);
