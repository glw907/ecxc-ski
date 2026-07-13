// The Training route is bespoke, not the [...path] catch-all, since it hosts a live
// registration form (RegistrationForm.svelte) that posts through a remote function and so
// cannot prerender. It still loads the 'training' pages-concept entry through the shared
// createPublicRoutes wiring in registration/page-route.ts (the same wiring the catch-all uses,
// [...path]/+page.server.ts), so admin edits to the page's editorial content stay live here and
// the entry's rendered html/seo/hero shape matches every other content page exactly.
import type { PageServerLoad } from './$types';
import { loadRegistrationPageEntry } from '$theme/registration/page-route';

export const prerender = false;

export const load: PageServerLoad = loadRegistrationPageEntry;
