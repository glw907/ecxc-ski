// Not reachable by nav or crawl (no page links here on purpose; it's a print document, not a
// nav destination), so the default crawl-based prerender would skip it; force it in explicitly.
export const prerender = true;
