# ADR-008: Add selective Socket.IO delivery after durable notifications

- **Status:** Proposed
- **Date:** 2026-09-22

## Context

Assignments, comments, status changes, and notification counts benefit from prompt updates, but making every record collaborative in real time adds conflict, scaling, and cache complexity. The application needs reconnect and authorized room behavior more than raw WebSocket minimalism.

## Decision

At M10, add Socket.IO for notification creation, assignment/status changes, comments, and material project updates. Authenticate with the opaque session, derive user/tenant rooms on the server, authorize joins, send compact versioned events, and treat PostgreSQL/API reads as authoritative. Clients deduplicate and invalidate/refetch complex cached views. A single API instance is the explicit initial real-time topology; add a Redis adapter only before multi-instance deployment.

## Alternatives

- Polling: operationally simple and remains the fallback, but notification latency and repeated requests are poorer.
- Server-Sent Events: simpler one-way delivery, but Socket.IO provides mature reconnect/room ergonomics for the selected interactions.
- Redis adapter immediately: enables horizontal fan-out but adds infrastructure before deployment requires it.
- Manual mutation of all client caches: lower refetch traffic but error-prone across filtered lists and aggregates.

## Consequences

Users receive prompt relevant updates without a collaborative-editing system. Real-time remains eventually consistent and must handle duplicate/out-of-order events and reconnect refresh. Horizontal scaling is blocked until a shared adapter is implemented and tested, and this limitation must be visible in deployment docs.
