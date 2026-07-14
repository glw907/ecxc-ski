<!-- @component
The Training and Talkeetna Camp registration form, sharing one waiver
(`WaiverText.svelte`) and one field layout, posted through `registerTraining` or
`registerCamp` (`registration.remote.ts`) depending on `variant`. Styled on the same
Waymark token layer as `ContactForm.svelte`: DaisyUI's default-bordered inputs, a
`<fieldset>`/`<legend>` per logical group, the fields' own `.as(...)` bindings for
value persistence and per-field `aria-invalid`, and the identical Turnstile widget.

Layout: each fieldset is a quiet card (the same chrome as the submit panel) whose
fields sit on a 12-column grid. The form stays a single column for flow; only
logically-related short fields share a row (city/state/ZIP, the phone pair,
policy/group numbers), and a short field alone on its row is width-matched rather
than stretched. Below 40rem every field is full width.

Every input's `name` (via the field's own `.as(...)` spread) matches
`registration/schema.ts`'s posted field names exactly, since that schema is what
actually validates the POST body server-side.

Age gate: once the athlete's date of birth computes 18 or older (a local `ageFromDob`
mirroring schema.ts's own `ageNow` rule, recomputed from the athleteDob input's live
value on every keystroke), the "Parent or guardian" fieldset disables and its fields'
`required` attributes drop, matching schema.ts's own age-gated re-requirement of those
same fields. Typed values are never cleared when the gate toggles, only the
enabled/required state.

Accessibility: the top-of-form validation summary (`role="alert"`) and the success
confirmation (`role="status"`) are both mounted from first render (empty until they
have something to say), so a screen reader's live-region watch is already attached
before either one gets content; each also carries `tabindex="-1"` so focus can move
there once a submission completes. Every field additionally carries its own adjacent
error text (`id="<field>-error"`, wired via `aria-describedby`), and the `.as(...)`
spread's own `aria-invalid` getter drives a border/outline change on the input itself
(see the `[aria-invalid='true']` rule below) so an error is never color-only, on top of
the text already being a second, independent channel.

A Turnstile token is single-use: once `siteverify` consumes it, a retry with the same
token always fails. Every failed submission (pending goes true then false with the
issue list non-empty) resets the widget, so a family that hits a transient failure
(a dropped record email, a spam-check miss) can retry without reloading the page.
-->
<script lang="ts">
  import type { RemoteFormField } from '@sveltejs/kit';
  import { registerCamp, registerTraining } from '$theme/registration.remote';
  import WaiverText from './WaiverText.svelte';
  // window.turnstile is declared ambiently in $theme/turnstile.d.ts.

  interface Props {
    variant: 'training' | 'camp';
  }
  const { variant }: Props = $props();

  /**
   * The field set both schemas share, hand-written rather than read off either schema's
   * inferred type. `campSchema`'s fields object is `{...sharedFields, ...campOnly}` (see
   * schema.ts), so it structurally carries every field below with the identical wrapper
   * type; the cast below just tells TypeScript what registration.remote.ts's own
   * `ParsedRegistrationFields` interface already asserts by hand for the same reason
   * (valibot's runtime-built `agree_<id>` keys defeat literal key inference either way).
   */
  interface SharedRegistrationFields {
    athleteFullName: RemoteFormField<string>;
    athleteDob: RemoteFormField<string>;
    parentName: RemoteFormField<string>;
    parentRelationship: RemoteFormField<string>;
    address: RemoteFormField<string>;
    city: RemoteFormField<string>;
    state: RemoteFormField<string>;
    zip: RemoteFormField<string>;
    homePhone: RemoteFormField<string>;
    cellPhone: RemoteFormField<string>;
    parentEmail: RemoteFormField<string>;
    athleteEmail: RemoteFormField<string>;
    athleteCell: RemoteFormField<string>;
    parentCrewlabInvite: RemoteFormField<boolean>;
    secondParentName: RemoteFormField<string>;
    secondParentEmail: RemoteFormField<string>;
    emergencyName: RemoteFormField<string>;
    emergencyRelationship: RemoteFormField<string>;
    emergencyPhone: RemoteFormField<string>;
    emergencyEmail: RemoteFormField<string>;
    insuranceProvider: RemoteFormField<string>;
    policyNumber: RemoteFormField<string>;
    groupNumber: RemoteFormField<string>;
    physicianName: RemoteFormField<string>;
    physicianPhone: RemoteFormField<string>;
    medications: RemoteFormField<string>;
    allergies: RemoteFormField<string>;
    conditions: RemoteFormField<string>;
    tetanus: RemoteFormField<string>;
    photoRelease: RemoteFormField<'grant' | 'deny'>;
    athleteSignature: RemoteFormField<string>;
    parentSignature: RemoteFormField<string>;
    parentConsent: RemoteFormField<boolean>;
    athleteConsent: RemoteFormField<boolean>;
  }

  const action = $derived(variant === 'camp' ? registerCamp : registerTraining);
  const fields = $derived(action.fields as unknown as SharedRegistrationFields);
  const issues = $derived(action.fields.allIssues() ?? []);

  // The "Parent or guardian" section disables and stops being required once the athlete is an
  // adult, mirroring schema.ts's own age-gated re-requirement of those same fields server-side.
  // `dobOverride` starts unset so the gate reflects a re-rendered field's own posted value
  // (`dobDefault`) until the family actually types in the date field, at which point the
  // oninput handler below takes over, the same pattern `carpoolOverride` uses above.
  let dobOverride = $state<string | undefined>(undefined);
  const dobDefault = $derived(fields.athleteDob.value() ?? '');

  /** Age in whole years today; mirrors schema.ts's own `ageNow`/`ageInYears` rule. An
   *  unparseable or missing dob computes NaN, and `NaN >= 18` is false, so a blank or bad date
   *  defaults to minor (the parent section stays required), the safe direction. */
  function ageFromDob(dobIso: string): number {
    const dob = new Date(dobIso);
    const now = new Date();
    let years = now.getUTCFullYear() - dob.getUTCFullYear();
    const monthDiff = now.getUTCMonth() - dob.getUTCMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dob.getUTCDate())) years -= 1;
    return years;
  }

  const athleteIsAdult = $derived(ageFromDob(dobOverride ?? dobDefault) >= 18);

  function handleDobInput(event: Event) {
    dobOverride = (event.target as HTMLInputElement).value;
  }

  // Carpool seats only show and only require a value once a family picks "can drive"; that
  // choice is knowable purely from the radio group itself, unlike the waiver's age-gated
  // signature rules, so tracking it client-side is in bounds per the task's own instruction.
  // `carpoolOverride` starts unset so the reveal reflects a re-rendered field's own posted
  // value (`carpoolDefault`, reactive over `variant`) until the family actually clicks a
  // radio, at which point the onchange handlers below set it directly.
  let carpoolOverride = $state<string | undefined>(undefined);
  const carpoolDefault = $derived(variant === 'camp' ? (registerCamp.fields.carpool.value() ?? '') : '');
  const carpoolChoice = $derived(carpoolOverride ?? carpoolDefault);

  /**
   * A carpool radio changed. Any choice besides "can drive" clears a previously-entered seat
   * count, so a family that picks "can drive", types a number, then switches to "needs a
   * ride" never submits a stale seat count for a field that is now hidden.
   */
  function handleCarpoolChange(choice: 'needs-ride' | 'can-drive' | 'self') {
    carpoolOverride = choice;
    if (choice !== 'can-drive') {
      registerCamp.fields.carpoolSeats.set(undefined);
    }
  }

  /**
   * The id of the control a validation issue names, so the error summary can link to it.
   * Field names double as input ids throughout the form; the waiver agreement checkboxes are
   * the one exception (posted as agree_<id>, labeled as agree-<id>). Form-level issues and the
   * Turnstile token (whose widget has no focusable control) return undefined and render as
   * plain text.
   */
  function issueTargetId(issue: { path?: Array<string | number> }): string | undefined {
    const key = issue.path?.[0];
    if (typeof key !== 'string' || key === '' || key === 'turnstileToken') return undefined;
    return key.startsWith('agree_') ? key.replace('agree_', 'agree-') : key;
  }

  /** Move focus to a summary link's field, GOV.UK error-summary style. */
  function focusIssueTarget(event: MouseEvent, id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    event.preventDefault();
    el.scrollIntoView({ block: 'center' });
    el.focus({ preventScroll: true });
  }

  let alertEl = $state<HTMLElement | undefined>();
  let successEl = $state<HTMLElement | undefined>();
  let wasPending = $state(false);

  // Move focus once a submission cycle finishes (pending goes from true to false), to
  // whichever of the two live regions now has something to say. Gating on that transition,
  // rather than on `issues.length` alone, keeps a field's own client-side revalidation while
  // typing from yanking focus back to the summary mid-correction. The same transition resets
  // the Turnstile widget on a failure, since its token is single-use and every retry with the
  // stale token would otherwise fail the spam check regardless of what was actually wrong.
  $effect(() => {
    const pending = !!action.pending;
    if (wasPending && !pending) {
      if (action.result?.success) {
        successEl?.focus();
      } else if (issues.length > 0) {
        alertEl?.focus();
        window.turnstile?.reset();
      }
    }
    wasPending = pending;
  });
</script>

{#snippet fieldError(id: string, field: { issues: () => { message: string }[] | undefined })}
  <p id="{id}-error" class="field-error">{field.issues()?.[0]?.message ?? ''}</p>
{/snippet}

<section id="register" class="registration-form">
  <div role="status" class="registration-success" bind:this={successEl} tabindex="-1" hidden={!action.result?.success}>
    {#if action.result?.success}
      <h2>{variant === 'camp' ? 'You are registered for camp.' : 'You are registered.'}</h2>
      {#if variant === 'camp'}
        <p>
          A copy of the signed record is on its way to your email. Details, including the exact site and
          address, go out to registered families before camp.
        </p>
      {:else}
        <p>A copy of the signed record is on its way to your email. See you at practice.</p>
      {/if}
      {#if action.result.parentCopySent === false}
        <p>
          We could not send your email copy; the registration itself went through. Reach us via the contact
          form for a copy.
        </p>
      {/if}
    {/if}
  </div>

  <div hidden={!!action.result?.success}>
    <h2>Register</h2>
    <p class="form-note">Fields marked * are required.</p>

    <form {...action} class="flex flex-col gap-m">
      <div role="alert" class="flex flex-col gap-s" bind:this={alertEl} tabindex="-1">
        {#each issues as issue}
          {@const target = issueTargetId(issue)}
          <p class="rounded-field border border-error bg-error/10 px-s py-xs text-step--1 text-error">
            {#if target}
              <a href="#{target}" class="issue-link" onclick={(event) => focusIssueTarget(event, target)}>
                {issue.message}
              </a>
            {:else}
              {issue.message}
            {/if}
          </p>
        {/each}
      </div>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Athlete</legend>

        <div class="field f-8">
          <label for="athleteFullName">Full name</label>
          <input
            id="athleteFullName"
            class="input w-full"
            autocomplete="name"
            required
            aria-describedby="athleteFullName-error"
            {...fields.athleteFullName.as('text')}
          />
          {@render fieldError('athleteFullName', fields.athleteFullName)}
        </div>

        <div class="field f-4">
          <label for="athleteDob">Date of birth</label>
          <input
            id="athleteDob"
            class="input w-full"
            required
            aria-describedby="athleteDob-error"
            {...fields.athleteDob.as('date')}
            oninput={handleDobInput}
          />
          {@render fieldError('athleteDob', fields.athleteDob)}
        </div>
      </fieldset>

      <fieldset class="fieldset" disabled={athleteIsAdult}>
        <legend class="fieldset-legend">Parent or guardian</legend>
        {#if athleteIsAdult}
          <p class="fieldset-help">The athlete is 18 or older, so this section isn't needed.</p>
        {/if}

        <div class="field f-6">
          <label for="parentName">Full name</label>
          <input
            id="parentName"
            class="input w-full"
            autocomplete="name"
            required={!athleteIsAdult}
            aria-describedby="parentName-error"
            {...fields.parentName.as('text')}
          />
          {@render fieldError('parentName', fields.parentName)}
        </div>

        <div class="field f-6">
          <label for="parentRelationship">Relationship to athlete</label>
          <input
            id="parentRelationship"
            class="input w-full"
            placeholder="Mother, father, guardian…"
            required={!athleteIsAdult}
            aria-describedby="parentRelationship-error"
            {...fields.parentRelationship.as('text')}
          />
          {@render fieldError('parentRelationship', fields.parentRelationship)}
        </div>

        <div class="field f-8">
          <label for="address">Home address</label>
          <input
            id="address"
            class="input w-full"
            autocomplete="street-address"
            required={!athleteIsAdult}
            aria-describedby="address-error"
            {...fields.address.as('text')}
          />
          {@render fieldError('address', fields.address)}
        </div>

        <div class="field f-6">
          <label for="city">City</label>
          <input
            id="city"
            class="input w-full"
            autocomplete="address-level2"
            required={!athleteIsAdult}
            aria-describedby="city-error"
            {...fields.city.as('text')}
          />
          {@render fieldError('city', fields.city)}
        </div>

        <div class="field f-3">
          <label for="state">State</label>
          <input
            id="state"
            class="input w-full"
            autocomplete="address-level1"
            required={!athleteIsAdult}
            aria-describedby="state-error"
            {...fields.state.as('text')}
          />
          {@render fieldError('state', fields.state)}
        </div>

        <div class="field f-3">
          <label for="zip">ZIP code</label>
          <input
            id="zip"
            class="input w-full"
            autocomplete="postal-code"
            inputmode="numeric"
            required={!athleteIsAdult}
            aria-describedby="zip-error"
            {...fields.zip.as('text')}
          />
          {@render fieldError('zip', fields.zip)}
        </div>

        <div class="field f-6">
          <label for="homePhone">Home phone (optional)</label>
          <input
            id="homePhone"
            type="tel"
            class="input w-full"
            autocomplete="home tel"
            aria-describedby="homePhone-error"
            {...fields.homePhone.as('text')}
          />
          {@render fieldError('homePhone', fields.homePhone)}
        </div>

        <div class="field f-6">
          <label for="cellPhone">Cell phone</label>
          <input
            id="cellPhone"
            type="tel"
            class="input w-full"
            autocomplete="mobile tel"
            required={!athleteIsAdult}
            aria-describedby="cellPhone-error"
            {...fields.cellPhone.as('text')}
          />
          {@render fieldError('cellPhone', fields.cellPhone)}
        </div>

        <div class="field f-6">
          <label for="parentEmail">Email</label>
          <input
            id="parentEmail"
            type="email"
            class="input w-full"
            autocomplete="email"
            required={!athleteIsAdult}
            aria-describedby="parentEmail-error"
            {...fields.parentEmail.as('text')}
          />
          {@render fieldError('parentEmail', fields.parentEmail)}
        </div>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">CrewLAB team app</legend>
        <!-- The at-least-one-contact requirement is cross-field, so neither input may carry
             `required` (a lie on either one alone); the instruction is carried instead by this
             paragraph, referenced from BOTH inputs' aria-describedby so it is announced on
             focus, not discovered at submit time. -->
        <p class="fieldset-help" id="crewlabAthleteHelp">
          Practice plans and schedule changes live in CrewLAB, our team app. Once your
          registration goes through, we send the athlete's invite by email or text. Give us at
          least one of the two.
        </p>

        <div class="field f-6">
          <label for="athleteEmail">Athlete email</label>
          <input
            id="athleteEmail"
            class="input w-full"
            autocomplete="email"
            aria-describedby="athleteEmail-error crewlabAthleteHelp"
            {...fields.athleteEmail.as('email')}
          />
          {@render fieldError('athleteEmail', fields.athleteEmail)}
        </div>

        <div class="field f-6">
          <label for="athleteCell">Athlete cell phone</label>
          <input
            id="athleteCell"
            class="input w-full"
            autocomplete="tel"
            aria-describedby="athleteCell-error crewlabAthleteHelp"
            {...fields.athleteCell.as('tel')}
          />
          {@render fieldError('athleteCell', fields.athleteCell)}
        </div>

        <label class="crewlab-consent" for="parentCrewlabInvite">
          <input
            id="parentCrewlabInvite"
            class="checkbox"
            aria-describedby="parentCrewlabInvite-error parentInviteHelp"
            {...fields.parentCrewlabInvite.as('checkbox')}
          />
          Send me a parent invite too
        </label>
        <p class="fieldset-help" id="parentInviteHelp">
          Parents confirm the connection to their athlete inside the app after the invite
          arrives.
        </p>
        {@render fieldError('parentCrewlabInvite', fields.parentCrewlabInvite)}

        <p class="fieldset-help" id="secondParentHelp">
          Another parent or guardian who should get their own invite? Optional.
        </p>

        <div class="field f-6">
          <label for="secondParentName">Second parent or guardian name</label>
          <input
            id="secondParentName"
            class="input w-full"
            autocomplete="name"
            aria-describedby="secondParentName-error secondParentHelp"
            {...fields.secondParentName.as('text')}
          />
          {@render fieldError('secondParentName', fields.secondParentName)}
        </div>

        <div class="field f-6">
          <label for="secondParentEmail">Second parent or guardian email</label>
          <input
            id="secondParentEmail"
            class="input w-full"
            autocomplete="email"
            aria-describedby="secondParentEmail-error secondParentHelp"
            {...fields.secondParentEmail.as('email')}
          />
          {@render fieldError('secondParentEmail', fields.secondParentEmail)}
        </div>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Emergency contact</legend>

        <div class="field f-6">
          <label for="emergencyName">Full name</label>
          <input
            id="emergencyName"
            class="input w-full"
            required
            aria-describedby="emergencyName-error"
            {...fields.emergencyName.as('text')}
          />
          {@render fieldError('emergencyName', fields.emergencyName)}
        </div>

        <div class="field f-6">
          <label for="emergencyRelationship">Relationship to athlete</label>
          <input
            id="emergencyRelationship"
            class="input w-full"
            required
            aria-describedby="emergencyRelationship-error"
            {...fields.emergencyRelationship.as('text')}
          />
          {@render fieldError('emergencyRelationship', fields.emergencyRelationship)}
        </div>

        <div class="field f-6">
          <label for="emergencyPhone">Phone</label>
          <input
            id="emergencyPhone"
            type="tel"
            class="input w-full"
            required
            aria-describedby="emergencyPhone-error"
            {...fields.emergencyPhone.as('text')}
          />
          {@render fieldError('emergencyPhone', fields.emergencyPhone)}
        </div>

        <div class="field f-6">
          <label for="emergencyEmail">Email (optional)</label>
          <input
            id="emergencyEmail"
            type="email"
            class="input w-full"
            aria-describedby="emergencyEmail-error"
            {...fields.emergencyEmail.as('text')}
          />
          {@render fieldError('emergencyEmail', fields.emergencyEmail)}
        </div>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Insurance & physician</legend>

        <div class="field f-6">
          <label for="insuranceProvider">Health insurance provider</label>
          <input
            id="insuranceProvider"
            class="input w-full"
            required
            aria-describedby="insuranceProvider-error"
            {...fields.insuranceProvider.as('text')}
          />
          {@render fieldError('insuranceProvider', fields.insuranceProvider)}
        </div>

        <div class="field f-3">
          <label for="policyNumber">Policy number</label>
          <input
            id="policyNumber"
            class="input w-full"
            required
            aria-describedby="policyNumber-error"
            {...fields.policyNumber.as('text')}
          />
          {@render fieldError('policyNumber', fields.policyNumber)}
        </div>

        <div class="field f-3">
          <label for="groupNumber">Group number (optional)</label>
          <input
            id="groupNumber"
            class="input w-full"
            aria-describedby="groupNumber-error"
            {...fields.groupNumber.as('text')}
          />
          {@render fieldError('groupNumber', fields.groupNumber)}
        </div>

        <div class="field f-6">
          <label for="physicianName">Physician name (optional)</label>
          <input
            id="physicianName"
            class="input w-full"
            aria-describedby="physicianName-error"
            {...fields.physicianName.as('text')}
          />
          {@render fieldError('physicianName', fields.physicianName)}
        </div>

        <div class="field f-6">
          <label for="physicianPhone">Physician phone (optional)</label>
          <input
            id="physicianPhone"
            type="tel"
            class="input w-full"
            aria-describedby="physicianPhone-error"
            {...fields.physicianPhone.as('text')}
          />
          {@render fieldError('physicianPhone', fields.physicianPhone)}
        </div>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Medical</legend>

        <div class="field f-4">
          <label for="medications">Current medications</label>
          <textarea
            id="medications"
            class="textarea w-full"
            rows="2"
            placeholder="None"
            required
            aria-describedby="medications-error"
            {...fields.medications.as('text')}
          ></textarea>
          {@render fieldError('medications', fields.medications)}
        </div>

        <div class="field f-4">
          <label for="allergies">Allergies</label>
          <textarea
            id="allergies"
            class="textarea w-full"
            rows="2"
            placeholder="None"
            required
            aria-describedby="allergies-error"
            {...fields.allergies.as('text')}
          ></textarea>
          {@render fieldError('allergies', fields.allergies)}
        </div>

        <div class="field f-4">
          <label for="conditions">Relevant medical conditions</label>
          <textarea
            id="conditions"
            class="textarea w-full"
            rows="2"
            placeholder="None"
            required
            aria-describedby="conditions-error"
            {...fields.conditions.as('text')}
          ></textarea>
          {@render fieldError('conditions', fields.conditions)}
        </div>

        <div class="field f-4">
          <label for="tetanus">Last tetanus shot (optional)</label>
          <input
            id="tetanus"
            class="input w-full"
            aria-describedby="tetanus-error"
            {...fields.tetanus.as('date')}
          />
          {@render fieldError('tetanus', fields.tetanus)}
        </div>
      </fieldset>

      {#if variant === 'camp'}
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Camp logistics</legend>

          <div class="field f-6">
            <label for="dietary">Dietary needs (optional)</label>
            <input
              id="dietary"
              class="input w-full"
              aria-describedby="dietary-error"
              {...registerCamp.fields.dietary.as('text')}
            />
            {@render fieldError('dietary', registerCamp.fields.dietary)}
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Carpool</legend>
            <label class="carpool-option" for="carpool-needs-ride">
              <input
                id="carpool-needs-ride"
                class="radio"
                required
                aria-describedby="carpool-error"
                {...registerCamp.fields.carpool.as('radio', 'needs-ride')}
                onchange={() => handleCarpoolChange('needs-ride')}
              />
              My athlete needs a ride
            </label>
            <label class="carpool-option" for="carpool-can-drive">
              <input
                id="carpool-can-drive"
                class="radio"
                required
                aria-describedby="carpool-error"
                {...registerCamp.fields.carpool.as('radio', 'can-drive')}
                onchange={() => handleCarpoolChange('can-drive')}
              />
              We can drive and have spare seats
            </label>
            <label class="carpool-option" for="carpool-self">
              <input
                id="carpool-self"
                class="radio"
                required
                aria-describedby="carpool-error"
                {...registerCamp.fields.carpool.as('radio', 'self')}
                onchange={() => handleCarpoolChange('self')}
              />
              We will drive ourselves
            </label>
            {@render fieldError('carpool', registerCamp.fields.carpool)}
          </fieldset>

          <!-- Always in the DOM (never an {#if}): a `hidden` field is barred from constraint
               validation, so this both reveals the input to a screen reader/test only when
               relevant AND drops it out of submission validation when it is not, with no risk
               of an invisible required field blocking a "needs a ride" or "driving ourselves"
               submission. -->
          <div class="field f-4" hidden={carpoolChoice !== 'can-drive'}>
            <label for="carpoolSeats">Spare seats available</label>
            <input
              id="carpoolSeats"
              min="0"
              max="8"
              class="input w-full"
              required={carpoolChoice === 'can-drive'}
              aria-describedby="carpoolSeats-error"
              {...registerCamp.fields.carpoolSeats.as('number')}
            />
            {@render fieldError('carpoolSeats', registerCamp.fields.carpoolSeats)}
          </div>

          <div class="field">
            <label for="gearNotes">Gear notes (optional)</label>
            <textarea
              id="gearNotes"
              class="textarea w-full"
              rows="2"
              aria-describedby="gearNotes-error"
              {...registerCamp.fields.gearNotes.as('text')}
            ></textarea>
            {@render fieldError('gearNotes', registerCamp.fields.gearNotes)}
          </div>
        </fieldset>
      {/if}

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Photo and media release</legend>
        <label class="release-option" for="photoRelease-grant">
          <input
            id="photoRelease-grant"
            class="radio"
            required
            aria-describedby="photoRelease-error"
            {...fields.photoRelease.as('radio', 'grant')}
          />
          I grant permission for photographs or video of the athlete taken during Program activities to be used
          in non-commercial group communications.
        </label>
        <label class="release-option" for="photoRelease-deny">
          <input
            id="photoRelease-deny"
            class="radio"
            required
            aria-describedby="photoRelease-error"
            {...fields.photoRelease.as('radio', 'deny')}
          />
          I do not grant permission for photographs or video of the athlete to be used or shared.
        </label>
        {@render fieldError('photoRelease', fields.photoRelease)}
      </fieldset>

      <WaiverText />

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Signatures</legend>
        <p class="signature-help">
          If the athlete is 18 or older, they sign for themselves and the parent signature is optional.
        </p>

        <div class="field f-6">
          <label for="athleteSignature">Athlete signature (type your full name)</label>
          <input
            id="athleteSignature"
            class="input w-full"
            required
            aria-describedby="athleteSignature-error"
            {...fields.athleteSignature.as('text')}
          />
          {@render fieldError('athleteSignature', fields.athleteSignature)}

          <label class="signature-consent" for="athleteConsent">
            <input
              id="athleteConsent"
              class="checkbox"
              required
              aria-describedby="athleteConsent-error"
              {...fields.athleteConsent.as('checkbox')}
            />
            I agree that typing my name here is my electronic signature.
          </label>
          {@render fieldError('athleteConsent', fields.athleteConsent)}
        </div>

        <div class="field f-6">
          <label for="parentSignature">Parent or guardian signature (type your full name)</label>
          <input
            id="parentSignature"
            class="input w-full"
            aria-describedby="parentSignature-error"
            {...fields.parentSignature.as('text')}
          />
          {@render fieldError('parentSignature', fields.parentSignature)}

          <label class="signature-consent" for="parentConsent">
            <input
              id="parentConsent"
              class="checkbox"
              aria-describedby="parentConsent-error"
              {...fields.parentConsent.as('checkbox')}
            />
            I agree that typing my name here is my electronic signature.
          </label>
          {@render fieldError('parentConsent', fields.parentConsent)}
        </div>
      </fieldset>

      <div class="registration-submit">
        <!-- `data-response-field-name` renames Turnstile's injected hidden field away from its
             default `cf-turnstile-response`: SvelteKit's remote-form client throws on any posted
             field name containing a hyphen (see schema.ts's `turnstileToken` comment), so the
             default name crashes every real submission before a request is ever sent. -->
        <div
          class="cf-turnstile"
          data-sitekey="0x4AAAAAADPWAhVwEJvGQqhh"
          data-response-field-name="turnstileToken"
        ></div>

        <button type="submit" class="btn btn-primary self-start" disabled={!!action.pending}>
          {#if action.pending}
            Submitting…
          {:else if variant === 'camp'}
            Submit camp registration
          {:else}
            Submit registration
          {/if}
        </button>
      </div>
    </form>

    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  </div>
</section>

<style>
  /* The form's own headings sit outside any .prose wrapper, so they restate the site's
     prose-h2 treatment; without this they render at plain body scale and read as a stray
     word rather than the section title. */
  .registration-form h2 {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: var(--text-step-3);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-tight);
    margin: 0 0 var(--spacing-m);
  }

  .registration-form :global(.fieldset-legend) {
    font-family: var(--font-display);
    font-size: var(--text-step--1);
    font-weight: 700;
    letter-spacing: var(--tracking-eyebrow);
    text-transform: uppercase;
    color: var(--color-muted);
  }

  /* Each field group is a quiet card on the same chrome as the submit and success panels,
     so the form reads as a composed sequence rather than loose fields. Inside, fields sit
     on a 12-column grid; the `.f-*` spans below place logically-related short fields on a
     shared row, and everything collapses to full width under 40rem. */
  .registration-form fieldset.fieldset {
    grid-template-columns: repeat(12, 1fr);
    gap: var(--spacing-s);
    background: var(--color-base-100);
    border: var(--border) solid var(--color-card-border);
    border-radius: var(--radius-box);
    padding: var(--spacing-m);
    padding-block-start: var(--spacing-xs);
    box-shadow: var(--cairn-shadow);
  }
  .registration-form fieldset.fieldset > * {
    grid-column: 1 / -1;
    margin: 0;
  }
  /* The nested carpool group stays flat: a card inside a card reads as double chrome. Its
     legend takes a subordinate cut (sentence case, one weight down) so it reads one level
     below its parent card's legend rather than as a sibling group. */
  .registration-form fieldset.fieldset fieldset.fieldset {
    background: none;
    border: none;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
    row-gap: var(--spacing-2xs);
  }
  .registration-form fieldset.fieldset fieldset.fieldset .fieldset-legend {
    text-transform: none;
    letter-spacing: normal;
    font-weight: 600;
  }
  @media (min-width: 40rem) {
    .registration-form fieldset.fieldset > .f-8 {
      grid-column: span 8;
    }
    .registration-form fieldset.fieldset > .f-6 {
      grid-column: span 6;
    }
    .registration-form fieldset.fieldset > .f-4 {
      grid-column: span 4;
    }
    .registration-form fieldset.fieldset > .f-3 {
      grid-column: span 3;
    }
  }

  /* Bottom-justified so a row's inputs stay aligned when one neighbor's label wraps to a
     second line (the label hugs its own input; slack collects above it). */
  .field {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  /* An author display beats the UA's [hidden] rule, so the carpool-seats reveal needs the
     hidden state restated. */
  .field[hidden] {
    display: none;
  }
  /* Labels read as controls, not prose: the display face at a hair under step--1 (a
     proportional cut off the token, so it rides the fluid scale) separates them from the
     body-face help text and option sentences around them. */
  .field > label {
    display: block;
    margin-block-end: var(--spacing-3xs);
    font-family: var(--font-display);
    font-size: calc(var(--text-step--1) * 0.92);
    font-weight: 600;
    color: var(--color-base-content);
  }

  .registration-form .carpool-option,
  .registration-form .release-option,
  .registration-form .signature-consent,
  .registration-form .crewlab-consent {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-xs);
    font-size: var(--text-step--1);
  }
  .field .signature-consent {
    margin-block-start: var(--spacing-2xs);
  }

  .signature-help,
  .fieldset-help,
  .form-note {
    font-size: var(--text-step--1);
    color: var(--color-muted);
  }
  .form-note {
    margin: 0 0 var(--spacing-s);
  }

  /* Required marking derives from the input's own required attribute, so an asterisk can
     never drift from what the schema actually enforces (the conditional carpool-seats field
     gains and loses its mark with its required state). Scoped to the first label so a
     signature block's consent checkbox label stays unmarked. */
  .field:has(> :is(input, textarea)[required]) > label:first-child::after {
    content: ' *';
    color: var(--color-muted);
  }

  /* Summary errors link to their fields (the GOV.UK error-summary pattern); error ink is
     inherited so the pill stays one color, the underline carries the affordance. */
  .issue-link {
    color: inherit;
    text-decoration: underline;
  }

  /* Form controls join the site's fireweed focus vocabulary (prose.css's own link ring is
     2px --color-primary); DaisyUI's default ring is base-content, a one-off gray here. */
  .registration-form :is(input, textarea):focus-visible {
    outline-color: var(--color-primary);
  }

  /* DaisyUI's .textarea floor (min-height: 5rem) defeats the rows attribute; releasing it
     lets the two-row medical and gear fields sit at their declared height. */
  .registration-form textarea.textarea {
    min-height: 0;
  }

  /* A field's error text is the primary, non-color-only signal; this border/outline change is
     a secondary reinforcement, driven by the same `aria-invalid` the `.as(...)` spread already
     sets, so no field needs its own conditional class. */
  .registration-form input[aria-invalid='true'],
  .registration-form textarea[aria-invalid='true'] {
    border-color: var(--color-error);
    outline: var(--border, 1px) solid var(--color-error);
    outline-offset: 1px;
  }

  .field-error {
    margin-top: var(--spacing-3xs);
    font-size: var(--text-step--1);
    color: var(--color-error);
  }
  .field-error:empty {
    display: none;
  }

  /* The `role="alert"` summary is always mounted (see the @component note above), but with no
     issues it holds only Svelte's own each-block anchor comments; `:empty` still matches (per
     the CSS spec, comment nodes don't count), so this keeps a clean submission from showing a
     blank gap where the summary would otherwise reserve flex spacing for nothing. */
  .registration-form [role='alert']:empty {
    display: none;
  }

  .registration-submit {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-s);
    background: var(--color-base-100);
    border: var(--border) solid var(--color-card-border);
    border-radius: var(--radius-box);
    padding: var(--spacing-m);
    box-shadow: var(--cairn-shadow);
    /* The Turnstile iframe is a fixed 300px that cannot shrink; under ~350px viewports it
       scrolls inside this card rather than scrolling the whole page sideways. */
    overflow-x: auto;
  }

  .registration-success {
    background: var(--color-base-100);
    border: var(--border) solid var(--color-card-border);
    border-radius: var(--radius-box);
    padding: var(--spacing-m);
    box-shadow: var(--cairn-shadow);
  }
</style>
