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
   * (valibot's runtime-built `agree-<id>` keys defeat literal key inference either way).
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

  // Carpool seats only show and only require a value once a family picks "can drive"; that
  // choice is knowable purely from the radio group itself, unlike the waiver's age-gated
  // signature rules, so tracking it client-side is in bounds per the task's own instruction.
  // `carpoolOverride` starts unset so the reveal reflects a re-rendered field's own posted
  // value (`carpoolDefault`, reactive over `variant`) until the family actually clicks a
  // radio, at which point the onchange handlers below set it directly.
  let carpoolOverride = $state<string | undefined>(undefined);
  const carpoolDefault = $derived(variant === 'camp' ? (registerCamp.fields.carpool.value() ?? '') : '');
  const carpoolChoice = $derived(carpoolOverride ?? carpoolDefault);
</script>

<section id="register" class="registration-form">
  {#if action.result?.success}
    <div class="registration-success">
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
    </div>
  {:else}
    <form {...action} class="flex flex-col gap-l">
      {#each action.fields.allIssues() ?? [] as issue}
        <p class="rounded-field border border-error bg-error/10 px-s py-xs text-step--1 text-error">
          {issue.message}
        </p>
      {/each}

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Athlete</legend>

        <label for="athleteFullName">Full name</label>
        <input id="athleteFullName" class="input w-full" autocomplete="name" required {...fields.athleteFullName.as('text')} />

        <label for="athleteDob">Date of birth</label>
        <input id="athleteDob" class="input w-full" required {...fields.athleteDob.as('date')} />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Parent or guardian</legend>

        <label for="parentName">Full name</label>
        <input id="parentName" class="input w-full" autocomplete="name" required {...fields.parentName.as('text')} />

        <label for="parentRelationship">Relationship to athlete</label>
        <input
          id="parentRelationship"
          class="input w-full"
          placeholder="Mother, father, guardian…"
          required
          {...fields.parentRelationship.as('text')}
        />

        <label for="address">Home address</label>
        <input id="address" class="input w-full" autocomplete="street-address" required {...fields.address.as('text')} />

        <label for="city">City</label>
        <input id="city" class="input w-full" autocomplete="address-level2" required {...fields.city.as('text')} />

        <label for="state">State</label>
        <input id="state" class="input w-full" autocomplete="address-level1" required {...fields.state.as('text')} />

        <label for="zip">ZIP code</label>
        <input id="zip" class="input w-full" autocomplete="postal-code" required {...fields.zip.as('text')} />

        <label for="homePhone">Home phone (optional)</label>
        <input id="homePhone" type="tel" class="input w-full" autocomplete="tel" {...fields.homePhone.as('text')} />

        <label for="cellPhone">Cell phone</label>
        <input id="cellPhone" type="tel" class="input w-full" autocomplete="tel" required {...fields.cellPhone.as('text')} />

        <label for="parentEmail">Email</label>
        <input
          id="parentEmail"
          type="email"
          class="input w-full"
          autocomplete="email"
          required
          {...fields.parentEmail.as('text')}
        />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Emergency contact</legend>

        <label for="emergencyName">Full name</label>
        <input id="emergencyName" class="input w-full" required {...fields.emergencyName.as('text')} />

        <label for="emergencyRelationship">Relationship to athlete</label>
        <input id="emergencyRelationship" class="input w-full" required {...fields.emergencyRelationship.as('text')} />

        <label for="emergencyPhone">Phone</label>
        <input id="emergencyPhone" type="tel" class="input w-full" required {...fields.emergencyPhone.as('text')} />

        <label for="emergencyEmail">Email (optional)</label>
        <input id="emergencyEmail" type="email" class="input w-full" {...fields.emergencyEmail.as('text')} />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Insurance & physician</legend>

        <label for="insuranceProvider">Health insurance provider</label>
        <input id="insuranceProvider" class="input w-full" required {...fields.insuranceProvider.as('text')} />

        <label for="policyNumber">Policy number</label>
        <input id="policyNumber" class="input w-full" required {...fields.policyNumber.as('text')} />

        <label for="groupNumber">Group number (optional)</label>
        <input id="groupNumber" class="input w-full" {...fields.groupNumber.as('text')} />

        <label for="physicianName">Physician name (optional)</label>
        <input id="physicianName" class="input w-full" {...fields.physicianName.as('text')} />

        <label for="physicianPhone">Physician phone (optional)</label>
        <input id="physicianPhone" type="tel" class="input w-full" {...fields.physicianPhone.as('text')} />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Medical</legend>

        <label for="medications">Current medications</label>
        <textarea id="medications" class="textarea w-full" placeholder="None" required {...fields.medications.as('text')}
        ></textarea>

        <label for="allergies">Allergies</label>
        <textarea id="allergies" class="textarea w-full" placeholder="None" required {...fields.allergies.as('text')}
        ></textarea>

        <label for="conditions">Relevant medical conditions</label>
        <textarea id="conditions" class="textarea w-full" placeholder="None" required {...fields.conditions.as('text')}
        ></textarea>

        <label for="tetanus">Last tetanus shot (optional)</label>
        <input id="tetanus" class="input w-full" {...fields.tetanus.as('date')} />
      </fieldset>

      {#if variant === 'camp'}
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Camp logistics</legend>

          <label for="dietary">Dietary needs (optional)</label>
          <input id="dietary" class="input w-full" {...registerCamp.fields.dietary.as('text')} />

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Carpool</legend>
            <label class="carpool-option" for="carpool-needs-ride">
              <input
                id="carpool-needs-ride"
                class="radio"
                required
                {...registerCamp.fields.carpool.as('radio', 'needs-ride')}
                onchange={() => (carpoolOverride = 'needs-ride')}
              />
              My athlete needs a ride
            </label>
            <label class="carpool-option" for="carpool-can-drive">
              <input
                id="carpool-can-drive"
                class="radio"
                required
                {...registerCamp.fields.carpool.as('radio', 'can-drive')}
                onchange={() => (carpoolOverride = 'can-drive')}
              />
              We can drive and have spare seats
            </label>
            <label class="carpool-option" for="carpool-self">
              <input
                id="carpool-self"
                class="radio"
                required
                {...registerCamp.fields.carpool.as('radio', 'self')}
                onchange={() => (carpoolOverride = 'self')}
              />
              We will drive ourselves
            </label>
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
              {...registerCamp.fields.carpoolSeats.as('number')}
            />
          </div>

          <label for="gearNotes">Gear notes (optional)</label>
          <textarea id="gearNotes" class="textarea w-full" {...registerCamp.fields.gearNotes.as('text')}></textarea>
        </fieldset>
      {/if}

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Photo and media release</legend>
        <label class="release-option" for="photoRelease-grant">
          <input
            id="photoRelease-grant"
            class="radio"
            required
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
            {...fields.photoRelease.as('radio', 'deny')}
          />
          I do not grant permission for photographs or video of the athlete to be used or shared.
        </label>
      </fieldset>

      <WaiverText />

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Signatures</legend>
        <p class="signature-help">
          If the athlete is 18 or older, they sign for themselves and the parent signature is optional.
        </p>

        <label for="athleteSignature">Athlete signature (type your full name)</label>
        <input id="athleteSignature" class="input w-full" {...fields.athleteSignature.as('text')} />

        <label class="signature-consent" for="athleteConsent">
          <input id="athleteConsent" class="checkbox" required {...fields.athleteConsent.as('checkbox')} />
          I agree that typing my name here is my electronic signature.
        </label>

        <label for="parentSignature">Parent or guardian signature (type your full name)</label>
        <input id="parentSignature" class="input w-full" {...fields.parentSignature.as('text')} />

        <label class="signature-consent" for="parentConsent">
          <input id="parentConsent" class="checkbox" {...fields.parentConsent.as('checkbox')} />
          I agree that typing my name here is my electronic signature.
        </label>
      </fieldset>

      <div class="registration-submit">
        <div class="cf-turnstile" data-sitekey="0x4AAAAAADPWAhVwEJvGQqhh"></div>

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
  {/if}
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
