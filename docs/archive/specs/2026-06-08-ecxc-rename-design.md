# Rebrand: East Community Nordic (ecnordic.ski) to East Community Cross Country (ecxc.ski)

The site rebrands from East Community Nordic to East Community Cross Country, and the domain moves from
`ecnordic.ski` to `ecxc.ski`. The site is in unannounced beta, so brief disruption and data loss in the
auth store are acceptable. The work runs as a series of passes.

## Decisions

- **Name.** Full name on first reference: East Community Cross Country. Short form after: ECXC. This
  reverses the old "never ECN" rule for the new brand.
- **Sport word.** The org name is a hard rename. The sport itself stays flexible: "nordic skiing",
  "cross-country skiing", and "XC skiing" are all acceptable and vary by context. The sweep does not
  blanket-replace "nordic" in sport references.
- **Brand mark.** A four-spot grid logo, "EC" over "XC", with the two C's stacking on the right. The
  detailed visual design is its own pass run through `frontend-design`.
- **Domain.** `ecxc.ski` is registered and its Cloudflare zone is active
  (`3de7acd16b3a1fab5bafa2a46c3b0243`). DNS, the Worker custom domain, and the redirect are wired through
  the Cloudflare API.
- **Redirect.** `ecnordic.ski` 301-redirects to `ecxc.ski` through a Cloudflare Redirect Rule on the old
  zone, so old links keep working.
- **Auth store.** A new D1, `cairn-ecxc-auth`, replaces `cairn-ecnordic-auth`. The schema is dumped from
  the existing database and applied to the new one. The allowlist is seeded with one owner,
  `geoff@907.life`. The old database is decommissioned after cutover.
- **Repo.** The GitHub repo renames to `ecxc-ski` and the local directory to `~/Projects/ecxc-ski`, last,
  because it changes the session's working directory.

## Pass series

Each pass ends with the standard site-pass consolidation (gate green, STATUS, commit, push). The live site
stays served on `ecnordic.ski` until the domain cutover, so no pass before Rename 4 changes the domain,
route, or Worker name.

### Rename 1: identity sweep (names, content, docs)

Rename the org name and brand strings everywhere, with no infra or domain change.

- `src/lib/site.config.yaml`: `siteName: ECXC`, `author: ECXC`, reworded `description`,
  `email.senderName: ECXC Contact`, `footer.copyrightName: East Community Cross Country`. Leave `url`,
  `email.sender`, and the `wrangler.toml` route, Worker name, and `PUBLIC_ORIGIN` on `ecnordic.ski` (they
  flip in Rename 4).
- `src/content/**`: org-name rename. Sport references left to read naturally.
- `Nav.svelte`: the wordmark becomes a plain "ECXC" placeholder. The grid logo lands in Rename 5.
- Naming convention rewritten in `docs/content-guide.md`, `.claude/rules/content.md`, and `CLAUDE.md`.
- Other `ecnordic` (non-domain) references in code and docs.

Gate: check, test, build. Deploys to `ecnordic.ski`, now branded ECXC.

### Rename 2: audience broadening (content)

Adjust the page copy so it welcomes high school cross-country runners alongside skiers, the reason for the
rename. Most pages already name both, so this pass makes the framing consistent (home and training
especially). Draft and review through the `content-draft` and `content-review` skills, against the
runner-and-skier audience rule now in `docs/content-guide.md`. Content only, no infra.

Gate: check, test (snapshots regenerated), build.

### Rename 3: new auth D1

- Create `cairn-ecxc-auth`. Apply the schema dumped from `cairn-ecnordic-auth`
  (`SELECT sql FROM sqlite_master`). Seed one owner row, `geoff@907.life`.
- Point the `wrangler.toml` D1 binding at the new `database_id`.

Gate plus a deployed admin check on `ecnordic.ski`. The old database stays until Rename 4.

### Rename 4: domain cutover and redirect

- Wire `ecxc.ski` DNS and the Worker custom domain through the Cloudflare API.
- Flip `site.config.yaml` `url` and `email.sender`, plus `wrangler.toml` `PUBLIC_ORIGIN`, `route`, and
  Worker `name` (`ecnordic` to `ecxc`).
- Add the `ecnordic.ski` to `ecxc.ski` 301 Redirect Rule.
- Verify: `ecxc.ski` serves, `ecnordic.ski` 301s, and the magic-link login works end to end on the new
  domain against the new D1.
- Decommission the old Worker route and the `cairn-ecnordic-auth` database.

### Rename 5: brand logo (frontend-design)

The four-spot grid monogram in `Nav.svelte` and a matching SVG favicon (`static/` has none today),
designed through `frontend-design`. Replaces the Rename 1 placeholder.

### Rename 6: repo and local directory rename

`gh repo rename ecxc-ski`, update the git remote, then `mv ~/Projects/ecnordic-ski ~/Projects/ecxc-ski`.
Runs last, because it moves the working directory out from under the session. The session resumes in the
new path.

## Risks and sequencing

- The repo auto-deploys on push, so the domain, route, and Worker name stay on `ecnordic.ski` until Rename
  4 to keep the live build serving.
- Renaming the Worker creates a new Worker and orphans the old one. Rename 4 removes the old route and
  serves `ecnordic.ski` through the redirect rule, not a Worker.
- The new D1 swap (Rename 3) points the live admin at a near-empty store. Acceptable in beta with
  `geoff@907.life` seeded as owner.
