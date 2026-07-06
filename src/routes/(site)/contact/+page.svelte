<script lang="ts">
  import { SITE_TITLE } from '$lib/config';
  import ContactForm from '$lib/components/ContactForm.svelte';
  import { riseStyle } from '$lib/motion';
</script>

<svelte:head>
  <title>Contact — {SITE_TITLE}</title>
</svelte:head>

<div class="contact-page">
  <h1 class="page-title">Contact</h1>
  <p class="contact-intro">
    Questions about joining, donations, or volunteering? Send them here and a
    coach will get back to you. The liability waiver works a little
    differently. You sign it in CrewLAB, so if your question is about the waiver,
    you will find what you need there.
  </p>
  <div class="contact-module" style={riseStyle(0)}>
    <ContactForm />
  </div>
</div>

<style>
  .contact-page {
    animation: page-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .contact-intro {
    font-size: 1rem;
    line-height: 1.6;
    color: var(--color-body);
    max-width: 42rem;
    margin-block: 0 1.5rem;
  }
  .contact-module {
    animation: module-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--rise, 0s);
  }
  @media (prefers-reduced-motion: reduce) {
    .contact-page,
    .contact-module {
      animation: none;
    }
  }
</style>
