/**
 * Simple structured logger for server-side operations (M3).
 * Outputs JSON to stdout. In production, Vercel captures this in
 * function logs. Replace with Sentry/Datadog when ready.
 */

type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...data,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) =>
    log("info", message, data),
  warn: (message: string, data?: Record<string, unknown>) =>
    log("warn", message, data),
  error: (message: string, data?: Record<string, unknown>) =>
    log("error", message, data),

  // Convenience for catching unknown errors in try/catch
  catch: (error: unknown, context?: string) => {
    const message =
      error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    log("error", message, { context, stack });
  },
};
