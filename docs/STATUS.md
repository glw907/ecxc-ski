# ecxc.ski: Project Status

## Current state (2026-07-06)

Rebuilt from scratch on the Waymark starter template and `@glw907/cairn-cms ^0.80.0`, then
**deployed to production** (the pre-rebuild 0.62.2-era app is retired; `https://ecxc.ski` now
serves the rebuild). The same day, three further waves shipped and deployed straight to `main`:
a CTA-label contrast fix, a site-wide one-vocabulary hover system, and a design pass that
re-expresses headings, sections, CTAs, alerts, checklists, and cards against six locked picks
(see History below for each). Every wave is gated green and confirmed live: the sitemap's 11
URLs all 200, and the three design-pass picks (the de-carded About flow, the framed CTA panel,
the corrected checklist scale) hold on the deployed site at 1440.

> **Architecture note.** cairn-cms is an embedded magic-link CMS library published as
> `@glw907/cairn-cms`; this site is a standalone repo consuming it via its own adapter. The
> engine's rolling status is `../cairn-cms/docs/STATUS.md`.

### Next up

No dev-side action is queued. What remains is Geoff's own: a real magic-link login and the full
authed `/admin` checklist against the deployed Worker (the local sandbox can only prove the D1
session mechanism past the guard, not the GitHub App round trip), the waiver's attorney review,
the CrewLAB confirmations, and the old `cairn-ecnordic-auth` D1 decommission. The `note`-tier
alert (`alert-structural`/`alert-caution` both have a live content instance; `alert-note` does
not) has no content to exercise it yet; add one the next time a page needs an informational,
no-tint alert.

---

## History

- **Architecture/design-language rewrite (2026-07-06), family repo tidy.** `docs/architecture.md`
  and `docs/design-language.md` rewritten from scratch against the current chassis/theme reality
  (`src/chassis/README.md`, `src/theme/cairn.config.ts`, `ecxc-theme.css`, `markdown/components.ts`),
  replacing the pre-rebuild 0.62.2-era descriptions (the old markdown pipeline, `src/lib/content.ts`,
  `decorate*()` functions, the fourteen-plus-directive kit) flagged stale by the docs landing sweep
  below. Both files shrank substantially (960 lines combined to roughly 340) in the same move, since
  a short, true doc was the explicit goal over a long, speculative one. `npm run check` (0 errors, 0
  warnings) and `npm test` (28/28) both green after the edit. Clears the "Follow-ups (carried)" item
  below and finding 6 of the Rebuild-from-Waymark entry further down.

- **Docs landing sweep (2026-07-06).** `CLAUDE.md`'s stack line named a `@schedule-x/svelte` and
  hand-authored `remark` + `remark-gfm` pipeline (both removed by the calendar-feature drop and
  the cairn-cms `createRenderer` adoption respectively) and carried a `New Event` content-type
  section for a concept that no longer exists (only `posts` and `pages`, per `src/theme/cairn.config.ts`);
  fixed, and two new sections point at the `src/chassis`/`src/theme` split
  (`src/chassis/README.md`) and the family-wide design/verification standards
  (`../cairn-cms/CLAUDE.md`'s polish/fidelity and responsive standards, the computed-style-probe
  verification method this pass's own hover system used). `docs/cairn-dx-findings.md` gained an
  explicit historical-snapshot framing (it predates both the ecxc rename and the meta-workspace
  flattening) and its now-resolved npm-workspace finding leads with the resolution instead of
  burying it after the complaint. The fully executed `2026-07-05-rebuild-from-waymark.md` plan
  moved to `docs/superpowers/archive/plans/`. Grepped `docs/` and `CLAUDE.md` for `TODO`/`FIXME`/
  `WATCH:` markers: none found. `docs/architecture.md` and `docs/design-language.md` remained
  pre-rebuild at the time of this sweep; both were rewritten in the family repo tidy above.

- **CTA fix, hover system, and design pass (2026-07-06), all deployed.** Three waves landed and
  pushed the same day, each its own gated commit, bringing the rebuild's remaining visual debt
  down before Geoff's design review.

  **CTA fix** (`617429b`). The unlayered body-link rule (`ecxc-theme.css`'s own documented
  unlayered-override block) was painting every in-prose link's underline-and-color treatment onto
  the CTA button's label too, since both are anchors and the override lives outside any Tailwind
  `@layer`; the fix scopes that rule off `.cta-link` so the button keeps its own button styling.

  **Hover system** (`b134cfc`). One site-wide hover vocabulary, a single `150ms ease` token
  declared once in `ecxc-theme.css`'s unlayered `:root`: body-link underline reveal, nav ink
  shift, tag-pill border/ink deepening, CTA brightness+1px rise, linked-card shadow+1px rise, and
  footer icon shift. Verified with computed-style probes (a canvas-roundtrip to normalize
  Chromium's `oklch()` computed colors to sRGB) plus a contrast check on the CTA
  (6.05:1 resting, 5.53:1 hover, both clear of the 3:1 floor) and a `:has()`-scoped card affordance
  that fires only while the pointer is over the card's real link.

  **Design pass** (`7d8f7e2`, `51c1a5a`). Six locked picks (Geoff, 2026-07-06) as one coherent
  pass: a tighter h1 masthead scale, icon-led section headers on dated sections, framed-neutral
  CTA cards (a new `render/cta-panel.ts` after-render step groups the heading and lead-in copy
  with the button into one `.cta-panel`, matching `render/table-scroll.ts`'s own seam), a
  three-tier escalating alert chrome (`structural`: plain border, no tint, no icon;
  `note`: soft tint wash, no border; `caution`: full border, thicker rule, small-caps title),
  grouped-card checklists (items keep the surrounding prose's own type scale rather than a
  separate, larger Utopia step), and selective de-carding of the `passage` directive (flat by
  default; `variant="card"` or `variant="emphasis"` earn chrome only where the content is
  object-like or advisory). A same-day follow-up fix (`51c1a5a`) closed three gaps the pass's own
  verification found: the CTA card had framed only the button, not the panel; the `structural`
  alert tier had zero content instances to prove the three-tier escalation; and checklist items
  were rendering one step larger than surrounding prose.

  **Live verification (this pass).** All 11 `sitemap.xml` URLs return 200 on the deployed
  `https://ecxc.ski`. At 1440: the About page's five `ec-passage` blocks all
  compute `box-shadow: none` and a `0px` border (the flat, de-carded flow holds); Training's
  `.cta-panel` computes a real border, shadow, and background around the whole heading-plus-copy
  block (the framed CTA holds); a checklist item and a plain prose paragraph both compute
  `font-size: 16px` (the checklist-scale fix holds); the live `alert-caution` (About's "Risks &
  waiver") and `alert-structural` (Training's "Carpooling") crop visibly distinct, matching the
  escalating-chrome design; the CTA button's live resting contrast is 6.05:1. `alert-note` has no
  live content instance to probe (see "Next up" above), an honest gap, not a regression.

- **Chassis restructure (2026-07-05), deployed.** Task 4 of
  `../cairn-cms/docs/superpowers/plans/2026-07-05-chassis-restructure.md`. Split `src/lib` into
  `src/chassis/` (the genre-free plumbing: `content.ts`, `feed.ts`, `cairn.server.ts`, `render.ts`'s
  `makeIconRenderer` icon wiring, `theme-toggle.ts`, `tokens.css`, `prose.css`, `composition.css`,
  verbatim from cairn-cms's showcase, or adopting its exact shape) and `src/theme/` (ecxc's own
  adapter config, chrome components, `theme.css`/`ecxc-theme.css`/`ecxc-components.css` values, the
  directive registry), with `$chassis`/`$theme` SvelteKit aliases mirroring the showcase's own.
  `markdown/components.ts` now calls the chassis's `makeIconRenderer` instead of hand-wiring
  `iconSpan`/`glyph`, a zero-behavior-change adoption (ecxc's own icon set was already doing the
  identical wiring by hand). `SiteHeader.svelte`'s theme toggle now calls the shared
  `$chassis/theme-toggle` mechanism instead of carrying its own copy. Only `dev-gate.ts` is omitted
  from the chassis copy (no dev backend here, per `hooks.server.ts`'s own comment); see
  `src/chassis/README.md` for the full boundary and every override seam.

  **Folded in, the three sanctioned fixes from the fidelity trial.** (1) The training-groups
  spectrum bar: `.ec-spectrum-bar span` had no `flex` value, so each empty segment's flex-basis
  resolved to its own zero-width content and the bar rendered three invisible slivers; added
  `flex: 1` in `ecxc-components.css`. (2) The FAQ answers now render inline, not behind a
  `<details>`/`<summary>` disclosure: `markdown/components.ts`'s `faq` build() emits a plain
  `<div class="faq">` with an always-visible `<p class="faq-question">` and
  `<div class="faq-answer">`, and `ecxc-theme.css` overrides chassis/prose.css's pointer-cursor
  default on the question (no longer a toggle). The now-unused `chevron-down` glyph was dropped from
  `markdown/icons.ts`. (3) The archives page regained its tag-filter chip row (each tag a pill with
  its post count, linking into `/tags/[tag]`, reading the same `posts.allTags()` the `/tags` index
  already calls) and its in-page RSS/JSON/Email feed links, both in
  `(site)/archives/+page.server.ts`/`+page.svelte`. The four re-expression items (heading voice,
  section-header anatomy, CTA cards, blue alerts) were deliberately left untouched; they await
  Geoff's sanction-or-restore ruling.

  **Verified.** A git-worktree pixel diff against the pre-restructure commit, across home, about,
  crewlab, volunteers, waiver, tags, a tag detail, and a post, shows only sub-pixel font-hinting
  noise (well under 2% of pixels differing, all text-shaped, no layout or color shift): the
  restructure itself changed nothing visible. The three restored fixes were verified against their
  own reference crops (the spectrum bar, the inline FAQ, and the archives chips/feed-links) at
  desktop and a 390px mobile check. `npm run check` (0/0), `npm test` (19/19, exit 0), and
  `npm run build` all pass.

- **Rebuild from Waymark (2026-07-05), deployed 2026-07-06.** Plan:
  `docs/superpowers/plans/2026-07-05-rebuild-from-waymark.md`. Five tasks: (1) retired the
  0.62.2-era app wholesale for a fresh Waymark scaffold on the v2 adapter idiom
  (`defineConcept`/`fieldset`, `posts`+`pages` concepts, `githubApp(...)`, entry-aware `render`);
  (2) migrated the six content entries and rationalized the eighteen legacy directives into
  Waymark's starter set (alert/cta/faq/callout reused verbatim) plus an ecxc-declared domain set
  (programs/program, week/day, spectrum/zone, passage, aside, checklist); (3) wired the bespoke
  surface (`/archives`, `/tags`, `/tags/[tag]`, `/contact`, the waiver re-expressed in-system,
  Pagefind, the `/home`→`/` and `/resources`→`/crewlab` redirects); (4) built `ecxc-theme.css` (the
  fireweed/spruce/black-spruce oklch trio, self-hosted Alegreya Sans + iA Writer Mono S + Nunito)
  over the inherited light/dark toggle, and migrated the hero/profile photos into the media
  library; (5) this pass's gate, crawl diff, responsive check, admin smoke, and the flexibility
  verdict below.

  **The permalink crawl diff (task 5).** Every URL in the live `https://ecxc.ski/sitemap.xml` (11
  entries) plus `/feed.xml`, `/feed.json`, `/robots.txt`, and a 404 probe served the identical
  status and body at the identical path on the local build, with exactly the two sanctioned
  deltas: `/home` (200 on live, a real page duplicating `/`) now 301s to `/`, and `/resources` (404
  on live already) now 301s to `/crewlab`. `/archives` was already a live 200 route, just absent
  from the old hand-written sitemap; it now joins the list. One regression found and fixed before
  this closed: the ported `/tags/[tag]` route carried `trailingSlash = 'always'` (mechanically
  copied from the 907.life rebuild's own pattern, whose live site uses a trailing slash), flipping
  ecxc's own no-trailing-slash canonical (`docs/architecture.md`: "Canonical URLs carry no trailing
  slash") and 307-redirecting every crawled `/tags/<tag>` URL. Fixed by dropping the override and
  the matching trailing slash from every internal link (`PostRow.svelte`, the tags index, the
  sitemap route); re-verified byte-identical to live.

  A second, silent regression found by direct comparison, not the crawl diff (page `<title>`
  content, not a URL): every content page's browser-tab title lost its site-name suffix
  (`entry.title` alone instead of the live site's `"<title> — ECXC"`), since the engine's
  `buildSeoMeta`/`CairnHead` never appends one by design (a site is expected to use `CairnHead`'s
  own `title` override prop, exactly as the pre-rebuild `[...path]` template already did). Fixed
  by passing that override in the rebuilt template, and correcting three bespoke routes
  (`/contact`, `/tags`, `/tags/[tag]`, `/archives`) that had inherited the 907.life site's own
  middle-dot separator convention instead of ecxc's own established em dash (the one deliberate,
  pre-existing exception is `/waiver`, a hand-built legal page that has always used the middle dot;
  left unchanged).

  **The responsive spot-check (task 5) found and fixed a real regression before this pass
  closed**, the same class of bug 907.life's own Pass 18 hit independently: `prose.css` ships a
  `.table-scroll` wrapper class with no render step wired to emit it (Waymark's `createRenderer`
  keeps its internal plugin ordering closed; a site adds this at the HTML-string boundary after
  `renderMarkdown`), and neither task 1 through 4 wired it here either. No current content has a
  markdown table, so nothing visibly overflowed yet, but the gap was live and would have bitten
  the first table an editor adds. Fixed by porting `src/lib/render/table-scroll.ts` verbatim from
  the cairn showcase (matching 907.life's own fix), wiring it into `cairn.config.ts`'s
  `rendering.render` after `renderMarkdown`, and declaring the five packages it needs
  (`hast-util-to-string`, `rehype-parse`, `rehype-stringify`, `unified`, `unist-util-visit`) as
  direct dependencies (already transitive through `@glw907/cairn-cms`, matching the showcase's own
  `package.json`). Screenshots at 320/1440/2560 on home, `/training` (the heaviest nesting: two
  schedule tables, a checklist, a numbered list, an FAQ accordion, four directive types), and
  `/waiver` show zero overflow on the rebuild at every width; the live site itself overflows to
  326-452px at 320px on the same three pages (`document.documentElement.scrollWidth`), so the
  rebuild's mobile reading surface is measurably tighter, the acceptance bar this task set.

  **The local admin smoke (task 5), as far as it goes without production.** Per the D1-session
  smoke process: the local `cairn-ecxc-auth` D1 has the auth schema and a seeded owner
  (`geoff-login@907.life`); a session row minted in an earlier task still resolves. `wrangler.toml`
  declares a `custom_domain` route, so under plain `wrangler dev` the guard's own `isLocalHost`
  check fails (`event.url.hostname` resolves to `ecxc.ski`, not `localhost`) and every `/admin`
  request gets the "HTTPS required" help page; `wrangler dev --local-protocol https` plus the
  `__Host-cairn_session` cookie name (the guard's https-mode cookie prefix) is the correct local
  recipe and proves the guard completely: no cookie → 303 `/admin/login`; a valid session → 307
  into `/admin/posts` with a fresh CSRF cookie. The content-list view itself (the real GitHub App
  installation-token round trip) hangs indefinitely in this sandbox's `wrangler dev`/workerd
  runtime past two minutes with near-zero worker CPU, a known environment limitation (an identical
  plain-Node replay of the same JWT sign-and-exchange call resolves in under a second), not a
  credentials or code bug. The authed checklist beyond the guard needs the deployed https Worker;
  see the pre-publish checklist below.

  **Full gate, every task.** `npm run check`: 0 errors, 0 warnings (579 files). `npm test`: 19/19
  passed, exit 0. `npm run build`: green (adapter-cloudflare output built; the two upstream
  `INVALID_ANNOTATION` Rolldown warnings from `@glw907/cairn-cms`'s shipped `.svelte` files are
  informational, not build failures).

### The flexibility verdict (task 5)

The redo amendment's own question: how much of the ecxc identity did the token-only seam
(`ecxc-theme.css` over neutral Waymark, zero chrome edits, per task 4's own report) actually
express on the real, rendered site, not just in the token file's own values.

**Roughly 35-40% of the pre-rebuild visual identity survives through the seam alone, honestly
assessed against the live site side by side at three widths.** What transferred in full: both
self-hosted faces (Alegreya Sans, iA Writer Mono S) and the display face (Nunito), and the single
fireweed-pink accent hue, which does real work across the whole site (active nav state, every CTA
button, the callout/alert left-rule and icon tint, in-prose links). What did not transfer: two of
the four named brand tokens in `ecxc-theme.css` itself. `--color-secondary` (black spruce) and
`--color-accent` (mid spruce) are correctly defined, real oklch values with a legible dark/light
comment explaining their intended job ("black spruce: people, community, wayfinding"; "mid spruce:
highlights & interactive accents"), but grep confirms zero consuming rule anywhere in the copied
chrome or prose CSS: no component reads `--color-secondary`/`--color-accent` as a background,
border, or text color. `--color-neutral` (spruce-slate, commented "the CTA panel's structural
dark") has exactly one consumer in the entire codebase, `--cairn-cta-bg` in `theme.css`, which only
renders on Waymark's `/styleguide` demo route, a page this site was never given (only the showcase
carries it). Three of the theme file's four brand tokens are inert on the live site: correctly
authored, never seen. The old site's other defining visual traits, a colored (near-black-spruce)
header and footer band, a colored square-letter "ECXC" logo lockup, bolder/more saturated
alert-callout tinting with a visible left border and role icon, and a pink-to-green gradient
divider, have no token-addressable equivalent in Waymark's copied `SiteHeader.svelte`/
`SiteFooter.svelte`/`prose.css`; each reads a plain `base-100`/`base-200` surface by the template's
own design, and reaching any of them would mean editing those copied, site-owned files directly
(a chrome edit), which this task deliberately did not do so the pure-seam result stays legible as
evidence. Per the amendment's own rule, this gap is not a defect to silently patch here; it is the
finding the flexibility test exists to surface.

### Template findings (consolidated across both rebuilds, ranked)

Reported back to cairn-cms per the plan's harvest step; 907.life's Pass 18 ran the same plan
independently first, so several items below carry two-site confirmation. Ranked by how much it
would bite the next Waymark-based rebuild, TOP-RANK first per the amendment's own rule that a seam
which cannot express the design outranks a mechanical gap.

1. **TOP-RANK, ecxc only: three of a site's four theme-file brand tokens can be entirely inert on
   the real site with no build warning.** See the flexibility verdict above in full.
   `--color-secondary`/`--color-accent`/`--color-neutral` are real, well-considered values that a
   site author would reasonably believe are "wired in" (the theme file's own header comment says
   so), but nothing in the copied Waymark chrome or prose ever reads two of them, and the third's
   only real estate is a demo page most consumer sites never copy. Recommend the showcase's own
   `SiteHeader`/`SiteFooter`/prose components exercise all five DaisyUI role colors somewhere
   visible in the default template (even a thin accent stripe or a secondary-tinted footer detail),
   or `cairn-doctor`/a lint step flags a theme-layer token with zero real consumers, the same way an
   unused CSS custom property is invisible to every current tool short of a manual grep.
2. **A scaffold-copy checklist gap lets a real accessibility/responsive fix go unwired for four
   tasks, independently reproduced on a second site (found and fixed here and on 907.life).**
   `prose.css`'s `.table-scroll` wrapper is a two-part contract (the class plus a render-time step
   that emits it) documented only in an inline comment; a site that copies the CSS without
   separately copying and wiring `table-scroll.ts` gets no error and no warning until a real table
   overflows a narrow viewport. Two independent sites hit the identical gap on the identical file.
   Recommend either an explicit scaffold-copy checklist naming every render-step file a template's
   CSS depends on, or folding table-scroll into `createRenderer`'s own default behavior (a site
   opts out, rather than every consumer remembering to opt in).
3. **The engine's sitemap surface only sees concept-derived routes, independently re-confirmed on a
   second site.** `sitemapResponse`/`site.all()`/`posts.allTags()` hand back only concept
   permalinks; a site-owned route with no concept behind it (`/archives`, `/tags`, `/contact`, a
   bespoke `/waiver`) is invisible to both and must be hand-listed, with nothing tying that list to
   the real route tree, which is exactly how the drift on `main` (the pre-rebuild sitemap missing
   `/archives`) happened in the first place. Two sites needing the identical manual list, with
   drift as the observed failure mode both times, is a stronger signal for an engine-side answer
   (an optional extra-static-routes argument, or a build check flagging an undeclared route
   directory) than either finding alone.
4. **`fields.url` rejects any relative path, anchor, or `cairn:` reference; real content routinely
   needs one.** `cta.url` had to widen to `fields.text` + a link-shape pattern since real content
   needed both an internal `/crewlab` link and an external app-link URL from the same attribute.
   Not caught by any build or test gate; only surfaces as a broken guided-insert form in the admin
   editor. Worth a documented `fields.linkUrl` (or a `fields.url({ allowRelative: true })` option)
   in the core field set, since this is not the first site to hit it.
5. **No custom rehype seam on `createRenderer`** (already filed; this pass's table-scroll fix is a
   third independent data point for it, after the docs-friction-log entry and 907.life's Pass 18):
   adding one post-render behavior means re-parsing and re-stringifying already-rendered HTML
   through a second `unified` pipeline rather than composing into the engine's own pipeline.
6. **Docs drift is a carried cost of a wholesale rebuild, not itself a defect.**
   `docs/architecture.md` and this repo's `CLAUDE.md` both still described the pre-rebuild
   0.62.2-era app (the old markdown pipeline, `src/app.css`, `@schedule-x`, an `events` content
   type none of which exist anymore). Out of scope for this gate-and-verify task; flagged here so a
   documentation pass picks it up before it misleads the next person who reads this repo, the same
   carried-follow-up shape 907.life's own Pass 18 findings used for its own stale architecture
   section. **Update (docs landing sweep, 2026-07-06): `CLAUDE.md`'s half is fixed** (the stack
   line, the dead `events` content-type section); see the History entry below. **Update (family
   repo tidy, 2026-07-06): `docs/architecture.md` and `docs/design-language.md` are rewritten**,
   both now describing the current chassis/theme reality; see the History entry above.

> **Follow-ups (carried).** The pre-publish checklist below (attorney review of the waiver, the
> CrewLAB confirmations, the old `cairn-ecnordic-auth` D1 decommission) is unaffected by this
> rebuild and still open. The kit `csrf.checkOrigin` deprecation (kit#15992) stays on the cairn
> watch list.

- **cairn 0.59 → 0.62.2 (2026-06-25).** Editor copy-edit, per-field description hints, the
  `/admin/help` Help home, a non-blocking address-collision advisory. No content change.
- **cairn 0.57 → 0.62.2 (2026-06-15/25).** Media end to end (0.57 R2 upload + resolver, 0.59 bulk
  delete + orphan collection), then the additive 0.60–0.62.2 span. No content change.
- **cairn 0.50 → 0.56.2 (2026-06-12/15).** Single-mount admin (0.50), preview-knob fidelity (0.51),
  editor-takes-the-shell (0.54), component-picker system (0.56.2). Each deploy green; doctor
  `--probe` 11/0/1 (the one skip is the D1 check, no `account_id`).
- **Coach voice drafting system (2026-06-09).** Generative guide, briefs, corpus; full rewrite.
- **Rename 1–6 (2026-06-08/09).** Full ECXC rebrand: identity sweep, new `cairn-ecxc-auth` D1,
  domain cutover with 301, brand mark, repo rename to `ecxc-ski`.

## Passes

| Pass | Goal | Status |
|------|------|--------|
| 1–9, 0.10–0.37 | Scaffold through cairn upgrades | ✓ Done |
| Refresh 1–3 | Six-page content rebuild | ✓ Done |
| Rename 1–6 | Full ECXC rebrand through repo rename | ✓ Done |
| Drafting system | Coach voice system + site rewrite | ✓ Done |
| cairn 0.50–0.62.2 | Single-mount admin + component-picker system + media + editor/help | ✓ Done |
| Rebuild from Waymark | Fresh scaffold on cairn ^0.80.0, ecxc-theme.css, media library | ✓ Deployed 2026-07-06 |
| Chassis restructure | `src/lib` → `src/chassis`/`src/theme` + the spectrum bar/inline FAQ/archives-chips fixes | ✓ Deployed 2026-07-06 |
| CTA fix, hover system, design pass | CTA-label contrast fix, site-wide hover vocabulary, six locked design picks | ✓ Deployed 2026-07-06 |
| Docs landing sweep | `CLAUDE.md`/DX-findings/STATUS audited against the rebuild; stale pre-rebuild references corrected | ✓ Done 2026-07-06 |

### Pre-publish checklist (gate before announcing)

- Magic-link login confirmed on ecxc.ski (deployed https Worker), then old `cairn-ecnordic-auth` D1
  decommission.
- Attorney review of the waiver.
- CrewLAB confirmations: join link and signing flow (#22), collection model (#21, live `[ASK]`).
- Real photos in place of any remaining placeholders (the hero and hero migration landed in this
  rebuild; the profile photo uploaded but stays unplaced pending a confirmed identity, per task 4).

**Deploy:** Live at **https://ecxc.ski**, the rebuild plus the CTA fix, hover system, and design
pass, all on `main` as of 2026-07-06. The pre-publish checklist above is still open.
