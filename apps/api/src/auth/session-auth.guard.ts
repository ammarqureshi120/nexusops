import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { RUNTIME_CONFIG } from "../config/config.module";
import type { RuntimeConfig } from "../config/runtime-config";
import type { AuthenticatedRequest } from "./auth.types";
import { SessionsService } from "./sessions.service";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionsService,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const cookies = request.cookies as Record<string, unknown> | undefined;
    const token = cookies?.[this.config.sessionCookieName];

    if (typeof token !== "string" || token.length === 0) {
      throw this.unauthorized();
    }

    const session = await this.sessions.resolve(token);
    if (session === null) {
      throw this.unauthorized();
    }

    request.authSessionId = session.id;
    request.user = session.user;
    return true;
  }

  private unauthorized(): UnauthorizedException {
    return new UnauthorizedException({
      code: "authentication_required",
      detail: "Sign in to continue.",
    });
  }
}
