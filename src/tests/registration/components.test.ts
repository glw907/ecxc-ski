import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { WAIVER_SECTIONS } from '$theme/waiver/waiver';

// RegistrationForm.svelte imports registration.remote.ts, whose top-level `form(...)` calls
// need a static `$app/server` import to satisfy SvelteKit's remote-function build step;
// `$app/server` only resolves inside a full SvelteKit dev/build, not under plain vitest
// (matching remote.test.ts's own mock). The fake `form()` below returns a minimal
// RemoteForm-shaped object: a `fields` proxy that hands back a working `.as()`/`.value()`/
// `.allIssues()` field stub for ANY property name, so the component's real field references
// (including registerCamp's camp-only ones) never throw, without hand-listing every one.
function makeFieldStub(name: string) {
  return {
    as: (type: string, value?: unknown) => {
      const attrs: Record<string, unknown> = { name };
      if (type === 'checkbox') {
        // Matches real RemoteFormField.as('checkbox') behavior (see WaiverText.svelte's own
        // comment on the same prefix): only a boolean-coerced field carries `b:`, so a
        // checkbox posts as `b:<name>` while a radio (a plain string picklist value) does not.
        attrs.name = `b:${name}`;
        attrs.type = type;
        attrs.checked = false;
      } else if (type === 'radio') {
        attrs.type = type;
        attrs.checked = false;
        if (value !== undefined) attrs.value = value;
      } else if (type !== 'text') {
        attrs.type = type;
      }
      return attrs;
    },
    value: () => undefined,
    set: () => undefined,
    issues: () => undefined,
  };
}

const fieldsStub = new Proxy(
  {},
  {
    get(_target, prop: string | symbol) {
      if (prop === 'allIssues') return () => [];
      if (prop === 'issues') return () => undefined;
      if (typeof prop !== 'string') return undefined;
      return makeFieldStub(prop);
    },
  },
);

interface FormActionStub {
  method: string;
  action: string;
  fields: typeof fieldsStub;
  pending: number;
  result: { success: true; parentCopySent: boolean } | undefined;
  submitted: boolean;
}

// The real RemoteForm object keeps `fields`/`pending`/`result`/`submitted` as non-enumerable
// accessors, so `{...action}` on a `<form>` element (this component's own idiom) spreads only
// `method`/`action` onto the DOM node; a plain object literal here would make every one of
// those enumerable instead, and Svelte would try (and fail) to stringify the `fields` proxy
// as a literal HTML attribute.
const formActionStub = Object.defineProperties(
  { method: 'POST', action: '' } as FormActionStub,
  {
    fields: { value: fieldsStub, enumerable: false },
    pending: { value: 0, enumerable: false },
    result: { value: undefined, enumerable: false },
    submitted: { value: false, enumerable: false },
  },
);

vi.mock('$app/server', () => ({
  form: () => formActionStub,
  getRequestEvent: () => {
    throw new Error('getRequestEvent is not available outside a request; this suite never submits');
  },
}));

const { default: WaiverText } = await import('$theme/components/WaiverText.svelte');
const { default: RegistrationForm } = await import('$theme/components/RegistrationForm.svelte');

describe('WaiverText', () => {
  it('renders one required agreement checkbox per waiver section, posted as b:agree_<id>', () => {
    const { body } = render(WaiverText);

    // The `b:` prefix is load-bearing, not decorative: SvelteKit's convert_formdata only
    // coerces a checked box's posted "on" string to a real boolean when the field name
    // carries it, matching schema.test.ts's own boolean-vs-string coverage of the same
    // contract from the schema side.
    for (const section of WAIVER_SECTIONS) {
      expect(body).toContain(`id="agree-${section.id}"`);
      expect(body).toContain(`name="b:agree_${section.id}"`);
    }
    const checkboxCount = (body.match(/type="checkbox"/g) ?? []).length;
    expect(checkboxCount).toBe(WAIVER_SECTIONS.length);
  });

  it('labels every summary as a non-operative, plain-terms aid', () => {
    const { body } = render(WaiverText);

    const label = 'Plain-terms summary, for readability. The full text below is what you are agreeing to.';
    const occurrences = body.split(label).length - 1;
    expect(occurrences).toBe(WAIVER_SECTIONS.length);
  });
});

describe('RegistrationForm', () => {
  it('training variant renders every shared fieldset legend and no camp logistics', () => {
    const { body } = render(RegistrationForm, { props: { variant: 'training' } });

    for (const legend of [
      'Athlete',
      'Parent or guardian',
      'CrewLAB team app',
      'Emergency contact',
      'Insurance',
      'Medical',
      'Photo and media release',
      'Signatures',
    ]) {
      expect(body).toContain(legend);
    }
    expect(body).not.toContain('Camp logistics');
    expect(body).not.toContain('id="carpoolSeats"');
  });

  it('camp variant renders the camp logistics fieldset and the seats input', () => {
    const { body } = render(RegistrationForm, { props: { variant: 'camp' } });

    expect(body).toContain('CrewLAB team app');
    expect(body).toContain('Camp logistics');
    expect(body).toContain('id="carpoolSeats"');
  });

  it('places the CrewLAB team app fieldset directly after Parent or guardian and before Emergency contact', () => {
    const { body } = render(RegistrationForm, { props: { variant: 'training' } });

    const parentIndex = body.indexOf('Parent or guardian');
    const crewlabIndex = body.indexOf('CrewLAB team app');
    const emergencyIndex = body.indexOf('Emergency contact');
    expect(parentIndex).toBeGreaterThan(-1);
    expect(crewlabIndex).toBeGreaterThan(parentIndex);
    expect(emergencyIndex).toBeGreaterThan(crewlabIndex);
  });

  it.each(['training', 'camp'] as const)(
    '%s variant renders the photo-release radios and both signature inputs',
    (variant) => {
      const { body } = render(RegistrationForm, { props: { variant } });

      expect(body).toContain('id="photoRelease-grant"');
      expect(body).toContain('id="photoRelease-deny"');
      expect(body).toContain('id="athleteSignature"');
      expect(body).toContain('id="parentSignature"');
    },
  );

  it.each(['training', 'camp'] as const)('%s variant does not show the success copy on first render', (variant) => {
    const { body } = render(RegistrationForm, { props: { variant } });

    expect(body).not.toContain('You are registered');
  });

  it('renders an h2 heading the form section, so the page runs h1 then h2 then the waiver h3s without a skip', () => {
    const { body } = render(RegistrationForm, { props: { variant: 'training' } });

    expect(body).toMatch(/<h2[^>]*>Register<\/h2>/);
  });

  it('mounts the failed-submit alert region from first render, empty until there are issues', () => {
    const { body } = render(RegistrationForm, { props: { variant: 'training' } });

    expect(body).toMatch(/<div role="alert"[^>]*tabindex="-1"/);
    // No validation issues on first render (the mocked fields.allIssues() returns []), so
    // no error message text should be present yet.
    expect(body).not.toContain('rounded-field border border-error');
  });

  it('mounts the success status region from first render, hidden until a submission succeeds', () => {
    const { body } = render(RegistrationForm, { props: { variant: 'training' } });

    expect(body).toMatch(/<div role="status"[^>]*tabindex="-1"[^>]*hidden/);
  });

  it('wires each field to its own stable error id via aria-describedby', () => {
    const { body } = render(RegistrationForm, { props: { variant: 'training' } });

    for (const field of [
      'athleteFullName',
      'parentEmail',
      'athleteSignature',
      'athleteEmail',
      'athleteCell',
      'parentCrewlabInvite',
      'secondParentName',
      'secondParentEmail',
    ]) {
      // The error id must lead the describedby list; a field may append help-text ids after
      // it (the CrewLAB contacts carry their shared instruction paragraph this way).
      expect(body).toMatch(new RegExp(`aria-describedby="${field}-error[ "]`));
      expect(body).toContain(`id="${field}-error"`);
    }
  });

  it('posts the parent CrewLAB invite checkbox under a b:parentCrewlabInvite name', () => {
    const { body } = render(RegistrationForm, { props: { variant: 'training' } });

    expect(body).toContain('name="b:parentCrewlabInvite"');
  });

  it('does not mark either CrewLAB contact field required, since only one of the pair is needed', () => {
    const { body } = render(RegistrationForm, { props: { variant: 'training' } });

    const athleteEmailInput = body.match(/<input id="athleteEmail"[^>]*>/)?.[0];
    const athleteCellInput = body.match(/<input id="athleteCell"[^>]*>/)?.[0];
    expect(athleteEmailInput).toBeDefined();
    expect(athleteCellInput).toBeDefined();
    expect(athleteEmailInput).not.toContain('required');
    expect(athleteCellInput).not.toContain('required');
  });

  it('requires the athlete signature unconditionally', () => {
    const { body } = render(RegistrationForm, { props: { variant: 'training' } });

    const athleteSignatureInput = body.match(/<input id="athleteSignature"[^>]*>/)?.[0];
    expect(athleteSignatureInput).toBeDefined();
    expect(athleteSignatureInput).toContain('required');
  });
});
