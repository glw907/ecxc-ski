<!-- @component ECXC's contact page: a short intro plus the contact form. -->
<script lang="ts">
  import { siteConfig } from '$theme/cairn.config';
  import ContactForm from '$theme/components/ContactForm.svelte';
</script>

<svelte:head>
  <title>Contact — {siteConfig.siteName}</title>
  <meta name="description" content="Get in touch with an ECXC coach." />
</svelte:head>

<section class="pb-xl pt-l">
  <h1 class="m-0 mb-s font-display text-step-5 font-semibold leading-tight tracking-tight">Contact</h1>
  <p class="m-0 mb-l max-w-measure-wide text-step-0 leading-snug text-muted">
    Questions about joining, donations, or volunteering? Send them here and a coach will get back
    to you. The liability waiver is signed as part of registration, on the <a
      href="/training"
      class="inline-link">training</a
    >
    and <a href="/talkeetna" class="inline-link">camp</a> pages, so if your question is about the
    waiver, start there.
  </p>
  <ContactForm />
</section>

<style>
  /* This paragraph sits outside `.prose`, so it does not inherit ecxc-theme.css's
     `.prose a:not([class]):not([href^='#'])` body-link treatment; these two inline links get
     their own copy of that same fireweed color and underline-reveal hover, the site's one-token
     hover vocabulary. */
  .inline-link {
    color: var(--color-primary);
    text-decoration-line: underline;
    text-decoration-color: transparent;
    transition: text-decoration-color var(--cairn-hover-transition);
  }
  .inline-link:hover {
    text-decoration-color: currentColor;
  }
</style>
