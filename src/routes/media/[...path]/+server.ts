// cairn-cms 0.79+: the media delivery route. It streams content-addressed image bytes from the
// MEDIA_BUCKET R2 binding, validating the hash and extension before any read and carrying its own
// security headers (it sits outside /admin). The route is off until the adapter declares a media
// block; createMediaRoute reads the resolved config off the runtime itself.
import { createMediaRoute } from '@glw907/cairn-cms/sveltekit';
import { runtime } from '$lib/cairn.server.js';

export const GET = createMediaRoute(runtime);
