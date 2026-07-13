import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { WAIVER_SECTIONS } from '$theme/waiver/waiver';
import {
  buildRecord,
  campSchema,
  CREWLAB_HEADERS,
  SHEET_HEADERS,
  toRowValues,
  trainingSchema,
} from '$theme/registration/schema';

/** All waiver agreement checkboxes checked, as a real submission would send them. */
function agreements(): Record<string, boolean> {
  return Object.fromEntries(WAIVER_SECTIONS.map((section) => [`agree_${section.id}`, true]));
}

function baseFields(dob: string) {
  return {
    athleteFullName: 'Riley Athlete',
    athleteDob: dob,
    parentName: 'Pat Parent',
    parentRelationship: 'Mother',
    address: '123 Main St',
    city: 'Anchorage',
    state: 'AK',
    zip: '99501',
    homePhone: '',
    cellPhone: '907-555-0100',
    parentEmail: 'pat@example.com',
    athleteEmail: 'athlete@example.com',
    athleteCell: '',
    parentCrewlabInvite: false,
    secondParentName: '',
    secondParentEmail: '',
    emergencyName: 'Emery Contact',
    emergencyRelationship: 'Aunt',
    emergencyPhone: '907-555-0101',
    emergencyEmail: '',
    insuranceProvider: 'Premera',
    policyNumber: 'POL-123',
    groupNumber: '',
    physicianName: '',
    physicianPhone: '',
    medications: 'none',
    allergies: 'none',
    conditions: 'none',
    tetanus: '',
    photoRelease: 'grant',
    athleteSignature: 'Riley Athlete',
    parentSignature: 'Pat Parent',
    parentConsent: true,
    athleteConsent: true,
    turnstileToken: '',
    ...agreements(),
  };
}

/** A birth date that is exactly `years` old today, in ISO `YYYY-MM-DD` form. */
function dobForAge(years: number): string {
  const now = new Date();
  const dob = new Date(Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate() - 1));
  return dob.toISOString().slice(0, 10);
}

describe('trainingSchema', () => {
  it('parses a valid adult submission', () => {
    const result = v.safeParse(trainingSchema, baseFields(dobForAge(18)));
    expect(result.success).toBe(true);
  });

  it('parses a valid minor submission with a parent signature', () => {
    const result = v.safeParse(trainingSchema, baseFields(dobForAge(16)));
    expect(result.success).toBe(true);
  });

  it('fails when a waiver agreement is missing, naming the section', () => {
    const fields = baseFields(dobForAge(18));
    delete (fields as Record<string, unknown>)['agree_risks'];
    const result = v.safeParse(trainingSchema, fields);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.issues.map((issue) => issue.message).join(' ');
      expect(messages).toContain('Acknowledgment & Assumption of Inherent Risks');
    }
  });

  it('fails a 17-year-old with no parent signature', () => {
    const fields = { ...baseFields(dobForAge(17)), parentSignature: '' };
    const result = v.safeParse(trainingSchema, fields);
    expect(result.success).toBe(false);
  });

  it('passes an 18-year-old with no parent signature', () => {
    const fields = { ...baseFields(dobForAge(18)), parentSignature: '', parentConsent: false };
    const result = v.safeParse(trainingSchema, fields);
    expect(result.success).toBe(true);
  });

  it('fails a blank athlete signature regardless of age, including an adult athlete', () => {
    const fields = { ...baseFields(dobForAge(18)), athleteSignature: '' };
    const result = v.safeParse(trainingSchema, fields);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.issues.map((issue) => issue.message).join(' ');
      expect(messages).toContain("Please type the athlete's name to sign.");
    }
  });
});

// The waiver's per-section `agree_<id>` fields (built by schema.ts's own
// `waiverAgreementFields`) only accept a real boolean, never the raw posted string a checkbox
// sends without SvelteKit's `b:` name prefix. WaiverText.svelte's checkbox is hand-authored
// (its field name is generated at runtime, so it cannot go through `RemoteFormField.as(...)`,
// which would add the prefix automatically), so this is the schema-side half of that contract;
// components.test.ts asserts the rendered `name="b:agree_<id>"` half.
describe('waiver agreement fields require a real boolean, not the raw posted "on" string', () => {
  it('accepts a checked section once it has coerced to the real boolean true', () => {
    const result = v.safeParse(trainingSchema, baseFields(dobForAge(18)));
    expect(result.success).toBe(true);
  });

  it('rejects a checked section still carrying the raw posted string "on" (the shape a checkbox posts without the b: name prefix)', () => {
    const fields = { ...baseFields(dobForAge(18)), 'agree_risks': 'on' };
    const result = v.safeParse(trainingSchema, fields);
    expect(result.success).toBe(false);
  });
});

describe('CrewLAB invite fields', () => {
  it('rejects a blank athlete email and cell together, forwarding to athleteEmail', () => {
    const fields = { ...baseFields(dobForAge(18)), athleteEmail: '', athleteCell: '' };
    const result = v.safeParse(trainingSchema, fields);
    expect(result.success).toBe(false);
    if (!result.success) {
      const forwarded = result.issues.some((issue) => issue.path?.[0]?.key === 'athleteEmail');
      expect(forwarded).toBe(true);
    }
  });

  it('passes with only an athlete email', () => {
    const fields = { ...baseFields(dobForAge(18)), athleteEmail: 'athlete@example.com', athleteCell: '' };
    expect(v.safeParse(trainingSchema, fields).success).toBe(true);
  });

  it('passes with only an athlete cell', () => {
    const fields = { ...baseFields(dobForAge(18)), athleteEmail: '', athleteCell: '907-555-0199' };
    expect(v.safeParse(trainingSchema, fields).success).toBe(true);
  });

  it('rejects a second-parent name with no email, forwarding to secondParentEmail', () => {
    const fields = { ...baseFields(dobForAge(18)), secondParentName: 'Sam Second', secondParentEmail: '' };
    const result = v.safeParse(trainingSchema, fields);
    expect(result.success).toBe(false);
    if (!result.success) {
      const forwarded = result.issues.some((issue) => issue.path?.[0]?.key === 'secondParentEmail');
      expect(forwarded).toBe(true);
    }
  });

  it('rejects a second-parent email with no name, forwarding to secondParentName', () => {
    const fields = { ...baseFields(dobForAge(18)), secondParentName: '', secondParentEmail: 'sam@example.com' };
    const result = v.safeParse(trainingSchema, fields);
    expect(result.success).toBe(false);
    if (!result.success) {
      const forwarded = result.issues.some((issue) => issue.path?.[0]?.key === 'secondParentName');
      expect(forwarded).toBe(true);
    }
  });

  it('passes with both second-parent fields blank', () => {
    const fields = { ...baseFields(dobForAge(18)), secondParentName: '', secondParentEmail: '' };
    expect(v.safeParse(trainingSchema, fields).success).toBe(true);
  });

  it('passes with both second-parent fields filled', () => {
    const fields = {
      ...baseFields(dobForAge(18)),
      secondParentName: 'Sam Second',
      secondParentEmail: 'sam@example.com',
    };
    expect(v.safeParse(trainingSchema, fields).success).toBe(true);
  });

  it('defaults parentCrewlabInvite to false when omitted', () => {
    const fields = { ...baseFields(dobForAge(18)) } as Record<string, unknown>;
    delete fields['parentCrewlabInvite'];
    const result = v.safeParse(trainingSchema, fields);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.output as { parentCrewlabInvite: boolean }).parentCrewlabInvite).toBe(false);
    }
  });

  it('enforces the same athlete-contact requirement on campSchema', () => {
    const fields = {
      ...baseFields(dobForAge(18)),
      athleteEmail: '',
      athleteCell: '',
      dietary: '',
      carpool: 'self',
      gearNotes: '',
    };
    expect(v.safeParse(campSchema, fields).success).toBe(false);
  });
});

describe('campSchema', () => {
  function campFields(dob: string) {
    return {
      ...baseFields(dob),
      dietary: 'vegetarian',
      carpool: 'self',
      gearNotes: '',
    };
  }

  it('parses a valid camp submission', () => {
    const result = v.safeParse(campSchema, campFields(dobForAge(18)));
    expect(result.success).toBe(true);
  });

  it('fails can-drive with no seats offered', () => {
    const fields = { ...campFields(dobForAge(18)), carpool: 'can-drive' };
    const result = v.safeParse(campSchema, fields);
    expect(result.success).toBe(false);
  });

  it('passes needs-ride with no seats offered', () => {
    const fields = { ...campFields(dobForAge(18)), carpool: 'needs-ride' };
    const result = v.safeParse(campSchema, fields);
    expect(result.success).toBe(true);
  });

  it('passes can-drive when seats are offered', () => {
    const fields = { ...campFields(dobForAge(18)), carpool: 'can-drive', carpoolSeats: 2 };
    const result = v.safeParse(campSchema, fields);
    expect(result.success).toBe(true);
  });

  it('fails a blank athlete signature regardless of age, including an adult athlete', () => {
    const fields = { ...campFields(dobForAge(18)), athleteSignature: '' };
    const result = v.safeParse(campSchema, fields);
    expect(result.success).toBe(false);
  });
});

const META = {
  ip: '203.0.113.5',
  userAgent: 'vitest-agent/1.0',
  submittedAt: '2026-07-13T12:00:00.000Z',
  waiverHash: 'deadbeef',
};

describe('buildRecord and toRowValues', () => {
  it('assembles a training record whose row matches its headers', () => {
    const parsed = v.parse(trainingSchema, baseFields('2008-01-01'));
    const record = buildRecord('training', parsed, META);

    expect(record.kind).toBe('training');
    expect(record.camp).toBeUndefined();
    expect(record.signatures.athleteIsAdult).toBe(true);

    const row = toRowValues(record);
    expect(row).toHaveLength(SHEET_HEADERS.training.length);
    for (const value of [
      'Riley Athlete',
      '2008-01-01',
      'Pat Parent',
      'Anchorage',
      'pat@example.com',
      'grant',
      'deadbeef',
      '203.0.113.5',
      'vitest-agent/1.0',
    ]) {
      expect(row).toContain(value);
    }
  });

  it('assembles a camp record whose row matches its headers and carries camp logistics', () => {
    const parsed = v.parse(campSchema, {
      ...baseFields('2008-01-01'),
      dietary: 'no nuts',
      carpool: 'can-drive',
      carpoolSeats: 3,
      gearNotes: 'has an extra sleeping bag',
    });
    const record = buildRecord('camp', parsed, META);

    expect(record.camp).toBeDefined();
    const row = toRowValues(record);
    expect(row).toHaveLength(SHEET_HEADERS.camp.length);
    for (const value of ['no nuts', 'can-drive', '3', 'has an extra sleeping bag']) {
      expect(row).toContain(value);
    }
  });

  it('marks a 17-year-old athlete as not an adult at submission time', () => {
    const parsed = v.parse(trainingSchema, baseFields(dobForAge(17)));
    const record = buildRecord('training', parsed, {
      ...META,
      submittedAt: new Date().toISOString(),
    });
    expect(record.signatures.athleteIsAdult).toBe(false);
  });

  it('assembles crewlab info, including the second parent only when both fields are filled', () => {
    const parsed = v.parse(trainingSchema, {
      ...baseFields('2008-01-01'),
      athleteEmail: 'athlete@example.com',
      athleteCell: '907-555-0199',
      parentCrewlabInvite: true,
      secondParentName: 'Sam Second',
      secondParentEmail: 'sam@example.com',
    });
    const record = buildRecord('training', parsed, META);

    expect(record.crewlab.athleteEmail).toBe('athlete@example.com');
    expect(record.crewlab.athleteCell).toBe('907-555-0199');
    expect(record.crewlab.parentInvite).toBe(true);
    expect(record.crewlab.secondParent).toEqual({ name: 'Sam Second', email: 'sam@example.com' });
  });

  it('leaves crewlab.secondParent undefined when the pair is blank', () => {
    const parsed = v.parse(trainingSchema, baseFields('2008-01-01'));
    const record = buildRecord('training', parsed, META);
    expect(record.crewlab.secondParent).toBeUndefined();
  });

  it('appends CREWLAB_HEADERS last for both kinds', () => {
    expect(SHEET_HEADERS.training.slice(-5)).toEqual(CREWLAB_HEADERS);
    expect(SHEET_HEADERS.camp.slice(-5)).toEqual(CREWLAB_HEADERS);
  });

  it('appends the five CrewLAB cells last in a training row, booleans as Yes/No', () => {
    const parsed = v.parse(trainingSchema, {
      ...baseFields('2008-01-01'),
      athleteEmail: 'athlete@example.com',
      athleteCell: '907-555-0199',
      parentCrewlabInvite: true,
      secondParentName: 'Sam Second',
      secondParentEmail: 'sam@example.com',
    });
    const record = buildRecord('training', parsed, META);
    const row = toRowValues(record);
    expect(row).toHaveLength(SHEET_HEADERS.training.length);
    expect(row.slice(-5)).toEqual([
      'athlete@example.com',
      '907-555-0199',
      'Yes',
      'Sam Second',
      'sam@example.com',
    ]);
  });

  it('appends the five CrewLAB cells last in a camp row too', () => {
    const parsed = v.parse(campSchema, {
      ...baseFields('2008-01-01'),
      dietary: '',
      carpool: 'self',
      gearNotes: '',
    });
    const record = buildRecord('camp', parsed, META);
    const row = toRowValues(record);
    expect(row).toHaveLength(SHEET_HEADERS.camp.length);
    expect(row.slice(-5)).toEqual(['athlete@example.com', '', 'No', '', '']);
  });
});
