// The two outbound registration emails, both built from one RegistrationRecord so the record
// email (to Geoff, the durable legal copy) and the parent copy can never drift apart. The
// record email reuses contact.remote.ts's exact send mechanism: SEND_EMAIL is a
// destination-address-restricted Email Sending binding, so it needs a hand-built MIME message
// via `mimetext` plus the ambient `cloudflare:email` module's `EmailMessage` class. The parent
// copy goes through cairn-cms's own EMAIL binding instead, an unrestricted Email Sending
// binding that cairn's own magic-link sender (dist/email.js's `cloudflareSend`) calls with a
// plain `{ to, from, subject, html, text }` object, not an `EmailMessage` instance; this module
// follows that same shape rather than the wrangler.toml comment's own gloss on it.
import { createMimeMessage } from 'mimetext';
import {
  CREWLAB_HEADERS,
  SHEET_HEADERS,
  toRowValues,
  type FormKind,
  type RegistrationRecord,
} from './schema';

const SENDER = 'noreply@ecxc.ski';
const SENDER_NAME = 'ECXC Registration';

const FORM_KIND_LABEL: Record<FormKind, string> = {
  training: 'Training',
  camp: 'Talkeetna Camp',
};

// Header text grouping for the labeled record body. Membership is keyed on the literal
// strings SHEET_HEADERS carries (schema.ts's SHARED_HEADERS / CAMP_LOGISTICS_HEADERS /
// SIGNATURE_HEADERS), so the two files agree on wording by construction: a header the schema
// renames or removes simply stops appearing here, it never goes stale silently.
const ATHLETE_HEADERS = new Set(['Athlete Full Name', 'Athlete Date of Birth']);
const PARENT_HEADERS = new Set([
  'Parent/Guardian Name',
  'Parent/Guardian Relationship',
  'Address',
  'City',
  'State',
  'ZIP',
  'Home Phone',
  'Cell Phone',
  'Parent Email',
]);
const EMERGENCY_HEADERS = new Set([
  'Emergency Contact Name',
  'Emergency Contact Relationship',
  'Emergency Contact Phone',
  'Emergency Contact Email',
]);
const INSURANCE_HEADERS = new Set([
  'Insurance Provider',
  'Policy Number',
  'Group Number',
  'Physician Name',
  'Physician Phone',
]);
const MEDICAL_HEADERS = new Set(['Medications', 'Allergies', 'Conditions', 'Last Tetanus Shot']);
const CAMP_HEADERS = new Set(['Dietary Needs', 'Carpool', 'Carpool Seats', 'Gear Notes']);
const CREWLAB_HEADER_SET = new Set(CREWLAB_HEADERS);
const PHOTO_HEADERS = new Set(['Photo Release']);
const SIGNATURE_HEADERS = new Set(['Athlete Signature', 'Parent Signature', 'Athlete Is Adult']);

// In display order. Anything not claimed by an earlier group (Submitted At, Waiver Hash, IP
// Address, User Agent) falls through to a trailing "Record" section, so a body always covers
// every header without a maintained exhaustive list.
const FIELD_GROUPS: { heading: string; headers: Set<string> }[] = [
  { heading: 'Athlete', headers: ATHLETE_HEADERS },
  { heading: 'Parent or guardian', headers: PARENT_HEADERS },
  { heading: 'CrewLAB invite', headers: CREWLAB_HEADER_SET },
  { heading: 'Emergency contact', headers: EMERGENCY_HEADERS },
  { heading: 'Insurance & physician', headers: INSURANCE_HEADERS },
  { heading: 'Medical', headers: MEDICAL_HEADERS },
  { heading: 'Camp logistics (camp only)', headers: CAMP_HEADERS },
  { heading: 'Photo release', headers: PHOTO_HEADERS },
  { heading: 'Signatures', headers: SIGNATURE_HEADERS },
];

/**
 * Render a registration record as one plain-text body, every field labeled with its
 * SHEET_HEADERS wording and grouped under the same section headings the forms use, so the
 * record email and the roster sheet always describe a submission in the same words. Shared by
 * both outbound emails so their bodies cannot drift apart.
 */
function recordToText(record: RegistrationRecord): string {
  const headers = SHEET_HEADERS[record.kind];
  const values = toRowValues(record);
  const valueByHeader = new Map(headers.map((header, i) => [header, values[i] ?? '']));
  const claimed = new Set(FIELD_GROUPS.flatMap((group) => [...group.headers]));

  const sections: string[] = [];
  for (const group of FIELD_GROUPS) {
    const lines = headers
      .filter((header) => group.headers.has(header))
      .map((header) => `${header}: ${valueByHeader.get(header)}`);
    if (lines.length > 0) sections.push([group.heading, ...lines].join('\n'));
  }

  const recordLines = headers
    .filter((header) => !claimed.has(header))
    .map((header) => `${header}: ${valueByHeader.get(header)}`);
  if (recordLines.length > 0) sections.push(['Record', ...recordLines].join('\n'));

  return sections.join('\n\n');
}

/** Escape the four HTML-significant characters `mimetext` and `cloudflare:email` never touch. */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Wrap a plain-text body as preformatted HTML, preserving its line breaks. Exported for
 *  contact.remote.ts's own EMAIL-binding send, whose contract requires an html part. */
export function textToHtml(text: string): string {
  return `<pre>${escapeHtml(text)}</pre>`;
}

/** The subject line the record email and any staff copy share, so the two cannot drift apart. */
function recordSubject(record: RegistrationRecord): string {
  return `Registration: ${record.athlete.fullName} (${FORM_KIND_LABEL[record.kind]})`;
}

/**
 * Email the complete signed record to Geoff, the system of record for a registration. Sent
 * through the SEND_EMAIL binding, the same fixed-destination mechanism contact.remote.ts uses.
 * When `opts.sheetsError` is set, the body opens with a flagged block naming the failure so
 * Geoff can back-fill the roster row by hand; the signature was still captured. Throws if the
 * binding is missing or the send itself fails, since this is the must-succeed step of the
 * pipeline.
 */
export async function sendRecordEmail(
  env: { CONTACT_EMAIL: string; SEND_EMAIL: { send(msg: unknown): Promise<void> } },
  record: RegistrationRecord,
  opts: { sheetsError?: string },
): Promise<void> {
  const subject = recordSubject(record);
  const parts: string[] = [];
  if (opts.sheetsError) {
    parts.push(`*** SHEETS APPEND FAILED, back-fill this row by hand ***\n${opts.sheetsError}`);
  }
  parts.push(recordToText(record));
  const body = parts.join('\n\n');

  const msg = createMimeMessage();
  msg.setSender({ name: SENDER_NAME, addr: SENDER });
  msg.setRecipient(env.CONTACT_EMAIL);
  msg.setSubject(subject);
  msg.addMessage({ contentType: 'text/plain', data: body });

  const { EmailMessage } = await import('cloudflare:email');
  await env.SEND_EMAIL.send(new EmailMessage(SENDER, env.CONTACT_EMAIL, msg.asRaw()));
}

/**
 * Email the parent or guardian their own copy of the signed record, through cairn-cms's
 * unrestricted EMAIL binding. Throws if the binding call fails; the caller decides whether a
 * failed parent copy blocks the submission (per the plan, it does not).
 */
export async function sendParentCopy(
  env: { EMAIL: { send(msg: unknown): Promise<void> } },
  record: RegistrationRecord,
): Promise<void> {
  const subject = `Your ECXC registration: ${record.athlete.fullName}`;
  const intro =
    `Thanks for registering. This is your copy of the signed registration and waiver for ` +
    `${record.athlete.fullName}. Keep it with your records. If anything in it is wrong, reply ` +
    `through the contact form at https://ecxc.ski/contact and we will fix it.`;
  const text = `${intro}\n\n${recordToText(record)}`;

  await env.EMAIL.send({
    to: record.parent.email,
    from: SENDER,
    subject,
    text,
    html: textToHtml(text),
  });
}

/**
 * Email the complete record to an additional coach or staff recipient (Amy, who runs camp),
 * through cairn-cms's unrestricted EMAIL binding. Carries the same subject and body as
 * `sendRecordEmail` sent to Geoff, with no sheets-failure block, since this copy is a
 * convenience, not the durable legal record. Throws if the binding call fails; the caller
 * decides whether a failed coach copy blocks the submission (per the plan, it does not).
 */
export async function sendRecordCopy(
  env: { EMAIL: { send(msg: unknown): Promise<void> } },
  to: string,
  record: RegistrationRecord,
): Promise<void> {
  const subject = recordSubject(record);
  const text = recordToText(record);

  await env.EMAIL.send({
    to,
    from: SENDER,
    subject,
    text,
    html: textToHtml(text),
  });
}
