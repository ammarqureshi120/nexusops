# ADR-003: Use PostgreSQL with Prisma

- **Status:** Proposed
- **Date:** 2026-09-22

## Context

NexusOps depends on relational integrity, tenant-scoped queries, transactions, constraints, pagination, operational aggregates, and useful text search. TypeScript productivity matters, but the database model must not be reduced to ORM defaults.

## Decision

Use a supported PostgreSQL release as the system of record and Prisma for schema migrations and routine type-safe access. Model explicit constraints and indexes, inspect generated migrations, and permit parameterized raw SQL for capabilities/query plans Prisma cannot express well. Integration tests run against PostgreSQL, not an in-memory substitute.

## Alternatives

- SQLite: excellent simplicity but not representative of target concurrency, indexing, or PostgreSQL search/constraint behavior.
- MongoDB: flexible documents do not fit the dense relational membership and integrity model as well.
- TypeORM/Drizzle: viable; Prisma offers cohesive migration/client ergonomics, while Drizzle offers closer SQL control. Either still requires database expertise.

## Consequences

Developers get typed access and a clear migration path. Advanced indexes/checks may require SQL migrations, and Prisma abstractions must not obscure query plans or transactions. Provider selection must account for connections, backups, restore, and migration execution.
