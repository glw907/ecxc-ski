// Backlog #18: /resources was retired when its waiver-and-forms content folded into CrewLAB. A
// static route at this exact segment outranks the [...path] catch-all, so this 301s the legacy
// URL to where the content actually lives now.
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = () => {
  redirect(301, '/crewlab');
};
