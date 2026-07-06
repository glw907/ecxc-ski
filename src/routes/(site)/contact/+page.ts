// The contact form posts to a remote function; keep the page dynamic so the
// no-JS progressive-enhancement fallback can POST (a prerendered static page
// would 405). The form action itself now lives in `$lib/contact.remote.ts`.
export const prerender = false;
