# ecxc.ski: Project Status

## Current state (2026-07-05)

Rebuilt from scratch on the Waymark starter template and `@glw907/cairn-cms ^0.80.0` (the
rebuild-from-Waymark plan, five tasks, 2026-07-05). The v2 adapter idiom, thirteen rationalized
directive types (down from eighteen) plus ecxc's own domain component set (programs, week/day,
spectrum/zone), the waiver rejoining the design system, and an inherited theme toggle. Every
permalink the pre-rebuild sitemap listed reproduces exactly except two sanctioned launch
redirects. **The production deploy is HELD for Geoff's go**; the rebuild is fully gated and
verified locally but not pushed or deployed. The engine's rolling status is
`../cairn-cms/docs/STATUS.md`.

> **Pass: rebuild from Waymark (done, deploy held).** Plan:
> `docs/superpowers/plans/2026-07-05-rebuild-from-waymark.md`. Five tasks: (1) bumped to
> `^0.80.0` and migrated the adapter to the v2 idiom (`defineConcept`/`fieldset`,
> `githubApp(...)`, the nested rendering group), keeping the site's own bespoke `app.css` and
> chrome rather than a fresh scaffold copy, an in-place upgrade rather than a template swap; (2)
> rationalized the eighteen legacy directives into thirteen (`alert`/`cta`/`faq` on Waymark's
> starter shapes, `card` and `passage` collapsed into one, `split`/`panel`/`section` retired to
> plain passages and headings, the `programs`/`week`/`spectrum` domain set carried over
> unchanged), migrated all six content entries with training.md as the acceptance fixture; (3)
> wired the two launch redirects (`/home` → `/`, `/resources` → `/crewlab`), tokenized the
> waiver's hardcoded hex palette to oklch, and patched the sitemap's missing `/archives`; (4)
> landed the inherited theme toggle (a bare `cairn-site-theme` cookie, the same mechanism
> 907.life and the showcase carry) and self-hosted Nunito, and migrated the hero and profile
> photos into the media library (real R2 references, content-hashed delivery); (5) this pass's
> gate, crawl diff, responsive spot-check, and local admin smoke, closing the loop.
>
> **The permalink crawl diff (Task 5).** Every URL on the live `https://ecxc.ski/sitemap.xml`
> (11 entries) plus `/feed.xml`, `/feed.json`, and `/robots.txt` served the same HTTP status on
> the local rebuild, with exactly the two sanctioned deltas: `/home` (live 200, rebuilt 301 to
> `/`) and `/resources` (live 404, rebuilt 301 to `/crewlab`). Every other URL—`/`, `/about`,
> `/archives`, `/contact`, `/crewlab`, `/tags`, `/tags/announcements`, `/training`,
> `/volunteers`, `/waiver`, `/2026/05/welcome`—served 200 on both. One incidental,
> non-regressive finding: the rebuilt `sitemap.xml` also gains `/archives` (a route that was
> already live but missing from the old hand-listed sitemap, the identical gap 907.life's
> rebuild independently hit and fixed the same way) and correctly drops `/home`, now a redirect
> target. `feed.xml` gained a `<category>` element per post tag, an engine-side improvement from
> the version bump rather than a site change.
>
> **The responsive spot-check (Task 5) found and fixed a real regression before this pass
> closed.** Screenshots at 320/1440/2560 on home, training, and the waiver first looked clean
> under a naive capture, but a `document.documentElement.scrollWidth` check (the method
> 907.life's rebuild used) at 320px caught `/waiver` rendering at 425 to 453px, well past the
> viewport—live and rebuilt alike (**not a rebuild regression**: the live site overflows to the
> identical 452px). Root causes, by contribution: the `.page::after` "DRAFT" watermark's fixed
> 96pt rotated text forced the widest overflow regardless of viewport (the dominant cause);
> `.section-title`'s `white-space: nowrap` forced long section headings past the column; and the
> print page's fixed 0.75in horizontal padding plus a `.doc-header` flex row with no wrap left
> almost no room on a phone screen. All four fixed, scoped to the waiver route's own `<style>`
> block under its existing `@media (max-width: 8.5in)` breakpoint (the `@media print` block
> re-asserts the inch measurements for actual printing, untouched): the watermark shrinks to
> 42pt, the section title wraps instead of forcing width, the page padding drops to
> `1.25rem 1rem`, and the header stacks instead of forcing two blocks side by side. Re-verified:
> `scrollWidth` is 312 (no overflow) on every one of the nine spot-checked routes at 320px, the
> waiver's mobile reading surface is now measurably better than the live site's (which still
> overflows), and the 1440/2560 renders are visually unchanged. A separate, non-bug finding: the
> first capture pass (before adding `--force-prefers-reduced-motion`) showed the training page's
> `passage`/`alert` modules invisible—a screenshot-timing artifact of the site's CSS entrance
> animation (the `data-rise` cascade, `animation-fill-mode: both`) racing the headless capture,
> not a rendering defect; forcing reduced motion for the check resolved it.
>
> **The local admin smoke (Task 5), as far as it goes without production.** Per
> `../cairn-cms/docs/internal/admin-smoke-test.md`: the local D1 (`cairn-ecxc-auth`) has the auth
> schema and the seeded owner (`geoff@907.life`); a session row minted and inserted cleanly. But
> `wrangler.toml` declares a `custom_domain` route (`ecxc.ski`), so under `wrangler dev` the
> Worker resolves `event.url` to the production origin regardless of the local request host, and
> the guard's deployed-http branch sends every `/admin` request (anon or authed) to the "HTTPS
> required" page, exactly as the smoke doc predicts and exactly as 907.life's rebuild hit. The D1
> session mechanism itself is proven; the authed checklist needs the deployed https Worker, which
> is Geoff's step per the held-deploy boundary. Session row cleaned up.
>
> **Full gate, every task.** `npm run check`: 0 errors, 0 warnings (551 files). `npm test`: 37/37
> passed, exit 0. `npm run build`: green (adapter-cloudflare output built; two upstream
> `INVALID_ANNOTATION` Rolldown warnings from `@glw907/cairn-cms`'s shipped `.svelte` files are
> informational, matching 907.life's identical finding).

### Template findings (consolidated, ranked; both rebuilds' harvest)

Reported back to cairn-cms per the plan's harvest step. Ranked by how much it would bite the
next Waymark-based rebuild; items also filed by 907.life's rebuild are marked so.

1. **No custom rehype/render seam on the render pipeline (also filed by 907.life).** ecxc did
   not independently need a post-render hook this pass (no table-scroll equivalent to wire), but
   Task 2's directive rationalization confirms the same shape of gap from a different angle: a
   site's own component `build()` functions run inside the engine's fixed pipeline with no
   extension point beyond the registry itself. Recommend the fix 907.life already proposed: an
   optional rehype-plugins parameter on the render pipeline factory.
2. **The engine's sitemap surface only sees concept-derived routes (also filed by 907.life,
   independently hit here too).** `sitemapResponse` and the site resolver hand back concept
   permalinks only; ecxc's site-owned `/archives`, `/tags`, `/tags/[tag]`, `/contact`, `/waiver`
   are all invisible to it and hand-listed in the site's own `sitemap.xml`, with nothing tying
   that list to the route tree—exactly how `/archives` went missing from the pre-rebuild
   sitemap in the first place. Two independent sites hitting the identical gap is a strong
   signal: an optional extra-static-routes list, or a build check flagging an undeclared route
   directory, is worth an engine-side answer before a third site adds its own routes.
3. **A scaffold-copy checklist gap can hide a render-time or responsive contract across a whole
   pass (pattern match to 907.life's table-scroll finding, different mechanism).** 907.life's
   rebuild found a CSS class documented as needing a paired render step that rode unwired for
   several tasks with no error. ecxc's rebuild did not reproduce that specific defect, but this
   pass's own find—the waiver's fixed-inch print CSS never getting a narrow-viewport pass
   across the four tasks that touched the page—is the same shape of gap: nothing in the plan's
   task acceptance criteria named a responsive check, so it rode along until an explicit
   `scrollWidth` check caught it in the closing task. Two sites landing in the same shape of gap
   from different CSS mechanisms suggests the fix is procedural (an explicit responsive-check
   line in a rebuild plan's earlier task acceptance, not only the closing gate task) as much as
   it is an engine feature.
4. **The v2 grammar's `fields.url` cannot express an internal link.** `URL_RE` requires an
   absolute `http(s)` URL, so a `cta`'s or `program`'s href/url attribute—which routinely wants
   an in-page anchor, a site-relative path, or a `cairn:` reference—cannot use `fields.url` at
   all; every such attribute in ecxc's registry is a `fields.text` with a hand-rolled pattern
   (`^(#|/|cairn:|https?://)`) instead. Worth a `fields.link` (or a widened `fields.url`) that
   accepts the same four forms out of the box; this is not an ecxc-specific need, any site with
   an in-page CTA or anchor-linked nav hits it.
5. **Theme toggle: already landed, closing the loop (907.life's finding, ecxc consumes it
   unchanged).** 907.life's rebuild asked for the manual light/dark toggle to land in the
   template itself; it did, at cairn-cms `main` (held, unpublished). ecxc's own Task 4 confirms
   the mechanism generalizes to a second site with a completely different palette
   (fireweed/spruce vs. 907's cream/aurora-green): a bare `cairn-site-theme` cookie, no rename,
   both sites' own `resolveTheme()`/`toggleTheme()` shape ports unchanged.

### Component findings (ecxc-specific; the eighteen-to-thirteen rationalization)

The directive rationalization (Task 2) is a live test of the v2 component grammar against a
denser, older content set than 907.life's eight posts. What fought the grammar, ranked:

1. **No rich-body CTA.** Waymark's starter `cta` is attribute-only (label, url, variant); the
   pre-rebuild `cta` was a titled card wrapping rich markdown (an intro, an embedded link, a
   postscript). The rationalization moves the framing prose to plain paragraphs around a bare
   `:::cta:::` and drops the card body entirely, a real capability loss for a site that wants a
   call-to-action with supporting copy in the same visual unit, not only a button.
2. **No `newTab` on the starter `cta`.** An external app-install link (ecxc's CrewLAB) needs to
   open in a new tab; Waymark's `cta` has no attribute for it. ecxc added its own `newTab`
   boolean. Not an unusual need (any site linking to an external app or partner site hits it);
   worth folding into the starter shape.
3. **No anchor-id on `callout`.** ecxc's old `aside`/`card` occasionally served as a deep-link
   target (a footnote's `#gloss-*` destination). Waymark's `callout` has no `id` attribute for
   this; ecxc's own `aside` (kept as a small leftover specifically because `callout`'s intent,
   drawing attention, is the opposite of a quiet gloss) carries its own `id`. A footnote/gloss
   primitive is plausibly out of scope for the starter set, but an `id` attribute on `callout`
   itself, for any component used as a link target, is a small, generally useful addition.
4. **`card`'s `role` attribute was dead weight.** Collapsing `card` and `passage` into one
   `passage` surfaced that `card`'s declared `role` attribute was never read by its own `build()`,
   a component schema and its build function had drifted apart with nothing to catch it. Worth a
   lint or a runtime dev-mode warning when a declared attribute is never read inside `build()`.
5. **The domain set (`programs`/`program`, `week`/`day`, `spectrum`/`zone`) carried over with an
   unchanged shape, no friction.** This is exactly the shape `defineComponent` is for: a
   site-owned, honestly scoped vocabulary the starter set was never going to include. No engine
   change suggested here; it is the charter working as intended.

**Follow-ups (carried).** BACKLOG.md's #12, #17, and #18 (the waiver tokenization and the two
launch redirects) are functionally resolved by this pass, but the backlog file itself is
unedited (out of this task's scope; a housekeeping pass should close them). The CrewLAB
collection-model placeholder (#21) and the pre-publish confirmations below are unchanged,
carried forward verbatim per the plan, not invented here. The full authed `/admin` checklist
needs the deployed https Worker (see the local admin smoke note above) and is Geoff's step
alongside the held deploy itself.

---

## Next starter prompt (the held deploy)

> **Goal.** Deploy the rebuild-from-Waymark pass to production, replacing the cairn `^0.62.2`
> app.
>
> **Settled (do not re-brainstorm).** Every gate in this file is green locally: `npm run check`
> (0/0), `npm test` (37/37, exit 0), `npm run build`, the permalink crawl diff (two sanctioned
> redirects, everything else exact), and the 320/1440/2560 responsive spot-check (a real waiver
> overflow found and fixed, now beating the live site). The wrangler bindings (custom domain,
> `AUTH_DB`, `EMAIL`, `MEDIA_BUCKET`, `ASSETS`, `SEND_EMAIL`) carry over unchanged.
>
> **Geoff's steps, in order.** (1) Review the `rebuild-waymark` branch and this pass's findings.
> (2) Resolve the pre-publish checklist below (the CrewLAB confirmations and the attorney review
> are unchanged by this rebuild). (3) Push and deploy. (4) Run the full authed `/admin` checklist
> against the deployed `https://ecxc.ski` Worker (the local smoke only proved the D1 session
> mechanism). (5) A real magic-link login in a browser, the one thing no scripted smoke can
> replay. (6) Decide whether to publish the held cairn-cms window (the theme toggle plus
> whatever else has accumulated) alongside or separately from this site's own deploy.

---

## History

- **Rebuild from Waymark (2026-07-05).** Fresh adapter on cairn `^0.80.0`, eighteen directives
  rationalized to thirteen, launch redirects wired, waiver tokenized and made responsive, theme
  toggle inherited, hero/profile photos into the media library. Deploy HELD for Geoff.
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
| cairn 0.50–0.56.2 | Single-mount admin + component-picker system | ✓ Done |
| cairn 0.57–0.62.2 | Media end to end + additive editor/help bumps | ✓ Done |
| Rebuild from Waymark | Fresh adapter on cairn `^0.80.0`, deploy HELD | ✓ Done (2026-07-05) |

### Pre-publish checklist (gate before announcing)

- Magic-link login confirmed on ecxc.ski, then old `cairn-ecnordic-auth` D1 decommission.
- Attorney review of the waiver.
- CrewLAB confirmations: join link and signing flow (#22), collection model (#21, live `[ASK]`).
- ~~Launch-time redirects: `/resources` and `/home` (#18, #17).~~ Wired in the rebuild's Task 3;
  verified in the Task 5 crawl diff.

**Deploy:** Live at **https://ecxc.ski** (the pre-rebuild app, cairn `^0.62.2`). The rebuild
branch (`rebuild-waymark`) is gated and ready; push and deploy are Geoff's step.
