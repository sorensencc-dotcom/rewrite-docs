export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  traceId?: string;
  spanId?: string;
  context?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
  };
}

export class Logger {
  private minLevel: LogLevel;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(minLevel: LogLevel = "info") {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  private format(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
    traceId?: string,
    spanId?: string
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      traceId,
      spanId,
      context,
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
      };
    }

    const output = this.format(entry);

    if (level === "error") {
      console.error(output);
    } else if (level === "warn") {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>, traceId?: string, spanId?: string): void {
    this.log("info", message, context, undefined, traceId, spanId);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log("error", message, context, error);
  }
}

export const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || "info"
);
