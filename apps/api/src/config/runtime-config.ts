const DEFAULT_API_PORT = 3001;

export interface RuntimeConfig {
  corsOrigins: string[];
  port: number;
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

function parseCorsOrigins(value: string | undefined): string[] {
  if (value === undefined || value.trim() === "") {
    return [];
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

export function readRuntimeConfig(
  environment: NodeJS.ProcessEnv = process.env,
): RuntimeConfig {
  return {
    corsOrigins: parseCorsOrigins(environment.CORS_ORIGINS),
    port: parsePort(environment.PORT),
  };
}
