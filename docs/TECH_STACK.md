# ScorelineIQ — Tech Stack (VPS deployment)

Design principle: everything runs on **one VPS** at launch (no managed
cloud services beyond DNS/CDN), keeps monthly cost under ~$40, and scales
vertically first (bigger VPS) before it scales horizontally (multiple
VPS + load balancer). Re-evaluate at ~500k monthly sessions.

## 1. Infrastructure

| Layer | Choice | Why |
|---|---|---|
| VPS provider | Hetzner Cloud (CPX21, ~4GB RAM) or Contabo VPS M | Cheapest reliable EU/US options; Hetzner has excellent price/performance and easy resizing |
| OS | Ubuntu 24.04 LTS | Standard, long support window |
| Reverse proxy / TLS | Caddy (auto HTTPS) or Nginx + Certbot | Caddy is simpler to maintain solo; Nginx if you want finer cache control |
| Containerization | Docker + Docker Compose | One `docker-compose.yml` runs web, API, DB, cache, worker — easy to redeploy, easy to move VPS later |
| CDN / DNS / edge cache | Cloudflare (free tier) | Caches static/HTML at edge, absorbs traffic spikes, DDoS protection, free SSL, image resizing via Cloudflare Polish |
| Object storage (future) | Cloudflare R2 or Backblaze B2 | Only needed once team logos/images grow large — S3-compatible, cheap |
| Backups | Restic or VPS provider snapshots, nightly to a second cheap storage box | Postgres dump + media, automated cron |
| Monitoring | Uptime Kuma (self-hosted, one Docker container) + Cloudflare analytics | Free, simple, enough for one VPS |
| Error tracking | Sentry (free tier, hosted) | Catches prediction-engine and app crashes |

## 2. Application Layer

| Component | Choice | Why |
|---|---|---|
| Frontend/SSR framework | **Next.js 15** (App Router) | Best-in-class SSR/ISR for SEO-critical, high-page-count sites; incremental static regeneration means match pages rebuild automatically after kickoff without a full redeploy |
| Language | TypeScript throughout | Type safety across a codebase an AI agent will be editing continuously |
| Styling/UI | Tailwind CSS + a small component set (shadcn/ui) | Fast to build, consistent, small bundle |
| API layer | Next.js Route Handlers (or a separate Fastify service if load requires splitting later) | Keep one deployable unit at MVP scale |
| Database | **PostgreSQL 16** | Relational fit for fixtures/teams/leagues/predictions/results; strong indexing for the URL-per-match model |
| ORM | Prisma | Fast iteration, type-safe queries, easy migrations |
| Cache/queue | **Redis** | Cache league tables & hot match pages; backs a lightweight job queue (BullMQ) for ingestion/prediction jobs |
| Job scheduling | BullMQ (Node) or system cron calling scripts | Fixture ingestion, prediction generation, result-scoring, sitemap regeneration |
| Prediction engine | **Python microservice** (FastAPI) — Poisson/Dixon-Coles goal model + Elo-style team-strength ratings, blended | Python has the strongest statistical/ML tooling (numpy/scipy/pandas); runs as an internal service the Next.js app calls or that writes directly to Postgres via a shared schema |

## 3. Data Sources

| Need | Provider (pick one to start) | Notes |
|---|---|---|
| Fixtures, results, standings, team stats | **API-Football** (via RapidAPI) or **Sportmonks** | Sportmonks has a solid entry-tier "Standard" plan (~$30–50/mo) covering ~40 leagues, better for "30–40 games/day" scale than the free tiers |
| Fallback/free tier for MVP | **Football-Data.org** free tier | Only ~12 top leagues, but zero cost to validate the pipeline before paying for full coverage |
| Injury/lineup data (v2) | Sportmonks add-on or API-Football | Improves prediction inputs; optional for MVP |

## 4. SEO/Content Tooling

- `next-sitemap` (or custom script) regenerating sitemap index daily,
  split by date (thousands of URLs won't fit one sitemap file).
- Structured data via `schema-dts` types, injected server-side.
- A small internal "content variation" module: generates the unique
  narrative sentence per match page (form summary, H2H summary) from
  templated-but-varied phrasing driven by the actual stats — avoids
  Google's thin/duplicate-content flags.

## 5. CI/CD

- GitHub (private repo) → GitHub Actions:
  - On PR: typecheck, lint, unit tests, build.
  - On merge to `main`: build Docker images, push to a container
    registry (GitHub Container Registry — free for private repos at
    this scale), SSH into VPS, `docker compose pull && up -d`.
- Zero-downtime-ish: Caddy/Nginx in front means a brief container swap
  is imperceptible at this traffic tier; add a health-check gate before
  cutting over once traffic grows.

## 6. Ads & Affiliate

- Google AdSense (apply after ~20–30 quality pages live and site has
  the required trust pages — privacy policy, about, contact).
- Ezoic as a fallback/parallel network if AdSense is slow or rejects
  gambling-adjacent content initially (Ezoic is more permissive and
  itself optimizes ad placement/RPM).
- Affiliate: bookmaker affiliate networks (e.g., via a network like
  Income Access, or direct bookmaker affiliate programs) — added as a
  clearly labeled module, not blended into prediction content, to keep
  it AdSense-policy-safe.

## 7. Estimated Monthly Cost (MVP)

| Item | Cost |
|---|---|
| VPS (Hetzner CPX21 or similar) | ~$15–20 |
| Domain (already owned) | $0 (renewal ~$12/yr) |
| Cloudflare (free tier) | $0 |
| Football data API (entry paid tier) | ~$30–50 |
| Sentry / Uptime Kuma | $0 (free tiers) |
| **Total** | **~$45–70/month** |

Scale the data-API tier (and eventually the VPS size) as traffic and ad
revenue grow — don't overpay for league coverage before there's an
audience to serve it to.
