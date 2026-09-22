# ADR-006: Use a PostgreSQL transactional outbox before adding Redis

- **Status:** Proposed
- **Date:** 2026-09-22

## Context

Verification, password reset, and invitation emails should not extend request transactions and must survive transient provider failures. Notifications/activity must not silently diverge from committed domain changes. Adding Redis solely to showcase a queue increases local and production operations.

## Decision

Write minimal, versioned outbox messages in the same PostgreSQL transaction as the triggering state. A bounded worker claims messages with leases, retries with backoff, records failure state, and invokes idempotent consumers. Use this for outbound email and durable side-effect coordination. Keep activity facts transactional where required. Defer scheduled reminders and Redis-backed queues.

## Alternatives

- Synchronous email: minimal components but slow, retry-unsafe, and capable of reporting failure after a domain commit.
- BullMQ/Redis: mature job features, but introduces another datastore before throughput/scheduling needs exist.
- Managed queue: operationally strong, but provider coupling and transaction handoff still require an outbox or equivalent guarantee.

## Consequences

Delivery is durable without a second datastore, but polling, cleanup, poison-message visibility, concurrency leases, and idempotency require careful tests. Revisit a managed/Redis queue when volume, scheduling, or isolation exceeds the simple worker.
