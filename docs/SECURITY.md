# Security architecture and threat model

## Scope and trust boundaries

Protected assets are user accounts, credentials/sessions, organization membership and roles, tenant work and comments, administrative/audit records, invitation channels, and service secrets. Trust boundaries exist between browser and web/API, public and authenticated routes, one tenant and another, API modules and persistence, worker and email provider, and build/deployment systems.

Primary assumptions: browser clients are untrusted; users may belong to multiple organizations; IDs can leak; an authenticated member may act maliciously; email is the V1 account-recovery channel; no file upload or third-party webhook surface exists in V1.

## Security invariants

- Authentication identifies a user; active tenant membership plus resource policy authorizes every operation.
- Tenant-owned reads and writes use tenant-scoped predicates. Client IDs, hidden UI, or route guards never establish access.
- Secrets/tokens are random, purpose-bound, hash-stored, time-limited where applicable, and never logged.
- Security-sensitive changes and repeated denied access are observable without recording sensitive payloads.
- Default-deny applies to capabilities, CORS origins, external destinations, fields accepted for mutation, and real-time rooms/events.

## Threat register

| Threat | Risk | Planned mitigation |
| --- | --- | --- |
| Account takeover | Password guessing, credential stuffing, stolen/reset session grants tenant access | Argon2id; rate limits by account/IP signals; generic auth responses; secure opaque cookies; session rotation/revocation; verified recovery; optional MFA deferred but architecture must permit it |
| Broken access control / IDOR | Member reads or mutates a resource outside their tenant/project | ActorContext from server session; capability + relationship policy; compound tenant predicates; concealed `404`; negative authorization and isolation tests |
| Cross-tenant relation injection | Attacker assigns another tenant's member/team to local records | Tenant-denormalized compound FKs where feasible; scoped `connect`/lookup; transaction checks; reject mismatched relationships |
| Privilege escalation | Admin/Manager promotes self, changes Owner, or exploits stale session policy | Explicit permission table; last/sole Owner invariant; sensitive change transaction; session/context refresh; audit events; no mass-assignment of role fields |
| Invitation abuse | Enumeration, replay, privilege injection, email flooding | Random hash-stored single-use token; expiry; bind email/org/role; active-invite uniqueness; invite/resend limits and idempotency; verify accepting email; audit revoke/accept |
| Brute force and enumeration | Login/reset/invite endpoints reveal users or exhaust resources | Uniform public responses/timing where practical; layered rate limits; bounded input; monitoring; optional challenge only after abuse evidence |
| CSRF | Cookie-authenticated browser is induced to issue unsafe requests | SameSite cookies, exact Origin/Referer validation on unsafe methods, CSRF token if topology requires, narrow CORS with credentials, no state change via GET |
| XSS | Malicious descriptions/comments steal actions/data | React escaping; sanitized allowlisted Markdown; no raw HTML rendering; CSP; avoid browser-readable auth tokens; context-aware output encoding |
| Injection | Crafted filters/search/input alters SQL or commands | DTO/schema validation and allowlists; Prisma parameterization; parameterized reviewed raw SQL; no shell construction from input |
| WebSocket hijack/leak | Unauthorized connections join tenant/user rooms or receive stale membership events | Authenticate handshake and revalidate on reconnect/room join; server-derived rooms; origin checks; disconnect/revoke on membership/session change where feasible; event payload minimization |
| Session fixation/theft | Reused identifier or weak cookie controls prolong compromise | Generate after authentication; rotate on privilege change; Secure/HttpOnly/host-only/SameSite; idle + absolute expiry; hashed storage; logout-all and reset revocation |
| Sensitive logging | Tokens, passwords, content, or personal data enter logs/errors | Structured allowlisted fields; header/body redaction; stable public errors; restricted access/retention; tests for redaction |
| Secrets/dependency compromise | Leaked config or vulnerable package/build affects application | Environment/secret manager; `.env` ignored; least-privilege CI; lockfile review; dependency updates/scanning; pinned actions; no secrets in client bundles |
| Email/outbox replay | Worker sends duplicates or attacker observes content | Idempotency/dedupe keys; leased retries; minimal payload; provider API over TLS; redact failures; status visibility and bounded retention |
| Denial of service | Expensive search, pagination, login, or sockets consumes resources | Input/page limits; cursor pagination; query timeouts/indexes; connection/pool limits; rate limits; payload limits; backpressure and health signals |
| Unsafe deletion | Cascades erase evidence or shared tenant history | Restrictive FKs, archive states, explicit high-impact workflow, backup/recovery procedure before enabling organization deletion |

File upload threats, SSRF from user-provided fetch URLs, payment fraud, public API key abuse, and webhook signature validation are excluded with their features; reassess before adding those surfaces.

## Authentication controls

- Password policy favors length, permits password managers/paste, screens commonly compromised values if a privacy-preserving option is available, and avoids arbitrary periodic rotation.
- Session cookie names, path/domain, SameSite, expiry, and HTTPS behavior are environment-tested. Production refuses insecure configuration.
- Verification/reset/invitation links avoid secrets in analytics/referrer leakage; landing pages promptly exchange/consume tokens and set a strict referrer policy.
- Password reset revokes all sessions and records a security event. Email change is post-V1 unless re-authentication, dual notification, and verification are designed.
- Auth and privilege endpoints require recent authentication where impact warrants it (ownership transfer, future organization deletion).

## Authorization policy

Route guards may ensure authentication and organization membership, but application services call named capabilities such as `organization.member.invite` or `project.work.update`. Resource checks include project ownership/membership, actor status, target role, and lifecycle state. Data access never falls back to unscoped `findUnique(id)` for tenant records.

Owner/Admin audit access does not grant direct database-style visibility into secrets, hashes, or removed content. Changes to Owner, Admin, membership status, invitations, session security, and organization settings create `ADMIN` or `SECURITY` events.

## Platform controls

- Validate environment configuration on startup; separate development/test/production values.
- TLS at ingress, HSTS after HTTPS readiness, CSP, frame-ancestors, MIME sniffing protection, strict referrer policy, and a minimal Permissions Policy.
- Database role has only required schema/data permissions; migrations use a separately controlled role where deployment supports it.
- API request body and URL size limits; allowlisted content types; pagination ceilings.
- Error responses include request IDs but not stack traces, SQL, provider payloads, or existence-sensitive detail.
- Backups, restore tests, retention, incident response contacts, and key rotation are release-readiness requirements even for a portfolio deployment.

## Verification gates

Before release, test cross-tenant read/write attempts for every tenant resource; the full role matrix on sensitive commands; last-Owner invariants; invitation replay/mismatch/expiry; session rotation/revocation/expiry; CSRF origin/token behavior; XSS sanitization; auth rate limits; WebSocket room authorization; error/log redaction; and dependency/container scans. Manual threat-model review repeats whenever a new external input, integration, role, or data-sharing path is proposed.

## Deferred security capabilities

MFA, enterprise SSO, SCIM, fine-grained custom roles, database RLS, tamper-evident external audit storage, user uploads, public API credentials, and formal compliance certification are not V1 features. Deferral does not permit architecture that prevents their later addition, but no speculative implementation is warranted.
