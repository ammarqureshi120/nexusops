import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { createHmac, randomBytes } from "node:crypto";

import { RUNTIME_CONFIG } from "../config/config.module";
import type { RuntimeConfig } from "../config/runtime-config";
import { PrismaService } from "../database/prisma.service";
import type { SafeUser } from "./auth.types";
import { toSafeUser } from "./auth.utils";

type SessionStore = Pick<Prisma.TransactionClient, "session">;
const LAST_USED_WRITE_INTERVAL_MS = 5 * 60 * 1000;

interface IssuedSession {
  expiresAt: Date;
  token: string;
}

interface ResolvedSession {
  id: string;
  user: SafeUser;
}

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {}

  async issue(
    userId: string,
    store: SessionStore = this.prisma,
  ): Promise<IssuedSession> {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + this.config.sessionTtlMs);

    await store.session.create({
      data: {
        tokenHash: this.hashToken(token),
        userId,
        expiresAt,
      },
    });

    return { expiresAt, token };
  }

  async resolve(token: string): Promise<ResolvedSession | null> {
    const now = new Date();
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { user: true },
    });

    if (
      session === null ||
      session.revokedAt !== null ||
      session.expiresAt <= now
    ) {
      return null;
    }

    if (
      session.lastUsedAt <=
      new Date(now.getTime() - LAST_USED_WRITE_INTERVAL_MS)
    ) {
      const refreshed = await this.prisma.session.updateMany({
        where: {
          id: session.id,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { lastUsedAt: now },
      });

      if (refreshed.count !== 1) {
        return null;
      }
    }

    return { id: session.id, user: toSafeUser(session.user) };
  }

  async revoke(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  hashToken(token: string): string {
    return createHmac("sha256", this.config.sessionHashSecret)
      .update(token)
      .digest("hex");
  }
}
