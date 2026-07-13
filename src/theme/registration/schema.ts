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

/** An optional email field: blank passes, but a non-blank value must be a valid address. */
function optionalEmailField(message: string) {
  return v.pipe(
    v.optional(v.pipe(v.string(), v.trim()), ''),
    v.check((value) => value === '' || v.EMAIL_REGEX.test(value), message),
  );
}

/** One required agreement checkbox per waiver section, named `agree-<id>`. */
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

const athleteDobField = v.pipe(
  v.string(),
  v.trim(),
  v.isoDate("Please enter the athlete's date of birth as a valid date."),
  v.check((dob) => dob >= '1990-01-01', "Please double-check the athlete's date of birth."),
  v.check((dob) => dob <= isoToday(), "Please double-check the athlete's date of birth."),
);

const waiverAgreementFields = Object.fromEntries(
  WAIVER_SECTIONS.map((section) => [`agree-${section.id}`, waiverAgreementField(section.title)]),
);

const sharedFields = {
  athleteFullName: requiredText("Please enter the athlete's full name."),
  athleteDob: athleteDobField,
  parentName: requiredText("Please enter the parent or guardian's name."),
  parentRelationship: requiredText(
    'Please enter the relationship to the athlete (for example, mother, father, guardian).',
  ),
  address: requiredText('Please enter a home address.'),
  city: requiredText('Please enter a city.'),
  state: requiredText('Please enter a state.'),
  zip: requiredText('Please enter a ZIP code.'),
  homePhone: optionalText(),
  cellPhone: requiredText('Please enter a cell phone number.'),
  parentEmail: v.pipe(v.string(), v.trim(), v.email('Please enter a valid email address.')),
  emergencyName: requiredText("Please enter an emergency contact's name."),
  emergencyRelationship: requiredText(
    "Please enter the emergency contact's relationship to the athlete.",
  ),
  emergencyPhone: requiredText("Please enter the emergency contact's phone number."),
  emergencyEmail: optionalEmailField(
    'Please enter a valid email address for the emergency contact, or leave it blank.',
  ),
  insuranceProvider: requiredText('Please enter the health insurance provider.'),
  policyNumber: requiredText('Please enter the insurance policy number.'),
  groupNumber: optionalText(),
  physicianName: optionalText(),
  physicianPhone: optionalText(),
  medications: requiredText('Please list current medications, or enter "none".'),
  allergies: requiredText('Please list allergies, or enter "none".'),
  conditions: requiredText('Please list any relevant medical conditions, or enter "none".'),
  tetanus: optionalText(),
  photoRelease: v.picklist(
    ['grant', 'deny'],
    'Please choose whether you grant or do not grant photo and media permission.',
  ),
  athleteSignature: v.optional(v.pipe(v.string(), v.trim()), ''),
  parentSignature: v.optional(v.pipe(v.string(), v.trim()), ''),
  parentConsent: v.optional(v.boolean(), false),
  athleteConsent: v.pipe(
    v.optional(v.boolean(), false),
    v.check(
      (checked) => checked === true,
      'Please check the box confirming the athlete agrees to sign electronically.',
    ),
  ),
  // Injected by the Turnstile widget, not a rendered field; matches contact.remote.ts.
  'cf-turnstile-response': v.optional(v.string(), ''),
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
  v.forward(
    v.check(
      (input) => ageNow(input.athleteDob) < 13 || input.athleteSignature.trim() !== '',
      'Please have the athlete type their name to sign.',
    ),
    ['athleteSignature'],
  ),
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
      (input) => ageNow(input.athleteDob) < 13 || input.athleteSignature.trim() !== '',
      'Please have the athlete type their name to sign.',
    ),
    ['athleteSignature'],
  ),
  v.forward(
    v.check(
      (input) => input.carpool !== 'can-drive' || input.carpoolSeats !== undefined,
      'Please tell us how many seats you can offer to other families.',
    ),
    ['carpoolSeats'],
  ),
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

export const SHEET_HEADERS: Record<FormKind, string[]> = {
  training: [...SHARED_HEADERS, ...SIGNATURE_HEADERS],
  camp: [...SHARED_HEADERS, ...CAMP_LOGISTICS_HEADERS, ...SIGNATURE_HEADERS],
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

  return [...shared, ...campLogistics, ...signature];
}
