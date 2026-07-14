# BACKLOG

> Project issue tracker. Managed by `/log-issue`.

## High

- [x] **#36** Deployed admin login hangs: cairn installation-token cache poisoning `#bug` `#ecxc` *(2026-07-13, resolved 2026-07-13)*
  RESOLVED: cairn 0.84.2 fixes the engine (the cache stores only a resolved token, never the
  in-flight mint promise; regression test pins the never-settling case). This site bumped to
  ^0.84.2 and deployed (version 62ff5ce4), then probed live in the exact poisoning order with a
  smoke session: authed `GET /admin` 307 in 0.86s, `GET /admin/posts` 200 in 0.72s (the request
  that used to hang), repeat 200, homepage 200, smoke row deleted. Remaining human step: Geoff's
  own magic-link click on the deployed admin, which the pre-publish checklist already carries.
  Live-confirmed on ecxc.ski: after a successful magic-link confirm (token confirmed, session
  created), the browser hangs forever. `GET /admin` starts the shell's streamed `pendingEntries`
  GitHub mint, answers its 307 immediately, and workerd cancels the in-flight fetch; the
  engine's module-global token cache then serves that dead promise to every request in the
  isolate for 55 minutes, so `/admin/posts` never responds (tail: outcome `canceled`, near-zero
  CPU). Also the real cause of the "content-list round trip hangs in this sandbox" note from
  the rebuild and 0.84.1 smokes; that was engine behavior, not the sandbox. Engine bug, handed
  to cairn-cms: `../cairn-cms/docs/internal/2026-07-13-admin-token-cache-poisoning.md`. Close by
  upgrading to the fixed cairn release and completing the deployed-admin checklist (blocks the
  pre-publish checklist's magic-link item). Possible interim workaround, untested: after
  signing in, navigate directly to `/admin/posts` on a fresh isolate.

## Medium

- [ ] **#37** Finish the Resend cutover: verify ecxc.ski in Resend, put the secret, live e2e, drop the CF path `#improvement` `#ecxc` *(2026-07-14)*
  The 2026-07-14 morning outage (Cloudflare Email Service's account daily sending quota, hit at
  ~15 total sends because a new sending account starts with a tiny reputation-based cap) drove a
  transitional dual-transport email layer: every send path (registration record/parent/coach,
  contact + Amy copy, cairn magic links) prefers Resend when the `RESEND_API_KEY` Worker secret
  exists and falls back to the CF bindings when it does not. Blocked on the Resend side: the free
  plan's one domain slot holds aksailingclub.org (Geoff investigating; a separate free Resend
  account for ecxc would also isolate sending reputation). To close: add ecxc.ski in Resend, add
  its DKIM/SPF DNS records to the zone, verify, `secret-set.sh`/`sync.sh --worker ecxc` the key
  per the workstation flow, run the live e2e runbook (`docs/registration-e2e.md`), then strip the
  CF fallback and the two `[[send_email]]` bindings in a cleanup pass (#35 dies with them).
- [ ] **#38** Reset the Turnstile widget after a failed submission `#bug` `#ecxc` *(2026-07-14)*
  A Turnstile token is single-use: when a submission fails server-side after `siteverify` has
  consumed the token (the 2026-07-14 case: the record email failed on the mail quota), every
  retry posts the spent token and dies on "Spam check failed. Please try again." until the
  member reloads. One member burned ~an hour in this loop, appending four duplicate roster rows.
  On a failed remote-form result, call `turnstile.reset()` (both registration forms + contact)
  so the retry mints a fresh token. Consider pairing with a quota-aware failure message so a
  mail-outage rejection stops inviting immediate identical retries.

- [ ] **#33** Rate-limit the registration endpoints' parent-copy send `#improvement` `#ecxc` *(2026-07-13)*
  The camp/training registration forms email a confirmation to the parent address from the form (the unrestricted `EMAIL` binding), so one solved Turnstile challenge sends one attacker-shaped email from noreply@ecxc.ski to an arbitrary address. Mitigations already in place: Turnstile fails closed, and every send lands the full record in CONTACT_EMAIL, so abuse is visible. Add a per-IP or per-address rate limit (KV or DO) if volume or abuse ever warrants. Security review of the registration-forms pass, 2026-07-13.

## Low

- [ ] **#34** Registration-roster export hygiene: CSV formula-injection note `#improvement` `#ecxc` *(2026-07-13)*
  The live Sheet is safe (the Worker appends with `valueInputOption=RAW`, so `=`/`+`/`-`/`@` values store as literal text), but an exported CSV reopened in Excel/Sheets can evaluate a leading formula character. Either prefix risky cells with `'` at export time or just don't re-import exports. Security review, 2026-07-13.
- [ ] **#35** `SEND_EMAIL` lacks `remote = true`, so `wrangler dev` cannot exercise the record email `#improvement` `#ecxc` *(2026-07-13)*
  The registration pipeline's must-succeed record email simulates locally while the soft parent copy (`EMAIL`, `remote = true`) sends real mail, the inverse of production's trust model. Add `remote = true` to `SEND_EMAIL` when local testing of the critical path matters. Workers review, 2026-07-13.
- [ ] **#27** Give 907.life the shared web-content method routing `#improvement` `#ecxc` *(2026-06-06)*
  Add a `docs/content-guide.md` and a `.claude/rules/content.md` to the 907.life repo that point at the same shared web-content method (`~/.claude/docs/web-content-method.md`), so the second site gets the same `content-draft`/`content-review` routing by copying two small local files. The method, the two skills, and the widened `prose-guard` lexicon already live in the dotfiles, so 907.life needs only its own voice guide plus the router rule. This is the spec's out-of-scope item "A 907.life content-guide.md that points at the same shared method."
- [ ] **#19** Defer the `roster` directive until real coach photos exist `#improvement` `#ecxc` *(2026-06-04, path updated 2026-07-13)*
  A `roster` directive (a grid of coach or volunteer headshot cards) waits on real photos. The Volunteers & Coaches page uses the existing `split`/`panel` directives for the bios in the meantime, so the page ships without the roster grid. Add `roster` to the registry (`src/theme/markdown/components.ts`) and convert the Volunteers bios to it once headshots are in hand.
## Done

- [x] **#22** Pre-publish: revoke the old CrewLAB join link; confirm donation collection `#improvement` `#ecxc` *(2026-06-04 → 2026-07-13)*
  Both halves closed the day the invite-only flow shipped: Geoff revoked the old public deep link (`crewlab.app.link/5g7vhhYEn3b`; it no longer admits anyone), and #21's answer confirmed the donations question (camp cost-share + donations run through the app).

- [x] **#21** Confirm what ECXC collects through CrewLAB, then add the answer to crewlab.md `#improvement` `#ecxc` *(2026-06-04 → 2026-07-13)*
  Geoff's answer: camp cost-share and donations, no dues. The "For parents & supporters" passage now carries the payments sentence (voluntary chip-in framing, keeping the free-camp and need-blind claims true); the brief records the fact with provenance.

- [x] **#30** Raster favicon fallback for Safari `#improvement` `#ecxc` *(2026-06-09 → 2026-07-13)*
  Fixed in the backlog-triage pass, wider than logged: the Waymark rebuild's `app.html` linked no favicon at all, so every browser requested `/favicon.ico` and 404'd. `static/` now ships `favicon.ico` (16/32/48 multi-res) and a 180px `apple-touch-icon.png`, both rendered from `favicon.svg` (oklch flattened to hex for the rasterizer), and `src/app.html` links all three.
- [x] **#1** Flip prerender options back to `'fail'` once content is real `#improvement` `#ecxc` *(2026-05-20 → 2026-07-13)*
  Content is real; `svelte.config.js` now sets `handleHttpError`, `handleMissingId`, and `handleUnseenRoutes` all to `'fail'`, and the build passes clean. A dangling `cairn:` token, a broken internal link, a broken fragment, or an unlisted route now fails the build instead of warning.
- [x] **#16** Restore a build-time frontmatter validation gate for content `#improvement` `#ecxc` *(2026-06-01 → 2026-07-13)*
  Resolved by the engine, verified empirically on 0.84.1: `createSiteIndexes` validates every entry against the adapter fieldset by default, a failing entry is excluded from the corpus, and the `cairn-manifest` Vite plugin then fails the build red ("content manifest is stale"). Test: deleting a post's `title` made `npm run build` exit 1. Residual, deliberate: the tags field is `creatable: true`, so the closed vocabulary and a min-one-tag rule stay policy (content rules), not schema; the `url-inventory` test still catches date/filename disagreement.
- [x] **#20** Add a global `.ec-head` flex rule so `aside`/`gallery` heads work off the three directive pages `#bug` `#ecxc` *(2026-06-04 → 2026-07-13)*
  Obsolete: the Waymark rebuild moved all directive CSS into the global `src/theme/ecxc-components.css`; the catch-all route carries no page-scoped directive rules, and the `gallery` directive no longer exists. Directives are self-contained on every route by construction now.
- [x] **#15** Fix the h1 to h3 heading skip in `ArchiveList` `#bug` `#ecxc` *(2026-06-01 → 2026-07-13)*
  Fixed by the Waymark rebuild: `ArchiveList.svelte` is gone and its replacement `PostList.svelte` emits `<h2 class="post-list__year-heading">` under the page `<h1>`, no skipped level.
- [x] **#31** Migrate `Nav.svelte` off the deprecated `$app/stores` page import `#improvement` `#ecxc` *(2026-06-09 → 2026-07-13)*
  Obsolete: `Nav.svelte` was retired by the Waymark rebuild and no file imports `$app/stores` anywhere in `src/`.
- [x] **#23** Adopt the `toc` component once cairn-cms ships a post-rehype hook `#improvement` `#ecxc` *(2026-06-04 → 2026-07-13)*
  Obsolete both ways: the Waymark rebuild dropped the hand-maintained `page-toc` nav (no page carries one now), and cairn 0.81 shipped the `rehypePlugins` seam that was the blocker. If a page ever wants a toc again, the seam is there.
- [x] **#14** Dedup the catch-all cascade keyframes against the global ones `#cleanup` `#ecxc` *(2026-05-24 → 2026-07-13)*
  Obsolete: `page-rise`/`module-rise` appear nowhere in the rebuilt codebase; both `app.css` and the old catch-all's scoped copies were retired with the Waymark rebuild.
- [x] **#5** Replace @schedule-x with a custom Svelte calendar component `#improvement` `#ecxc` *(2026-05-20 → 2026-07-13)*
  Resolved by removal: the Waymark rebuild dropped the calendar feature and `@schedule-x` with it (STATUS docs sweep, 2026-07-06). No calendar component exists to replace.

- [x] **#18** Launch-time redirects: `/resources`, `/waiver` `#improvement` `#ecxc` *(2026-06-04 → 2026-07-13)*
  `/resources` → `/crewlab` and `/home` shipped with the Waymark rebuild (crawl-diff verified, STATUS 2026-07-05). `/waiver` closed differently than planned: the registration-forms pass (2026-07-13) retired the print-styled page and 301s `/waiver` → `/training`, where the digital waiver now lives inside the registration form.
- [x] **#17** Launch-time redirect `/home` -> `/` `#bug` `#ecxc` *(2026-06-04 → 2026-07-05)*
  Shipped in the Waymark rebuild: `/home` 301s to `/` (crawl-diff verified, STATUS 2026-07-05).
- [x] **#12** Tokenize the waiver page's hardcoded `--w-*` color palette `#improvement` `#ecxc` *(2026-05-24 → 2026-07-13)*
  Obsolete: the registration-forms pass deleted the print-styled `/waiver` page outright (the waiver is digital-only, rendered by `WaiverText.svelte` in design-system tokens; `/waiver` 301s to `/training`).

- [x] **#26** Retroactive rubric audit of the existing site pages `#improvement` `#ecxc` *(2026-06-06 → 2026-06-09)*
  Run `content-review` over each published page in `src/content/pages/` and record the band and score for each, as a one-time content-quality audit. The smoke test in the web-content authoring initiative scored About at Publish (93); the rest of the pages have not been run through the rubric. Capture the bands and scores, then hold or redraft any page that lands below Publish. This is the spec's out-of-scope item "Applying the rubric retroactively to the existing pages as a content audit."
  Run 2026-06-09 with five independent reviewer agents against the rubric and the new coach-voice corpus. Results: crewlab Publish 87, training Publish 87, volunteers Publish 83, home Hold 75, about Hold 72. No hard-gate hits. Recurring findings: negative-parallelism taglines, "Bold term: explanation" bullet architecture, participial benefit tags, the about.md philosophy grid (mission-statement register), the duplicated "When he's not..." bio closer. The two Hold pages are the natural first targets for hand editing, which also seeds the corpus's First-party gold section.

- [x] **#32** Admin "Could not authenticate with GitHub": ecxc Worker has no secrets `#bug` `#ecxc` *(2026-06-09 → 2026-06-09)*
  `npx wrangler secret list` on the `ecxc` Worker returns `[]`, so `GITHUB_APP_PRIVATE_KEY_B64` (the GitHub App key cairn signs its JWT with) is missing; the Worker was created fresh at the Rename 4 cutover and the old `ecnordic` Worker's secrets did not carry over. Fix: `npx wrangler secret put GITHUB_APP_PRIVATE_KEY_B64` with the App key per cairn's `docs/guides/rotate-the-github-app-key.md`, then retest an admin save. Also re-set `TURNSTILE_SECRET_KEY` and `CONTACT_EMAIL` if the contact form needs them (same empty list). GitHub-side state is verified good: repo renamed with the redirect active, App installation 135372268 intact.

- [x] **#29** Admin login 403s for a browser that sends no `Origin` header (cairn missing-Origin CSRF) `#bug` `#ecxc` *(2026-06-08 → 2026-06-08)*
  Fixed in cairn-cms `0.35.0`: cairn owns admin CSRF through a `__Host-cairn_csrf` double-submit token that tolerates a missing `Origin`, so the JS-free magic-link login works from a privacy browser. A failed check now serves a branded "Security check · Cairn" 403 in place of the raw SvelteKit text. ecnordic upgraded to `^0.35.0` and set `csrf: { checkOrigin: false }` in `svelte.config.js` (Pass 0.35). Verified on local dev: the login GET issues the token cookie + hidden `csrf` field, a no-`Origin` POST carrying a valid token passes the CSRF gate (reaches the editor lookup), and a POST with a missing or wrong token gets the branded 403. The original diagnosis lived at `~/Projects/cairn-cms/docs/cairn-dx-feedback-2026-06-08-ecnordic-login-csrf-missing-origin.md`.
- [x] **#28** Force HTTPS at the Cloudflare edge (cairn 0.34 deploy requirement) `#improvement` `#ecxc` *(2026-06-08 → 2026-06-08)*
  cairn-cms `^0.34.0` makes this a hard deploy requirement, so the magic-link login POST always carries an https scheme. Verified already configured on the ecnordic.ski zone (id `ee6d947a...`): "Always Use HTTPS" is `on`, HSTS is enabled (`max-age=63072000`, `includeSubDomains`), and `http://ecnordic.ski/admin/login` returns `301` to https. This closes the cross-scheme CSRF path from the 2026-06-07 DX report, but it did **not** make login work: the live failure is a missing-`Origin` header, a separate cause tracked as #29.
- [x] **#25** Finalize the Talkeetna camp packing list `#improvement` `#ecxc` *(2026-06-04 → 2026-06-05)*
  The real packing list replaced the `[PLACEHOLDER]` and draft list in the camp "What to pack" section of `src/content/pages/training.md`: sleeping bag and pillow, training clothes for cool and warm weather, rain gear, hang-out clothes, sock and clothing changes, a swimsuit and towel, running shoes, hill bounding poles, roller-ski kit (boots, skis, poles, helmet) if applicable, a water bottle with a carrier, hygiene items, daily medications, and optional personal food and snacks.
- [x] **#24** Confirm loaner equipment and fill the Training "What to bring" placeholder `#improvement` `#ecxc` *(2026-06-04 → 2026-06-05)*
  ECXC can lend roller skis, poles, and other gear to any athlete who needs it; the athlete just tells a coach. The `[PLACEHOLDER]` in the "What to bring" list and the "not provided" line in the Common questions FAQ were both replaced with that policy in `src/content/pages/training.md`.
- [x] **#6** Replace placeholder page content (about, resources) `#improvement` `#ecxc` *(2026-05-20 → 2026-06-04)*
  About was rewritten to the canonical facts in site-refresh Plan 2: the origin story, the full eligibility range, the schedule and camp dates, and the CrewLAB waiver, replacing the old placeholder copy. Resources was retired in the same plan, its waiver-and-forms content folded into CrewLAB and the page deleted. Both named pages are resolved. The Training page is still placeholder and is tracked with Plan 3; the one remaining CrewLAB collection placeholder is #21.

- [x] **#4** Add Sveltia CMS config for web-based editing by volunteers `#feature` `#ecxc` *(2026-05-20 → 2026-05-25)*
  Superseded by cairn-cms. Sveltia was never wired in; the dead `static/admin/` was removed
  in cairn Pass A (it shadowed the new `/admin` route as a static asset), and the magic-link
  cairn admin (passes A–C) is the web-editing surface now. Resolved by removal, not wiring.

- [x] **#11** Rename the welcome post file to drop the day `#improvement` `#ecxc` *(2026-05-24 → 2026-05-24)*
  Renamed `2026-05-14-welcome.md` → `2026-05-welcome.md` (URL `/2026/05/14-welcome` → `/2026/05/welcome`). Reconciled the filename convention: code (`posts.ts` `parseFilepath`) and CLAUDE.md use `YYYY-MM-slug`; fixed the contradicting `YYYY-MM-DD-slug` in `.claude/rules/content.md`.
- [x] **#10** Sveltia CMS config points at the wrong repo `#bug` `#ecxc` *(2026-05-24 → 2026-05-24)*
  Fixed `backend.repo` → `glw907/ecnordic-ski` and the `slug` template → `{{year}}-{{month}}-{{slug}}` (was the wrong day-bearing form). CMS still unwired; that's #4.
- [x] **#9** Remove unused font files from `static/fonts/` `#improvement` `#ecxc` *(2026-05-20 → 2026-05-24)*
  Deleted 22 unreferenced woff2 files (Cormorant, ETBook, iA Quattro, Iosevka, Karla, Lora, Monaspace, Spectral, + stray iA Mono italics). Kept only the 6 `@font-face`'d files: AlegreyaSans ×4, iAWriterMonoS Bold/Regular. (Nunito loads from Google.)

- [x] **#13** Remote-functions spike (`form()`) `#feature` `#ecxc` *(2026-05-24 → 2026-05-24)*
  Pass 9. Converted the contact form to a `form()` remote function (`src/lib/contact.remote.ts`, Valibot schema, Turnstile + Email Workers intact). Verified end-to-end on adapter-cloudflare (JS + no-JS paths) via `wrangler dev`. **Verdict: DEFER.** Works and ergonomically wins, but the API is experimental ("subject to change", no stable date) and additive per the core team. Contact stays the proving ground; don't migrate other surfaces until stable. See `docs/architecture.md`.

- [x] **#8** Replace regex-based HTML rewriting with a remark plugin `#improvement` `#ecxc` *(2026-05-20 → 2026-05-24)*
  Resolved by the Pass 5/6 directive pipeline: the `decorateAbout`/`wrapSections` regex surgery is deleted; rendering is now a remark/rehype AST pipeline (`src/lib/markdown/`).
- [x] **#7** Move the static-page HTML transform into the load/build layer `#improvement` `#ecxc` *(2026-05-20 → 2026-05-24)*
  Resolved by the Pass 5/6 directive pipeline: the transform runs at build inside `renderMarkdown` (called from `getPage`), not on client render. The old per-render `decorate*` functions are gone.
- [x] **#3** Set real Turnstile site key after domain is live `#improvement` `#ecxc` *(2026-05-20 → 2026-05-20)*
- [x] **#2** Full visual design pass (Pass 3: Nunito font, crimson/cobalt palette, hero grid, nav, news cards) `#improvement` `#ecxc` *(2026-05-20)*
