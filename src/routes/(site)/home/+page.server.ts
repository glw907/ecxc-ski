import { redirect } from '@sveltejs/kit';

// The routed Home content page (src/content/pages/home.md) answers at /home under the
// pages concept's default `/<id>` permalink, duplicating the root (backlog #17). This static
// route outranks the [...path] catch-all for the exact /home path, so the duplicate 301s to
// the canonical `/` instead of rendering a second copy of the page.
export const load = () => {
  redirect(301, '/');
};
