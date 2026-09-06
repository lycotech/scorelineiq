# ScorelineIQ — Product Requirements Document

**Version:** 1.0
**Owner:** Femi
**Status:** Draft for build
**Domain:** ScorelineIQ.com

---

## 1. Vision

ScorelineIQ is a free, global football (soccer) prediction and statistics
site. It generates data-driven match predictions (1X2, correct score,
over/under 2.5, BTTS) across major and minor leagues worldwide, publishes
them as fast, SEO-optimized pages, and tracks its own accuracy publicly to
build trust. Revenue comes from display ads (AdSense/Ezoic) and bookmaker
affiliate placements — never from paid tips or subscriptions.

Reference model: **Forebet.com** — ~8.6M visits/quarter, top traffic from
Nigeria, Kenya, Netherlands, US, Colombia; 67% direct traffic, strong
organic search; monetized via AdSense + affiliate links; free, no login,
no paywall; publishes probability-based predictions with a public
green/red accuracy record per match.

## 2. Goals

1. Rank organically for `[team A] vs [team B] prediction` and
   `[league] predictions today` queries across as many leagues as
   feasible without manual effort per match (programmatic SEO).
2. Publish predictions before major kickoffs every day, automatically.
3. Build visible credibility via a public, unfalsifiable accuracy record
   (color-coded past results, season-to-date hit rate per market).
4. Monetize via ads + affiliate, approved by AdSense (avoid the
   "encourages gambling" content-policy trap — frame as sports analytics,
   not tipster/betting advice).
5. Run on a single VPS at low fixed monthly cost until traffic justifies
   scaling out.

## 3. Non-Goals (v1)

- No user accounts, login, or personalization.
- No paid "VIP tips" or subscription tier (keep AdSense-safe and simple).
- No live in-play betting odds integration (licensing complexity) — v1
  uses pre-match statistical predictions only.
- No native mobile app (responsive web only).
- No direct bet placement or payment processing on-site.

## 4. Target Users

- **Casual bettor / football fan** (primary): checks predictions before
  placing a bet elsewhere or just out of interest. Mobile-first, low
  patience, wants the answer above the fold.
- **Tipster / content consumer**: screenshots picks to share on
  Telegram/WhatsApp groups — design pages to be screenshot-friendly.
- **SEO long-tail searcher**: searches a specific fixture ("Ipswich vs
  Liverpool prediction") — needs a dedicated, indexable page per match.

## 5. Core Features (MVP → v1)

### 5.1 Predictions Engine Output (per fixture)
- 1X2 probabilities (Home/Draw/Away %)
- Predicted correct score (most likely scoreline)
- Over/Under 2.5 goals probability
- BTTS (Yes/No) probability
- A single "Forecast confidence" score (0–100) to headline the pick
- Model basis disclosed in plain language (Poisson/Elo blend — see
  Tech Stack doc) with a permanent "How predictions are made" page for
  transparency and E-E-A-T (Google's trust signal for YMYL-adjacent
  content).

### 5.2 Page Types (all statically generated / ISR for SEO)
| Page | URL pattern | Purpose |
|---|---|---|
| Homepage | `/` | Today's + tomorrow's top fixtures across all leagues, sorted by kickoff time |
| Day archive | `/predictions/2026-09-06` | All fixtures for a given date |
| League hub | `/league/premier-league` | Standings, upcoming fixtures, past accuracy for that league |
| Match page | `/match/ipswich-vs-liverpool-2026-09-04` | Full breakdown: 1X2, score, O/U, BTTS, form, H2H, injuries if available |
| Accuracy/track record | `/accuracy` | Rolling hit-rate stats per market, per league, updated daily |
| Country/market hub | `/predictions/nigeria` (or similar) | Localized landing pages for top traffic countries |
| Static/trust pages | `/how-it-works`, `/about`, `/responsible-gambling`, `/privacy`, `/terms` | AdSense approval requirements + credibility |

### 5.3 Monetization Surfaces
- Header/sidebar/in-content display ad units (AdSense primary, Ezoic or
  a secondary network as fallback/backup while AdSense approval is
  pending or if rejected for gambling-adjacent content).
- Non-intrusive affiliate module ("Where to watch odds" / bookmaker
  comparison) — kept secondary and clearly labeled, avoid overlapping ad
  placements to reduce policy risk.
- No autoplay video, no popups/interstitials (protects AdSense standing
  and Core Web Vitals).

### 5.4 Accuracy Tracking (trust feature, differentiator)
- Nightly job scores every prediction made the previous day against the
  final result (win/loss per market), stores it, and recomputes rolling
  accuracy % by market/league/time window.
- Publicly displayed — this is the credibility engine that lets the site
  compete with entrenched incumbents.

## 6. Data Requirements

- Fixtures, live/final scores, team form (last 5), H2H history, league
  tables, and ideally basic team stats (goals for/against, home/away
  splits) for as many leagues as the data provider's plan covers.
- Provider candidates: API-Football (RapidAPI), Sportmonks, or
  Football-Data.org (free tier is limited to top leagues — fine for
  MVP, upgrade later for the "30–40 games/day" long-tail coverage).

## 7. SEO Requirements

- Server-rendered/ISR HTML (no client-only rendering of core content).
- One canonical URL per fixture, stable even after the match ends
  (converts into a "result + review" page post-match — never 404s a
  match page, this compounds long-tail traffic over time).
- Schema.org `SportsEvent` + `Prediction`-adjacent structured data,
  `BreadcrumbList`, FAQ schema on league hubs.
- Sitemap auto-regenerated daily (thousands of match URLs).
- Core Web Vitals budget: LCP < 2.5s, CLS < 0.1 — ad slots must be
  reserved (fixed height) to avoid layout shift penalties.
- hreflang / localized hub pages for top non-English markets identified
  in Forebet's traffic mix (Nigeria/Kenya = English already; consider
  Spanish for Colombia, Dutch for Netherlands in a later phase).

## 8. Success Metrics

| Metric | 3-month target | 12-month target |
|---|---|---|
| Indexed pages | 5,000+ | 50,000+ |
| Organic sessions/month | 20,000 | 300,000+ |
| Match pages published/day | 30–40 | 150+ |
| AdSense approval | Achieved | — |
| RPM (revenue per 1000 pageviews) | $1–2 | $3–5 (better GEO mix) |
| Prediction accuracy (1X2, rolling) | Published, ≥45% | ≥48–50% (baseline "favorite always wins" is ~45-50%) |

## 9. Risks

- **AdSense rejection**: gambling-adjacent content is heavily scrutinized.
  Mitigation: frame everything as statistical analysis, not betting
  advice; add responsible-gambling page; avoid the words "bet now",
  "guaranteed win"; consider Ezoic as a launch network if AdSense
  rejects initially.
- **Data provider cost scaling**: covering "1,000+ games/day" globally
  requires a paid tier quickly. Mitigation: launch with free/cheap tier
  covering ~40–80 fixtures/day (top 25–30 leagues), scale the data plan
  as ad revenue justifies it.
- **Thin/duplicate content penalty**: templated pages risk being flagged
  as low-value by Google. Mitigation: every match page must have unique
  computed text (not just a table) — form sentences, H2H sentence,
  narrative summary generated from the underlying stats.
- **Competing with 15+-year-old incumbents** (Forebet, Forebet clones,
  Predictz, Windrawwin): realistic timeline to meaningful organic
  traffic is 6–12 months minimum, per SEO norms for a new domain in a
  competitive niche.

## 10. Out of Scope Questions for Later

- Jurisdictional gambling-content restrictions (some countries/ad
  networks restrict betting-adjacent sites — legal review recommended
  before scaling paid ads/affiliate in specific GEOs).
- VAT/business registration for affiliate payouts once revenue is
  material.

---

Sources: [Forebet FAQ](https://www.forebet.com/en/faq), [Similarweb — forebet.com traffic](https://www.similarweb.com/website/forebet.com/), [ValueTheMarkets — Forebet review](https://www.valuethemarkets.com/prediction-markets/forebet-review-how-data-driven-football-forecasts-work-and-their-limits)
