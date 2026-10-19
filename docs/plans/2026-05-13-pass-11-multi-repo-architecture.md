# Pass 11 — Multi-Repo Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure cairn-cms into a generic, distributable site engine where each site's content and config live in their own isolated GitHub repo, with a CI-driven overlay mechanism connecting them.

**Architecture:** The cairn-cms engine builds a single site at a time, identified by `VITE_SITE`. A CI script clones the target site's content repo, overlays its `content/`, `routes/`, `config.ts`, `theme.css`, and `wrangler.toml` into the engine before building. Site content repos trigger builds via GitHub `repository_dispatch`. The engine has no hardcoded site references after this pass.

**Tech Stack:** SvelteKit, TypeScript, Vite (aliases + define), Cloudflare Workers, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-05-13-cairn-cms-multi-repo-architecture.md`

> **Editor auth note:** A core goal of Cairn is that editors never need a GitHub
> account. This pass does NOT implement the Cairn CMS editor interface — that is a
> separate future pass with its own spec. What this pass *does* do is create the
> content repo infrastructure that Cairn CMS will write to via service account on
> editors' behalf. After this pass, content repos exist and the CI pipeline works;
> editors just can't reach them yet without a developer pushing directly.

---

## File Map

### cairn-cms (modify)
- `vite.config.ts` — add `VITE_SITE` define + `$site-config`, `$site-theme`, `$site-lib` resolve aliases
- `src/lib/posts.ts` — per-site static glob using VITE_SITE conditional
- `src/lib/config.ts` — re-export from `$site-config` alias instead of hardcoded values
- `src/app.css` — import `$site-theme` instead of hardcoded @theme + font block
- `.github/workflows/deploy.yml` — update to use `VITE_SITE=907-life` and `wrangler.907-life.toml`

### cairn-cms (create)
- `src/sites/907-life/config.ts` — 907.life site constants (extracted from src/lib/config.ts)
- `src/sites/907-life/theme.css` — 907.life @theme block + fonts (extracted from src/app.css)
- `scripts/overlay.sh` — overlay site package into engine before build
- `.github/workflows/build-site.yml` — repository_dispatch triggered build + deploy
- `wrangler.907-life.toml` — renamed from wrangler.toml

### 907-life content repo (new GitHub repo: `glw907/907-life`)
- `posts/*.md` — moved from `src/content/posts/`
- `config.ts` — site constants (same content as src/sites/907-life/config.ts)
- `theme.css` — theme (same content as src/sites/907-life/theme.css)
- `wrangler.toml` — Worker config (same content as wrangler.907-life.toml)
- `.github/workflows/trigger-build.yml` — fires repository_dispatch on cairn-cms

---

## Task 1: Extract 907-life site constants

**Files:**
- Create: `src/sites/907-life/config.ts`

- [ ] **Create the site config file**

```typescript
// src/sites/907-life/config.ts
export const SITE_URL              = 'https://907.life';
export const SITE_TITLE            = '907.life';
export const SITE_DESCRIPTION      = 'A personal blog by Geoffrey L. Wright';
export const SITE_AUTHOR           = 'Geoffrey L. Wright';
export const SITE_LOCALE           = 'en-US';
export const FEED_MAX_ITEMS        = 20;
export const HOMEPAGE_FEATURED_COUNT = 1;
```

- [ ] **Commit**

```bash
git add src/sites/907-life/config.ts
git commit -m "Add 907-life site config extracted from lib/config.ts"
```

---

## Task 2: Extract 907-life theme

**Files:**
- Modify: `src/app.css`
- Create: `src/sites/907-life/theme.css`

The goal is to move everything site-specific (font faces, @theme block, @plugin config, dark mode overrides) from `app.css` into `src/sites/907-life/theme.css`. The `app.css` will keep only shared utility classes and the `@import "tailwindcss"` directive.

- [ ] **Read the current app.css to identify the split point**

Run: `wc -l src/app.css` and read through to find where the @font-face declarations end and the shared `.post-body`, `.post-date` utility classes begin.

- [ ] **Create `src/sites/907-life/theme.css`**

Move the entire theme block: all `@font-face` declarations, `@plugin "daisyui"`, `@plugin "daisyui/theme"`, and `@theme` block from `src/app.css` into this new file. The file should start with `@import "tailwindcss";` so it is self-contained.

```css
/* src/sites/907-life/theme.css */
@import "tailwindcss";
@plugin "daisyui" {
  themes: silk --default, dim --prefersdark;
}

/* @font-face blocks for Karla, Spectral, Monaspace Neon */
/* ... (copy verbatim from src/app.css) ... */

/* @theme block */
/* ... (copy verbatim from src/app.css) ... */

/* @plugin "daisyui/theme" dark overrides */
/* ... (copy verbatim from src/app.css) ... */
```

- [ ] **Update `src/app.css` to import from `$site-theme`**

Replace the extracted content with a single import. The file should become:

```css
/* src/app.css */
@import '$site-theme';

/* Shared utility classes used across multiple routes */
.post-body { /* ... keep as-is ... */ }
.post-date { /* ... keep as-is ... */ }
/* ... rest of shared classes unchanged ... */
```

- [ ] **Run check to confirm no type errors**

```bash
npm run check
```

Expected: no errors (theme not yet wired — will resolve in Task 4)

- [ ] **Commit**

```bash
git add src/sites/907-life/theme.css src/app.css
git commit -m "Extract 907-life theme into src/sites/907-life/theme.css"
```

---

## Task 3: Wire VITE_SITE into Vite config

**Files:**
- Modify: `vite.config.ts`

- [ ] **Update vite.config.ts**

```typescript
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'path';

const site = process.env.VITE_SITE ?? '907-life';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  define: {
    'import.meta.env.VITE_SITE': JSON.stringify(site)
  },
  resolve: {
    alias: {
      '$site-config': path.resolve(`src/sites/${site}/config.ts`),
      '$site-theme':  path.resolve(`src/sites/${site}/theme.css`),
      '$site-lib':    path.resolve(`src/sites/${site}/lib`)
    }
  },
  ssr: {
    external: ['cloudflare:email']
  },
  build: {
    rollupOptions: {
      external: ['cloudflare:email']
    }
  }
});
```

- [ ] **Run check to confirm aliases resolve**

```bash
npm run check
```

- [ ] **Commit**

```bash
git add vite.config.ts
git commit -m "Wire VITE_SITE define and site-config/theme/lib aliases into Vite"
```

---

## Task 4: Update lib/config.ts to re-export from $site-config

**Files:**
- Modify: `src/lib/config.ts`

All existing callers import from `$lib/config` — this file becomes a pass-through. No callsites change.

- [ ] **Replace src/lib/config.ts**

```typescript
// src/lib/config.ts
export {
  SITE_URL,
  SITE_TITLE,
  SITE_DESCRIPTION,
  SITE_AUTHOR,
  SITE_LOCALE,
  FEED_MAX_ITEMS,
  HOMEPAGE_FEATURED_COUNT
} from '$site-config';
```

- [ ] **Run check**

```bash
npm run check
```

Expected: no errors. All existing imports of `$lib/config` continue to work unchanged.

- [ ] **Commit**

```bash
git add src/lib/config.ts
git commit -m "Re-export lib/config from \$site-config alias"
```

---

## Task 5: Update posts.ts for multi-site content paths

**Files:**
- Modify: `src/lib/posts.ts`

`import.meta.glob` requires static string patterns — it cannot use runtime variables. The workaround is one glob per supported site with a build-time conditional. Each build only has one site's content present (overlaid by CI), so only the matching glob has files; the others resolve to empty objects.

- [ ] **Update the rawFiles declaration in src/lib/posts.ts**

Replace the existing single glob at the top of the file:

```typescript
// Before
const rawFiles = import.meta.glob<string>('/src/content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
});
```

With per-site static globs:

```typescript
// After — one static glob per supported site; only the active site has files at build time
const _SITE = import.meta.env.VITE_SITE;

const rawFiles: Record<string, string> =
  _SITE === 'ecnordic-ski'
    ? import.meta.glob<string>('/src/content/ecnordic-ski/posts/*.md', { query: '?raw', import: 'default', eager: true })
    : _SITE === 'aksailingclub-org'
    ? import.meta.glob<string>('/src/content/aksailingclub-org/posts/*.md', { query: '?raw', import: 'default', eager: true })
    : import.meta.glob<string>('/src/content/907-life/posts/*.md', { query: '?raw', import: 'default', eager: true });
```

- [ ] **Move existing content files to the 907-life subdirectory**

```bash
mkdir -p src/content/907-life
mv src/content/posts src/content/907-life/posts
```

- [ ] **Update parseFilepath to handle new path structure**

The filepath keys from the glob will now be `/src/content/907-life/posts/YYYY-MM-DD-slug.md`. Update `parseFilepath` to extract the filename from the new path:

```typescript
function parseFilepath(filepath: string): Pick<PostSummary, 'year' | 'month' | 'day' | 'slug'> {
  // filepath: /src/content/<site>/posts/YYYY-MM-DD-slug.md
  const filename = filepath.split('/').pop()!.replace('.md', '');
  const [year, month, day, ...slugParts] = filename.split('-');
  return { year, month, day, slug: slugParts.join('-') };
}
```

(This function is unchanged in logic — `filepath.split('/').pop()` already extracts just the filename regardless of path depth.)

- [ ] **Verify the dev server loads posts correctly**

```bash
VITE_SITE=907-life npm run dev
```

Navigate to `http://localhost:5173` and confirm posts appear. Check a post URL like `http://localhost:5173/2026/03/06/early-march/` loads correctly.

- [ ] **Stop dev server and run check**

```bash
npm run check
```

- [ ] **Commit**

```bash
git add src/lib/posts.ts src/content/
git commit -m "Update posts.ts for multi-site content paths under src/content/<site>/"
```

---

## Task 6: Rename wrangler config and update deploy workflow

**Files:**
- Create: `wrangler.907-life.toml`
- Modify: `.github/workflows/deploy.yml`

- [ ] **Copy wrangler.toml to wrangler.907-life.toml**

```bash
cp wrangler.toml wrangler.907-life.toml
```

The content of `wrangler.907-life.toml` remains identical to the current `wrangler.toml`. Keep `wrangler.toml` in place for now so local `npx wrangler dev` continues to work without specifying `--config`.

- [ ] **Update .github/workflows/deploy.yml**

Change the build step to pass `VITE_SITE` and the deploy step to use the site-specific config:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: VITE_SITE=907-life npm run build

      - name: Build Pagefind index
        run: npx pagefind --site .svelte-kit/cloudflare

      - name: Deploy
        run: npx wrangler deploy --config wrangler.907-life.toml
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

- [ ] **Run a local build to confirm it still works**

```bash
VITE_SITE=907-life npm run build
```

Expected: build succeeds, `.svelte-kit/cloudflare/` populated.

- [ ] **Commit**

```bash
git add wrangler.907-life.toml .github/workflows/deploy.yml
git commit -m "Add wrangler.907-life.toml and update deploy workflow for VITE_SITE"
```

---

## Task 7: Write the overlay script

**Files:**
- Create: `scripts/overlay.sh`

This script is run by CI after cloning a site package repo. It copies site package files into the engine at the correct locations.

- [ ] **Create scripts/overlay.sh**

```bash
#!/usr/bin/env bash
# Usage: ./scripts/overlay.sh <site-package-dir> <site-name>
# Overlays a site package into the cairn-cms engine before building.
# Site files take precedence over engine defaults on conflict.

set -euo pipefail

SITE_DIR="${1:?Usage: overlay.sh <site-package-dir> <site-name>}"
SITE_NAME="${2:?Usage: overlay.sh <site-package-dir> <site-name>}"

echo "Overlaying site package: $SITE_NAME from $SITE_DIR"

# Content
if [ -d "$SITE_DIR/content" ]; then
  mkdir -p "src/content/$SITE_NAME"
  cp -r "$SITE_DIR/content/." "src/content/$SITE_NAME/"
  echo "  content/ → src/content/$SITE_NAME/"
fi

# Route overrides and additions
if [ -d "$SITE_DIR/routes" ]; then
  cp -r "$SITE_DIR/routes/." "src/routes/"
  echo "  routes/ → src/routes/"
fi

# Site-specific lib
if [ -d "$SITE_DIR/lib" ]; then
  mkdir -p "src/sites/$SITE_NAME/lib"
  cp -r "$SITE_DIR/lib/." "src/sites/$SITE_NAME/lib/"
  echo "  lib/ → src/sites/$SITE_NAME/lib/"
fi

# Static assets
if [ -d "$SITE_DIR/static" ]; then
  cp -r "$SITE_DIR/static/." "static/"
  echo "  static/ → static/"
fi

# Site config
if [ -f "$SITE_DIR/config.ts" ]; then
  mkdir -p "src/sites/$SITE_NAME"
  cp "$SITE_DIR/config.ts" "src/sites/$SITE_NAME/config.ts"
  echo "  config.ts → src/sites/$SITE_NAME/config.ts"
fi

# Theme
if [ -f "$SITE_DIR/theme.css" ]; then
  mkdir -p "src/sites/$SITE_NAME"
  cp "$SITE_DIR/theme.css" "src/sites/$SITE_NAME/theme.css"
  echo "  theme.css → src/sites/$SITE_NAME/theme.css"
fi

# Wrangler config
if [ -f "$SITE_DIR/wrangler.toml" ]; then
  cp "$SITE_DIR/wrangler.toml" "wrangler.$SITE_NAME.toml"
  echo "  wrangler.toml → wrangler.$SITE_NAME.toml"
fi

echo "Overlay complete for $SITE_NAME"
```

- [ ] **Make it executable**

```bash
chmod +x scripts/overlay.sh
```

- [ ] **Test the overlay script locally against the 907-life site files**

```bash
# Create a temporary site package dir to simulate CI
mkdir -p /tmp/907-life-pkg/content
cp -r src/content/907-life /tmp/907-life-pkg/content/
cp src/sites/907-life/config.ts /tmp/907-life-pkg/config.ts
cp src/sites/907-life/theme.css /tmp/907-life-pkg/theme.css
cp wrangler.907-life.toml /tmp/907-life-pkg/wrangler.toml

# Run overlay into a throwaway copy to verify paths
./scripts/overlay.sh /tmp/907-life-pkg 907-life
```

Expected output:
```
Overlaying site package: 907-life from /tmp/907-life-pkg
  content/ → src/content/907-life/
  config.ts → src/sites/907-life/config.ts
  theme.css → src/sites/907-life/theme.css
  wrangler.toml → wrangler.907-life.toml
Overlay complete for 907-life
```

- [ ] **Commit**

```bash
git add scripts/overlay.sh
git commit -m "Add overlay.sh for CI site package build step"
```

---

## Task 8: Add build-site CI workflow

**Files:**
- Create: `.github/workflows/build-site.yml`

This workflow handles `repository_dispatch` events sent by content repos. It clones the content repo, runs the overlay, builds, and deploys.

- [ ] **Create .github/workflows/build-site.yml**

```yaml
name: Build and deploy site

on:
  repository_dispatch:
    types: [build-site]
  workflow_dispatch:
    inputs:
      site:
        description: 'Site name (e.g. 907-life, ecnordic-ski)'
        required: true
        default: '907-life'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout engine
        uses: actions/checkout@v4

      - name: Resolve site name
        id: site
        run: |
          SITE="${{ github.event.client_payload.site || github.event.inputs.site }}"
          echo "name=$SITE" >> $GITHUB_OUTPUT

      - name: Clone site package
        run: |
          git clone \
            https://x-access-token:${{ secrets.SITE_CONTENT_PAT }}@github.com/glw907/${{ steps.site.outputs.name }}.git \
            /tmp/site-package

      - name: Overlay site package
        run: ./scripts/overlay.sh /tmp/site-package ${{ steps.site.outputs.name }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: VITE_SITE=${{ steps.site.outputs.name }} npm run build

      - name: Build Pagefind index
        run: npx pagefind --site .svelte-kit/cloudflare

      - name: Deploy
        run: npx wrangler deploy --config wrangler.${{ steps.site.outputs.name }}.toml
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

- [ ] **Commit**

```bash
git add .github/workflows/build-site.yml
git commit -m "Add build-site workflow for repository_dispatch triggered deploys"
```

---

## Task 9: Create the 907-life content repo on GitHub

This task creates the `glw907/907-life` GitHub repo and populates it with the 907.life site package.

- [ ] **Create the repo on GitHub**

```bash
gh repo create glw907/907-life \
  --private \
  --description "907.life site content and config (cairn-cms site package)"
```

- [ ] **Initialize content repo locally**

```bash
mkdir /tmp/907-life-content && cd /tmp/907-life-content
git init
git remote add origin https://github.com/glw907/907-life.git
```

- [ ] **Copy site package files**

```bash
# From the cairn-cms root:
cp -r src/content/907-life/posts /tmp/907-life-content/
cp src/sites/907-life/config.ts   /tmp/907-life-content/
cp src/sites/907-life/theme.css   /tmp/907-life-content/
cp wrangler.907-life.toml         /tmp/907-life-content/wrangler.toml
```

- [ ] **Create the trigger workflow in the content repo**

```bash
mkdir -p /tmp/907-life-content/.github/workflows
cat > /tmp/907-life-content/.github/workflows/trigger-build.yml << 'EOF'
name: Trigger cairn-cms build

on:
  push:
    branches: [main]

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.CAIRN_DISPATCH_TOKEN }}
          script: |
            await github.rest.repos.createDispatchEvent({
              owner: 'glw907',
              repo: 'cairn-cms',
              event_type: 'build-site',
              client_payload: { site: '907-life' }
            });
EOF
```

- [ ] **Initial commit and push**

```bash
cd /tmp/907-life-content
git add .
git commit -m "Initial 907-life site package"
git branch -M main
git push -u origin main
```

- [ ] **Add required GitHub secrets to the content repo**

  `CAIRN_DISPATCH_TOKEN` — a GitHub fine-grained PAT with **Contents: Read** and **Actions: Write** permissions scoped to `glw907/cairn-cms` only.

  Set it via:
  ```bash
  gh secret set CAIRN_DISPATCH_TOKEN --repo glw907/907-life
  ```
  (Paste the PAT value when prompted.)

---

## Task 10: Add required secrets to cairn-cms

- [ ] **Create SITE_CONTENT_PAT**

  Generate a GitHub fine-grained PAT with **Contents: Read** permission scoped to `glw907/907-life` (and any future content repos). This PAT lives only in cairn-cms and is never exposed to content repo contributors.

  ```bash
  gh secret set SITE_CONTENT_PAT --repo glw907/cairn-cms
  ```

- [ ] **Verify secrets are present**

  ```bash
  gh secret list --repo glw907/cairn-cms
  ```

  Expected: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `SITE_CONTENT_PAT` all listed.

---

## Task 11: End-to-end test via workflow_dispatch

Before relying on the push trigger, verify the full pipeline manually using `workflow_dispatch`.

- [ ] **Trigger the build-site workflow manually**

  ```bash
  gh workflow run build-site.yml \
    --repo glw907/cairn-cms \
    --field site=907-life
  ```

- [ ] **Monitor the run**

  ```bash
  gh run watch --repo glw907/cairn-cms
  ```

  Expected: all steps pass, site deploys to 907.life.

- [ ] **Verify the live site**

  ```bash
  curl -s -o /dev/null -w "%{http_code}" https://907.life/
  ```

  Expected: `200`

---

## Task 12: Test the push trigger end-to-end

- [ ] **Make a trivial content change in the 907-life repo**

  ```bash
  cd /tmp/907-life-content
  # Add a blank line to a post, or update a tag
  echo "" >> posts/$(ls posts/ | head -1)
  git add .
  git commit -m "Test trigger"
  git push
  ```

- [ ] **Confirm cairn-cms build-site workflow fires**

  ```bash
  gh run list --repo glw907/cairn-cms --workflow build-site.yml --limit 3
  ```

  Expected: a new run appears within ~30 seconds of the push.

- [ ] **Watch it complete**

  ```bash
  gh run watch --repo glw907/cairn-cms
  ```

---

## Task 13: Update STATUS.md and commit pass plan

- [ ] **Update STATUS.md**

  Mark Pass 11 as complete. Add Pass 12 (ECN site package) as the next planned pass with a starter prompt:

  ```markdown
  | 11 | Multi-repo architecture: VITE_SITE, overlay, 907-life content repo, CI pipeline | ✓ Done |
  | 12 | ECN site package: create ecnordic-ski repo, scaffold content types, wire trigger | planned |
  ```

  Update the **Next starter prompt** section:

  ```
  > **Goal.** Create the ecnordic-ski site package and wire it into the cairn-cms
  > build pipeline.
  >
  > **Scope.** Create `glw907/ecnordic-ski` GitHub repo; populate with ECN content
  > scaffold (posts/, events/, schedule.yaml); add config.ts and theme.css with
  > placeholder ECN tokens; add custom training calendar route
  > (routes/schedule/+page.svelte); update posts.ts glob to include ecnordic-ski;
  > verify build with VITE_SITE=ecnordic-ski; add trigger workflow to content repo.
  >
  > **Approach.** Invoke cairn-pass to start. Standard pass-end checklist applies.
  ```

- [ ] **Commit**

  ```bash
  git add docs/STATUS.md docs/superpowers/plans/2026-05-13-pass-11-multi-repo-architecture.md
  git commit -m "Pass 11 plan and STATUS.md update"
  ```

---

## Self-Review Notes

**Spec coverage check:**
- G1 (1–10 sites from one engine): Tasks 3, 5, 8 ✓
- G2 (per-site customization without engine modification): Tasks 1, 2, 7 ✓
- G3 (static-first): Build pipeline unchanged, static output maintained ✓
- G4 (distributable): overlay.sh + site package convention is the distribution primitive ✓
- G6 (no GitHub required for editors): content repo has no editor-facing auth; Cairn CMS auth is a separate spec ✓
- G7 (scoped access): separate GitHub repos enforce this at platform level ✓
- G9 (publish = live): Tasks 8, 11, 12 — push → dispatch → build → deploy ✓

**Known gap:** Cairn CMS editor interface (G6, G8) is explicitly out of scope for this pass. It has no implementation tasks here. A separate spec + plan is required.

**Type consistency:** `_SITE` in posts.ts is only used in the conditional — not exported or referenced elsewhere. `$site-config`, `$site-theme`, `$site-lib` aliases are consistent across vite.config.ts, lib/config.ts, and app.css.
