<!-- @component
ECXC's contact form: posts through the `sendMessage` remote function (contact.remote.ts), styled
on the Waymark token layer with DaisyUI's default-bordered inputs (no `-bordered` modifier; v5
removed it) and a `<fieldset>` grouping the three fields. The Turnstile widget's site key is public
by design (it ships inside the served HTML, unlike the paired secret key, which stays a Worker
secret), so it is a plain literal here, the same site key the pre-rebuild site already registered
with Cloudflare, not an env read. -->
<script lang="ts">
  import { sendMessage } from '$lib/contact.remote';

  const { name, email, message } = sendMessage.fields;
</script>

<section class="contact-form">
  {#if sendMessage.result?.success}
    <p class="text-success">Message sent. I'll get back to you soon.</p>
  {:else}
    <form {...sendMessage} class="flex max-w-measure-wide flex-col gap-m">
      {#each sendMessage.fields.allIssues() as issue}
        <p class="rounded-field border border-error bg-error/10 px-s py-xs text-step--1 text-error">
          {issue.message}
        </p>
      {/each}

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Name</legend>
        <input class="input w-full" autocomplete="name" required {...name.as('text')} />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Email</legend>
        <input class="input w-full" autocomplete="email" required {...email.as('email')} />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Message</legend>
        <textarea class="textarea h-32 w-full" required {...message.as('text')}></textarea>
      </fieldset>

      <div class="cf-turnstile" data-sitekey="0x4AAAAAADPWAhVwEJvGQqhh"></div>

      <button type="submit" class="btn btn-primary self-start" disabled={!!sendMessage.pending}>
        {sendMessage.pending ? 'Sending…' : 'Send message'}
      </button>
    </form>

    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  {/if}
</section>
