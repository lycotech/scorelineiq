# ScorelineIQ — Implementation Plan

Six phases, each shippable and each building on a working previous phase.
Timeframes assume one part-time developer working with Claude/agent
assistance, not a full team.

---

## Phase 0 — Foundations (Week 1)

- [ ] Provision VPS (Hetzner/Contabo), harden it (SSH key auth only,
      UFW firewall, fail2ban, unattended-upgrades).
- [ ] Point ScorelineIQ.com DNS to Cloudflare, proxy through Cloudflare.
- [ ] Install Docker + Docker Compose on VPS.
- [ ] Scaffold Next.js 15 (TypeScript, App Router, Tailwind) repo.
- [ ] Scaffold Postgres + Prisma schema (leagues, teams, fixtures,
      predictions, results, accuracy_stats).
- [ ] Scaffold FastAPI prediction-engine service (empty endpoint first).
- [ ] `docker-compose.yml` wiring web + api + postgres + redis.
- [ ] GitHub repo, branch protection on `main`, GitHub Actions skeleton.
- [ ] Sign up for a football data API (start with Football-Data.org free
      tier to unblock development at zero cost).

**Exit criteria:** `docker compose up` on the VPS serves a placeholder
Next.js homepage over HTTPS at ScorelineIQ.com.

---

## Phase 1 — Data Pipeline (Week 2)

- [ ] Build ingestion job: pull today's + tomorrow's fixtures from the
      data API into Postgres (`fixtures` table).
- [ ] Build team/league sync job (runs weekly — standings, form).
- [ ] Schedule both via BullMQ + Redis (or simple cron calling a script).
- [ ] Build result-ingestion job: pull final scores for yesterday's
      fixtures, store in `results`.
- [ ] Add logging + Sentry so a failed ingestion run is visible, not
      silent.

**Exit criteria:** Postgres reliably contains an up-to-date fixture list
every morning without manual intervention, for at least the leagues on
the current data-API tier.

---

## Phase 2 — Prediction Engine (Weeks 3–4)

- [ ] Implement Dixon-Coles/Poisson goal-expectancy model in the FastAPI
      service using each team's recent scored/conceded rates (home/away
      split) and a simple Elo-style adjustment for overall strength.
- [ ] Output per fixture: home/draw/away %, top-3 correct scores with
      probabilities, over/under 2.5 %, BTTS %.
- [ ] Store predictions in Postgres keyed to fixture ID, generated at a
      fixed daily time (e.g., 06:00 UTC) for the next 48 hours of
      fixtures.
- [ ] Build the nightly accuracy-scoring job: compare yesterday's stored
      predictions to `results`, mark each market win/loss, write to
      `accuracy_stats` (rolling by league/market/time window).
- [ ] Backtest the model against 2–3 months of historical results (pull
      via the data API) before trusting it live — tune until it beats a
      naive baseline (always-favorite) on a held-out sample.

**Exit criteria:** Every fixture ingested in Phase 1 gets a full
prediction set automatically, and a `/accuracy` internal report shows a
believable, better-than-baseline hit rate.

---

## Phase 3 — Public Site / SEO Skeleton (Weeks 4–6)

- [ ] Build page templates: homepage, day archive, league hub, match
      page, accuracy page, static trust pages (about/how-it-
      works/privacy/terms/responsible-gambling/contact).
- [ ] Wire ISR: match pages regenerate on a schedule + on-demand after
      kickoff/full-time.
- [ ] Add unique narrative text generation per match page (templated
      sentences populated from real stats — not just tables).
- [ ] Add structured data (SportsEvent, BreadcrumbList, FAQ schema).
- [ ] Add sitemap generation job (daily, chunked).
- [ ] Reserve fixed-height ad slot containers (no ads served yet —
      layout only, to protect CLS).
- [ ] Submit sitemap to Google Search Console + Bing Webmaster Tools.

**Exit criteria:** 30–40 match pages/day are live, indexable, pass
Core Web Vitals, and are being crawled (check GSC coverage report).

---

## Phase 4 — Monetization (Weeks 6–8, gated on ~3–4 weeks of clean content history)

- [ ] Apply for Google AdSense once the site has enough indexed,
      original content and all trust pages live.
- [ ] If rejected or slow: launch with Ezoic in the interim.
- [ ] Integrate ad slots into the reserved containers from Phase 3.
- [ ] Add a clearly labeled bookmaker-affiliate comparison module
      (separate from prediction content, per AdSense policy safety).
- [ ] Add basic analytics (Cloudflare Web Analytics or Plausible —
      privacy-friendly, avoids heavy GA4 script weight).

**Exit criteria:** Ads are live and serving; first affiliate link is
tracked and clickable; Core Web Vitals still pass with ads loaded.

---

## Phase 5 — Growth & Scale (Ongoing, Month 3+)

- [ ] Expand data-API tier to cover more leagues (grow from ~40 to
      100+ games/day as budget allows from ad revenue).
- [ ] Add country/market landing pages for top traffic GEOs (mirroring
      Forebet's Nigeria/Kenya/Netherlands/US/Colombia mix).
- [ ] Add internal linking automation (league hub ↔ match pages ↔
      accuracy page) to strengthen SEO equity flow.
- [ ] A/B test ad placement density vs. bounce rate.
- [ ] Consider horizontal scaling (second VPS + load balancer, managed
      Postgres) only once single-VPS resource usage consistently nears
      capacity.
- [ ] Quarterly model re-tuning as more results accumulate.

---

## Milestone Summary Table

| Phase | Duration | Key deliverable |
|---|---|---|
| 0 | Week 1 | VPS + skeleton app live |
| 1 | Week 2 | Automated fixture/result pipeline |
| 2 | Weeks 3–4 | Working, backtested prediction engine |
| 3 | Weeks 4–6 | Public SEO-ready site, 30–40 pages/day |
| 4 | Weeks 6–8 | Ads + affiliate live |
| 5 | Month 3+ | Scale leagues, GEOs, traffic, revenue |
