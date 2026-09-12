# AI Operational Rules (supplement)

General rules: `~/.claude/instructions/ai-operational-rules.md`. This file carries only
what is specific to this repo.

---

## Secrets in this repo

`RESEND_API_KEY` is a secret for this repo, sourced from `~/.local/secrets`:

```bash
RESEND_KEY=$(bash -c 'source ~/.local/secrets && echo -n $RESEND_API_KEY')
```

---

## Deployment: Normal vs. Manual

**Normal deploy:** `git push origin main` into GitHub Actions builds and deploys.

**Never run `npx wrangler deploy` from the project root during normal workflow, for this
Actions-deployed site.** It overwrites the Actions-managed deploy with a stale local build.

Manual deploy only for emergencies (Actions is broken):

```bash
npm run build && npx pagefind --site .svelte-kit/cloudflare && npx wrangler deploy
```
