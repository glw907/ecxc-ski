# ecxc.ski: Project Status

## Current state (2026-07-13)

On `@glw907/cairn-cms ^0.84.1` (upgraded from 0.81.0 on 2026-07-13, full gate and admin-guard
smoke green) with the backlog triaged the same day from 16 open items to 7 (see History).

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

**No queued initiative.** What remains is Geoff's own, from the pre-publish checklist below
(#22 closed 2026-07-13: Geoff revoked the old public join link the day the invite-only flow
shipped):

- Magic-link login and the full authed `/admin` checklist on the deployed Worker, then the old
  `cairn-ecnordic-auth` D1 decommission. **BLOCKED by cairn engine bug #36** (2026-07-13,
  live-diagnosed): the deployed confirm flow succeeds server-side, but `GET /admin`'s
  immediate 307 abandons the shell's streamed GitHub token mint and the engine's module-global
  token cache then serves that dead promise isolate-wide, hanging `/admin/posts`. The
  rebuild-era "content-list hangs in this sandbox = environment limitation" note was this same
  bug, misattributed. Handoff: `../cairn-cms/docs/internal/2026-07-13-admin-token-cache-poisoning.md`.
  Unblocks by upgrading to the fixed cairn release, then running the full authed checklist.
- Attorney review of the waiver. Delete the two CrewLAB-pass test emails (delivery itself was
  confirmed live 2026-07-13, closing the older carried check).

Small candidates for a future pass: a site-wide varied-phrasing sweep of the repeated
contact-us formula (content-review finding, 2026-07-13) and the `roster` directive once real
photos exist (#19). (The `alert-note` gap closed 2026-07-13: the waiver's eight plain-terms
summaries now ride that tier.)

---

## History

- **Registration-forms design refinement + font fix + coach copy (2026-07-13), SHIPPED.**
  A live exploratory arc (the `design-refinement` skill's iterate-with-owner mode, ~11 kept
  iterations) on the /training and /talkeetna forms: 12-column width-matched field grid
  (single-column flow, related short fields share rows), quiet cards per field group, the
  waiver as one bordered document (legal text one step down with its own flow rhythm, since
  the wrapper divorces it from prose.css's direct-child owl selector), plain-terms summaries
  on the `alert-note` tier with caption labels, washed-chip agree rows, display-face field
  labels, derived required-asterisks (`:has(... [required])` so marks cannot drift), linked
  error summary (GOV.UK pattern), and both in-page registration CTAs demoted to plain links.
  /training's form section: 10,980px → ~8,900px at 1440. Settled decisions and reasoning:
  `docs/design/design-decisions.md`. Backing UX: phones now validate and normalize to
  `XXX-XXX-XXXX` and emails lowercase in the schema (91 registration tests); every record
  email also copies Amy (`REGISTRATION_CC` var, soft-fail via the EMAIL binding).
  A Geoff-opted workflow review (3 lenses + adversarial verification, 7 agents) confirmed
  two majors, both fixed: placeholder contrast (3.65:1 → 5.35:1, site-wide rule) and the
  pre-existing mobile horizontal overflow (root cause: `.site-main`'s implicit flex stretch
  let the fixed 300px Turnstile iframe widen the column; `width: 100%` + submit-card
  containment; 320 and 390 now probe clean). Same arc, site-wide latent defect found by
  Geoff's eye: the rebuild-era self-hosted Alegreya Sans woff2 subsets were missing every
  capital letter except A (per-glyph fallback made bold capitals inconsistent); replaced
  with complete latin subsets, coverage verified via fontTools cmap + `document.fonts.check`.

- **CrewLAB invite integration + nav grouping (2026-07-13), SHIPPED and verified live.** Spec:
  `docs/superpowers/specs/2026-07-13-crewlab-invite-integration-design.md` (with the sourced
  research record `docs/crewlab-onboarding-research.md`, the operating reference for the invite
  loop); plan archived. CrewLAB onboarding is invite-only through the existing forms, no new
  ones: registration (both forms, shared schema) collects the athlete's invite contact
  (email/cell, at least one required), a parent opt-in, and an optional second-parent pair,
  riding the whole existing pipeline (five columns appended to both roster tabs, live header
  rows extended via API and verified; a `CrewLAB invite` group in the record email). Boosters
  route through the contact form. Four content pages re-pointed (home's action line, about,
  training, crewlab's rewritten Getting started + CTA); the public join link is off the site
  (deployed grep: zero hits). #21 closed same day (camp cost-share + donations restored to the
  parents passage). Workflow-orchestrated (Geoff's opt-in): three site-implementer tasks, a
  three-lens review workflow (svelte/a11y/workers) with adversarial verification — one
  confirmed a11y finding (the either-of-two-contacts instruction now rides both inputs'
  aria-describedby) and four lows fixed, one refuted-by-prior-work; two independent
  content-review gates PASS. Live e2e both forms: SUCCESS + `SHEET VERIFY: PASS`, both test
  rows verified and deleted, both emails confirmed received by Geoff (closing the older
  delivery check), Turnstile secret rotated back. Renders verified at 1440/390 (fieldset,
  crewlab page). Same pass, Geoff's nav ask: the Home menu item is gone (the tile mark is the
  home link), the nav packs right with the free width on the logo's side, an ink-mix rule sets
  off the search/theme cluster, and the hamburger breakpoint rose to 919px with a matchMedia
  drawer reset (640-919 was wrapping labels; verified at 375/700/910/920/1440).

- **cairn 0.84.1 upgrade + backlog triage (2026-07-13), pushed.** Upgraded `@glw907/cairn-cms`
  ^0.81.0 → ^0.84.1: the whole span is additive per the changelog, verified against all seven
  subpaths the site imports; doctor 12/0, check 0/0 (612 files), tests 84/84, build green; the
  local https admin-guard smoke passed exactly per the recipe (no cookie → 303 login; minted
  session → 307 `/admin/posts` + fresh `__Host-cairn_csrf`; the content-list GitHub round trip
  still hangs in this sandbox, the known environment limitation). Backlog then triaged 16 open →
  7: five obsolete post-rebuild (#5 #14 #20 #23 #31), #15 already fixed by the rebuild
  (`PostList` emits `<h2>`), #16 resolved by the engine's default validate gate (verified
  empirically: deleting a post's `title` fails the build via the manifest verify), #1 fixed
  (all three prerender options `'fail'`, build clean), #30 fixed wider than logged (the rebuild
  shipped NO favicon link at all; now `favicon.ico` 16/32/48 + `apple-touch-icon.png` + three
  `app.html` links). The triage also caught stale content: about.md and crewlab.md still said
  the waiver is signed in CrewLAB (false since the registration pass) and the live `/crewlab`
  page was rendering a raw `[ASK: payments]` editorial marker; both files corrected to the
  one-form registration model (independent content-review gate: PASS), #21 re-scoped to add the
  payments answer back once confirmed. CLAUDE.md's stale snapshot instruction replaced with the
  real post-content-edit step (`npm run cairn:manifest`; the pre-rebuild HTML snapshots no
  longer exist).

- **Registration forms + digital waiver (2026-07-13), SHIPPED and verified live.** Spec/plan:
  `docs/superpowers/specs/2026-07-13-registration-forms-design.md`,
  `docs/superpowers/plans/2026-07-13-registration-forms.md`. Training (`/training`, re-scoped
  from the old page, URL kept generic for future seasons) and Talkeetna Camp (`/talkeetna`,
  new) each carry a registration form sharing one code-owned digital waiver
  (`src/theme/waiver/waiver.ts`, SHA-256-pinned). A submission validates (valibot), verifies
  Turnstile (fail-closed), appends a row to the roster Google Sheet (service-account JWT via
  WebCrypto), emails the signed record to `CONTACT_EMAIL` (must-succeed), and emails a copy to
  the parent (soft-fail). The print `/waiver` page was retired (301 to `/training`); the waiver
  is digital-only, re-expressed with plain-terms summaries plus an adult-participant clause,
  E-SIGN/Alaska UETA consent, governing law, and severability (attorney review still owed, per
  the pre-publish checklist). Content rewritten brief-first (two independent critic passes).

  **Infra provisioned:** a dedicated GCP project `ecxc-registrations` + `ecxc-sheets` service
  account (the ASC account was not usable: its Sheets API was disabled and Geoff lacks
  enable-permission on that project). Key stored in the workstation age store
  (`GOOGLE_SA_KEY_B64`, `sync.sh --worker ecxc`), the roster spreadsheet ID committed as
  `REGISTRATION_SHEET_ID`. The Worker now carries four secrets (CLAUDE.md updated).

  **Four-reviewer gate + live e2e found five real bugs, all fixed:** the waiver checkboxes and
  the Turnstile field both used hyphenated names that crash SvelteKit's remote-form client
  (identifier-path parser) on every real submission (the Turnstile one hit the contact form
  too); a stale `CONTACT_EMAIL` (`@ecnordic.ski`) blocked the must-succeed record email;
  Turnstile was fail-open on a missing secret; the SA-key decode could leak key bytes into an
  error. Both forms now submit green end to end (camp + training), the roster row verified
  landing and cleaned up, contrast/render reads passed at 1440 and 390. The live-e2e harness
  and runbook are `scripts/e2e-registration.mjs` + `docs/registration-e2e.md`. Backlog: #33/#34/
  #35 logged, #12/#17/#18 closed, #22 re-scoped.

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

### The flexibility verdict + template findings (harvested; full text in git history)

The rebuild's flexibility verdict (roughly 35-40% of the pre-rebuild identity survived the
token-only seam; three of the theme file's four brand tokens were inert on the live site with no
warning) and the six consolidated template findings (inert brand tokens, the table-scroll
scaffold-copy gap, sitemap blindness to non-concept routes, `fields.url` rejecting relative
paths, no custom rehype seam, docs drift) were reported to cairn-cms per the plan's harvest
step, several with two-site confirmation from 907.life's Pass 18. The rehype-seam and
table-scroll items shipped in cairn 0.81 (the `remarkPlugins`/`rehypePlugins` seam, default-on
table scrolling). The full text of both sections is preserved in this file as of commit
`d6248e8`.

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
| Registration forms + digital waiver | Training + Talkeetna forms, code-owned digital waiver, Sheets + email pipeline | ✓ Deployed 2026-07-13 |
| cairn 0.84.1 + backlog triage | Upgrade 0.81→0.84.1 gated + smoked; 16 backlog items → 7; favicon set, strict prerender, stale-waiver content sweep | ✓ Done 2026-07-13 |
| CrewLAB invite integration | Invite-only onboarding through the existing forms; five schema fields, four content pages, nav grouping; live e2e green | ✓ Deployed 2026-07-13 |
| Registration-forms refinement | Live design arc (field grid, cards, waiver document), phone/email normalization, coach copy, font fix, workflow review | ✓ Deployed 2026-07-13 |

### Pre-publish checklist (gate before announcing)

- Magic-link login confirmed on ecxc.ski (deployed https Worker), then old `cairn-ecnordic-auth` D1
  decommission.
- Attorney review of the waiver.
- CrewLAB confirmations: join link and signing flow (#22), collection model (#21, live `[ASK]`).
- Real photos in place of any remaining placeholders (the hero and hero migration landed in this
  rebuild; the profile photo uploaded but stays unplaced pending a confirmed identity, per task 4).

**Deploy:** Live at **https://ecxc.ski**, the rebuild plus the CTA fix, hover system, and design
pass, all on `main` as of 2026-07-06. The pre-publish checklist above is still open.
