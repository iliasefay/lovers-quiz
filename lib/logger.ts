// Structured logging utility for production
type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// In production, only log warnings and errors
const MIN_LEVEL: LogLevel = process.env.NODE_ENV === "production" ? "warn" : "debug";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function formatLog(entry: LogEntry): string {
  const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`;
}

function createLogEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    if (!shouldLog("debug")) return;
    const entry = createLogEntry("debug", message, context);
    console.log(formatLog(entry));
  },

  info(message: string, context?: Record<string, unknown>) {
    if (!shouldLog("info")) return;
    const entry = createLogEntry("info", message, context);
    console.log(formatLog(entry));
  },

  warn(message: string, context?: Record<string, unknown>) {
    if (!shouldLog("warn")) return;
    const entry = createLogEntry("warn", message, context);
    console.warn(formatLog(entry));
  },

  error(message: string, context?: Record<string, unknown>) {
    if (!shouldLog("error")) return;
    const entry = createLogEntry("error", message, context);
    console.error(formatLog(entry));
  },

  // Log socket events
  socket(event: string, direction: "in" | "out", context?: Record<string, unknown>) {
    const arrow = direction === "in" ? "<<" : ">>";
    this.debug(`${arrow} ${event}`, context);
  },

  // Log lobby lifecycle
  lobby(action: string, lobbyCode: string, context?: Record<string, unknown>) {
    this.info(`Lobby ${action}`, { lobbyCode, ...context });
  },
};

export default logger;
