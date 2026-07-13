// The Talkeetna Camp route, bespoke for the same reason as /training's own +page.server.ts
// (a live registration form that cannot prerender): see that file's header comment for the
// full rationale. This loads the 'talkeetna' pages-concept entry through the same shared
// createPublicRoutes wiring in registration/page-route.ts.
import type { PageServerLoad } from './$types';
import { loadRegistrationPageEntry } from '$theme/registration/page-route';

export const prerender = false;

export const load: PageServerLoad = loadRegistrationPageEntry;
