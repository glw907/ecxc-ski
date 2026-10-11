When the user says "continue development", "next pass", "start the
next pass", "finish pass", "ship pass", or "continue" in the context
of ecxc-ski's own roadmap, invoke the `site-pass` skill, which runs on
`pass-core` (risk classes, one executing session, a fast lane per task,
the full suite once at close, PR and STATUS as the ledgers).
cairn-cms is a separate standalone repo; this site consumes
`@glw907/cairn-cms` from the npm registry by version range.

## Keep the backlog current

`BACKLOG.md` uses the `/log-issue` structured format (numbered `**#N**`
items, `#type`/`#ecnordic` tags, dates, grouped under High/Medium/Low/Done).
Use that format for new items, never plain bullets.

When work completes something tracked in the backlog, close it in the same
pass: mark `[x]`, move it to `## Done` with a completion date, and verify it's
actually done (check real state, don't assume) before closing. Don't leave
resolved items sitting open.
