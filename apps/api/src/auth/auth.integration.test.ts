import type { INestApplication } from "@nestjs/common";
import argon2 from "argon2";
import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApplication } from "../application";
import { PrismaService } from "../database/prisma.service";

const ORIGIN = "http://localhost:3000";
const databaseUrl = process.env.TEST_DATABASE_URL;
const databaseDescribe = databaseUrl === undefined ? describe.skip : describe;

interface ProblemBody {
  code: string;
  detail: string;
  errors?: Record<string, string[]>;
  status: number;
}

interface UserBody {
  data: {
    displayName: string;
    email: string;
  };
}

function responseBody<T>(response: SupertestResponse): T {
  const body: unknown = response.body;
  return body as T;
}

databaseDescribe("authentication API (PostgreSQL)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Server;

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    process.env.CORS_ORIGINS = ORIGIN;
    process.env.SESSION_HASH_SECRET =
      "integration-test-secret-that-is-long-enough";
    process.env.SESSION_TTL_HOURS = "24";
    app = await createApplication({ logger: false });
    const httpServer: unknown = app.getHttpServer();
    server = httpServer as Server;
    prisma = app.get(PrismaService);
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it("registers with normalized email, hashes the password and stores only a token hash", async () => {
    const response = await request(server)
      .post("/api/v1/auth/register")
      .set("Origin", ORIGIN)
      .send({
        displayName: "Ada Lovelace",
        email: "  ADA@Example.COM  ",
        password: "a long passphrase",
      })
      .expect(201);

    const body = responseBody<UserBody>(response);
    expect(body.data.displayName).toBe("Ada Lovelace");
    expect(body.data.email).toBe("ada@example.com");
    expect(JSON.stringify(body)).not.toContain("passwordHash");

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "ada@example.com" },
    });
    expect(user.passwordHash).not.toBe("a long passphrase");
    await expect(
      argon2.verify(user.passwordHash, "a long passphrase"),
    ).resolves.toBe(true);

    const session = await prisma.session.findFirstOrThrow({
      where: { userId: user.id },
    });
    const setCookie = (
      response.headers["set-cookie"] as unknown as string[]
    )[0];
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Path=/");
    const rawToken = /nexusops_session=([^;]+)/.exec(setCookie ?? "")?.[1];
    expect(rawToken).toBeDefined();
    expect(session.tokenHash).not.toBe(rawToken);
    expect(session.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns useful validation errors and rejects unknown fields", async () => {
    const response = await request(server)
      .post("/api/v1/auth/register")
      .set("Origin", ORIGIN)
      .send({ email: "not-an-email", password: "short", admin: true })
      .expect(400);

    const body = responseBody<ProblemBody>(response);
    expect(body.code).toBe("validation_failed");
    expect(body.errors?.email).toBeInstanceOf(Array);
    expect(body.errors?.password).toBeInstanceOf(Array);
    expect(JSON.stringify(body)).not.toContain("Prisma");
  });

  it("handles duplicate normalized email without exposing database details", async () => {
    const response = await request(server)
      .post("/api/v1/auth/register")
      .set("Origin", ORIGIN)
      .send({
        displayName: "Another Ada",
        email: "ADA@example.com",
        password: "another long password",
      })
      .expect(409);

    const body = responseBody<ProblemBody>(response);
    expect(body.code).toBe("email_in_use");
    expect(body.status).toBe(409);
    expect(JSON.stringify(body)).not.toContain("users_email_key");
  });

  it("supports login, current user, expiration, revocation and logout", async () => {
    const agent = request.agent(server);
    await agent
      .post("/api/v1/auth/register")
      .set("Origin", ORIGIN)
      .send({
        displayName: "Grace Hopper",
        email: "grace@example.com",
        password: "correct horse battery",
      })
      .expect(201);

    await agent.get("/api/v1/auth/me").expect(200);
    await request(server).get("/api/v1/auth/me").expect(401);

    const invalid = await request(server)
      .post("/api/v1/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: "grace@example.com", password: "wrong password" })
      .expect(401);
    const absent = await request(server)
      .post("/api/v1/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: "missing@example.com", password: "wrong password" })
      .expect(401);
    expect(responseBody<ProblemBody>(invalid).detail).toBe(
      responseBody<ProblemBody>(absent).detail,
    );

    const expiredAgent = request.agent(server);
    await expiredAgent
      .post("/api/v1/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: " GRACE@EXAMPLE.COM ", password: "correct horse battery" })
      .expect(200);
    const newest = await prisma.session.findFirstOrThrow({
      where: { user: { email: "grace@example.com" } },
      orderBy: { createdAt: "desc" },
    });
    await prisma.session.update({
      where: { id: newest.id },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });
    await expiredAgent.get("/api/v1/auth/me").expect(401);

    const revokedAgent = request.agent(server);
    await revokedAgent
      .post("/api/v1/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: "grace@example.com", password: "correct horse battery" })
      .expect(200);
    const revocable = await prisma.session.findFirstOrThrow({
      where: { user: { email: "grace@example.com" } },
      orderBy: { createdAt: "desc" },
    });
    await prisma.session.update({
      where: { id: revocable.id },
      data: { revokedAt: new Date() },
    });
    await revokedAgent.get("/api/v1/auth/me").expect(401);

    const logoutAgent = request.agent(server);
    await logoutAgent
      .post("/api/v1/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: "grace@example.com", password: "correct horse battery" })
      .expect(200);
    await logoutAgent
      .post("/api/v1/auth/logout")
      .set("Origin", ORIGIN)
      .expect(204);
    await logoutAgent.get("/api/v1/auth/me").expect(401);
  });

  it("rejects unsafe requests without an allowlisted origin", async () => {
    const response = await request(server)
      .post("/api/v1/auth/login")
      .send({ email: "ada@example.com", password: "a long passphrase" })
      .expect(403);
    expect(responseBody<ProblemBody>(response).code).toBe("untrusted_origin");
  });

  it("rate limits repeated login attempts without extra infrastructure", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(server)
        .post("/api/v1/auth/login")
        .set("Origin", ORIGIN)
        .send({ email: "missing@example.com", password: "wrong password" })
        .expect(401);
    }

    const response = await request(server)
      .post("/api/v1/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: "missing@example.com", password: "wrong password" })
      .expect(429);
    expect(responseBody<ProblemBody>(response).code).toBe("rate_limited");
    expect(response.headers["retry-after"]).toBeDefined();
  });
});
