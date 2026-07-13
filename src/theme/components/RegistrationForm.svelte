<!-- @component
The Training and Talkeetna Camp registration form, sharing one waiver
(`WaiverText.svelte`) and one field layout, posted through `registerTraining` or
`registerCamp` (`registration.remote.ts`) depending on `variant`. Styled on the same
Waymark token layer as `ContactForm.svelte`: DaisyUI's default-bordered inputs, a
`<fieldset>`/`<legend>` per logical group, the fields' own `.as(...)` bindings for
value persistence and per-field `aria-invalid`, and the identical Turnstile widget.

Every input's `name` (via the field's own `.as(...)` spread) matches
`registration/schema.ts`'s posted field names exactly, since that schema is what
actually validates the POST body server-side.

Accessibility: the top-of-form validation summary (`role="alert"`) and the success
confirmation (`role="status"`) are both mounted from first render (empty until they
have something to say), so a screen reader's live-region watch is already attached
before either one gets content; each also carries `tabindex="-1"` so focus can move
there once a submission completes. Every field additionally carries its own adjacent
error text (`id="<field>-error"`, wired via `aria-describedby`), and the `.as(...)`
spread's own `aria-invalid` getter drives a border/outline change on the input itself
(see the `[aria-invalid='true']` rule below) so an error is never color-only, on top of
the text already being a second, independent channel.
-->
<script lang="ts">
  import type { RemoteFormField } from '@sveltejs/kit';
  import { registerCamp, registerTraining } from '$theme/registration.remote';
  import WaiverText from './WaiverText.svelte';

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

  let alertEl = $state<HTMLElement | undefined>();
  let successEl = $state<HTMLElement | undefined>();
  let wasPending = $state(false);

  // Move focus once a submission cycle finishes (pending goes from true to false), to
  // whichever of the two live regions now has something to say. Gating on that transition,
  // rather than on `issues.length` alone, keeps a field's own client-side revalidation while
  // typing from yanking focus back to the summary mid-correction.
  $effect(() => {
    const pending = !!action.pending;
    if (wasPending && !pending) {
      if (action.result?.success) {
        successEl?.focus();
      } else if (issues.length > 0) {
        alertEl?.focus();
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

    <form {...action} class="flex flex-col gap-l">
      <div role="alert" class="flex flex-col gap-s" bind:this={alertEl} tabindex="-1">
        {#each issues as issue}
          <p class="rounded-field border border-error bg-error/10 px-s py-xs text-step--1 text-error">
            {issue.message}
          </p>
        {/each}
      </div>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Athlete</legend>

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

        <label for="athleteDob">Date of birth</label>
        <input
          id="athleteDob"
          class="input w-full"
          required
          aria-describedby="athleteDob-error"
          {...fields.athleteDob.as('date')}
        />
        {@render fieldError('athleteDob', fields.athleteDob)}
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Parent or guardian</legend>

        <label for="parentName">Full name</label>
        <input
          id="parentName"
          class="input w-full"
          autocomplete="name"
          required
          aria-describedby="parentName-error"
          {...fields.parentName.as('text')}
        />
        {@render fieldError('parentName', fields.parentName)}

        <label for="parentRelationship">Relationship to athlete</label>
        <input
          id="parentRelationship"
          class="input w-full"
          placeholder="Mother, father, guardian…"
          required
          aria-describedby="parentRelationship-error"
          {...fields.parentRelationship.as('text')}
        />
        {@render fieldError('parentRelationship', fields.parentRelationship)}

        <label for="address">Home address</label>
        <input
          id="address"
          class="input w-full"
          autocomplete="street-address"
          required
          aria-describedby="address-error"
          {...fields.address.as('text')}
        />
        {@render fieldError('address', fields.address)}

        <label for="city">City</label>
        <input
          id="city"
          class="input w-full"
          autocomplete="address-level2"
          required
          aria-describedby="city-error"
          {...fields.city.as('text')}
        />
        {@render fieldError('city', fields.city)}

        <label for="state">State</label>
        <input
          id="state"
          class="input w-full"
          autocomplete="address-level1"
          required
          aria-describedby="state-error"
          {...fields.state.as('text')}
        />
        {@render fieldError('state', fields.state)}

        <label for="zip">ZIP code</label>
        <input
          id="zip"
          class="input w-full"
          autocomplete="postal-code"
          required
          aria-describedby="zip-error"
          {...fields.zip.as('text')}
        />
        {@render fieldError('zip', fields.zip)}

        <label for="homePhone">Home phone (optional)</label>
        <input
          id="homePhone"
          type="tel"
          class="input w-full"
          autocomplete="tel"
          aria-describedby="homePhone-error"
          {...fields.homePhone.as('text')}
        />
        {@render fieldError('homePhone', fields.homePhone)}

        <label for="cellPhone">Cell phone</label>
        <input
          id="cellPhone"
          type="tel"
          class="input w-full"
          autocomplete="tel"
          required
          aria-describedby="cellPhone-error"
          {...fields.cellPhone.as('text')}
        />
        {@render fieldError('cellPhone', fields.cellPhone)}

        <label for="parentEmail">Email</label>
        <input
          id="parentEmail"
          type="email"
          class="input w-full"
          autocomplete="email"
          required
          aria-describedby="parentEmail-error"
          {...fields.parentEmail.as('text')}
        />
        {@render fieldError('parentEmail', fields.parentEmail)}
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Emergency contact</legend>

        <label for="emergencyName">Full name</label>
        <input
          id="emergencyName"
          class="input w-full"
          required
          aria-describedby="emergencyName-error"
          {...fields.emergencyName.as('text')}
        />
        {@render fieldError('emergencyName', fields.emergencyName)}

        <label for="emergencyRelationship">Relationship to athlete</label>
        <input
          id="emergencyRelationship"
          class="input w-full"
          required
          aria-describedby="emergencyRelationship-error"
          {...fields.emergencyRelationship.as('text')}
        />
        {@render fieldError('emergencyRelationship', fields.emergencyRelationship)}

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

        <label for="emergencyEmail">Email (optional)</label>
        <input
          id="emergencyEmail"
          type="email"
          class="input w-full"
          aria-describedby="emergencyEmail-error"
          {...fields.emergencyEmail.as('text')}
        />
        {@render fieldError('emergencyEmail', fields.emergencyEmail)}
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Insurance & physician</legend>

        <label for="insuranceProvider">Health insurance provider</label>
        <input
          id="insuranceProvider"
          class="input w-full"
          required
          aria-describedby="insuranceProvider-error"
          {...fields.insuranceProvider.as('text')}
        />
        {@render fieldError('insuranceProvider', fields.insuranceProvider)}

        <label for="policyNumber">Policy number</label>
        <input
          id="policyNumber"
          class="input w-full"
          required
          aria-describedby="policyNumber-error"
          {...fields.policyNumber.as('text')}
        />
        {@render fieldError('policyNumber', fields.policyNumber)}

        <label for="groupNumber">Group number (optional)</label>
        <input
          id="groupNumber"
          class="input w-full"
          aria-describedby="groupNumber-error"
          {...fields.groupNumber.as('text')}
        />
        {@render fieldError('groupNumber', fields.groupNumber)}

        <label for="physicianName">Physician name (optional)</label>
        <input
          id="physicianName"
          class="input w-full"
          aria-describedby="physicianName-error"
          {...fields.physicianName.as('text')}
        />
        {@render fieldError('physicianName', fields.physicianName)}

        <label for="physicianPhone">Physician phone (optional)</label>
        <input
          id="physicianPhone"
          type="tel"
          class="input w-full"
          aria-describedby="physicianPhone-error"
          {...fields.physicianPhone.as('text')}
        />
        {@render fieldError('physicianPhone', fields.physicianPhone)}
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Medical</legend>

        <label for="medications">Current medications</label>
        <textarea
          id="medications"
          class="textarea w-full"
          placeholder="None"
          required
          aria-describedby="medications-error"
          {...fields.medications.as('text')}
        ></textarea>
        {@render fieldError('medications', fields.medications)}

        <label for="allergies">Allergies</label>
        <textarea
          id="allergies"
          class="textarea w-full"
          placeholder="None"
          required
          aria-describedby="allergies-error"
          {...fields.allergies.as('text')}
        ></textarea>
        {@render fieldError('allergies', fields.allergies)}

        <label for="conditions">Relevant medical conditions</label>
        <textarea
          id="conditions"
          class="textarea w-full"
          placeholder="None"
          required
          aria-describedby="conditions-error"
          {...fields.conditions.as('text')}
        ></textarea>
        {@render fieldError('conditions', fields.conditions)}

        <label for="tetanus">Last tetanus shot (optional)</label>
        <input
          id="tetanus"
          class="input w-full"
          aria-describedby="tetanus-error"
          {...fields.tetanus.as('date')}
        />
        {@render fieldError('tetanus', fields.tetanus)}
      </fieldset>

      {#if variant === 'camp'}
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Camp logistics</legend>

          <label for="dietary">Dietary needs (optional)</label>
          <input
            id="dietary"
            class="input w-full"
            aria-describedby="dietary-error"
            {...registerCamp.fields.dietary.as('text')}
          />
          {@render fieldError('dietary', registerCamp.fields.dietary)}

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
          <div class="carpool-seats" hidden={carpoolChoice !== 'can-drive'}>
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

          <label for="gearNotes">Gear notes (optional)</label>
          <textarea
            id="gearNotes"
            class="textarea w-full"
            aria-describedby="gearNotes-error"
            {...registerCamp.fields.gearNotes.as('text')}
          ></textarea>
          {@render fieldError('gearNotes', registerCamp.fields.gearNotes)}
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
  .registration-form :global(.fieldset-legend) {
    font-family: var(--font-display);
    font-size: var(--text-step--1);
    font-weight: 700;
    letter-spacing: var(--tracking-eyebrow);
    text-transform: uppercase;
    color: var(--color-muted);
  }

  .registration-form label:not(.carpool-option):not(.release-option):not(.signature-consent) {
    display: block;
    margin-top: var(--spacing-s);
    font-size: var(--text-step--1);
    color: var(--color-base-content);
  }

  .carpool-option,
  .release-option,
  .signature-consent {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-s);
    font-size: var(--text-step--1);
  }

  .signature-help {
    font-size: var(--text-step--1);
    color: var(--color-muted);
    margin: 0 0 var(--spacing-s);
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
     blank gap where the summary would otherwise reserve `gap-l` flex spacing for nothing. */
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
  }

  .registration-success {
    background: var(--color-base-100);
    border: var(--border) solid var(--color-card-border);
    border-radius: var(--radius-box);
    padding: var(--spacing-m);
    box-shadow: var(--cairn-shadow);
  }
</style>
