// The registration pipeline core, split out of registration.remote.ts because SvelteKit's
// remote-functions module check rejects a `.remote.ts` file exporting anything besides remote
// functions. This module owns everything testable (the pipeline, its deps seam, the request
// adapter); registration.remote.ts keeps only the two `form()` exports that wrap it.
import { invalid } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import { buildRecord, campSchema, toRowValues, trainingSchema, type FormKind } from './schema';
import { appendRegistrationRow } from './sheets';
import { sendParentCopy, sendRecordCopy, sendRecordEmail } from './emails';
import { resendSender, type SendCapable } from '../email-transport';
import { WAIVER_HASH } from '../waiver/waiver';

/** The tab a submission's row lands in, per the plan's own sheet layout. */
const SHEET_TAB: Record<FormKind, string> = {
  training: 'Training',
  camp: 'Talkeetna Camp',
};

const RECORD_EMAIL_FAILURE_MESSAGE =
  'Something went wrong saving your registration. Please try again. If it fails a second ' +
  'time, use the contact form instead so we can sort it out.';

/**
 * The posted, validated shape both forms share, hand-written rather than inferred from
 * `trainingSchema`/`campSchema` (`v.InferOutput` loses literal key typing on the schema's
 * `agree_<id>` fields, generated at runtime from `WAIVER_SECTIONS`; see schema.ts's own
 * `SharedParsedFields`, which this mirrors). A real parsed submission carries more fields
 * (one `agree_<id>` boolean per waiver section) than this interface names; that is fine, since
 * a variable's excess properties never trigger TypeScript's excess-property check.
 */
export interface ParsedRegistrationFields {
  athleteFullName: string;
  athleteDob: string;
  parentName: string;
  parentRelationship: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  homePhone: string;
  cellPhone: string;
  parentEmail: string;
  athleteEmail: string;
  athleteCell: string;
  parentCrewlabInvite: boolean;
  secondParentName: string;
  secondParentEmail: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  emergencyEmail: string;
  insuranceProvider: string;
  policyNumber: string;
  groupNumber: string;
  physicianName: string;
  physicianPhone: string;
  medications: string;
  allergies: string;
  conditions: string;
  tetanus: string;
  photoRelease: 'grant' | 'deny';
  athleteSignature: string;
  parentSignature: string;
  parentConsent: boolean;
  athleteConsent: boolean;
  /** Injected by the Turnstile widget's renamed field; see schema.ts's `turnstileToken` for why. */
  turnstileToken: string;
}

/** The camp form's posted shape: the shared fields plus camp logistics. */
export interface ParsedCampFields extends ParsedRegistrationFields {
  dietary: string;
  carpool: 'needs-ride' | 'can-drive' | 'self';
  carpoolSeats?: number;
  gearNotes: string;
}

/**
 * The environment `handleRegistration` reads. Every field is optional so a test can supply
 * exactly the bindings a given branch exercises, and so a deploy missing the Sheets secret
 * (`GOOGLE_SA_KEY_B64`/`REGISTRATION_SHEET_ID`) still degrades per the plan rather than failing
 * a type check.
 */
export interface RegistrationEnv {
  TURNSTILE_SECRET_KEY?: string;
  GOOGLE_SA_KEY_B64?: string;
  REGISTRATION_SHEET_ID?: string;
  CONTACT_EMAIL?: string;
  SEND_EMAIL?: SendCapable;
  EMAIL?: SendCapable;
  /** Amy's address, cc'd a soft-fail copy of every registration record and contact
   *  message; unset in dev. */
  MAIL_CC?: string;
}

/**
 * The request-scoped values `handleRegistration` needs, injected so a test never has to fake
 * `$app/server`'s `getRequestEvent`.
 */
export interface RegistrationDeps {
  env: RegistrationEnv;
  ip: string;
  userAgent: string;
  /** The server submission time as an ISO string; a fixed function lets a test pin the clock. */
  now: () => string;
}

/** Verify a Turnstile token. Duplicated from contact.remote.ts's identical check rather than
 * shared, since this pass's file list does not touch that module. */
async function verifyTurnstile(token: string, ip: string, secret: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const { success } = (await res.json()) as { success: boolean };
  return success;
}

/**
 * Run the registration pipeline for one validated submission: verify Turnstile, assemble the
 * record, append the Sheets row (soft failure), email the record to Geoff (must succeed), email
 * the parent their copy (soft failure), then email Amy her coach copy (soft failure).
 *
 * Order and failure semantics, per the plan: a Turnstile failure or a missing mail binding
 * rejects before anything is recorded. A Sheets append failure (including the Sheets env simply
 * being unset) never fails the submission; its error rides along in the record email as a
 * flagged block instead. A record-email failure does fail the submission, since that email is
 * the pipeline's must-succeed step. A parent-copy failure only shows up in the return value; an
 * adult athlete's record may carry a blank `parent.email` (the "Parent or guardian" section is
 * optional past 18), so the parent copy targets that address, falls back to the athlete's own
 * CrewLAB email when it is blank, and is skipped entirely (never attempted, `parentCopySent:
 * false`) when neither address exists. The coach copy to `MAIL_CC` is an ops concern only: its
 * failure is logged and otherwise invisible, never surfaced in the return value or the
 * submitter's experience.
 */
export function handleRegistration(
  kind: 'training',
  data: ParsedRegistrationFields,
  deps: RegistrationDeps,
): Promise<{ success: true; parentCopySent: boolean }>;
export function handleRegistration(
  kind: 'camp',
  data: ParsedCampFields,
  deps: RegistrationDeps,
): Promise<{ success: true; parentCopySent: boolean }>;
export async function handleRegistration(
  kind: FormKind,
  data: ParsedRegistrationFields | ParsedCampFields,
  deps: RegistrationDeps,
): Promise<{ success: true; parentCopySent: boolean }> {
  const { env } = deps;

  const turnstileToken = data.turnstileToken;
  const turnstileSecret = env.TURNSTILE_SECRET_KEY;
  if (!turnstileSecret) {
    // Fail closed: a deploy missing the Turnstile secret must not silently accept every
    // submission unchecked, unlike the Sheets step below, which is allowed to degrade.
    invalid('Registration is temporarily unavailable. Please try again later or use the contact form instead.');
  }
  if (!(await verifyTurnstile(turnstileToken, deps.ip, turnstileSecret))) {
    invalid('Spam check failed. Please try again.');
  }

  if (!env.CONTACT_EMAIL || !env.SEND_EMAIL) {
    invalid('Mail service not configured.');
  }

  const meta = {
    ip: deps.ip,
    userAgent: deps.userAgent,
    submittedAt: deps.now(),
    waiverHash: WAIVER_HASH,
  };

  // `kind` is the caller's own discriminant (enforced by the overloads above), so a 'camp' kind
  // is only ever paired with a ParsedCampFields input; this narrows the same way schema.ts's
  // own buildRecord() does for the analogous cast.
  const record = kind === 'camp'
    ? buildRecord('camp', data as ParsedCampFields, meta)
    : buildRecord('training', data, meta);

  let sheetsError: string | undefined;
  if (!env.GOOGLE_SA_KEY_B64 || !env.REGISTRATION_SHEET_ID) {
    sheetsError = 'Registration sheet is not configured (missing GOOGLE_SA_KEY_B64 or REGISTRATION_SHEET_ID).';
  } else {
    try {
      await appendRegistrationRow(
        { GOOGLE_SA_KEY_B64: env.GOOGLE_SA_KEY_B64, REGISTRATION_SHEET_ID: env.REGISTRATION_SHEET_ID },
        SHEET_TAB[kind],
        toRowValues(record),
      );
    } catch (error) {
      sheetsError = error instanceof Error ? error.message : String(error);
    }
  }

  try {
    await sendRecordEmail({ CONTACT_EMAIL: env.CONTACT_EMAIL, SEND_EMAIL: env.SEND_EMAIL }, record, { sheetsError });
  } catch (error) {
    console.error('registration record email failed', error);
    invalid(RECORD_EMAIL_FAILURE_MESSAGE);
  }

  // An adult athlete's record may carry a blank parent.email; the athlete's own CrewLAB email
  // is the fallback recipient, and a blank pair skips the send outright (not a failure worth
  // logging, just nobody to mail).
  let parentCopySent = false;
  const parentCopyTo = record.parent.email || record.crewlab.athleteEmail;
  if (env.EMAIL && parentCopyTo) {
    try {
      await sendParentCopy({ EMAIL: env.EMAIL }, record, parentCopyTo);
      parentCopySent = true;
    } catch (error) {
      console.error('registration parent copy failed', error);
      parentCopySent = false;
    }
  }

  if (env.MAIL_CC && env.EMAIL) {
    try {
      await sendRecordCopy({ EMAIL: env.EMAIL }, env.MAIL_CC, record);
    } catch (error) {
      console.error('registration coach copy failed', error);
    }
  }

  return { success: true, parentCopySent };
}

/**
 * Build the pipeline's deps from the current request, the one seam the two form actions add.
 * Resend backs both SEND_EMAIL and EMAIL when `RESEND_API_KEY` is set; otherwise both stay
 * undefined and the pipeline's own fail-closed check (`'Mail service not configured.'`) rejects
 * the submission.
 */
export function buildDeps(): RegistrationDeps {
  const { platform, getClientAddress, request } = getRequestEvent();
  const env = platform?.env;
  const resend = env?.RESEND_API_KEY ? resendSender(env.RESEND_API_KEY) : undefined;

  return {
    env: {
      TURNSTILE_SECRET_KEY: env?.TURNSTILE_SECRET_KEY,
      GOOGLE_SA_KEY_B64: env?.GOOGLE_SA_KEY_B64,
      REGISTRATION_SHEET_ID: env?.REGISTRATION_SHEET_ID,
      CONTACT_EMAIL: env?.CONTACT_EMAIL,
      SEND_EMAIL: resend,
      EMAIL: resend,
      MAIL_CC: env?.MAIL_CC,
    },
    ip: getClientAddress(),
    userAgent: request.headers.get('user-agent') ?? '',
    now: () => new Date().toISOString(),
  };
}
