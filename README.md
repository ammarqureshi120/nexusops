# NexusOps

NexusOps is a multi-tenant B2B operations platform for organizations that need a calm, structured place to organize teams, projects, and day-to-day work. The repository currently contains the approved product and architecture foundation plus minimal web and API application shells.

## Current implementation

Implemented:

- Product, architecture, data, security, testing, performance, and UI/UX planning
- pnpm workspace with separate Next.js web and NestJS API applications
- Responsive, accessible web foundation page with semantic design tokens
- Versioned API foundation with `GET /api/v1/health`, validated runtime configuration, security headers, CORS allowlisting, and graceful shutdown hooks
- Strict TypeScript, ESLint, Prettier, production builds, and focused API foundation tests

Planned but not implemented:

- Database and Prisma integration
- Authentication, sessions, users, organizations, memberships, invitations, and RBAC
- Teams, projects, work items, comments, activity, notifications, analytics, and search
- Transactional outbox, background processing, WebSockets, and deployment infrastructure

## V1 in one paragraph

A user can create an account and organization, invite colleagues, organize members into teams, create projects and work items, assign and discuss work, receive in-app notifications, and review meaningful project and organization activity. Managers get a concise operational dashboard covering active projects, work status, overdue items, and workload. Tenant isolation, role-based permissions, auditability, accessible UX, and risk-based tests are first-class requirements.

## Planned architecture

- pnpm workspace with `apps/web` and `apps/api`; no build orchestrator initially
- Next.js App Router frontend with feature-oriented modules and a small accessible UI foundation
- NestJS REST API as a modular monolith with OpenAPI contracts
- PostgreSQL with Prisma, explicit relational constraints, indexes, and transactions
- Opaque, revocable server sessions in secure HTTP-only cookies
- Transactional outbox for durable side effects; a database-backed worker is added with email delivery
- Selective real-time notification delivery later in V1; Redis is deferred until scaling evidence requires it
- Docker Compose for local development and GitHub Actions during the delivery phase, not during planning

The rationale and tradeoffs are documented in [Architecture](docs/ARCHITECTURE.md) and the [ADRs](docs/adr/).

## Local development

Prerequisites:

- Node.js 22.12 or newer within the Node 22 release line
- Corepack (included with the supported Node installation)

Install dependencies and start both applications:

```powershell
corepack pnpm install
corepack pnpm dev
```

The web application runs at `http://localhost:3000`. The API health endpoint runs at `http://localhost:3001/api/v1/health`.

The API defaults to port `3001` with cross-origin requests disabled. Set `PORT` and a comma-separated `CORS_ORIGINS` environment variable when another local origin needs API access; safe examples are documented in `apps/api/.env.example`.

Run the verified workspace quality gates:

```powershell
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## Documentation map

- [Product definition and V1 scope](docs/PRODUCT.md)
- [System and API architecture](docs/ARCHITECTURE.md)
- [Conceptual data model](docs/DATA_MODEL.md)
- [UI and UX direction](docs/UI_UX.md)
- [Security and threat model](docs/SECURITY.md)
- [Testing strategy](docs/TESTING.md)
- [Performance strategy](docs/PERFORMANCE.md)
- [Milestone roadmap](docs/ROADMAP.md)

## Current status

Planning is approved and the M0 repository/application foundation is established locally. Business implementation must continue milestone by milestone from the roadmap. Decisions requiring approval before later milestones remain listed there.

No performance, usage, reliability, or customer claims are made at this stage.
