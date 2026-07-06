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
      configModule: '/src/theme/cairn.config.ts',
      content: { posts: '/src/content/posts/*.md', pages: '/src/content/pages/*.md' },
      manifestPath: '/src/content/.cairn/index.json',
    }),
  ],
  // The contact form's SEND_EMAIL path (contact.remote.ts) imports the ambient
  // `cloudflare:email` module, which exists only inside the Workers runtime; keep it external
  // so Rolldown doesn't try to resolve it at build time.
  ssr: {
    external: ['cloudflare:email'],
  },
  build: {
    rollupOptions: {
      external: ['cloudflare:email'],
    },
  },
});
