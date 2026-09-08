# ScorelineIQ — TODO (Claude & Agents Checklist)

Flat, ordered checklist mirroring IMPLEMENTATION_PLAN.md phases. Each
item should become one commit/PR, not a giant batch — keeps agent work
reviewable.

## Phase 0 — Foundations
- [x] Provision & harden VPS (SSH keys, UFW, fail2ban) — VPS at
      13.140.176.236 (Ubuntu 24.04). SSH key-only auth, password login
      disabled (including at the cloud-init level, which was silently
      re-enabling it), root SSH login disabled in favor of a `deploy`
      sudo user, UFW active (22/80/443 only), fail2ban active with a
      tuned jail.local, unattended-upgrades already on by default.
- [x] Cloudflare DNS + proxy for ScorelineIQ.com — zone active, Namecheap
      nameservers switched, A records for `@` and `www` point at the
      VPS with the orange-cloud proxy on; verified both resolve to
      Cloudflare's edge
- [x] Install Docker + Docker Compose on VPS (v29.8.0 / Compose v5.5.1,
      `deploy` user in the `docker` group, service enabled on boot)
- [x] Scaffold Next.js 15 + TypeScript + Tailwind repo
- [x] Scaffold Prisma schema: `League`, `Team`, `Fixture`, `Prediction`,
      `Result`, `AccuracyStat`
- [x] Scaffold FastAPI prediction-engine skeleton (health check only)
- [x] Write `docker-compose.yml` (web, api, postgres, redis)
- [x] GitHub repo + branch protection + Actions skeleton (lint/build)
- [x] Sign up for Football-Data.org free tier, store API key in `.env`

## Phase 1 — Data Pipeline
- [x] `ingest-fixtures` job (fetch next 48h, upsert into Postgres)
- [x] `sync-teams-and-form` job (weekly standings/form refresh)
- [x] `score-results` job (pull final scores, write `Result`)
- [x] Wire scheduling for the above (cron, not BullMQ — see
      `infra/crontab`; no persistent worker needed at this scale)
- [x] Sentry integration for job failures (no-ops until `SENTRY_DSN`
      is set)

## Phase 2 — Prediction Engine
- [x] Implement Dixon-Coles/Poisson goal model in FastAPI
- [x] Add Elo-style team-strength adjustment
- [x] Output 1X2 / correct score top-3 / O-U 2.5 / BTTS probabilities
- [x] Persist predictions per fixture, generated on a daily schedule
      (`generate-predictions` job; add to `infra/crontab` once daily
      cadence is confirmed against real cron runs)
- [x] `nightly-accuracy` job (score predictions vs results, roll up
      accuracy stats by league/market/window)
- [x] Backtest against 2–3 months historical data; confirm beats naive
      baseline before going live (`scripts/backtest.py` — 52.0% 1X2 vs
      44.6% naive baseline across 204 matches, 3 leagues; see commit
      for full per-league breakdown)

## Phase 3 — Public Site / SEO
- [x] Homepage template (today/tomorrow fixtures, sorted by kickoff)
- [x] Day-archive page template (`/predictions/[date]`)
- [x] League-hub page template (`/league/[slug]`)
- [x] Match-page template (`/match/[slug]`) with unique narrative text
- [x] Accuracy page template (`/accuracy`)
- [x] Static trust pages: about, how-it-works, privacy, terms,
      responsible-gambling
- [ ] Contact page — deferred, no real contact address/method exists
      yet to put on it
- [x] Structured data (SportsEvent, BreadcrumbList, FAQ schema on
      league hubs)
- [x] ISR wiring: time-based `revalidate` per page, plus on-demand
      `/api/revalidate` called by score-results/generate-predictions
      after they write new data
- [x] Sitemap generation (`app/sitemap.ts`, dynamic — regenerates on
      every request rather than a separate daily job; chunking deferred
      until fixture volume is large enough to need it)
- [ ] Submit sitemap to Google Search Console + Bing Webmaster Tools —
      needs a live domain and the user's GSC/Bing accounts
- [x] Reserve fixed-height ad slot containers (no ads yet)

## Initial production deploy (2026-09-09)

Live at <https://scorelineiq.com>. `docker-compose.prod.yml` adds a Caddy
reverse proxy (automatic Let's Encrypt HTTPS for both apex and `www`)
and binds Postgres/prediction-api/web to `127.0.0.1` rather than the
public interface — cron jobs still run via host-installed npm (the
web image's standalone build has no tsx/devDependencies) so they need
loopback access, but nothing is reachable from outside except Caddy on
80/443. Deployed by building on the VPS directly from a git clone
(`infra/scripts/deploy.sh`), not via `.github/workflows/deploy.yml`'s
GHCR-pull path, which needs registry-push secrets that aren't
configured. Real data seeded: `ingest-fixtures`, `sync-teams-and-form`,
and `generate-predictions` all run successfully against production;
`infra/crontab` installed for ongoing automation.

Three real bugs only surfaced during this first deploy (all fixed, see
commit history): the web image's Dockerfile never ran `prisma
generate`, causing a Docker-build-only TypeScript failure; three pages
(`/`, `/accuracy`, `sitemap.xml`) were statically prerendered with live
Prisma queries that a Docker build has no database access to run —
switched to `force-dynamic`; and `REVALIDATE_SECRET` was never actually
passed into the web container's environment, silently breaking
on-demand ISR (non-fatal, but not what was verified locally).

## Phase 4 — Monetization
- [ ] Apply for Google AdSense (after ≥20–30 quality indexed pages +
      trust pages live)
- [ ] Fallback: set up Ezoic if AdSense delayed/rejected
- [ ] Wire ad units into reserved slots
- [ ] Add labeled bookmaker-affiliate comparison module
- [ ] Add privacy-friendly analytics (Cloudflare Web Analytics or
      Plausible)
- [ ] Re-check Core Web Vitals with ads live

## Phase 5 — Growth
- [ ] Upgrade data-API tier for more league coverage
- [ ] Add country/market landing pages (Nigeria, Kenya, Netherlands,
      US, Colombia — mirroring Forebet's traffic mix)
- [ ] Internal linking automation across hub/match/accuracy pages
- [ ] A/B test ad density vs. bounce rate
- [ ] Quarterly model re-tuning
- [ ] Re-evaluate VPS size / horizontal scaling threshold

## Recurring (every deploy)
- [ ] Typecheck + lint + unit tests pass in CI before merge
- [ ] Smoke test `/`, `/accuracy`, one match page after deploy
- [ ] Confirm no console/Sentry errors introduced

## Recurring (weekly, human review)
- [ ] Search Console coverage/errors check
- [ ] Accuracy page sanity check
- [ ] Data-API quota usage check
- [ ] Sentry error review
