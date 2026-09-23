import type { RequestHandler } from "express";
import { randomUUID } from "node:crypto";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function createOriginProtection(
  allowedOrigins: readonly string[],
): RequestHandler {
  const allowlist = new Set(allowedOrigins);

  return (request, response, next) => {
    if (SAFE_METHODS.has(request.method)) {
      next();
      return;
    }

    const origin = request.get("Origin");
    if (origin !== undefined && allowlist.has(origin)) {
      next();
      return;
    }

    const requestId = randomUUID();
    response.setHeader("X-Request-Id", requestId);
    response.status(403).json({
      type: "https://nexusops.dev/problems/untrusted_origin",
      title: "Request forbidden",
      status: 403,
      code: "untrusted_origin",
      detail: "The request origin is not allowed.",
      instance: request.originalUrl,
      requestId,
    });
  };
}
