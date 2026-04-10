/**
 * Next.js Instrumentation File
 * Replaces deprecated sentry.server.config.ts and sentry.edge.config.ts
 * Runs once per server/edge runtime startup.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { init } = await import("@sentry/nextjs");
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
      environment: process.env.NODE_ENV,
      enabled: process.env.NODE_ENV === "production",
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const { init } = await import("@sentry/nextjs");
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
      environment: process.env.NODE_ENV,
      enabled: process.env.NODE_ENV === "production",
    });
  }
}

// Required for Sentry to capture errors from nested React Server Components
export const onRequestError = async (...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>) => {
  const { captureRequestError } = await import("@sentry/nextjs");
  captureRequestError(...args);
};
