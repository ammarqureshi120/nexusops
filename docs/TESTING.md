# Testing and quality strategy

## Principles

Testing follows product risk, not an arbitrary coverage percentage. Use the smallest level that exposes the failure clearly, assert observable behavior, and reserve end-to-end tests for journeys whose cross-system integration is the risk. Tenant isolation, authorization, authentication, lifecycle invariants, and data integrity receive disproportionate attention.

Tests must not depend on execution order, production services, or shared mutable fixtures. Factories create explicit users, organizations, memberships, and relationships; IDs from different tenants are intentionally mixed in negative cases. Time, random tokens, email delivery, and the current actor are injectable at relevant boundaries.

## Layers

### Frontend

- Unit tests: pure permission/view helpers, formatting, URL filter parsing, state reducers, and schema edge cases where logic is non-trivial.
- Component/integration tests: forms, validation/error focus, filters in URL state, permission-aware actions, optimistic rollback/conflict handling, accessible dialogs/menus, and loading/empty/error states. Use a realistic API boundary rather than mocking implementation hooks.
- Accessibility checks: automated rules in component and E2E tests plus manual keyboard, focus, zoom, contrast, reduced-motion, and screen-reader smoke reviews.
- E2E: a small set of critical workflows through browser and API with deterministic seeded data. Prefer role and accessible-name selectors; avoid CSS structure selectors and broad screenshot tests.

### Backend

- Unit tests: permission policy, role transition rules, ownership, work transitions, token/session rules, notification recipient logic, and pure analytics date boundaries.
- Service tests: application use cases with real policy behavior and controlled ports for time/token/email; minimize mocks to actual external boundaries.
- API integration tests: real NestJS request pipeline and isolated PostgreSQL database for validation, cookies, CSRF/origin, status/error envelope, transactions, pagination/filtering, and OpenAPI contract behavior.
- Persistence tests: constraints, cascade/restrict behavior, indexes/query shapes where material, optimistic concurrency, outbox leases/idempotency, and transaction rollback.
- WebSocket tests: handshake/session and origin checks, authorized room routing, tenant isolation, duplicate/reconnect behavior, and revocation response.

### Contract and migration quality

Generate/validate OpenAPI in CI and detect unreviewed breaking changes once contracts stabilize. Every migration is applied from an empty database and from the prior milestone snapshot; destructive or blocking changes require a rollout note and recovery path. Generated frontend types, if adopted, are checked for drift.

## Critical test matrix

| Risk | Required evidence |
| --- | --- |
| Cross-tenant access | For every tenant entity, user from organization B cannot read, list through filters, mutate, relate, subscribe to, or infer organization A's resource |
| Role escalation | Each sensitive capability has allow and deny examples; Admin cannot create Owner/transfer ownership; last Owner cannot be removed |
| Invitation lifecycle | Valid acceptance, wrong email, expired/revoked/replayed token, duplicate invite, resend idempotency, role tampering, and transaction rollback |
| Session lifecycle | Secure cookie behavior, rotation, idle/absolute expiry, logout current/all, password-reset revocation, disabled-user rejection, CSRF/origin behavior |
| Resource relationships | Cannot assign non-member/cross-tenant user, attach foreign team/project, or access project after membership removal |
| Concurrent edits | Expected version succeeds; stale project/work update produces conflict without lost data |
| Durable side effects | Business change plus event/outbox commit together; retries are idempotent; poison work is visible; no email secret in logs |
| Search/list behavior | Stable cursor ordering, max page size, allowlisted sort/filter, Unicode/long input, permission scoping, no duplicate/missing records across normal pagination |
| Accessibility/resilience | Keyboard/focus path, labels/errors, reduced motion, loading/empty/error/offline states, optimistic rollback, and partial dashboard failure |

## Critical E2E workflows

1. Register → verify email → login → create organization → complete/skip optional onboarding.
2. Owner invites Member → invitee registers or logs in → accepts invitation → appears as active member.
3. Manager creates project → adds member → creates and assigns work → assignee updates status → both observe activity/notification.
4. Comment/mention → durable notification → authorized real-time delivery → read state persists after reload.
5. Admin attempts permitted role/member action; Manager/Member attempts equivalent forbidden action and receives the correct safe result.
6. A user with two organizations switches context; crafted IDs and WebSocket subscriptions never cross tenant boundaries.
7. Password reset revokes existing sessions; invitation/reset replay fails safely.

The first three flows are introduced incrementally rather than postponed to final hardening.

## Test environments and data

- Unit/component tests run in-process and parallel where isolation permits.
- API integration uses PostgreSQL matching the supported major production version. Each worker receives an isolated database/schema or transaction-safe reset mechanism.
- E2E uses production-like builds, a seeded database, captured/test email adapter, and one browser baseline initially; add a second engine only when risk/evidence justifies cost.
- No real user data or secrets in fixtures, snapshots, videos, traces, or CI logs. Failed artifacts have bounded retention.

## Coverage policy

Coverage is diagnostic. Track trends and require strong branch evidence around policies, tokens, tenant scoping, and lifecycle rules, but do not set 100% as a target. A changed high-risk rule without a focused test blocks the milestone even if aggregate coverage rises. Generated code, DTO boilerplate, and trivial framework wiring do not deserve tests solely for the number.

## Milestone quality gate

For each meaningful milestone:

1. Review acceptance criteria and threat/tenant implications before implementation.
2. Run formatter check, TypeScript checks for affected apps/packages, lint, focused tests, full affected test suites, and production builds.
3. Apply migrations to a clean database and exercise upgrade path when schema changes.
4. Review accessible/responsive states for changed UI.
5. Inspect the full diff and generated artifacts; verify no secrets, debug code, or unrelated changes.
6. Report exact commands, results, skipped checks, flaky behavior, and remaining risk. “Tests pass” alone is not a complete report.

CI evolves from fast static checks/unit tests to database integration and E2E as the relevant apps exist. Required checks must remain reliable and reasonably fast; quarantine is time-bounded with an owner and issue, never silent.
