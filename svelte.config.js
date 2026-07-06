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
      // A 5xx during prerender means a page actually crashed, so fail the build. This is what makes
      // the content graph fail-closed: a dangling cairn: link target throws "cairn link target not
      // found" out of the render, the page 500s, and the build stops here instead of shipping a
      // broken page. A 4xx (a link to a missing path) stays a warning, the lenient scaffold default.
      handleHttpError: ({ status, message }) => {
        if (status >= 500) throw new Error(message);
        console.warn(message);
      },
      handleMissingId: 'warn',
      handleUnseenRoutes: 'warn'
    }
  }
};

export default config;
