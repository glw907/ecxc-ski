// See https://svelte.dev/docs/kit/types#app.d.ts
import type { SendEmail, ExecutionContext } from '@cloudflare/workers-types';
// The binding-shaped types ship from the /sveltekit subpath: the Platform block intersects them
// rather than restating every engine binding by hand. CairnMediaBindings adds MEDIA_BUCKET,
// present because this site turns media on.
import type { CairnPlatformBindings, CairnMediaBindings } from '@glw907/cairn-cms/sveltekit';
// App.Locals.editor (set by the engine's auth guard) ships with the engine.
import '@glw907/cairn-cms/ambient';

declare global {
  namespace App {
    interface Platform {
      env: CairnPlatformBindings &
        CairnMediaBindings & {
          // The contact form's own bindings, on the /contact page (never read by cairn).
          SEND_EMAIL: SendEmail;
          CONTACT_EMAIL: string;
          TURNSTILE_SECRET_KEY: string;
        };
      context: ExecutionContext;
      caches: CacheStorage & { default: Cache };
    }
  }
}

export {};
