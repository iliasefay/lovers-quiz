// Environment configuration with validation

interface EnvConfig {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  ALLOWED_ORIGIN: string | null;
  MAX_LOBBIES: number;
  LOBBY_TTL_MS: number;
  DISCONNECT_TTL_MS: number;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
  }
  return parsed;
}

export function loadEnvConfig(): EnvConfig {
  const nodeEnv = getEnvVar("NODE_ENV", "development");
  if (!["development", "production", "test"].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}`);
  }

  return {
    NODE_ENV: nodeEnv as EnvConfig["NODE_ENV"],
    PORT: getEnvNumber("PORT", 3000),
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || null,
    MAX_LOBBIES: getEnvNumber("MAX_LOBBIES", 1000),
    LOBBY_TTL_MS: getEnvNumber("LOBBY_TTL_MS", 30 * 60 * 1000), // 30 minutes
    DISCONNECT_TTL_MS: getEnvNumber("DISCONNECT_TTL_MS", 5 * 60 * 1000), // 5 minutes
  };
}

// Singleton config instance
let _config: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (!_config) {
    _config = loadEnvConfig();
  }
  return _config;
}

export default getConfig;
