import { describe, expect, it } from "vitest";

import { readRuntimeConfig } from "./runtime-config";

const TEST_SECRET = "test-session-secret-that-is-long-enough";

describe("readRuntimeConfig", () => {
  it("uses safe local defaults", () => {
    expect(readRuntimeConfig({ SESSION_HASH_SECRET: TEST_SECRET })).toEqual({
      corsOrigins: ["http://localhost:3000"],
      isProduction: false,
      port: 3001,
      sessionCookieName: "nexusops_session",
      sessionHashSecret: TEST_SECRET,
      sessionTtlMs: 604_800_000,
    });
  });

  it("parses explicit runtime values", () => {
    expect(
      readRuntimeConfig({
        CORS_ORIGINS: "http://localhost:3000,https://app.example.com",
        PORT: "4100",
        SESSION_COOKIE_NAME: "auth",
        SESSION_HASH_SECRET: TEST_SECRET,
        SESSION_TTL_HOURS: "24",
      }),
    ).toEqual({
      corsOrigins: ["http://localhost:3000", "https://app.example.com"],
      isProduction: false,
      port: 4100,
      sessionCookieName: "auth",
      sessionHashSecret: TEST_SECRET,
      sessionTtlMs: 86_400_000,
    });
  });

  it("rejects invalid ports and origins", () => {
    expect(() =>
      readRuntimeConfig({ PORT: "70000", SESSION_HASH_SECRET: TEST_SECRET }),
    ).toThrow("PORT must be an integer between 1 and 65535.");
    expect(() =>
      readRuntimeConfig({
        CORS_ORIGINS: "https://app.example.com/path",
        SESSION_HASH_SECRET: TEST_SECRET,
      }),
    ).toThrow("CORS_ORIGINS must contain comma-separated HTTP origins.");
  });

  it("requires explicit production origins and a strong session secret", () => {
    expect(() =>
      readRuntimeConfig({
        NODE_ENV: "production",
        SESSION_HASH_SECRET: TEST_SECRET,
      }),
    ).toThrow("CORS_ORIGINS is required in production.");
    expect(() =>
      readRuntimeConfig({ SESSION_HASH_SECRET: "too-short" }),
    ).toThrow("SESSION_HASH_SECRET must contain at least 32 characters.");
  });
});
