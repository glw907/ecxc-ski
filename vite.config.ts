import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { cairnManifest } from '@glw907/cairn-cms/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    // Verify the committed content manifest against the corpus on every build, and back the
    // cairn-manifest regenerate bin. It fails the build outside the prerender lifecycle, so a stale
    // manifest fails red regardless of the inherited prerender.handleHttpError: 'warn' policy.
    cairnManifest({
      configModule: '/src/lib/cairn.config.ts',
      content: { posts: '/src/content/posts/*.md', pages: '/src/content/pages/*.md' },
      manifestPath: '/src/content/.cairn/index.json',
    }),
  ],
  ssr: {
    external: ['cloudflare:email']
  },
  build: {
    rollupOptions: {
      // Pagefind's UI bundle is generated after the build by `npx pagefind`,
      // so it doesn't exist at bundle time. Keep the runtime import external
      // (Vite 8's Rolldown bundler resolves it eagerly otherwise).
      external: ['cloudflare:email', '/pagefind/pagefind-ui.js']
    }
  }
});
