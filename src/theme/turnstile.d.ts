// Ambient declaration for the Turnstile widget script (loaded async by RegistrationForm.svelte
// and ContactForm.svelte), which attaches `turnstile` to `window` itself; there is no npm
// package to import types from. A `declare global` block cannot live inside a .svelte file's
// <script> (svelte-check treats it as nested, not top-level), so it lives here instead.
// `reset()` with no argument targets a page's one implicit widget, the only call both
// components make.
export {};

declare global {
  interface Window {
    turnstile?: {
      reset: (widgetId?: string) => void;
    };
  }
}
