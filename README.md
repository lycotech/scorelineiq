# ScorelineIQ

Free, global football prediction and stats site. See [AGENTS.md](AGENTS.md)
for repo conventions and ground rules, and [docs/](docs/) for the product
requirements, tech stack, implementation plan, and workflow.

## Structure

```
/apps/web             Next.js 15 app (App Router, TypeScript, Tailwind)
/apps/prediction-api  FastAPI service (Python) — the Poisson/Elo model
/packages/db          Prisma schema + client, shared by web and any Node jobs
/infra                docker-compose.yml, Caddyfile, deploy/backup/smoke-test scripts
/docs                 PRD, tech stack, implementation plan, workflow, TODO
```

## Local development

```
docker compose -f infra/docker-compose.yml up -d   # postgres + redis + api + web
npm run dev --workspace=web                         # web app dev server
npm run lint                                        # lint
npx prisma migrate dev --schema packages/db/prisma/schema.prisma
```

Copy each `.env.example` file to `.env` and fill in local values before
running anything.
