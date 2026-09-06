# ScorelineIQ — TODO (Claude & Agents Checklist)

Flat, ordered checklist mirroring IMPLEMENTATION_PLAN.md phases. Each
item should become one commit/PR, not a giant batch — keeps agent work
reviewable.

## Phase 0 — Foundations
- [ ] Provision & harden VPS (SSH keys, UFW, fail2ban)
- [ ] Cloudflare DNS + proxy for ScorelineIQ.com
- [ ] Install Docker + Docker Compose on VPS
- [ ] Scaffold Next.js 15 + TypeScript + Tailwind repo
- [ ] Scaffold Prisma schema: `League`, `Team`, `Fixture`, `Prediction`,
      `Result`, `AccuracyStat`
- [ ] Scaffold FastAPI prediction-engine skeleton (health check only)
- [ ] Write `docker-compose.yml` (web, api, postgres, redis)
- [ ] GitHub repo + branch protection + Actions skeleton (lint/build)
- [ ] Sign up for Football-Data.org free tier, store API key in `.env`

## Phase 1 — Data Pipeline
- [ ] `ingest-fixtures` job (fetch next 48h, upsert into Postgres)
- [ ] `sync-teams-and-form` job (weekly standings/form refresh)
- [ ] `score-results` job (pull final scores, write `Result`)
- [ ] Wire BullMQ + Redis scheduling for the above
- [ ] Sentry integration for job failures

## Phase 2 — Prediction Engine
- [ ] Implement Dixon-Coles/Poisson goal model in FastAPI
- [ ] Add Elo-style team-strength adjustment
- [ ] Output 1X2 / correct score top-3 / O-U 2.5 / BTTS probabilities
- [ ] Persist predictions per fixture, generated on a daily schedule
- [ ] `nightly-accuracy` job (score predictions vs results, roll up
      accuracy stats by league/market/window)
- [ ] Backtest against 2–3 months historical data; confirm beats naive
      baseline before going live

## Phase 3 — Public Site / SEO
- [ ] Homepage template (today/tomorrow fixtures, sorted by kickoff)
- [ ] Day-archive page template (`/predictions/[date]`)
- [ ] League-hub page template (`/league/[slug]`)
- [ ] Match-page template (`/match/[slug]`) with unique narrative text
- [ ] Accuracy page template (`/accuracy`)
- [ ] Static trust pages: about, how-it-works, privacy, terms,
      responsible-gambling, contact
- [ ] Structured data (SportsEvent, BreadcrumbList, FAQ schema)
- [ ] ISR wiring (regenerate on schedule + on-demand post-kickoff)
- [ ] Sitemap generation job (chunked, daily)
- [ ] Submit sitemap to Google Search Console + Bing Webmaster Tools
- [ ] Reserve fixed-height ad slot containers (no ads yet)

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
