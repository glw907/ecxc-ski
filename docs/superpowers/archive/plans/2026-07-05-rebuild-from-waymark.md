# ecxc.ski: rebuild from Waymark on 0.80.0

> The second rebuild (after 907.life; its plan and the rebuild-waymark branch there are the
> precedent). Same bars: permalinks exact, visuals quite close and ultimately improved
> (especially responsive), template/component friction lands in the cairn-cms DEFAULTS.
> Production deploy HELD for Geoff. Ground truth: the six-heading inventory (2026-07-05).

**The architecture:** fresh Waymark scaffold on `^0.80.0`; the ecxc identity (fireweed/
spruce/black-spruce oklch palette, Alegreya Sans + iA Writer Mono S) as the third theme
layer; the eighteen legacy directive types rationalized into Waymark's starter set plus a
small ecxc-declared domain set; the photos finally migrated INTO the media library.

## Judgment calls, locked in this plan

- **The `/home` duplicate and the unwired redirects:** the rebuild wires the site's own
  backlogged intent (#17 `/home` → `/` 301; #18 `/resources` and legacy `/waiver` paths →
  `/crewlab` where content moved) — a redirect preserves the URL contract while fixing the
  duplicate. Every other URL reproduces exactly.
- **The waiver stays a bespoke route but joins the design system** (fixes backlog #12): the
  print-styled legal layout re-expressed in tokens, no hardcoded palette, no Google Fonts
  fetch (self-host or system).
- **Directive rationalization:** alert, cta, faq map to Waymark's components directly;
  aside and passage map to callout and pull-quote where the content's intent matches
  (content-preserving edits, reviewed per instance); the DOMAIN set — programs/program,
  week/day, spectrum/zone — stays ecxc-declared via `defineComponent` (the charter's
  site-owned component model, exercised for real); card/grid/split/panel/section are the
  old layout vocabulary — map each usage to the nearest semantic (most are panels around
  prose; expect callout or plain sections), declare a leftover only if content genuinely
  needs it. Every schema the v2 grammar can't express is a COMPONENT-FRICTION finding.
- **The CrewLAB placeholder string** (backlog #21) is content Geoff must supply; the
  rebuild carries it forward verbatim and flags it in the morning report, not invents it.

### Task 1: Scaffold and config
Fresh Waymark copy on the `rebuild-waymark` branch; wrangler config carried (ASSETS,
SEND_EMAIL, EMAIL remote, AUTH_DB cairn-ecxc-auth, MEDIA_BUCKET ecxc-media, observability);
secrets by name only; the v2 adapter: `posts` (title, date, description, tags with
`taxonomy: true`, draft; permalink `/:year/:month/:slug`, month datePrefix) and `pages`
(title; `/<id>`); `githubApp(...)`; the POST_TAGS list becomes the site vocabulary.
**Acceptance:** registry build green; dev-backend admin sign-in works.

### Task 2: Content migration and directive rationalization
The six entries migrate; the four directive-using pages get their content-preserving
directive mapping per the locked calls; the domain components (programs, week/day,
spectrum/zone) declared via `defineComponent` with honest schemas and renders in the ecxc
idiom; training.md (the heaviest nesting) is the acceptance fixture.
**Acceptance:** every page renders with intent preserved (side-by-side against live);
the insert menu shows the ecxc set; component-friction findings recorded per schema fought.

### Task 3: The bespoke surface
/contact (Turnstile + SEND_EMAIL) ported; /archives, /tags, /tags/[tag] on current exports
(the 907 pattern); the waiver re-expressed in-system; the planned redirects wired; Pagefind
per the 907 port; sitemap carries the site-added routes (the 907 finding's answer applies).
**Acceptance:** crawl diff green with the two redirect improvements as the only deltas,
each returning 301 to the right target.

### Task 4: The ecxc theme and media migration
`ecxc-theme.css` over neutral Waymark (the oklch trio, the self-hosted faces, dark via the
template's toggle — inherited now, not hand-built); the hero and profile photos migrated
into the media library (real R2 references, alt text written, the manifest regenerated) —
the first real media-library usage across the two sites.
**Acceptance:** side-by-side quite-close; media library shows real assets with usage.

### Task 5: Gates, verification, held deploy
Site gate green; permalink crawl diff (with the sanctioned redirect deltas); responsive
spot-check at 320/1440/2560 beating the live site; local admin smoke prep; CHANGELOG/STATUS;
the consolidated TEMPLATE + COMPONENT findings report (both rebuilds' harvest, ranked, for
the morning). **Deploy waits for Geoff.**
