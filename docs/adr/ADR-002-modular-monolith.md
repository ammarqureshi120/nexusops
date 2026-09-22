# ADR-002: Build the API as a modular monolith

- **Status:** Proposed
- **Date:** 2026-09-22

## Context

The domain contains interacting identity, tenant, project, work, notification, and audit concerns, but V1 has no proven independent scaling, deployment, or team-ownership needs. Transactions and tenant safety span several concerns.

## Decision

Use one NestJS codebase and primary API deployable organized into explicit domain modules. Controllers adapt transport; application services own use cases and transactions; module-local data access uses Prisma without a generic repository wrapper. Use direct service calls for synchronous invariants and durable application events/outbox messages for side effects. A worker process may share the codebase for asynchronous email.

## Alternatives

- Microservices: isolate deployables but add network failure, distributed transactions, tracing, versioning, and operational load without a requirement.
- Unstructured monolith: easiest initially but invites cross-module persistence access and scattered authorization.
- CQRS/event sourcing: powerful for complex histories/read models but excessive for straightforward CRUD plus audited events.

## Consequences

V1 keeps transactions and local development understandable. Module boundaries must be enforced through imports, public services, review, and tests rather than network boundaries. A future extraction requires demonstrated ownership/scaling need and an ADR.
