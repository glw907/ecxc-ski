<!-- @component
ECXC's contact form: posts through the `sendMessage` remote function (contact.remote.ts), on
the same form vocabulary as `RegistrationForm.svelte`: one quiet card, a 12-column field grid
(name and email share a row), display-face labels wired to their inputs, derived required
asterisks, and per-field error text alongside the `role="alert"` summary. The Turnstile
widget's site key is public by design (it ships inside the served HTML, unlike the paired
secret key, which stays a Worker secret), so it is a plain literal here, the same site key the
pre-rebuild site already registered with Cloudflare, not an env read.

A Turnstile token is single-use: once `siteverify` consumes it, a retry with the same token
always fails. Every failed submission (pending goes true then false with the issue list
non-empty) resets the widget, matching RegistrationForm.svelte's own rule, so a sender who
hits a transient failure can retry without reloading the page. -->
<script lang="ts">
  import { sendMessage } from '$theme/contact.remote';
  // window.turnstile is declared ambiently in $theme/turnstile.d.ts.

  const { name, email, message } = sendMessage.fields;
  const issues = $derived(sendMessage.fields.allIssues() ?? []);

  // Track the pending -> not-pending transition (not `issues.length` alone) so the widget
  // resets once per failed submission, not on every reactive re-check of the issue list.
  let wasPending = $state(false);
  $effect(() => {
    const pending = !!sendMessage.pending;
    if (wasPending && !pending && issues.length > 0) {
      window.turnstile?.reset();
    }
    wasPending = pending;
  });
</script>

{#snippet fieldError(id: string, field: { issues: () => { message: string }[] | undefined })}
  <p id="{id}-error" class="field-error">{field.issues()?.[0]?.message ?? ''}</p>
{/snippet}

<section class="contact-form">
  {#if sendMessage.result?.success}
    <p class="text-success">Message sent. I'll get back to you soon.</p>
  {:else}
    <p class="form-note">Fields marked * are required.</p>
    <form {...sendMessage} class="flex max-w-measure-wide flex-col gap-m">
      <div role="alert" class="flex flex-col gap-s">
        {#each issues as issue}
          <p class="rounded-field border border-error bg-error/10 px-s py-xs text-step--1 text-error">
            {issue.message}
          </p>
        {/each}
      </div>

      <fieldset class="fieldset">
        <div class="field f-6">
          <label for="contact-name">Name</label>
          <input
            id="contact-name"
            class="input w-full"
            autocomplete="name"
            required
            aria-describedby="contact-name-error"
            {...name.as('text')}
          />
          {@render fieldError('contact-name', name)}
        </div>

        <div class="field f-6">
          <label for="contact-email">Email</label>
          <input
            id="contact-email"
            class="input w-full"
            autocomplete="email"
            required
            aria-describedby="contact-email-error"
            {...email.as('email')}
          />
          {@render fieldError('contact-email', email)}
        </div>

        <div class="field">
          <label for="contact-message">Message</label>
          <textarea
            id="contact-message"
            class="textarea h-32 w-full"
            required
            aria-describedby="contact-message-error"
            {...message.as('text')}
          ></textarea>
          {@render fieldError('contact-message', message)}
        </div>

        <!-- `data-response-field-name` renames Turnstile's injected hidden field away from its
             default `cf-turnstile-response`, which crashes SvelteKit's remote-form client on
             every real submission (a hyphenated field name fails its identifier-path parser
             before any request is sent); see registration/schema.ts's `turnstileToken`. -->
        <div
          class="cf-turnstile"
          data-sitekey="0x4AAAAAADPWAhVwEJvGQqhh"
          data-response-field-name="turnstileToken"
        ></div>

        <button type="submit" class="btn btn-primary self-start" disabled={!!sendMessage.pending}>
          {sendMessage.pending ? 'Sending…' : 'Send message'}
        </button>
      </fieldset>
    </form>

    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  {/if}
</section>

<style>
  /* The registration form's vocabulary, restated at contact scale (three fields, one card
     carrying the whole flow including submit). If a third form appears, extract the shared
     recipe instead of copying it again. */
  .contact-form fieldset.fieldset {
    grid-template-columns: repeat(12, 1fr);
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
  .contact-form fieldset.fieldset > * {
    grid-column: 1 / -1;
    margin: 0;
  }
  /* Grid items stretch on the inline axis; the submit button keeps its natural width,
     matching the registration form's own. */
  .contact-form fieldset.fieldset > .btn {
    justify-self: start;
  }
  @media (min-width: 40rem) {
    .contact-form fieldset.fieldset > .f-6 {
      grid-column: span 6;
    }
  }

  .field > label {
    display: block;
    margin-block-end: var(--spacing-3xs);
    font-family: var(--font-display);
    font-size: calc(var(--text-step--1) * 0.92);
    font-weight: 600;
    color: var(--color-base-content);
  }

  .form-note {
    margin: 0 0 var(--spacing-s);
    font-size: var(--text-step--1);
    color: var(--color-muted);
  }

  .field:has(> :is(input, textarea)[required]) > label:first-child::after {
    content: ' *';
    color: var(--color-muted);
  }

  .contact-form input[aria-invalid='true'],
  .contact-form textarea[aria-invalid='true'] {
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

  .contact-form [role='alert']:empty {
    display: none;
  }

  .contact-form :is(input, textarea):focus-visible {
    outline-color: var(--color-primary);
  }
</style>
