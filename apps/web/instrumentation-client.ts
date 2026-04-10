/**
 * Next.js Client Instrumentation File
 * Replaces deprecated sentry.client.config.ts
 * Runs once in the browser on initial page load.
 * https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  // Session replays: off by default, capture only on errors in prod
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production",
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
