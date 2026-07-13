import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendParentCopy, sendRecordEmail } from '$theme/registration/emails';
import { SHEET_HEADERS, type RegistrationRecord } from '$theme/registration/schema';

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

function makeRecord(kind: 'training' | 'camp'): RegistrationRecord {
  const record: RegistrationRecord = {
    kind,
    athlete: { fullName: 'Alice Athlete', dob: '2010-05-01' },
    parent: {
      name: 'Pat Parent',
      relationship: 'Mother',
      address: '123 Trail Rd',
      city: 'Anchorage',
      state: 'AK',
      zip: '99501',
      homePhone: '907-555-0100',
      cellPhone: '907-555-0101',
      email: 'parent@example.com',
    },
    emergency: {
      name: 'Eddie Emergency',
      relationship: 'Uncle',
      phone: '907-555-0102',
      email: 'eddie@example.com',
    },
    crewlab: {
      athleteEmail: 'alice@example.com',
      athleteCell: '907-555-0199',
      parentInvite: true,
      secondParent: { name: 'Sam Second', email: 'sam@example.com' },
    },
    insurance: { provider: 'Acme Health', policyNumber: 'POL-123', groupNumber: 'GRP-9' },
    physician: { name: 'Dr. Doc', phone: '907-555-0103' },
    medical: { medications: 'none', allergies: 'none', conditions: 'none', tetanus: '2020-01-01' },
    photoRelease: 'grant',
    signatures: {
      athleteSignature: 'Alice Athlete',
      parentSignature: 'Pat Parent',
      athleteIsAdult: false,
    },
    meta: {
      submittedAt: '2026-07-13T12:00:00.000Z',
      ip: '203.0.113.5',
      userAgent: 'test-agent/1.0',
      waiverHash: 'deadbeef',
    },
  };

  if (kind === 'camp') {
    record.camp = { dietary: 'vegetarian', carpool: 'can-drive', carpoolSeats: 3, gearNotes: 'has own tent' };
  }

  return record;
}

describe('sendRecordEmail', () => {
  const sendEmailMock = vi.fn();
  const env = { CONTACT_EMAIL: 'coach@ecxc.ski', SEND_EMAIL: { send: sendEmailMock } };

  beforeEach(() => {
    captured = [];
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue(undefined);
  });

  it('sends from noreply@ecxc.ski to CONTACT_EMAIL with the training subject', async () => {
    await sendRecordEmail(env, makeRecord('training'), {});

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(captured).toHaveLength(1);
    expect(captured[0].from).toBe('noreply@ecxc.ski');
    expect(captured[0].to).toBe('coach@ecxc.ski');
    expect(decodeSubject(captured[0].raw)).toBe('Registration: Alice Athlete (Training)');
  });

  it('labels a camp submission with the camp subject', async () => {
    await sendRecordEmail(env, makeRecord('camp'), {});
    expect(decodeSubject(captured[0].raw)).toBe('Registration: Alice Athlete (Talkeetna Camp)');
  });

  it('includes every SHEET_HEADERS label for the record kind in the body', async () => {
    for (const kind of ['training', 'camp'] as const) {
      captured = [];
      await sendRecordEmail(env, makeRecord(kind), {});
      const raw = captured[0].raw;
      for (const header of SHEET_HEADERS[kind]) {
        expect(raw).toContain(header);
      }
    }
  });

  it('carries the waiver hash', async () => {
    await sendRecordEmail(env, makeRecord('training'), {});
    expect(captured[0].raw).toContain('deadbeef');
  });

  it('adds the sheets-failure block only when opts.sheetsError is set', async () => {
    const record = makeRecord('training');

    await sendRecordEmail(env, record, {});
    expect(captured[0].raw).not.toContain('SHEETS APPEND FAILED');

    captured = [];
    await sendRecordEmail(env, record, { sheetsError: 'append failed: 500 quota exceeded' });
    expect(captured[0].raw).toContain('*** SHEETS APPEND FAILED, back-fill this row by hand ***');
    expect(captured[0].raw).toContain('append failed: 500 quota exceeded');
  });

  it('throws when the send binding rejects', async () => {
    sendEmailMock.mockRejectedValueOnce(new Error('binding unavailable'));
    await expect(sendRecordEmail(env, makeRecord('training'), {})).rejects.toThrow('binding unavailable');
  });

  it('places the CrewLAB invite group directly after the parent group, with the invite values', async () => {
    await sendRecordEmail(env, makeRecord('training'), {});
    const raw = captured[0].raw;

    const parentIndex = raw.indexOf('Parent or guardian');
    const crewlabIndex = raw.indexOf('CrewLAB invite');
    const emergencyIndex = raw.indexOf('Emergency contact');

    expect(parentIndex).toBeGreaterThan(-1);
    expect(crewlabIndex).toBeGreaterThan(parentIndex);
    expect(emergencyIndex).toBeGreaterThan(crewlabIndex);
    expect(raw).toContain('alice@example.com');
    expect(raw).toContain('sam@example.com');
  });
});

describe('sendParentCopy', () => {
  it("sends to the parent's submitted email address, from noreply@ecxc.ski", async () => {
    const send = vi.fn().mockResolvedValue(undefined);

    await sendParentCopy({ EMAIL: { send } }, makeRecord('training'));

    expect(send).toHaveBeenCalledTimes(1);
    const message = send.mock.calls[0][0] as {
      to: string;
      from: string;
      subject: string;
      text: string;
      html: string;
    };
    expect(message.to).toBe('parent@example.com');
    expect(message.from).toBe('noreply@ecxc.ski');
    expect(message.subject).toBe('Your ECXC registration: Alice Athlete');
    expect(message.text).toContain('Alice Athlete');
    expect(message.text).toContain('deadbeef');
  });

  it('carries the same labeled record as the record email', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const record = makeRecord('camp');

    await sendParentCopy({ EMAIL: { send } }, record);

    const message = send.mock.calls[0][0] as { text: string };
    for (const header of SHEET_HEADERS.camp) {
      expect(message.text).toContain(header);
    }
  });

  it('throws when the EMAIL binding rejects', async () => {
    const send = vi.fn().mockRejectedValue(new Error('quota exceeded'));
    await expect(sendParentCopy({ EMAIL: { send } }, makeRecord('camp'))).rejects.toThrow('quota exceeded');
  });
});
