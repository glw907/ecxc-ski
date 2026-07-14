// See https://svelte.dev/docs/kit/types#app.d.ts
import type { ExecutionContext, SendEmail } from '@cloudflare/workers-types';
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
          // The contact form's own bindings (contact.remote.ts): SEND_EMAIL is the
          // fixed-destination Email Routing binding (wrangler.toml), distinct from cairn's own
          // unrestricted EMAIL binding. CONTACT_EMAIL and TURNSTILE_SECRET_KEY are Worker
          // secrets, set by name only.
          SEND_EMAIL: SendEmail;
          CONTACT_EMAIL: string;
          TURNSTILE_SECRET_KEY?: string;
          // Transitional dual-transport email (src/theme/email-transport.ts): when set, every
          // send seam (registration, contact, magic links) prefers Resend over the Cloudflare
          // bindings above. Unset until the Resend sending domain is verified.
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
