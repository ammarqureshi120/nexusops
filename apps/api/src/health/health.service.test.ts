import { describe, expect, it } from "vitest";

import { HealthService } from "./health.service";

describe("HealthService", () => {
  it("reports that the API is available", () => {
    const service = new HealthService();

    expect(service.getStatus()).toEqual({
      service: "nexusops-api",
      status: "ok",
    });
  });
});
