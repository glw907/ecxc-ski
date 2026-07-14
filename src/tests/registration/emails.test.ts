import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendParentCopy, sendRecordCopy, sendRecordEmail } from '$theme/registration/emails';
import { SHEET_HEADERS, type RegistrationRecord } from '$theme/registration/schema';

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

  /** The plain OutboundMessage sendRecordEmail handed to the transport's send(), decoded from
   *  the mock's most recent call. */
  function lastMessage(): { to: string; from: string; fromName?: string; subject: string; text: string } {
    return sendEmailMock.mock.calls.at(-1)?.[0];
  }

  beforeEach(() => {
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue(undefined);
  });

  it('sends from noreply@ecxc.ski (as "ECXC Registration") to CONTACT_EMAIL with the training subject', async () => {
    await sendRecordEmail(env, makeRecord('training'), {});

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const message = lastMessage();
    expect(message.from).toBe('noreply@ecxc.ski');
    expect(message.fromName).toBe('ECXC Registration');
    expect(message.to).toBe('coach@ecxc.ski');
    expect(message.subject).toBe('Registration: Alice Athlete (Training)');
  });

  it('labels a camp submission with the camp subject', async () => {
    await sendRecordEmail(env, makeRecord('camp'), {});
    expect(lastMessage().subject).toBe('Registration: Alice Athlete (Talkeetna Camp)');
  });

  it('includes every SHEET_HEADERS label for the record kind in the body', async () => {
    for (const kind of ['training', 'camp'] as const) {
      await sendRecordEmail(env, makeRecord(kind), {});
      const text = lastMessage().text;
      for (const header of SHEET_HEADERS[kind]) {
        expect(text).toContain(header);
      }
    }
  });

  it('carries the waiver hash', async () => {
    await sendRecordEmail(env, makeRecord('training'), {});
    expect(lastMessage().text).toContain('deadbeef');
  });

  it('adds the sheets-failure block only when opts.sheetsError is set', async () => {
    const record = makeRecord('training');

    await sendRecordEmail(env, record, {});
    expect(lastMessage().text).not.toContain('SHEETS APPEND FAILED');

    await sendRecordEmail(env, record, { sheetsError: 'append failed: 500 quota exceeded' });
    expect(lastMessage().text).toContain('*** SHEETS APPEND FAILED, back-fill this row by hand ***');
    expect(lastMessage().text).toContain('append failed: 500 quota exceeded');
  });

  it('throws when the send binding rejects', async () => {
    sendEmailMock.mockRejectedValueOnce(new Error('binding unavailable'));
    await expect(sendRecordEmail(env, makeRecord('training'), {})).rejects.toThrow('binding unavailable');
  });

  it('places the CrewLAB invite group directly after the parent group, with the invite values', async () => {
    await sendRecordEmail(env, makeRecord('training'), {});
    const text = lastMessage().text;

    const parentIndex = text.indexOf('Parent or guardian');
    const crewlabIndex = text.indexOf('CrewLAB invite');
    const emergencyIndex = text.indexOf('Emergency contact');

    expect(parentIndex).toBeGreaterThan(-1);
    expect(crewlabIndex).toBeGreaterThan(parentIndex);
    expect(emergencyIndex).toBeGreaterThan(crewlabIndex);
    expect(text).toContain('alice@example.com');
    expect(text).toContain('sam@example.com');
  });
});

describe('sendParentCopy', () => {
  it("sends to the parent's submitted email address, from noreply@ecxc.ski", async () => {
    const send = vi.fn().mockResolvedValue(undefined);

    await sendParentCopy({ EMAIL: { send } }, makeRecord('training'), 'parent@example.com');

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

    await sendParentCopy({ EMAIL: { send } }, record, 'parent@example.com');

    const message = send.mock.calls[0][0] as { text: string };
    for (const header of SHEET_HEADERS.camp) {
      expect(message.text).toContain(header);
    }
  });

  it('sends to the `to` address passed in, not necessarily record.parent.email', async () => {
    const send = vi.fn().mockResolvedValue(undefined);

    await sendParentCopy({ EMAIL: { send } }, makeRecord('training'), 'athlete@example.com');

    const message = send.mock.calls[0][0] as { to: string };
    expect(message.to).toBe('athlete@example.com');
  });

  it('throws when the EMAIL binding rejects', async () => {
    const send = vi.fn().mockRejectedValue(new Error('quota exceeded'));
    await expect(
      sendParentCopy({ EMAIL: { send } }, makeRecord('camp'), 'parent@example.com'),
    ).rejects.toThrow('quota exceeded');
  });
});

describe('sendRecordCopy', () => {
  it('sends the record to the given address with the registration subject', async () => {
    const send = vi.fn().mockResolvedValue(undefined);

    await sendRecordCopy({ EMAIL: { send } }, 'amyenkhee@gmail.com', makeRecord('training'));

    expect(send).toHaveBeenCalledTimes(1);
    const message = send.mock.calls[0][0] as {
      to: string;
      from: string;
      subject: string;
      text: string;
      html: string;
    };
    expect(message.to).toBe('amyenkhee@gmail.com');
    expect(message.from).toBe('noreply@ecxc.ski');
    expect(message.subject).toBe('Registration: Alice Athlete (Training)');
    expect(message.text).toContain('Alice Athlete');
    expect(message.text).toContain('deadbeef');
    expect(message.text).not.toContain('SHEETS APPEND FAILED');
  });

  it('labels a camp submission with the camp subject', async () => {
    const send = vi.fn().mockResolvedValue(undefined);

    await sendRecordCopy({ EMAIL: { send } }, 'amyenkhee@gmail.com', makeRecord('camp'));

    const message = send.mock.calls[0][0] as { subject: string; text: string };
    expect(message.subject).toBe('Registration: Alice Athlete (Talkeetna Camp)');
    for (const header of SHEET_HEADERS.camp) {
      expect(message.text).toContain(header);
    }
  });

  it('throws when the EMAIL binding rejects', async () => {
    const send = vi.fn().mockRejectedValue(new Error('quota exceeded'));
    await expect(
      sendRecordCopy({ EMAIL: { send } }, 'amyenkhee@gmail.com', makeRecord('training')),
    ).rejects.toThrow('quota exceeded');
  });
});
