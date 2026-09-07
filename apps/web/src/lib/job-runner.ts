import * as Sentry from "@sentry/node";
import { prisma } from "@scorelineiq/db";

let sentryInitialized = false;

function initSentry(jobName: string) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || sentryInitialized) return;
  Sentry.init({ dsn, environment: process.env.NODE_ENV ?? "development" });
  Sentry.setTag("job", jobName);
  sentryInitialized = true;
}

// A failed job must never take down the site (see docs/WORKFLOW.md) —
// this only logs/reports and sets a non-zero exit code so cron/CI can
// see the failure, it never rethrows.
export function runJob(jobName: string, job: () => Promise<void>) {
  initSentry(jobName);

  job()
    .catch(async (error) => {
      console.error(`[${jobName}] failed:`, error);
      if (sentryInitialized) {
        Sentry.captureException(error);
        await Sentry.flush(2000);
      }
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
