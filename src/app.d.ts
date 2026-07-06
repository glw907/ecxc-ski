// See https://svelte.dev/docs/kit/types#app.d.ts

import type { SendEmail, D1Database } from '@cloudflare/workers-types';
import type { AuthEnv } from '@glw907/cairn-cms';

// App.Locals.editor (set by the engine's auth guard) ships with the engine.
import '@glw907/cairn-cms/ambient';

declare global {
  namespace App {
    interface Platform {
      env: {
        SEND_EMAIL: SendEmail;
        // Cloudflare Email Sending (transactional, arbitrary recipients) for magic links.
        EMAIL: NonNullable<AuthEnv['EMAIL']>;
        // The self-owned magic-link auth store (editor, magic_token, session tables).
        AUTH_DB: D1Database;
        CONTACT_EMAIL: string;
        TURNSTILE_SECRET_KEY: string;
        // The site origin, used to build magic links. Set in dev; in prod it matches the host.
        PUBLIC_ORIGIN: string;
        // GitHub App credentials for the commit signer.
        GITHUB_APP_ID: string;
        GITHUB_APP_INSTALLATION_ID: string;
        GITHUB_APP_PRIVATE_KEY_B64: string;
      };
      context: ExecutionContext;
      caches: CacheStorage & { default: Cache };
    }
  }
}

export {};
