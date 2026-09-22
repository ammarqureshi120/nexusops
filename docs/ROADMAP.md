# Implementation roadmap

## Delivery rules

Each milestone follows: plan → implement one coherent slice → review architecture/security/UX impact → format/typecheck/lint/test/build → inspect full diff → commit if requested. Acceptance criteria are user-observable or objectively verifiable. A milestone may be split into smaller pull requests; it must not silently absorb later features.

## M0 — Repository foundation

**Objective:** establish a reproducible workspace without product features.

**Scope/deliverables:** initialize Git; pnpm workspace; `apps/web` and `apps/api` minimal production-capable shells; shared TypeScript/format/lint conventions only where actually shared; environment validation pattern; `.gitignore`; contribution/decision workflow; baseline CI for install, static checks, tests, and builds.

**Dependencies:** approved planning and stack ADRs.

**Acceptance/tests:** clean clone installs with pinned tooling; both apps start and build; CI commands match local commands; no secrets/generated artifacts committed.

**Non-goals:** database, auth, domain UI, Docker runtime stack, speculative packages.

## M1 — Design and application shells

**Objective:** prove frontend boundaries, responsive shell, and accessible visual foundation.

**Scope/deliverables:** semantic tokens; selected accessible primitives; auth/app layouts; organization-aware navigation placeholder; loading/error/not-found boundaries; representative dashboard/project/work-detail static states; RTK Query vs TanStack Query decision spike; Storybook only if isolated component review clearly justifies its maintenance.

**Dependencies:** M0.

**Acceptance/tests:** keyboard navigation, focus, reduced motion, mobile through wide layouts, 200% zoom, automated accessibility smoke checks, route bundle baseline, no fake analytics data presented as real.

**Non-goals:** live API/domain persistence, complete design system, dark mode, decorative motion.

## M2 — Database and API foundations

**Objective:** establish safe relational and transport foundations.

**Scope/deliverables:** PostgreSQL/Prisma setup; initial identity/organization/session/event/outbox schema subset; migration workflow; API `/api/v1`, validation, problem details, request IDs, structured redaction, health endpoints, transaction conventions; Docker Compose for PostgreSQL local development.

**Dependencies:** M0; data model approval.

**Acceptance/tests:** clean and upgrade migrations; constraints proven; API errors/OpenAPI stable; health/readiness behavior; integration database isolation; query logging does not expose secrets.

**Non-goals:** Redis, WebSockets, production deployment, all domain tables in one migration.

## M3 — Authentication and account recovery

**Objective:** provide a secure, complete account/session lifecycle.

**Scope/deliverables:** register, verify, login/logout current/all, current user, reset password, opaque sessions, secure cookies, origin/CSRF controls, rate limits, email outbox worker and test adapter, auth UI states.

**Dependencies:** M2; deployment-origin assumptions documented.

**Acceptance/tests:** token replay/expiry, hashing, session rotation/revocation/expiry, disabled account, generic responses, rate limiting, CSRF/origin behavior, log redaction, end-to-end register/verify/login/reset.

**Non-goals:** MFA, OAuth/social login, SSO, device-risk scoring.

## M4 — Organizations and tenant isolation

**Objective:** make organization context a proven security boundary.

**Scope/deliverables:** create/list/switch/update organization, Owner membership, organization routing/context, actor/capability policy framework, scoped data-access conventions, onboarding entry/skip.

**Dependencies:** M3.

**Acceptance/tests:** multi-organization user flow; tenant IDs cannot cross read/write/relations; Owner invariants; concealed existence behavior; organization URL/session mismatch; onboarding empty/error states.

**Non-goals:** invitations, teams, organization deletion, custom roles, RLS.

## M5 — Memberships, invitations, and RBAC

**Objective:** safely grow and administer a workspace.

**Scope/deliverables:** member/pending-invite views; invite/resend/revoke/accept; role/status changes; deactivation/removal policy; permission matrix implementation; transactional admin/security events.

**Dependencies:** M4; email worker from M3.

**Acceptance/tests:** full role allow/deny matrix; wrong-email/expired/replayed invitation; deduplication/idempotency; last Owner; membership deactivation effects; critical invitation E2E.

**Non-goals:** custom roles, SCIM, bulk import, invitation domains.

## M6 — Teams

**Objective:** organize active members without expanding the authorization model unnecessarily.

**Scope/deliverables:** create/update/archive team; list/detail; add/remove members; optional lead; responsive member selection and empty states.

**Dependencies:** M5.

**Acceptance/tests:** only active same-tenant members can join; authorization matrix; duplicate/concurrent membership behavior; archive semantics; accessible selection UI.

**Non-goals:** nested teams, team-specific roles, capacity planning.

## M7 — Projects and project access

**Objective:** create durable containers with explicit ownership and access.

**Scope/deliverables:** project CRUD/archive/status; project owner/members; optional team association; list/filter/detail/activity shell; optimistic concurrency.

**Dependencies:** M5; M6 for team association.

**Acceptance/tests:** project visibility policy; cross-tenant relation attempts; owner/member lifecycle; stable pagination; stale update conflicts; responsive/permission/error states.

**Non-goals:** templates, dependencies, board/timeline views, portfolio hierarchy.

## M8 — Work items

**Objective:** support the core operational loop end to end.

**Scope/deliverables:** create/view/edit/archive; assignment, status, priority, dates, description; list/search/filter/sort/cursor pagination; project-local number; version conflicts; URL-backed views.

**Dependencies:** M7.

**Acceptance/tests:** scoped assignment and all role/resource rules; transaction-safe numbering; due/completion boundaries; search/filter stability; N+1/request-count checks; optimistic rollback/conflict UX; manager-to-assignee E2E.

**Non-goals:** subtasks, dependencies, recurring work, custom fields, bulk edit, attachments, board view.

## M9 — Comments and activity

**Objective:** add contextual collaboration and explainable history.

**Scope/deliverables:** comment create/edit/remove; sanitized Markdown decision; mention parsing; project/work activity feed; unified product/admin/security event queries with audience controls.

**Dependencies:** M8.

**Acceptance/tests:** author/moderator policy; XSS payloads; mention access validation; immutable events; metadata redaction; cursor feeds; removed-comment behavior.

**Non-goals:** chat, reactions, rich collaborative editor, attachments, separate audit service.

## M10 — Notifications and selective real time

**Objective:** deliver relevant changes durably and promptly.

**Scope/deliverables:** notification creation for the essential V1 categories, inbox/read state/count/deep links; authenticated Socket.IO gateway; user/tenant routing; reconnect/dedupe/invalidation; outbox-driven email only for already approved cases. Categories use product defaults; configurable preferences are deferred.

**Dependencies:** M9; stable application events.

**Acceptance/tests:** recipient rules; tenant and room isolation; revoked membership/session; duplicate/out-of-order/reconnect behavior; optimistic mark-read rollback; unread query plan; multi-instance limitation documented.

**Non-goals:** Redis adapter until multi-instance deployment, push/mobile notifications, digests, granular matrix, real-time every mutation.

## M11 — Dashboard and scoped search

**Objective:** provide explainable operational insight and fast discovery.

**Scope/deliverables:** active projects, work by status, overdue work, workload, completion trend, recent activity; scoped project/work/member search; deep-link filters; independent partial-error states.

**Dependencies:** M8–M10.

**Acceptance/tests:** role/project scoping; organization timezone boundaries; empty/unassigned cases; query plans with realistic high-cardinality seed; payload/request count; every metric links to source records.

**Non-goals:** predictions, warehouse, arbitrary reports, Elasticsearch, executive BI.

## M12 — Cross-cutting quality hardening

**Objective:** close accumulated security, accessibility, resilience, and performance risks.

**Scope/deliverables:** complete critical E2E suite; tenant/role matrix audit; screen-reader/keyboard/zoom review; Web Vitals and API/query baselines; failure/retry exercises; dependency/container scan; backup/restore and migration rehearsal; observability dashboards/alerts appropriate to chosen host.

**Dependencies:** feature-complete V1.

**Acceptance/tests:** documented measured baselines (not invented improvements); no unresolved Critical/High review findings; threat model verification; cross-browser smoke; worker poison-message recovery; production-like load scenarios.

**Non-goals:** feature expansion or premature tuning.

## M13 — Delivery, deployment, and public documentation

**Objective:** make V1 reproducibly deployable and understandable.

**Scope/deliverables:** production Docker images and Compose developer stack; GitHub Actions build/test/scan; chosen-host deployment/runbook; migrations/rollback and secret handling; seed/demo path with clearly synthetic data; README architecture diagrams and contribution guidance; screenshots only from working UI.

**Dependencies:** M12 and hosting decision.

**Acceptance/tests:** clean-clone setup; container health/non-root behavior where feasible; deploy/migration/rollback rehearsal; smoke tests; links/docs accurate; license and security-reporting policy selected.

**Non-goals:** Kubernetes, multi-region, fabricated benchmarks/users/history, public paid service launch.

## Approval gates before implementation

The following require owner approval before the relevant milestone:

1. Overall V1 scope and explicit exclusions in `PRODUCT.md`.
2. Opaque cookie sessions and the expected same-site web/API deployment topology.
3. Project visibility recommendation: explicit project membership with Owner/Admin oversight.
4. Members cannot create projects by default; Managers and above can.
5. pnpm workspace without Turborepo and no speculative shared packages.
6. PostgreSQL transactional outbox/worker for email, with Redis deferred.
7. Unified `ActivityEvent` model for product activity and privileged audit views in V1.
8. Socket.IO introduced at M10 and single-instance real-time until a measured need for shared fan-out.
9. Provider choices for email, hosting, error reporting, and telemetry before deployment-specific work.

There are **14 milestones (M0–M13)**. The plan intentionally merges overlapping foundation/hardening work and delays infrastructure until a feature or deployment need establishes it.
