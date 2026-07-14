<!-- @component
Renders the site's waiver (waiver/waiver.ts's `WAIVER_SECTIONS`) inline, in full: no scroll
trap, no accordion, since a family reads or prints the whole thing in place. Each section is
a `<section>` carrying a semantic `<h3>`, a plain-terms summary set in the alert-note
chrome (the soft-wash tier: a readability aid, visually distinct from both the legal text
and any warning), the operative legal text, and one required agreement checkbox posted as `b:agree_<section.id>` (underscore: SvelteKit parses remote-form field names as identifier paths, and a hyphen is an invalid path segment that kills hydration), matching
the posted field name `registration/schema.ts`'s `waiverAgreementFields` expects.

The `b:` name prefix is required, not decorative: it is the same prefix
`RemoteFormField.as('checkbox')` emits automatically for a field reached through the schema
(see RegistrationForm.svelte), but this checkbox is hand-authored rather than bound through
`.as(...)` (its field name is generated at runtime per waiver section, so it is not one of
the fixed keys `registration.remote.ts`'s `SharedRegistrationFields` interface names).
SvelteKit's `convert_formdata` only coerces a checked box's posted `"on"` string to a real
`true` when the field name carries that prefix; without it, valibot receives the string
`"on"` for a checked box, which fails `v.boolean()` and makes every checked waiver box read
as unchecked server-side. `id`/`for` stay unprefixed, since they only need to match each
other for the label association, not the posted field name.

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
        <div class="alert alert-note">
          <div class="card-body">
            <div class="ec-head">
              <span class="card-title">Plain-terms summary, for readability. The full text below is what you are agreeing to.</span>
            </div>
            <div class="alert-body">
              <p>{section.summary}</p>
            </div>
          </div>
        </div>
        <div class="waiver-legal">{@html section.html}</div>
      </div>

      <div class="waiver-agree">
        <input type="checkbox" class="checkbox" id="agree-{section.id}" name="b:agree_{section.id}" required />
        <label for="agree-{section.id}">I have read and agree to the {section.title} section.</label>
      </div>
    </section>
  {/each}
</div>

<style>
  /* The waiver sets as one bordered document on the same card chrome as the form's field
     groups: eight sections inside one frame reads as a single legal artifact rather than
     eight more pages of page. */
  .waiver-text {
    background: var(--color-base-100);
    border: var(--border) solid var(--color-card-border);
    border-radius: var(--radius-box);
    padding: var(--spacing-m);
    box-shadow: var(--cairn-shadow);
  }

  .waiver-section + .waiver-section {
    margin-top: var(--spacing-l);
    padding-top: var(--spacing-l);
    border-top: var(--border) solid var(--color-card-border);
  }

  /* The operative text is reference material a family reads or prints in place; one step
     down with snugger leading keeps all eight sections legible without an accordion. The
     summaries and headings stay at full scale, since they carry the actual reading path.
     Sized on the list container, not just p/li, so markers and em-based indents scale with
     the text instead of staying calibrated to the body size. */
  .waiver-legal :global(p),
  .waiver-legal :global(ul),
  .waiver-legal :global(ol) {
    font-size: var(--text-step--1);
    line-height: var(--leading-snug);
  }

  /* This wrapper breaks the chassis's direct-child flow rule (`.prose > * + *`), so the
     legal text supplies its own rhythm, scaled to its own smaller type: block gaps one
     notch tighter than prose, list items tighter still. */
  .waiver-legal > :global(* + *) {
    margin-top: var(--spacing-xs);
  }
  .waiver-legal :global(li + li) {
    margin-top: var(--spacing-2xs);
  }

  /* The plain-terms summary card sits between a heading and its legal text; the prose
     default margin-block for alerts assumes open page flow and reads as a hole here. */
  .waiver-section .prose :global(.alert) {
    margin-block: var(--spacing-s);
  }

  /* Within the document, the section title must win: the repeated summary label drops to a
     quiet display-face caption in muted ink. It deliberately skips the small-caps eyebrow
     vocabulary: this string is a full sentence, and caps-with-tracking at sentence length
     slows reading and dominates the section on narrow screens (both review lenses flagged
     it independently). */
  .waiver-section .prose :global(.alert-note .card-title) {
    font-family: var(--font-display);
    font-size: var(--text-step--1);
    font-weight: 700;
    color: var(--color-muted);
  }
  .waiver-section .prose :global(h3) {
    font-weight: 700;
  }

  /* The agreement row is the one thing a family DOES in each section; a washed, bordered
     chip separates it from the legal text it follows so it cannot be skimmed past. */
  .waiver-agree {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-s);
    padding: var(--spacing-xs) var(--spacing-s);
    background: var(--color-base-200);
    border: var(--border) solid var(--color-card-border);
    border-radius: var(--radius-field);
  }
  .waiver-agree label {
    font-size: var(--text-step--1);
    font-weight: 500;
  }
</style>
