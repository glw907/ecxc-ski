// The one server-side composition point. The runtime composes once here, and every server
// route that needs it (the /admin mount, /healthz, /media) imports it instead of re-running
// composeRuntime per route.
import { composeRuntime } from '@glw907/cairn-cms';
import { createCairnAdmin } from '@glw907/cairn-cms/sveltekit';
import { cairn, siteConfig } from '$theme/cairn.config.js';
import { magicLinkSender } from '$theme/email-transport.js';

export const runtime = composeRuntime({ adapter: cairn, siteConfig });
// magicLinkSender (src/theme/email-transport.ts) is the theme's minimal override of the seam:
// it reads the request's env at call time and prefers Resend when RESEND_API_KEY is set,
// otherwise it replicates the engine's own default EMAIL-binding send.
export const admin = createCairnAdmin(runtime, { auth: { send: magicLinkSender } });
