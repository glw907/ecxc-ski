// The one server-side composition point. The runtime composes once here, and every server
// route that needs it (the /admin catch-all mount, /healthz) imports it instead of re-running
// composeRuntime per route. createCairnAdmin defaults the magic-link branding from the
// runtime's siteName and sender, which match the adapter's, so no override is passed.
import { composeRuntime } from '@glw907/cairn-cms';
import { createCairnAdmin } from '@glw907/cairn-cms/sveltekit';
import { cairn, siteConfig } from './cairn.config.js';

export const runtime = composeRuntime({ adapter: cairn, siteConfig });
export const admin = createCairnAdmin(runtime);
