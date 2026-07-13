// The waiver is digital-only now, signed as part of registration on /training and /talkeetna
// (the registration-forms pass). This route's old print-styled document is retired; a static
// route at this exact segment outranks the [...path] catch-all, same idiom as /home and
// /resources, so this 301s the legacy URL to the general signing surface.
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = () => {
  redirect(301, '/training');
};
