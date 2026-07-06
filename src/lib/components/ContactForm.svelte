<script lang="ts">
  import { sendMessage } from '$lib/contact.remote';

  const { name, email, message } = sendMessage.fields;
</script>

<section id="contact" class="contact-section">
  {#if sendMessage.result?.success}
    <p class="form-success">Message sent — I'll get back to you soon.</p>
  {:else}
    <form {...sendMessage} class="contact-form">
      {#each sendMessage.fields.allIssues() as issue}
        <p class="form-error">{issue.message}</p>
      {/each}

      <div class="field">
        <label class="post-date" for="name">Name</label>
        <input
          id="name"
          class="field-input"
          autocomplete="name"
          required
          {...name.as('text')}
        />
      </div>

      <div class="field">
        <label class="post-date" for="email">Email</label>
        <input
          id="email"
          class="field-input"
          autocomplete="email"
          required
          {...email.as('email')}
        />
      </div>

      <div class="field">
        <label class="post-date" for="message">Message</label>
        <textarea
          id="message"
          class="field-input field-textarea"
          required
          {...message.as('text')}
        ></textarea>
      </div>

      <div
        class="cf-turnstile"
        data-sitekey="0x4AAAAAADPWAhVwEJvGQqhh"
      ></div>

      <button type="submit" class="btn btn-primary" disabled={!!sendMessage.pending}>
        {sendMessage.pending ? 'Sending…' : 'Send message'}
      </button>
    </form>

    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  {/if}
</section>

<style>
  .contact-section {
    margin-block-start: 0;
  }

  .contact-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-width: 34rem;
  }

  .contact-form .btn {
    align-self: flex-start;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .field-input {
    font-family: inherit;
    font-size: 0.975rem;
    color: var(--color-heading);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 3px;
    padding: 0.55rem 0.75rem;
    width: 100%;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    outline: none;
  }

  .field-input:focus {
    border-color: var(--color-muted);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }

  .field-textarea {
    resize: vertical;
    min-height: 8rem;
    line-height: 1.55;
  }

  .form-success {
    font-style: italic;
    color: var(--color-success);
    font-size: 0.975rem;
  }

  .form-error {
    font-size: 0.875rem;
    color: var(--color-error);
    padding: 0.6rem 0.75rem;
    background: var(--color-error-bg);
    border: 1px solid var(--color-error-border);
    border-radius: 3px;
  }
</style>
