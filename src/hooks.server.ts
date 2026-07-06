import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { createAuthGuard } from '@glw907/cairn-cms/sveltekit';

// Inject the reader's saved theme into the SSR'd <html data-theme> so the first paint matches
// their choice with no flash. This is site behavior the engine guard knows nothing about, so it
// runs first in the sequence; createAuthGuard() then owns the /admin session gate and allowlist.
const theme: Handle = ({ event, resolve }) => {
  const value = event.cookies.get('theme') ?? '';
  return resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace('data-theme=""', `data-theme="${value}"`),
  });
};

export const handle = sequence(theme, createAuthGuard());
