<!-- @component
Renders the site's waiver (waiver/waiver.ts's `WAIVER_SECTIONS`) inline, in full: no scroll
trap, no accordion, since a family reads or prints the whole thing in place. Each section is
a `<section>` carrying a semantic `<h3>`, a plain-terms summary set in the alert-structural
chrome (the site's calmest tier, a readability aid rather than a warning), the operative
legal text, and one required agreement checkbox named `agree-<section.id>`, matching the
posted field name `registration/schema.ts`'s `waiverAgreementFields` expects.

The heading and the summary/operative text sit inside a bare `.prose` wrapper so they pick up
the site's own reading-surface rules (`chassis/prose.css`'s h3 treatment, `ecxc-theme.css`'s
`.alert-structural` chrome) with no CSS duplicated here; the checkbox sits outside that
wrapper, since `.prose` styles no form control.
-->
<script lang="ts">
  import { WAIVER_SECTIONS } from '$theme/waiver/waiver';
</script>

<div class="waiver-text">
  {#each WAIVER_SECTIONS as section (section.id)}
    <section class="waiver-section">
      <div class="prose">
        <h3>{section.title}</h3>
        <div class="alert alert-structural">
          <div class="card-body">
            <div class="ec-head">
              <span class="card-title">Plain-terms summary, for readability. The full text below is what you are agreeing to.</span>
            </div>
            <div class="alert-body">
              <p>{section.summary}</p>
            </div>
          </div>
        </div>
        {@html section.html}
      </div>

      <div class="waiver-agree">
        <input type="checkbox" class="checkbox" id="agree-{section.id}" name="agree-{section.id}" required />
        <label for="agree-{section.id}">I have read and agree to the {section.title} section.</label>
      </div>
    </section>
  {/each}
</div>

<style>
  .waiver-section + .waiver-section {
    margin-top: var(--spacing-xl);
    padding-top: var(--spacing-xl);
    border-top: var(--border) solid var(--color-card-border);
  }

  .waiver-agree {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-m);
  }
  .waiver-agree label {
    font-size: var(--text-step--1);
  }
</style>
