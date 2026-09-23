import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";

import { AuthCookieService } from "./auth-cookie.service";
import { AuthRateLimitGuard } from "./auth-rate-limit.guard";
import { AuthService } from "./auth.service";
import type { AuthenticatedRequest, SafeUser } from "./auth.types";
import { CurrentUser } from "./current-user.decorator";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { SessionAuthGuard } from "./session-auth.guard";
import { SessionsService } from "./sessions.service";

interface UserResponse {
  data: SafeUser;
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookieService,
    private readonly sessions: SessionsService,
  ) {}

  @Post("register")
  @UseGuards(AuthRateLimitGuard)
  async register(
    @Body() input: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponse> {
    const result = await this.auth.register(input);
    this.cookies.set(response, result.token, result.expiresAt);
    return { data: result.user };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthRateLimitGuard)
  async login(
    @Body() input: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponse> {
    const result = await this.auth.login(input);
    this.cookies.set(response, result.token, result.expiresAt);
    return { data: result.user };
  }

  @Get("me")
  @UseGuards(SessionAuthGuard)
  me(@CurrentUser() user: SafeUser): UserResponse {
    return { data: user };
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SessionAuthGuard)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.sessions.revoke(request.authSessionId);
    this.cookies.clear(response);
  }
}
