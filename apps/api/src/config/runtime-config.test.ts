import { describe, expect, it } from "vitest";

import { readRuntimeConfig } from "./runtime-config";

describe("readRuntimeConfig", () => {
  it("uses safe local defaults", () => {
    expect(readRuntimeConfig({})).toEqual({
      corsOrigins: [],
      port: 3001,
    });
  });

  it("parses explicit runtime values", () => {
    expect(
      readRuntimeConfig({
        CORS_ORIGINS: "http://localhost:3000,https://app.example.com",
        PORT: "4100",
      }),
    ).toEqual({
      corsOrigins: ["http://localhost:3000", "https://app.example.com"],
      port: 4100,
    });
  });

  it("rejects an invalid port", () => {
    expect(() => readRuntimeConfig({ PORT: "70000" })).toThrow(
      "PORT must be an integer between 1 and 65535.",
    );
  });

  it("rejects a CORS path instead of an origin", () => {
    expect(() =>
      readRuntimeConfig({ CORS_ORIGINS: "https://app.example.com/path" }),
    ).toThrow("CORS_ORIGINS must contain comma-separated HTTP origins.");
  });
});
