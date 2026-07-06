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
    to you. The liability waiver works a little differently: you sign it in CrewLAB, so if your
    question is about the waiver, you'll find what you need there.
  </p>
  <ContactForm />
</section>
