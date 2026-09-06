# AGENTS.md — ScorelineIQ

This file orients any Claude/agent session working in this repository.
Read this before making changes.

## Project summary

ScorelineIQ is a free football prediction and stats site (Next.js +
FastAPI + Postgres, Dockerized, deployed to a single VPS behind
Cloudflare). Revenue is display ads + affiliate links — never paid
tips. Full context: `docs/PRD.md`, `docs/TECH_STACK.md`,
`docs/IMPLEMENTATION_PLAN.md`, `docs/WORKFLOW.md`, `docs/TODO.md`.

## Repo layout (target structure)

```
/apps
  /web            Next.js 15 app (App Router, TypeScript, Tailwind)
  /prediction-api FastAPI service (Python) — the Poisson/Elo model
/packages
  /db             Prisma schema + client, shared by web and any Node jobs
/infra
  docker-compose.yml
  Caddyfile (or nginx.conf)
  /scripts        deploy.sh, backup.sh, smoke-test.sh
/docs             PRD, tech stack, implementation plan, workflow, TODO
```

## Ground rules for any agent working here

1. **Never fabricate football data or prediction output.** Predictions
   must come from the actual model output stored in Postgres. If data
   is missing for a fixture, the page must say "prediction pending" —
   never a placeholder number dressed up as real.
2. **Never claim guaranteed wins or use betting-incitement language**
   anywhere in copy (UI strings, meta descriptions, blog content). This
   is an AdSense-approval and legal-risk issue, not just a style
   preference. Words to avoid: "guaranteed", "sure win", "bet now".
   Always frame as statistical/analytical, not advice.
3. **Every match page must render unique, real content** — not just a
   templated table with numbers swapped. If you're building the
   narrative-text generator, make sure the sentence structure varies
   enough, and every sentence is derived from real stored stats, not
   invented.
4. **SEO is load-bearing.** Any change to URL structure, canonical tags,
   sitemap generation, or structured data needs explicit human sign-off
   before merging — these mistakes are expensive to undo (deindexing).
5. **Ship in small, reviewable PRs** aligned to one `docs/TODO.md` item
   at a time. Don't bundle unrelated changes.
6. **Idempotent jobs only.** Any ingestion/prediction/scoring job must
   be safe to re-run without creating duplicate rows or double-counting
   accuracy stats.
7. **No secrets in the repo.** API keys (data provider, Sentry, AdSense)
   live in `.env` on the VPS / GitHub Actions secrets, never committed.
8. **Respect the VPS budget.** Don't introduce a dependency that assumes
   a managed cloud service (e.g., a hosted vector DB, a managed queue)
   without flagging the added monthly cost — this project is
   deliberately single-VPS at launch.
9. **Test against seeded/fake data locally**, never against production
   Postgres, when iterating on the prediction engine or page templates.

## Subagent roles (for orchestrated/multi-agent work)

When a task is large enough to split across agents, use these role
boundaries:

| Role | Responsibility | Touches |
|---|---|---|
| `data-ingestion-agent` | Fixture/team/result sync jobs, data-API integration | `/apps/prediction-api` ingestion modules, `/packages/db` |
| `prediction-engine-agent` | Poisson/Elo model, backtesting, accuracy scoring | `/apps/prediction-api` model code |
| `frontend-seo-agent` | Page templates, ISR config, structured data, sitemap | `/apps/web` |
| `content-agent` | Narrative-text generation logic, trust pages copy | `/apps/web` content modules, `/docs` |
| `devops-agent` | Docker Compose, CI/CD, VPS scripts, monitoring | `/infra` |
| `qa-agent` | Reviews PRs against `docs/TODO.md` and the ground rules above before merge | repo-wide, read-mostly |

Each subagent should read `docs/PRD.md` once at the start of its task
for context, then work only within its listed scope. Cross-scope changes
should be flagged for a human or the `qa-agent` rather than made
unilaterally.

## Commands (once scaffolded)

```
docker compose up -d          # run full stack locally
npm run dev --workspace=web   # web app dev server
npm run lint                  # lint
npm run test                  # unit tests
npx prisma migrate dev        # apply a new DB migration locally
```

## Definition of done (any task)

- [ ] Code typechecks and lints clean
- [ ] Unit tests added/updated and passing
- [ ] No secrets or real API keys committed
- [ ] Matches the relevant `docs/TODO.md` item
- [ ] Does not violate any ground rule above
- [ ] PR description states what changed and why
