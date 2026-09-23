const DEFAULT_API_PORT = 3001;
const DEFAULT_SESSION_TTL_HOURS = 24 * 7;
const MINIMUM_SESSION_SECRET_LENGTH = 32;

export interface RuntimeConfig {
  corsOrigins: string[];
  isProduction: boolean;
  port: number;
  sessionCookieName: string;
  sessionHashSecret: string;
  sessionTtlMs: number;
}

function parsePort(value: string | undefined): number {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_API_PORT;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  return port;
}

function parseCorsOrigins(
  value: string | undefined,
  isProduction: boolean,
): string[] {
  if (value === undefined || value.trim() === "") {
    if (isProduction) {
      throw new Error("CORS_ORIGINS is required in production.");
    }
    return ["http://localhost:3000"];
  }

  return value.split(",").map((candidate) => {
    const origin = candidate.trim();
    const parsed = new URL(origin);
    if (
      parsed.origin !== origin ||
      !["http:", "https:"].includes(parsed.protocol)
    ) {
      throw new Error(
        "CORS_ORIGINS must contain comma-separated HTTP origins.",
      );
    }
    return origin;
  });
}

function parseSessionSecret(value: string | undefined): string {
  if (value === undefined || value.length < MINIMUM_SESSION_SECRET_LENGTH) {
    throw new Error(
      `SESSION_HASH_SECRET must contain at least ${MINIMUM_SESSION_SECRET_LENGTH} characters.`,
    );
  }
  return value;
}

function parseSessionTtl(value: string | undefined): number {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_SESSION_TTL_HOURS * 60 * 60 * 1000;
  }

  const hours = Number(value);
  if (!Number.isInteger(hours) || hours < 1 || hours > 24 * 90) {
    throw new Error("SESSION_TTL_HOURS must be between 1 and 2160.");
  }
  return hours * 60 * 60 * 1000;
}

function parseCookieName(value: string | undefined): string {
  const cookieName = value?.trim() || "nexusops_session";
  if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(cookieName)) {
    throw new Error("SESSION_COOKIE_NAME is not a valid cookie name.");
  }
  return cookieName;
}

export function readRuntimeConfig(
  environment: NodeJS.ProcessEnv = process.env,
): RuntimeConfig {
  const isProduction = environment.NODE_ENV === "production";
  return {
    corsOrigins: parseCorsOrigins(environment.CORS_ORIGINS, isProduction),
    isProduction,
    port: parsePort(environment.PORT),
    sessionCookieName: parseCookieName(environment.SESSION_COOKIE_NAME),
    sessionHashSecret: parseSessionSecret(environment.SESSION_HASH_SECRET),
    sessionTtlMs: parseSessionTtl(environment.SESSION_TTL_HOURS),
  };
}
