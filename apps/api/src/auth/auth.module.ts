import { Module } from "@nestjs/common";

import { AuthCookieService } from "./auth-cookie.service";
import { AuthRateLimitGuard } from "./auth-rate-limit.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SessionAuthGuard } from "./session-auth.guard";
import { SessionsService } from "./sessions.service";

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionsService,
    AuthCookieService,
    AuthRateLimitGuard,
    SessionAuthGuard,
  ],
  exports: [SessionAuthGuard, SessionsService],
})
export class AuthModule {}
