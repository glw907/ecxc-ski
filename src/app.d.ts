// See https://svelte.dev/docs/kit/types#app.d.ts
import type { ExecutionContext } from '@cloudflare/workers-types';
// The binding-shaped types ship from the /sveltekit subpath, so the Platform block intersects
// them rather than restating every engine binding by hand. CairnMediaBindings adds MEDIA_BUCKET,
// present because this site turns media on.
import type { CairnPlatformBindings, CairnMediaBindings } from '@glw907/cairn-cms/sveltekit';
// App.Locals.editor (set by the engine's auth guard) ships with the engine.
import '@glw907/cairn-cms/ambient';

declare global {
  namespace App {
    interface Platform {
      env: CairnPlatformBindings &
        CairnMediaBindings & {
          // The contact form's own destination and gate (contact.remote.ts): Worker secrets,
          // set by name only.
          CONTACT_EMAIL: string;
          TURNSTILE_SECRET_KEY?: string;
          // src/theme/email-transport.ts's Resend transport, the site's only email transport
          // (registration, contact, magic links all read this at send time).
          RESEND_API_KEY?: string;
          // The registration pipeline's own bindings (registration.remote.ts). Both optional:
          // a deploy missing the Sheets secret still records signatures, per the plan's own
          // soft-failure design for the Sheets append step.
          GOOGLE_SA_KEY_B64?: string;
          REGISTRATION_SHEET_ID?: string;
          // Committed wrangler.toml var: Amy's copy of every registration record and
          // contact message.
          MAIL_CC?: string;
        };
      context: ExecutionContext;
      caches: CacheStorage & { default: Cache };
    }
  }
}

export {};
