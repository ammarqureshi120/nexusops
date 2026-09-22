# NexusOps project guidance

Inherit the global engineering guidance and use the relevant global frontend, backend, UI/UX, testing, performance, architecture-review, security, and Git skills for focused work. This file records only NexusOps-specific constraints.

## Product and stack

- NexusOps is a multi-tenant B2B operations and work-management SaaS.
- The planned stack is a pnpm workspace with `apps/web` (Next.js App Router, React, TypeScript, Tailwind CSS) and `apps/api` (NestJS, TypeScript, REST/OpenAPI), backed by PostgreSQL through Prisma.
- The backend starts as a modular monolith. Redis, queues, and WebSockets are optional capabilities introduced only at the milestone that demonstrates their need.
- The organization is the tenant boundary. Every tenant-owned query and mutation must derive tenant context from authenticated membership and scope data access accordingly.

## Architecture boundaries

- Frontend code is feature-oriented. Shared UI primitives remain domain-agnostic; features expose deliberate public APIs and do not reach into one another's internals.
- Server state stays in the server-state layer; local interaction state stays local. Do not mirror API data into a global client store.
- Backend controllers are transport adapters. Business rules and authorization live in testable application/domain services; Prisma is used directly inside cohesive module data-access services where a boundary adds value.
- Modules may collaborate only through explicit services/contracts or application events. Do not import another module's persistence internals.
- Do not add shared packages until at least two real consumers need the same stable contract. Do not share database entities as frontend API types.

## Tenant and security invariants

- Never trust a client-supplied `organizationId` as authorization proof.
- Resolve the active organization from the route plus the authenticated session, then verify active membership and required capability before resource access.
- Scope queries by both tenant and resource identifier; avoid fetch-then-authorize patterns that permit IDOR or existence leaks.
- Treat role checks as coarse gates and enforce ownership, project membership, and lifecycle rules at the business boundary.
- Security-sensitive changes are transactional and auditable. Never log credentials, raw tokens, session secrets, or sensitive personal content.

## Delivery workflow

- Work milestone by milestone: plan, implement a coherent slice, self-review, format, typecheck, lint, test, build, inspect the diff, then commit if requested.
- Do not generate the whole project in one pass. Keep commits focused and preserve unrelated work.
- Every milestone must meet its acceptance criteria and cover relevant loading, empty, error, authorization, responsive, and accessible states.
- Architecture changes affecting tenancy, authentication, module boundaries, persistence, public API contracts, or infrastructure require an ADR update and review before implementation.
- Do not add dependencies or infrastructure for portfolio appearance. Record measurements before claiming performance improvements.

## Quality gates

- TypeScript strict mode; no unbounded `any` at external or domain boundaries.
- Validate all API input and configuration; return stable problem details without internal leakage.
- Add focused tests for business rules, API boundaries, authorization, and tenant isolation. E2E tests cover only critical cross-module journeys.
- Meet WCAG 2.2 AA intent for core workflows, keyboard access, focus, contrast, labels, errors, and reduced motion.
- Before completion, run the applicable formatter, typecheck, linter, tests, and production build, and report exactly what ran.
