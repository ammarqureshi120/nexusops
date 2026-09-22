# ADR-005: Enforce organization tenancy in application queries and relational constraints

- **Status:** Proposed
- **Date:** 2026-09-22

## Context

Cross-tenant access is NexusOps' highest-impact domain risk. Resources are often addressed by IDs and related across memberships, teams, projects, and work. Frontend context and globally unique IDs cannot provide isolation.

## Decision

Treat Organization as the tenant partition. Resolve an authenticated active membership into an `ActorContext`; enforce named capabilities and resource relationships in application services; include `organization_id` on tenant-owned tables; query tenant resources with compound tenant/resource predicates; and use constraints/compound foreign keys to prevent cross-tenant relations where practical. Cover each tenant entity with negative integration tests.

PostgreSQL row-level security is deferred. If adopted later, it supplements rather than replaces application authorization.

## Alternatives

- Database/schema per tenant: strong isolation but expensive migrations, pooling, analytics, and operations for the expected V1 scale.
- RLS from inception: valuable defense but Prisma connection/transaction context and policy testing add complexity and can create false confidence.
- ID-only lookups followed by role checks: easy to write but vulnerable to IDOR, relationship injection, and existence leakage.

## Consequences

Tenant scope is visible and reviewable in schema and queries, with some denormalization and composite-index cost. Unscoped query escape hatches are high risk. RLS remains a documented future defense when operational evidence and implementation support justify it.
