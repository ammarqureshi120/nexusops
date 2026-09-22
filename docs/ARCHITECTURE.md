# Architecture

## System context

NexusOps is a browser-based SaaS with one web application, one API/worker deployable, PostgreSQL, and an email provider. It begins as a modular monolith so transactions, authorization, and operational ownership remain understandable to one engineer.

```text
Browser -> Next.js web -> NestJS REST API -> PostgreSQL
                     \-> authenticated WebSocket (later V1)
NestJS worker -> transactional outbox -> email provider
```

The web app never accesses the database. The API owns authentication, authorization, domain changes, persistence, audit, and real-time publication. The worker may share the API codebase but runs a distinct process when reliable email delivery is introduced.

## Planned repository shape

```text
apps/
  web/
    src/app/                 # routes and layouts
    src/features/            # feature-owned UI, state, schemas, public APIs
    src/components/ui/       # domain-neutral accessible primitives
    src/lib/                 # API client, auth bootstrap, utilities
  api/
    src/modules/             # bounded NestJS modules
    src/common/              # narrow cross-cutting transport/infrastructure concerns
    src/config/
    prisma/
packages/
  api-contracts/             # only if generated OpenAPI types prove useful
  config/                    # only after duplicated stable configuration exists
docs/
```

Use pnpm workspaces without Turborepo at first. Add no `ui`, `types`, or `validation` package speculatively. Frontend forms and API DTOs solve different trust-boundary problems; OpenAPI generation is the preferred contract-sharing mechanism.

## Frontend architecture

### Routes and layouts

- Public: marketing landing (minimal), sign-in, registration, verification, reset, invitation acceptance
- Onboarding: organization creation and optional setup steps
- App: `/o/[organizationSlug]/dashboard`, `/projects`, `/projects/[projectId]`, `/work/[workItemId]`, `/teams`, `/members`, `/notifications`, `/settings`
- Root layout handles fonts/theme shell; auth layout is distraction-free; organization layout resolves active tenant and renders app navigation

Next.js Server Components render route shells and server-suitable reads where they reduce waterfalls. Interactive tables, filters, forms, notifications, and real-time listeners are Client Components behind small boundaries. Authentication truth remains the API session; middleware may improve redirects but is never the authorization layer.

### Feature boundaries and dependency direction

`app -> features -> components/ui + lib`; shared layers must not import features. A feature exposes an `index.ts` public surface. Features coordinate through route composition, stable contracts, or shared domain identifiers—not internal component imports.

State is classified deliberately:

- URL state: filters, sort, search, page cursor, selected tab where linkable
- Server state: API queries, caching, invalidation, retry, and optimistic updates through RTK Query
- Form state: React Hook Form plus Zod client feedback; the server independently validates
- Local state: disclosure, selection, drafts, and transient interaction near the component
- Auth state: a bootstrapped current-session/current-membership query; no browser-readable bearer token
- Global client state: only truly cross-cutting UI such as transient sidebar preference; begin with context/local storage, not Redux slices

RTK Query is approved because invalidation, deduplication, tag relationships, optimistic patches, and a single API boundary are valuable across the interactive product. Next.js native fetch remains appropriate for server-rendered public/auth shells. Avoid fetching the same authenticated data through both systems in one route.

Errors use route error boundaries for rendering failures, inline messages for recoverable feature failures, field errors for validation, and toasts only for transient confirmation. Permission denials are distinct from absence where revealing existence is safe; inaccessible cross-tenant identifiers normally return `404`.

### Real-time client behavior

One organization-scoped connection authenticates through the existing session. Events carry a unique ID, entity ID, organization ID, type, and version/timestamp. Prefer RTK Query tag invalidation and refetch for complex aggregates; apply narrow optimistic/manual patches only when deterministic. Reconnect triggers a bounded refresh of visible queries and unread count. Duplicate or older versions are ignored.

## Backend modular monolith

| Module | Responsibility and entities | Exposed operations | Dependencies / key rules |
| --- | --- | --- | --- |
| Auth | Credentials, sessions, verification/reset tokens | Register, verify, login/logout, renew session, reset password | Users; hashes secrets; rate limits; rotates session ID at privilege changes |
| Users | Global user identity/profile | Current user, profile update | No tenant permissions by itself |
| Organizations | Tenant lifecycle/settings | Create/read/update organization, switch context | Memberships, Audit; Owner invariants |
| Memberships | Invitations, membership, roles | Invite/accept/revoke, list, role/status changes | Organizations, Users, Notifications; prevents last Owner removal |
| Teams | Teams and team membership | CRUD team, add/remove members | Memberships; members must be active in tenant |
| Projects | Project, project membership, ownership | CRUD/archive, membership and status changes | Memberships, Teams; project access policy |
| WorkItems | Operational work and assignments | CRUD/archive, list/filter/sort, state transitions | Projects, Memberships, Activity; assignee must have access |
| Comments | Work discussion | Create/edit/remove/list | WorkItems; author/moderator rules |
| Notifications | Durable user inbox | List, mark read, unread count | Consumes application events; recipient must be tenant member |
| Activity | Human-facing history and administrative audit | Scoped feeds and privileged audit query | Consumes transactionally recorded facts; immutable to normal users |
| Analytics | Read-only operational aggregates | Dashboard summaries | Projects/WorkItems read models; always tenant scoped |

Controllers parse transport input, call an application service, and map output. Application services own use cases, transactions, lifecycle rules, and authorization calls. Module-local query/data-access services encapsulate complex Prisma selection and mandatory scope; there is no generic repository layer.

Synchronous module calls are used for rules needed to complete a transaction. Durable side effects use an outbox row written in the same transaction. In-process handlers may project activity/notifications initially; email delivery consumes the outbox asynchronously when the worker is introduced.

## Tenant isolation and authorization

The organization is the partition key for all tenant-owned records, including child records where denormalizing `organization_id` improves safe scoping and indexes. A request pipeline:

1. Authenticates the opaque session and loads the user.
2. Resolves organization slug/ID from the route.
3. Loads an active membership and constructs `ActorContext { userId, organizationId, membershipId, role }`.
4. The application service checks the named capability plus resource relationship.
5. Data access queries use compound predicates such as `{ id, organizationId }`; nested writes connect only to equivalently scoped records.
6. A transaction writes the domain change, activity/audit facts, and outbox records as needed.

Defense in depth includes database foreign keys/compound unique constraints, code-reviewed scoped query helpers for high-risk access, optional PostgreSQL row-level security evaluation after the base model is proven, cross-tenant integration tests, non-enumerating errors, and alerts on repeated access denials. RLS is not a V1 dependency because Prisma transaction/session behavior adds meaningful complexity; application scoping remains mandatory even if RLS is later added.

## Authentication design

Use high-entropy opaque session tokens stored only in `Secure`, `HttpOnly`, `SameSite=Lax`, host-only cookies. Store only a keyed hash of the token server-side with user, expiry, created/last-used times, and revocation metadata. Rotate the identifier on login and security-sensitive privilege change; use rolling renewal within an absolute lifetime. Exact idle and absolute durations are configuration decisions tested at implementation.

This is simpler to revoke and safer in the browser than long-lived JWT refresh tokens. A server-side session lookup is an acceptable database cost and can be cached later only if measured. Cookie authentication requires CSRF controls: SameSite, strict origin checking on unsafe requests, and a CSRF token pattern if deployment topology or browser clients require cross-site requests. CORS is an explicit allowlist with credentials.

Passwords use Argon2id with deployment-calibrated parameters. Verification, reset, and invitation tokens are random, single-use, purpose-bound, expiry-bound, stored as hashes, and consumed transactionally. Login/reset endpoints use rate limits and non-enumerating responses. Password reset and compromised-account actions revoke sessions.

## API conventions

Use `/api/v1` because a public web client and durable documentation benefit from an explicit compatibility boundary. Resources are plural nouns and nested only where context is essential:

```text
POST   /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/current
GET    /api/v1/organizations/{orgId}/projects?status=ACTIVE&sort=-updatedAt&cursor=...
POST   /api/v1/organizations/{orgId}/projects/{projectId}/work-items
PATCH  /api/v1/organizations/{orgId}/work-items/{workItemId}
```

Use `200/201/204`, `400` malformed input, `401` unauthenticated, `403` known-but-disallowed actions, `404` absent or intentionally concealed resources, `409` lifecycle/version conflict, `422` semantically invalid input if it is meaningfully distinct, and `429` rate limiting.

Errors follow RFC 9457-style problem details with stable `type`, `title`, `status`, `code`, `detail`, `instance`, `requestId`, and optional field `errors`. Do not expose stacks or database messages.

Collection responses contain `data` and `page: { nextCursor, hasMore }`. Cursor pagination is default for activity, notifications, work, and members; small fixed enumerations can be unpaginated. Filtering uses allowlisted query fields, sorting uses an allowlist with `-` for descending, and search is length-limited and normalized. List responses select bounded fields; detail endpoints carry rich descriptions.

Require an `Idempotency-Key` for invitation creation/resend and other externally side-effecting commands where retries could duplicate email. Work-item updates use an expected `version`/ETag and return `409` on stale writes.

## Jobs, caching, and real time

- Jobs: reliable invitation, verification, and reset email justify background execution. Start with a PostgreSQL transactional outbox and worker using leases, attempts, backoff, and dead-letter visibility. This avoids Redis solely for a queue.
- Scheduled overdue reminders are deferred. In-app overdue status is computed/queryable; no daily job is required.
- Caching: rely first on browser/server-state caching and sound SQL. Cache only public/static Next.js assets and safe reference data. Do not cache authorization decisions. Reconsider Redis for session/unread-count pressure or multi-instance Socket.IO fan-out after measurement.
- Real time: add WebSockets late in V1 for notification creation, comment creation, assignment, and status changes. The database remains authoritative. Connection and room joins re-check session and membership; no client-chosen arbitrary room names.

## Observability and operations

- Structured JSON logs with request/correlation ID, route template, status, duration, actor/tenant identifiers where appropriate, and redaction
- Central error reporting with environment and release metadata; no sensitive content
- `/health/live` for process health and `/health/ready` for required dependency readiness
- Metrics added around request latency/errors, database pool/query health, worker lag/failures, WebSocket connections, and authentication denials as deployment matures
- Graceful shutdown stops new traffic, drains bounded work, and closes database/socket resources

Local Docker and CI are delivery concerns for later milestones. Production topology remains provider-neutral.

## Technology evaluation

| Technology | Problem solved / fit | Tradeoff and alternative | V1 decision |
| --- | --- | --- | --- |
| Next.js App Router | Routing, layouts, server rendering, bundle boundaries | Framework caching complexity; Vite SPA is simpler but loses integrated routing/rendering | Adopt |
| React + TypeScript | Interactive UI and typed domain boundaries | Requires discipline around client state and runtime validation | Adopt, strict mode |
| Tailwind CSS | Fast token-driven styling near components | Utility noise; CSS Modules is viable | Adopt with semantic tokens and UI primitives |
| Radix-style accessible primitives | Robust dialogs/menus/focus without a visual template | Dependency surface; native elements preferred when sufficient | Select per primitive, not a full component suite |
| RTK Query | Authenticated server-state cache, invalidation, optimistic flows | Redux ceremony; TanStack Query is smaller and equally credible | Adopt provisionally; validate in M1 spike |
| React Hook Form + Zod | Performant forms and immediate typed feedback | Duplicate server validation; native forms suit trivial cases | Adopt for non-trivial forms only |
| NestJS | Module boundaries, DI, guards/interceptors, OpenAPI | More framework ceremony than Fastify/Express | Adopt for domain breadth and consistent boundaries |
| REST + OpenAPI | Debuggable resource API and generated contracts | Over/under-fetching; GraphQL unnecessary for V1 query shapes | Adopt |
| PostgreSQL | Relational integrity, transactions, indexing, text search | Operational database required; SQLite lacks target concurrency/features | Adopt |
| Prisma | Type-safe access and productive migrations | Some advanced SQL needs raw reviewed queries; migration discipline required | Adopt |
| Socket.IO | Reconnect/rooms/transport ergonomics | Stateful operations and adapter needed at scale; SSE is simpler one-way | Add only in notification milestone |
| PostgreSQL outbox worker | Durable email side effects without new service | Polling and worker code; synchronous email is simpler but unreliable | Add with first outbound email |
| Redis | Shared ephemeral state, queue/fan-out/cache at scale | Extra operational dependency and consistency burden | Defer |

## Critical architecture review

The review found no critical blocker in the proposed plan after simplification. The meaningful risks and required responses are:

| Priority | Finding and impact | Required response |
| --- | --- | --- |
| High | Tenant scoping can be bypassed if developers use unscoped unique lookups | Compound tenant predicates, constrained module query services, review checklist, and negative integration tests from M4 onward |
| High | Cookie sessions without deliberate CSRF handling expose unsafe commands | Origin validation and CSRF design must be acceptance criteria in M3; deployment CORS/cookie topology documented before release |
| High | Notifications/activity/email can diverge if emitted after commit | Record activity/outbox facts transactionally for material changes; make consumers idempotent |
| Medium | Prisma plus RLS at inception would complicate transactions and give false confidence | Defer RLS; retain mandatory application scoping and revisit with evidence |
| Medium | RTK Query plus Server Components could duplicate caching/fetches | Assign ownership per route and validate the approach in M1 before broad adoption |
| Medium | WebSockets, Redis, and a queue were premature in the initial proposal | Defer Redis; use a database outbox; add real time only after durable notifications |
| Medium | Separate `ActivityEvent` and `AuditLog` tables risk duplicate facts | Use one immutable event table with audience/category fields unless retention or access evidence later demands separation |
| Low | Too many shared packages would create unstable coupling | Start with none; generate API contracts only when two consumers exist |

Remaining decisions are captured in the ADRs and approval gates in the roadmap.
