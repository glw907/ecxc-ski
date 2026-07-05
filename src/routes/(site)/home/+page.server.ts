// Backlog #17: /home used to answer twice (its own pages/home permalink, and a duplicate of /).
// A static route at this exact segment outranks the [...path] catch-all, so this 301s the legacy
// URL to the real home while pages/home.md itself stays the editable content entry / renders from
// (the (site)/+page.server.ts load reads it directly). The catch-all's own entries() may still
// list "home" (the content permalink); harmless, since it resolves through this same route.
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = () => {
  redirect(301, '/');
};
