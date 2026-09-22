# ADR-004: Authenticate browsers with opaque cookie sessions

- **Status:** Proposed
- **Date:** 2026-09-22

## Context

The first-party browser application needs secure login, immediate revocation, password-reset invalidation, organization role changes, and a WebSocket handshake. Long-lived browser-readable bearer tokens increase XSS impact; JWT revocation adds state anyway.

## Decision

Issue high-entropy opaque session tokens in Secure, HttpOnly, SameSite, host-only cookies. Store only a keyed token hash and session metadata server-side. Rotate identifiers on authentication and sensitive privilege changes; enforce idle and absolute expiry; support current/all-session revocation. Protect unsafe cookie-authenticated requests with SameSite, strict Origin checks, narrow credentialed CORS, and a CSRF token mechanism if the selected deployment topology needs it.

## Alternatives

- Access/refresh JWTs: reduce a lookup for some deployments but complicate rotation, replay detection, revocation, and browser storage.
- Framework-managed Next.js-only sessions: convenient but makes the separate NestJS API and WebSocket authority less clear.
- Browser-stored bearer token: simple API mechanics with unacceptable token exposure tradeoffs for this first-party app.

## Consequences

Revocation and security events are straightforward, at the cost of a session lookup and cleanup process. Web and API deployment origins must be planned carefully. CSRF is an explicit control, not assumed away by HttpOnly cookies.
