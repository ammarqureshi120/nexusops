# NexusOps

NexusOps is a planned multi-tenant B2B operations platform for organizations that need a calm, structured place to organize teams, projects, and day-to-day work. The repository is currently in its product and architecture planning phase; no application has been scaffolded.

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

Planning is complete when these documents and ADRs are accepted. Implementation must begin at M0 in the roadmap and proceed in coherent, reviewable milestones. Decisions requiring approval before implementation are listed in the roadmap.

No performance, usage, reliability, or customer claims are made at this stage.
