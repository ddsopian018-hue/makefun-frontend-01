# makefun-frontend-01

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/jolly-owl-87/makefun-frontend-01/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/jolly-owl-87/makefun-frontend-01/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

Boardroom is a fast, light, read-only frontend for make.fun built from plain static files with no framework and no build step. It shows the live bounty board (each bounty's live pot, entry fee, time left and entry count, with search, sorting and paging), a bounty's page (summary, rules, the live rewards table and dates), that bounty's leaderboard (judge win rates, validity and entry sizes, paged), and an account's public profile (record, placed entries and payouts) — every surface on its own hash route, every answer cached and revalidated with its ETag, and the leaderboard and profile code loaded only when a route asks for it.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. To hand the entry in the way the grader does: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` copies `app/` and `screenshots/` to `out/` and writes `out/dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=0njr0f8w&utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
