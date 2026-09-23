import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from "@nestjs/common";
import type { Request, Response } from "express";

interface AttemptWindow {
  count: number;
  resetsAt: number;
}

const WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  // Process-local by design for M1. Multi-instance deployments need a shared limiter.
  private readonly attempts = new Map<string, AttemptWindow>();

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const route = request.path.endsWith("/register") ? "register" : "login";
    const limit = route === "register" ? 5 : 10;
    const key = `${request.ip ?? request.socket.remoteAddress ?? "unknown"}:${route}`;
    const now = Date.now();
    this.pruneExpiredWindows(now);
    const current = this.attempts.get(key);
    const window =
      current === undefined || current.resetsAt <= now
        ? { count: 0, resetsAt: now + WINDOW_MS }
        : current;

    window.count += 1;
    this.attempts.set(key, window);

    if (window.count <= limit) {
      return true;
    }

    response.setHeader(
      "Retry-After",
      Math.max(1, Math.ceil((window.resetsAt - now) / 1000)),
    );
    throw new HttpException(
      {
        code: "rate_limited",
        detail: "Too many authentication attempts. Try again later.",
      },
      429,
    );
  }

  private pruneExpiredWindows(now: number): void {
    if (this.attempts.size < 10_000) {
      return;
    }

    for (const [key, window] of this.attempts) {
      if (window.resetsAt <= now) {
        this.attempts.delete(key);
      }
    }

    if (this.attempts.size >= 10_000) {
      const oldestKey = this.attempts.keys().next().value;
      if (oldestKey !== undefined) {
        this.attempts.delete(oldestKey);
      }
    }
  }
}
