# ScorelineIQ — Operating Workflow

Two workflows run continuously once live: the **content/data workflow**
(runs itself, daily) and the **development workflow** (how changes get
made to the codebase, by you and by Claude/agents).

---

## 1. Daily Content Pipeline (automated, no human step)

```
06:00 UTC  ingest-fixtures job
           → pulls next 48h of fixtures from data API into Postgres

06:15 UTC  sync-teams-and-form job (if stale > 24h)
           → refreshes team form, standings, H2H

06:30 UTC  generate-predictions job
           → calls prediction-engine (FastAPI) for every new fixture
           → writes 1X2 / correct score / O-U / BTTS + confidence

06:45 UTC  build-match-pages job
           → triggers ISR regeneration for new/updated match pages
           → regenerates day-archive and league-hub pages

07:00 UTC  regenerate-sitemap job
           → rebuilds today's sitemap chunk, pings Google/Bing

--- match kicks off / finishes throughout the day ---

+2h after   score-results job
kickoff     → pulls final score for finished fixtures
            → triggers match-page ISR refresh (adds result banner)

23:30 UTC  nightly-accuracy job
           → scores yesterday's predictions vs results per market
           → updates rolling accuracy_stats table
           → regenerates /accuracy page
```

All jobs are idempotent (safe to re-run) and alert to Sentry on failure.
A failed `generate-predictions` run should never take down the site —
match pages simply show "prediction pending" until the next retry.

## 2. Development Workflow (how code changes ship)

1. **Branch** off `main` for any change (`feat/…`, `fix/…`).
2. **Local/agent dev loop**: Claude or the developer makes the change,
   runs `docker compose up` locally (or in a dev container) against a
   seeded test DB — never against production data.
3. **PR opened** → GitHub Actions runs: typecheck, lint, unit tests,
   build. A human (you) reviews and approves.
4. **Merge to `main`** → GitHub Actions builds Docker images, pushes to
   GitHub Container Registry, SSHes into the VPS, runs
   `docker compose pull && docker compose up -d`.
5. **Post-deploy check**: Uptime Kuma / a smoke-test script hits `/`,
   `/accuracy`, and one match page to confirm 200s before considering
   the deploy done.
6. **Rollback**: `docker compose` keeps the previous image tag available
   — revert by redeploying the prior tag if a deploy breaks something.

## 3. Weekly/Monthly Human Checkpoints

- **Weekly**: check Search Console coverage/errors, check accuracy page
  looks sane, check Sentry for recurring errors, check data-API usage
  against plan quota.
- **Monthly**: review ad RPM and affiliate clicks, decide whether to
  upgrade the data-API tier (more leagues) or VPS size, re-tune the
  prediction model if accuracy has drifted, review AdSense policy
  center for any warnings.

## 4. Incident Response (minimal, one-person scale)

- Site down → Uptime Kuma alert (email/Telegram) → check
  `docker compose ps` on VPS, check Cloudflare status, check Sentry.
- Predictions missing for the day → check `generate-predictions` job
  logs first (most common failure point: data-API rate limit or schema
  change from provider).
- AdSense policy warning → immediately pause the flagged ad unit/page
  type via AdSense dashboard while investigating, don't wait.
