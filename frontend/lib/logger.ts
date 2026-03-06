/**
 * Structured logger for PharmaGuard API routes.
 *
 * Outputs JSON lines in production (machine-parseable by Datadog, CloudWatch, etc.)
 * and human-readable format in development.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("[analyze]", { requestId, drug, phenotype }, "Request received");
 *   logger.error("[analyze]", { requestId, error: err.message }, "LLM failed");
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  context: string;
  message: string;
  [key: string]: unknown;
}

const IS_PROD = process.env.NODE_ENV === "production";

function log(level: LogLevel, context: string, meta: Record<string, unknown>, message: string): void {
  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    context,
    message,
    ...meta,
  };

  if (IS_PROD) {
    // Structured JSON for log aggregators
    if (level === "error") {
      process.stderr.write(JSON.stringify(entry) + "\n");
    } else {
      process.stdout.write(JSON.stringify(entry) + "\n");
    }
  } else {
    // Human-readable for local dev
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] ${context}`;
    const metaStr = Object.keys(meta).length ? " " + JSON.stringify(meta) : "";
    // eslint-disable-next-line no-console
    (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(
      `${prefix}${metaStr} — ${message}`
    );
  }
}

export const logger = {
  debug: (ctx: string, meta: Record<string, unknown>, msg: string) => log("debug", ctx, meta, msg),
  info:  (ctx: string, meta: Record<string, unknown>, msg: string) => log("info",  ctx, meta, msg),
  warn:  (ctx: string, meta: Record<string, unknown>, msg: string) => log("warn",  ctx, meta, msg),
  error: (ctx: string, meta: Record<string, unknown>, msg: string) => log("error", ctx, meta, msg),
};
