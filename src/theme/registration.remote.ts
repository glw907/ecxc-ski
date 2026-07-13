// The Training and Talkeetna Camp registration form actions. A `.remote.ts` module may export
// ONLY remote functions (SvelteKit enforces this at module init), so the entire testable
// pipeline lives in ./registration/handler.ts and these two exports are the thinnest possible
// wrappers over it, in the exact `form()` idiom contact.remote.ts uses.
import { form } from '$app/server';
import { campSchema, trainingSchema } from './registration/schema';
import { buildDeps, handleRegistration } from './registration/handler';

export const registerTraining = form(trainingSchema, (data) => handleRegistration('training', data, buildDeps()));

export const registerCamp = form(campSchema, (data) => handleRegistration('camp', data, buildDeps()));
