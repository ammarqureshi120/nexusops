# ADR-007: Use feature-oriented frontend modules and a dedicated server-state cache

- **Status:** Proposed
- **Date:** 2026-09-22

## Context

NexusOps has interactive lists, filters, optimistic commands, notifications, forms, and tenant switching. A folder structure by technical type creates coupling, while a global store containing copied API data creates synchronization bugs. Next.js also provides server rendering and its own fetch cache.

## Decision

Organize the web app by feature with explicit public surfaces, a domain-neutral accessible UI layer, and shared infrastructure in `lib`. Keep URL, server, form, local, and cross-cutting UI state distinct. Provisionally use RTK Query for authenticated interactive server state, React Hook Form for non-trivial forms, and Zod for client feedback. Generate types from OpenAPI if that proves reliable; do not share Prisma/domain entities with the browser.

Each route deliberately chooses Server Component fetching or RTK Query ownership to avoid duplicate caches. Validate RTK Query against TanStack Query in M1 before locking the dependency.

## Alternatives

- Next.js fetch/server actions for all data: attractive integration but less suitable for the separately owned NestJS REST API and highly interactive client cache.
- TanStack Query: less Redux ceremony and a strong alternative; the M1 spike may replace the provisional decision.
- Global Redux slices for API data: explicit but duplicates cache/invalidation machinery and server truth.

## Consequences

Features stay cohesive and server data behavior is centralized. The team must document client/server boundaries and avoid fetching one resource through two cache owners. RTK Query adoption remains reversible until the M1 evidence gate.
