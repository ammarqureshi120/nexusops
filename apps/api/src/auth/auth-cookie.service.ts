import { Inject, Injectable } from "@nestjs/common";
import type { CookieOptions, Response } from "express";

import { RUNTIME_CONFIG } from "../config/config.module";
import type { RuntimeConfig } from "../config/runtime-config";

@Injectable()
export class AuthCookieService {
  constructor(@Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig) {}

  set(response: Response, token: string, expiresAt: Date): void {
    response.cookie(this.config.sessionCookieName, token, {
      ...this.options(),
      expires: expiresAt,
      maxAge: this.config.sessionTtlMs,
    });
  }

  clear(response: Response): void {
    response.clearCookie(this.config.sessionCookieName, this.options());
  }

  private options(): CookieOptions {
    return {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: this.config.isProduction,
    };
  }
}
