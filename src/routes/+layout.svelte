<script lang="ts">
  // The root layout is intentionally bare. All public chrome (app.css, Nav, search, the
  // width-constrained main, the footer, and the feed-discovery head links) lives in the
  // (site) route group, so the cairn-cms admin at /admin renders standalone. cairn 0.33's
  // dev-only guard logs a console error if the root layout wraps the admin in host chrome.
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

{@render children()}
