// Registration schema and record assembly, shared by the Training and Talkeetna Camp forms.
// The two valibot schemas below validate the flat fields an HTML form POST actually sends
// (SvelteKit's form() converts checked checkboxes and number inputs to real booleans/numbers
// before valibot ever sees them, per @sveltejs/kit's own form-utils.js; see the `n:`/`b:` name
// prefixes that `RemoteForm.fields.<name>.as(...)` emits). buildRecord() then reshapes that
// flat, posted-field shape into the one RegistrationRecord both the Sheets row and the emails
// consume, so downstream code never has to know about the form's field names.
import * as v from 'valibot';
import { WAIVER_SECTIONS } from '$theme/waiver/waiver';

export type FormKind = 'training' | 'camp';

export interface RegistrationRecord {
  kind: FormKind;
  athlete: { fullName: string; dob: string };
  parent: {
    name: string;
    relationship: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    homePhone?: string;
    cellPhone: string;
    email: string;
  };
  emergency: { name: string; relationship: string; phone: string; email?: string };
  crewlab: {
    athleteEmail?: string;
    athleteCell?: string;
    parentInvite: boolean;
    secondParent?: { name: string; email: string };
  };
  insurance: { provider: string; policyNumber: string; groupNumber?: string };
  physician: { name?: string; phone?: string };
  medical: { medications: string; allergies: string; conditions: string; tetanus?: string };
  camp?: {
    dietary?: string;
    carpool: 'needs-ride' | 'can-drive' | 'self';
    carpoolSeats?: number;
    gearNotes?: string;
  };
  photoRelease: 'grant' | 'deny';
  signatures: { athleteSignature: string; parentSignature?: string; athleteIsAdult: boolean };
  meta: { submittedAt: string; ip: string; userAgent: string; waiverHash: string };
}

/** A required, trimmed text field. */
function requiredText(message: string) {
  return v.pipe(v.string(), v.trim(), v.nonEmpty(message));
}

/** An optional, trimmed text field; an absent or blank submission parses to `''`. */
function optionalText() {
  return v.optional(v.pipe(v.string(), v.trim()), '');
}

/** A required email field: trimmed, lowercased, and checked as a valid address. */
function requiredEmailField(message: string) {
  return v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email(message));
}

/** An optional email field: blank passes, but a non-blank value must be a valid address. */
function optionalEmailField(message: string) {
  return v.pipe(
    v.optional(v.pipe(v.string(), v.trim(), v.toLowerCase()), ''),
    v.check((value) => value === '' || v.EMAIL_REGEX.test(value), message),
  );
}

const PHONE_FORMAT_MESSAGE = 'Please enter a 10-digit phone number, like 907-555-1234.';

/**
 * Strips every non-digit from a phone string, then drops a redundant leading US country code:
 * an 11-digit result starting with `1` collapses to the 10 digits that follow it.
 */
function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

/** True iff a phone string's digits normalize to exactly 10, the only length this schema accepts. */
function isValidPhone(value: string): boolean {
  return phoneDigits(value).length === 10;
}

/** A validated phone string in canonical `XXX-XXX-XXXX` form. */
function canonicalPhone(value: string): string {
  const digits = phoneDigits(value);
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** A required phone field: trimmed, checked as a 10-digit number, then normalized to `XXX-XXX-XXXX`. */
function requiredPhone(requiredMessage: string) {
  return v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty(requiredMessage),
    v.check(isValidPhone, PHONE_FORMAT_MESSAGE),
    v.transform(canonicalPhone),
  );
}

/** An optional phone field: an absent or blank submission parses to `''`; a non-blank value must be a valid 10-digit number, normalized to `XXX-XXX-XXXX`. */
function optionalPhone() {
  return v.pipe(
    v.optional(v.pipe(v.string(), v.trim()), ''),
    v.check((value) => value === '' || isValidPhone(value), PHONE_FORMAT_MESSAGE),
    v.transform((value) => (value === '' ? '' : canonicalPhone(value))),
  );
}

/** One required agreement checkbox per waiver section, named `agree_<id>` (underscored: hyphens are invalid remote-form field paths). */
function waiverAgreementField(sectionTitle: string) {
  return v.pipe(
    v.optional(v.boolean(), false),
    v.check(
      (checked) => checked === true,
      `Please check the box confirming you have read and agree to the "${sectionTitle}" section.`,
    ),
  );
}

/** Today's date as an ISO `YYYY-MM-DD` string, the upper bound for a birth date. */
function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Age in whole years at `referenceIso`. Both dates parse as UTC, matching how a bare
 * `YYYY-MM-DD` string and an ISO timestamp both resolve under the `Date` constructor.
 */
function ageInYears(dobIso: string, referenceIso: string): number {
  const dob = new Date(dobIso);
  const reference = new Date(referenceIso);
  let years = reference.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = reference.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && reference.getUTCDate() < dob.getUTCDate())) {
    years -= 1;
  }
  return years;
}

/** Age in whole years right now, for the schema's own cross-field checks at submit time. */
function ageNow(dobIso: string): number {
  return ageInYears(dobIso, new Date().toISOString());
}

const CREWLAB_CONTACT_MESSAGE =
  "Please give us an email or a cell number for the athlete's CrewLAB invite; either works.";
const SECOND_PARENT_PAIR_MESSAGE =
  "Please give the second parent's name and email together, or leave both blank.";

// The parent-group fields are each individually optional at the field level (below), then
// re-required one at a time by the forward checks under each schema when the athlete computes
// as a minor. Each message here is the exact required-field message the field carried before
// this pass made it optional, so a minor sees the identical wording an adult skips entirely.
const PARENT_NAME_MESSAGE = "Please enter the parent or guardian's name.";
const PARENT_RELATIONSHIP_MESSAGE =
  'Please enter the relationship to the athlete (for example, mother, father, guardian).';
const PARENT_ADDRESS_MESSAGE = 'Please enter a home address.';
const PARENT_CITY_MESSAGE = 'Please enter a city.';
const PARENT_STATE_MESSAGE = 'Please enter a state.';
const PARENT_ZIP_MESSAGE = 'Please enter a ZIP code.';
const PARENT_CELL_PHONE_MESSAGE = 'Please enter a cell phone number.';
const PARENT_EMAIL_MESSAGE = 'Please enter a valid email address.';

/** True once the athlete has at least one CrewLAB contact channel, an email or a cell. */
function hasAthleteCrewlabContact(input: { athleteEmail: string; athleteCell: string }): boolean {
  return input.athleteEmail.trim() !== '' || input.athleteCell.trim() !== '';
}

// The second-parent pair travels together: two directional checks, each forwarding to the
// field that is actually blank in the failing case. A name with no email fails the first
// (forwarded to the email); an email with no name fails the second (forwarded to the name).
// Both blank or both filled pass both checks.

/** A second-parent name with no email is incomplete. */
function secondParentEmailGivenName(input: {
  secondParentName: string;
  secondParentEmail: string;
}): boolean {
  return input.secondParentName.trim() === '' || input.secondParentEmail.trim() !== '';
}

/** A second-parent email with no name is incomplete. */
function secondParentNameGivenEmail(input: {
  secondParentName: string;
  secondParentEmail: string;
}): boolean {
  return input.secondParentEmail.trim() === '' || input.secondParentName.trim() !== '';
}

const athleteDobField = v.pipe(
  v.string(),
  v.trim(),
  v.isoDate("Please enter the athlete's date of birth as a valid date."),
  v.check((dob) => dob >= '1990-01-01', "Please double-check the athlete's date of birth."),
  v.check((dob) => dob <= isoToday(), "Please double-check the athlete's date of birth."),
);

const waiverAgreementFields = Object.fromEntries(
  WAIVER_SECTIONS.map((section) => [`agree_${section.id}`, waiverAgreementField(section.title)]),
);

const sharedFields = {
  athleteFullName: requiredText("Please enter the athlete's full name."),
  athleteDob: athleteDobField,
  // Individually optional: an adult athlete (18+) may submit with the whole "Parent or
  // guardian" section blank, matching RegistrationForm.svelte's disabled fieldset. Each field
  // is re-required for a minor by its own v.forward() check further down, reusing the exact
  // message it carried when it was unconditionally required (see the PARENT_*_MESSAGE
  // constants above).
  parentName: optionalText(),
  parentRelationship: optionalText(),
  address: optionalText(),
  city: optionalText(),
  state: optionalText(),
  zip: optionalText(),
  homePhone: optionalPhone(),
  cellPhone: optionalPhone(),
  parentEmail: optionalEmailField(PARENT_EMAIL_MESSAGE),
  // CrewLAB invite contacts: where the athlete's team-app invite goes, plus an optional
  // opt-in and second-parent pair. Cross-field requirements (at least one athlete contact;
  // the second-parent pair travels together) live in the schema pipes below, since a single
  // field's own validator cannot see its sibling fields.
  athleteEmail: optionalEmailField(
    'Please enter a valid email address for the athlete, or leave it blank.',
  ),
  athleteCell: optionalPhone(),
  parentCrewlabInvite: v.optional(v.boolean(), false),
  secondParentName: optionalText(),
  secondParentEmail: optionalEmailField(
    'Please enter a valid email address for the second parent, or leave it blank.',
  ),
  emergencyName: requiredText("Please enter an emergency contact's name."),
  emergencyRelationship: requiredText(
    "Please enter the emergency contact's relationship to the athlete.",
  ),
  emergencyPhone: requiredPhone("Please enter the emergency contact's phone number."),
  emergencyEmail: optionalEmailField(
    'Please enter a valid email address for the emergency contact, or leave it blank.',
  ),
  insuranceProvider: requiredText('Please enter the health insurance provider.'),
  policyNumber: requiredText('Please enter the insurance policy number.'),
  groupNumber: optionalText(),
  physicianName: optionalText(),
  physicianPhone: optionalPhone(),
  medications: requiredText('Please list current medications, or enter "none".'),
  allergies: requiredText('Please list allergies, or enter "none".'),
  conditions: requiredText('Please list any relevant medical conditions, or enter "none".'),
  tetanus: optionalText(),
  photoRelease: v.picklist(
    ['grant', 'deny'],
    'Please choose whether you grant or do not grant photo and media permission.',
  ),
  // Unconditionally required: the program has no under-13 athletes, so the age-gated exemption
  // this field used to carry (blank allowed under 13) only opened a blank-signature corner via
  // a mistyped date of birth. Every athlete, at any age, types their own name to sign.
  athleteSignature: requiredText("Please type the athlete's name to sign."),
  parentSignature: v.optional(v.pipe(v.string(), v.trim()), ''),
  parentConsent: v.optional(v.boolean(), false),
  athleteConsent: v.pipe(
    v.optional(v.boolean(), false),
    v.check(
      (checked) => checked === true,
      'Please check the box confirming the athlete agrees to sign electronically.',
    ),
  ),
  // Injected by the Turnstile widget via its `data-response-field-name` override, not a
  // rendered field; matches contact.remote.ts. The default field name Turnstile would use,
  // `cf-turnstile-response`, is unusable here: SvelteKit's remote-form client parses every
  // posted FormData key as an identifier path (`form-utils.js`'s `split_path`, the same
  // grammar that forces `agree_<id>` to use an underscore below) and throws synchronously,
  // client-side, before any request is sent, on a key containing a hyphen. That crash isn't
  // a corner case; it fires for every real submission, so the widget's own attribute renames
  // the field instead of the schema working around Turnstile's default.
  turnstileToken: v.optional(v.string(), ''),
  ...waiverAgreementFields,
};

const campFields = {
  ...sharedFields,
  dietary: optionalText(),
  carpool: v.picklist(['needs-ride', 'can-drive', 'self'], 'Please select a carpool option.'),
  carpoolSeats: v.optional(
    v.pipe(
      v.number('Please enter a whole number of seats.'),
      v.integer('Please enter a whole number of seats.'),
      v.minValue(0, 'Seats cannot be negative.'),
      v.maxValue(8, 'Please enter 8 or fewer seats.'),
    ),
  ),
  gearNotes: optionalText(),
};

export const trainingSchema = v.pipe(
  v.object(sharedFields),
  v.forward(
    v.check(
      (input) => ageNow(input.athleteDob) >= 18 || input.parentSignature.trim() !== '',
      'A parent or guardian must type their name to sign, since the athlete is under 18.',
    ),
    ['parentSignature'],
  ),
  v.forward(
    v.check(
      (input) => ageNow(input.athleteDob) >= 18 || input.parentConsent === true,
      'Please check the box confirming a parent or guardian is signing electronically, since the athlete is under 18.',
    ),
    ['parentConsent'],
  ),
  // The parent-group fields (made individually optional above) are re-required one at a time
  // for a minor athlete; ageNow() on a missing or unparseable dob returns NaN, and `NaN >= 18`
  // is false, so a blank or bad athleteDob defaults to the minor branch, the safe direction.
  v.forward(
    v.check((input) => ageNow(input.athleteDob) >= 18 || input.parentName.trim() !== '', PARENT_NAME_MESSAGE),
    ['parentName'],
  ),
  v.forward(
    v.check(
      (input) => ageNow(input.athleteDob) >= 18 || input.parentRelationship.trim() !== '',
      PARENT_RELATIONSHIP_MESSAGE,
    ),
    ['parentRelationship'],
  ),
  v.forward(
    v.check((input) => ageNow(input.athleteDob) >= 18 || input.address.trim() !== '', PARENT_ADDRESS_MESSAGE),
    ['address'],
  ),
  v.forward(
    v.check((input) => ageNow(input.athleteDob) >= 18 || input.city.trim() !== '', PARENT_CITY_MESSAGE),
    ['city'],
  ),
  v.forward(
    v.check((input) => ageNow(input.athleteDob) >= 18 || input.state.trim() !== '', PARENT_STATE_MESSAGE),
    ['state'],
  ),
  v.forward(
    v.check((input) => ageNow(input.athleteDob) >= 18 || input.zip.trim() !== '', PARENT_ZIP_MESSAGE),
    ['zip'],
  ),
  v.forward(
    v.check(
      (input) => ageNow(input.athleteDob) >= 18 || input.cellPhone.trim() !== '',
      PARENT_CELL_PHONE_MESSAGE,
    ),
    ['cellPhone'],
  ),
  v.forward(
    v.check((input) => ageNow(input.athleteDob) >= 18 || input.parentEmail.trim() !== '', PARENT_EMAIL_MESSAGE),
    ['parentEmail'],
  ),
  v.forward(v.check((input) => hasAthleteCrewlabContact(input), CREWLAB_CONTACT_MESSAGE), [
    'athleteEmail',
  ]),
  v.forward(v.check((input) => secondParentEmailGivenName(input), SECOND_PARENT_PAIR_MESSAGE), [
    'secondParentEmail',
  ]),
  v.forward(v.check((input) => secondParentNameGivenEmail(input), SECOND_PARENT_PAIR_MESSAGE), [
    'secondParentName',
  ]),
);

export const campSchema = v.pipe(
  v.object(campFields),
  v.forward(
    v.check(
      (input) => ageNow(input.athleteDob) >= 18 || input.parentSignature.trim() !== '',
      'A parent or guardian must type their name to sign, since the athlete is under 18.',
    ),
    ['parentSignature'],
  ),
  v.forward(
    v.check(
      (input) => ageNow(input.athleteDob) >= 18 || input.parentConsent === true,
      'Please check the box confirming a parent or guardian is signing electronically, since the athlete is under 18.',
    ),
    ['parentConsent'],
  ),
  v.forward(
    v.check(
      (input) => input.carpool !== 'can-drive' || input.carpoolSeats !== undefined,
      'Please tell us how many seats you can offer to other families.',
    ),
    ['carpoolSeats'],
  ),
  // The parent-group fields (made individually optional above) are re-required one at a time
  // for a minor athlete; ageNow() on a missing or unparseable dob returns NaN, and `NaN >= 18`
  // is false, so a blank or bad athleteDob defaults to the minor branch, the safe direction.
  v.forward(
    v.check((input) => ageNow(input.athleteDob) >= 18 || input.parentName.trim() !== '', PARENT_NAME_MESSAGE),
    ['parentName'],
  ),
  v.forward(
    v.check(
      (input) => ageNow(input.athleteDob) >= 18 || input.parentRelationship.trim() !== '',
      PARENT_RELATIONSHIP_MESSAGE,
    ),
    ['parentRelationship'],
  ),
  v.forward(
    v.check((input) => ageNow(input.athleteDob) >= 18 || input.address.trim() !== '', PARENT_ADDRESS_MESSAGE),
    ['address'],
  ),
  v.forward(
    v.check((input) => ageNow(input.athleteDob) >= 18 || input.city.trim() !== '', PARENT_CITY_MESSAGE),
    ['city'],
  ),
  v.forward(
    v.check((input) => ageNow(input.athleteDob) >= 18 || input.state.trim() !== '', PARENT_STATE_MESSAGE),
    ['state'],
  ),
  v.forward(
    v.check((input) => ageNow(input.athleteDob) >= 18 || input.zip.trim() !== '', PARENT_ZIP_MESSAGE),
    ['zip'],
  ),
  v.forward(
    v.check(
      (input) => ageNow(input.athleteDob) >= 18 || input.cellPhone.trim() !== '',
      PARENT_CELL_PHONE_MESSAGE,
    ),
    ['cellPhone'],
  ),
  v.forward(
    v.check((input) => ageNow(input.athleteDob) >= 18 || input.parentEmail.trim() !== '', PARENT_EMAIL_MESSAGE),
    ['parentEmail'],
  ),
  v.forward(v.check((input) => hasAthleteCrewlabContact(input), CREWLAB_CONTACT_MESSAGE), [
    'athleteEmail',
  ]),
  v.forward(v.check((input) => secondParentEmailGivenName(input), SECOND_PARENT_PAIR_MESSAGE), [
    'secondParentEmail',
  ]),
  v.forward(v.check((input) => secondParentNameGivenEmail(input), SECOND_PARENT_PAIR_MESSAGE), [
    'secondParentName',
  ]),
);

/** The posted, validated shape both schemas share. */
interface SharedParsedFields {
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
}

/** The camp form's posted shape: the shared fields plus camp logistics. */
interface CampParsedFields extends SharedParsedFields {
  dietary: string;
  carpool: 'needs-ride' | 'can-drive' | 'self';
  carpoolSeats?: number;
  gearNotes: string;
}

interface RegistrationMeta {
  ip: string;
  userAgent: string;
  submittedAt: string;
  waiverHash: string;
}

/** `''` reads as "not provided" for a field the record models as optional. */
function toOptional(value: string): string | undefined {
  return value === '' ? undefined : value;
}

export function buildRecord(
  kind: 'training',
  input: SharedParsedFields,
  meta: RegistrationMeta,
): RegistrationRecord;
export function buildRecord(
  kind: 'camp',
  input: CampParsedFields,
  meta: RegistrationMeta,
): RegistrationRecord;
export function buildRecord(
  kind: FormKind,
  input: SharedParsedFields | CampParsedFields,
  meta: RegistrationMeta,
): RegistrationRecord {
  const record: RegistrationRecord = {
    kind,
    athlete: { fullName: input.athleteFullName, dob: input.athleteDob },
    parent: {
      name: input.parentName,
      relationship: input.parentRelationship,
      address: input.address,
      city: input.city,
      state: input.state,
      zip: input.zip,
      homePhone: toOptional(input.homePhone),
      cellPhone: input.cellPhone,
      email: input.parentEmail,
    },
    emergency: {
      name: input.emergencyName,
      relationship: input.emergencyRelationship,
      phone: input.emergencyPhone,
      email: toOptional(input.emergencyEmail),
    },
    crewlab: {
      athleteEmail: toOptional(input.athleteEmail),
      athleteCell: toOptional(input.athleteCell),
      parentInvite: input.parentCrewlabInvite,
      secondParent:
        input.secondParentName !== '' && input.secondParentEmail !== ''
          ? { name: input.secondParentName, email: input.secondParentEmail }
          : undefined,
    },
    insurance: {
      provider: input.insuranceProvider,
      policyNumber: input.policyNumber,
      groupNumber: toOptional(input.groupNumber),
    },
    physician: {
      name: toOptional(input.physicianName),
      phone: toOptional(input.physicianPhone),
    },
    medical: {
      medications: input.medications,
      allergies: input.allergies,
      conditions: input.conditions,
      tetanus: toOptional(input.tetanus),
    },
    photoRelease: input.photoRelease,
    signatures: {
      athleteSignature: input.athleteSignature,
      parentSignature: toOptional(input.parentSignature),
      athleteIsAdult: ageInYears(input.athleteDob, meta.submittedAt) >= 18,
    },
    meta,
  };

  // `kind` is the caller's own discriminant; a 'camp' kind is only ever paired with a
  // CampParsedFields input (enforced by the overloads above), so this narrows safely.
  if (kind === 'camp') {
    const camp = input as CampParsedFields;
    record.camp = {
      dietary: toOptional(camp.dietary),
      carpool: camp.carpool,
      carpoolSeats: camp.carpoolSeats,
      gearNotes: toOptional(camp.gearNotes),
    };
  }

  return record;
}

const SHARED_HEADERS = [
  'Submitted At',
  'Athlete Full Name',
  'Athlete Date of Birth',
  'Parent/Guardian Name',
  'Parent/Guardian Relationship',
  'Address',
  'City',
  'State',
  'ZIP',
  'Home Phone',
  'Cell Phone',
  'Parent Email',
  'Emergency Contact Name',
  'Emergency Contact Relationship',
  'Emergency Contact Phone',
  'Emergency Contact Email',
  'Insurance Provider',
  'Policy Number',
  'Group Number',
  'Physician Name',
  'Physician Phone',
  'Medications',
  'Allergies',
  'Conditions',
  'Last Tetanus Shot',
];

const CAMP_LOGISTICS_HEADERS = ['Dietary Needs', 'Carpool', 'Carpool Seats', 'Gear Notes'];

const SIGNATURE_HEADERS = [
  'Photo Release',
  'Athlete Signature',
  'Parent Signature',
  'Athlete Is Adult',
  'Waiver Hash',
  'IP Address',
  'User Agent',
];

export const CREWLAB_HEADERS = [
  'Athlete Email (CrewLAB)',
  'Athlete Cell (CrewLAB)',
  'Parent CrewLAB Invite',
  'Second Parent Name',
  'Second Parent Email',
];

export const SHEET_HEADERS: Record<FormKind, string[]> = {
  training: [...SHARED_HEADERS, ...SIGNATURE_HEADERS, ...CREWLAB_HEADERS],
  camp: [...SHARED_HEADERS, ...CAMP_LOGISTICS_HEADERS, ...SIGNATURE_HEADERS, ...CREWLAB_HEADERS],
};

/** A sheet cell: `undefined` becomes blank, a boolean becomes Yes/No. */
function cell(value: string | number | boolean | undefined): string {
  if (value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export function toRowValues(record: RegistrationRecord): string[] {
  const shared = [
    record.meta.submittedAt,
    record.athlete.fullName,
    record.athlete.dob,
    record.parent.name,
    record.parent.relationship,
    record.parent.address,
    record.parent.city,
    record.parent.state,
    record.parent.zip,
    cell(record.parent.homePhone),
    record.parent.cellPhone,
    record.parent.email,
    record.emergency.name,
    record.emergency.relationship,
    record.emergency.phone,
    cell(record.emergency.email),
    record.insurance.provider,
    record.insurance.policyNumber,
    cell(record.insurance.groupNumber),
    cell(record.physician.name),
    cell(record.physician.phone),
    record.medical.medications,
    record.medical.allergies,
    record.medical.conditions,
    cell(record.medical.tetanus),
  ];

  const campLogistics =
    record.kind === 'camp' && record.camp
      ? [
          cell(record.camp.dietary),
          record.camp.carpool,
          cell(record.camp.carpoolSeats),
          cell(record.camp.gearNotes),
        ]
      : [];

  const signature = [
    record.photoRelease,
    record.signatures.athleteSignature,
    cell(record.signatures.parentSignature),
    cell(record.signatures.athleteIsAdult),
    record.meta.waiverHash,
    record.meta.ip,
    record.meta.userAgent,
  ];

  const crewlab = [
    cell(record.crewlab.athleteEmail),
    cell(record.crewlab.athleteCell),
    cell(record.crewlab.parentInvite),
    cell(record.crewlab.secondParent?.name),
    cell(record.crewlab.secondParent?.email),
  ];

  return [...shared, ...campLogistics, ...signature, ...crewlab];
}
