import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import argon2 from "argon2";

import { PrismaService } from "../database/prisma.service";
import type { AuthenticationResult } from "./auth.types";
import { normalizeEmail, toSafeUser } from "./auth.utils";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";
import { SessionsService } from "./sessions.service";

const PASSWORD_HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

@Injectable()
export class AuthService {
  private readonly dummyPasswordHash = argon2.hash(
    "not-a-real-user-password",
    PASSWORD_HASH_OPTIONS,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionsService,
  ) {}

  async register(input: RegisterDto): Promise<AuthenticationResult> {
    const email = normalizeEmail(input.email);
    const displayName = input.displayName.trim();
    if (displayName.length < 2) {
      throw new BadRequestException({
        code: "validation_failed",
        detail: "Please correct the highlighted fields.",
        errors: {
          displayName: ["Display name must contain at least 2 characters."],
        },
      });
    }

    const passwordHash = await argon2.hash(
      input.password,
      PASSWORD_HASH_OPTIONS,
    );

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: { email, displayName, passwordHash },
        });
        const session = await this.sessions.issue(user.id, transaction);
        return { ...session, user: toSafeUser(user) };
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException({
          code: "email_in_use",
          detail: "An account with this email already exists.",
        });
      }
      throw error;
    }
  }

  async login(input: LoginDto): Promise<AuthenticationResult> {
    const email = normalizeEmail(input.email);
    const user = await this.prisma.user.findUnique({ where: { email } });
    const passwordHash = user?.passwordHash ?? (await this.dummyPasswordHash);
    const passwordMatches = await argon2.verify(passwordHash, input.password);

    if (user === null || !passwordMatches) {
      throw new UnauthorizedException({
        code: "invalid_credentials",
        detail: "Email or password is incorrect.",
      });
    }

    const session = await this.sessions.issue(user.id);
    return { ...session, user: toSafeUser(user) };
  }
}
