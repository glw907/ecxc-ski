import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [vitePreprocess()],
  kit: {
    // remoteBindings:false keeps the build-time platform proxy from connecting to Cloudflare
    // during prerender. The EMAIL binding is `remote = true` for `wrangler dev` real-mail only;
    // wrangler dev still honors it, but without this the CI prerender (no Cloudflare auth) fails
    // with "Failed to start the remote proxy session".
    adapter: adapter({ platformProxy: { remoteBindings: false } }),
    // $chassis resolves the genre-free layer (src/chassis/): the plumbing and composition
    // primitives the theme mounts onto. $theme resolves ecxc's own theme content (src/theme/): the
    // chrome, the adapter config, the token values (see src/chassis/README.md for the boundary
    // rule). $lib is unused; the site keeps no src/lib.
    alias: {
      $chassis: 'src/chassis',
      '$chassis/*': 'src/chassis/*',
      $theme: 'src/theme',
      '$theme/*': 'src/theme/*'
    },
    // cairn-cms 0.35 owns admin CSRF through a double-submit token that tolerates a missing Origin,
    // so the JS-free magic-link login works from a privacy browser that omits the header. That needs
    // SvelteKit's global Origin check off; cairn's guard restores the strict Origin check for the
    // site's own non-admin form POSTs, so this is not a net loss. (BACKLOG #29.)
    csrf: { checkOrigin: false },
    experimental: {
      // The contact form posts through a remote function (contact.remote.ts).
      remoteFunctions: true
    },
    prerender: {
      // Strict since the content went real (BACKLOG #1): a crashed page (5xx, including the
      // content graph's "cairn link target not found"), a link to a missing path, a broken
      // fragment, or an unlisted route all fail the build instead of warning.
      handleHttpError: 'fail',
      handleMissingId: 'fail',
      handleUnseenRoutes: 'fail'
    }
  }
};

export default config;
