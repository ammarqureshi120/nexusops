# Conceptual data model

This document defines relational intent, not a Prisma schema. Names use singular model concepts and snake_case database fields for clarity; implementation naming is decided with the first migration.

## Modeling rules

- UUIDv7 or another time-sortable, non-sequentially-guessable identifier is preferred after verifying library/database support. IDs are never authorization evidence.
- All mutable rows have `created_at` and `updated_at`; immutable events have `occurred_at`. Store instants as UTC `timestamptz` and preserve organization timezone only as a setting for display/report boundaries.
- Every tenant-owned table carries `organization_id`, including deeply nested records where this enables safe compound foreign keys, tenant-scoped indexes, and simpler authorization review.
- Database constraints protect invariants; application validation produces friendly errors. Enums are stable domain concepts but should use check constraints or lookup-safe textual values when change frequency makes PostgreSQL enum migrations awkward.
- Prefer archive/status timestamps over a universal `deleted_at`. Hard-delete ephemeral tokens after expiry cleanup. Preserve security/audit facts according to an explicit retention policy.

## Identity and tenancy

### User

Global human identity. Key fields: `id`, normalized `email`, `email_verified_at`, `display_name`, `password_hash`, `status`, timestamps. Email is case-insensitively unique (normalized column or `citext`). A deactivated user cannot authenticate but historical attribution remains.

Relationships: sessions, token records, organization memberships, authored content, and event actor references. Never cascade-delete historical tenant content when a user is removed.

Indexes: unique normalized email; status only if operational queries justify it.

### Organization

Primary tenant. Key fields: `id`, `slug`, `name`, `timezone`, `status`, timestamps, optional `archived_at`. Globally unique normalized slug supports routing; display name is not unique. Organization deletion is a deliberate administrative workflow, not a routine cascade.

### OrganizationMembership

Joins a user to an organization and carries authorization context. Fields: `id`, `organization_id`, `user_id`, `role`, `status` (`ACTIVE`, `DEACTIVATED`), `joined_at`, `deactivated_at`, timestamps.

Constraints: unique `(organization_id, user_id)`; exactly one active Owner is enforced through a transaction and, where practical, a partial unique index. Role changes and deactivation must not remove the last Owner. Index `(user_id, status)` for workspace switching and `(organization_id, status, role)` for member administration.

### Session

Revocable authentication session. Fields: `id`, `user_id`, `token_hash`, `expires_at`, `absolute_expires_at`, `last_used_at`, `revoked_at`, coarse device/user-agent metadata, created time. `token_hash` is unique; expired/revoked sessions are periodically hard-deleted after a short diagnostic window. Index `(user_id, revoked_at, expires_at)`.

### PurposeToken

Hash-only record for email verification and password reset; invitation has its own business entity. Fields: `id`, `user_id`, `purpose`, `token_hash`, `expires_at`, `consumed_at`, created time. Unique token hash and index on expiry. Consumption is atomic.

### Invitation

Pending invitation to a tenant. Fields: `id`, `organization_id`, normalized `email`, `role`, `token_hash`, `invited_by_membership_id`, `expires_at`, `accepted_at`, `revoked_at`, timestamps.

Only one active invitation per `(organization_id, normalized_email)` via partial unique index. Acceptance verifies the authenticated/verified email, creates or reactivates membership under policy, and consumes the invitation in one transaction. Index tenant plus state/expiry; never expose the hash.

## Organization structure

### Team

Tenant-owned grouping. Fields: `id`, `organization_id`, `name`, optional `description`, `lead_membership_id`, `archived_at`, timestamps. Unique normalized active name per organization is recommended. Lead must be an active membership in the same tenant.

### TeamMembership

Fields: `organization_id`, `team_id`, `membership_id`, `created_at`; compound primary/unique key `(team_id, membership_id)`. Compound foreign keys ensure the team and membership share the organization. Removing a member does not delete their work history.

### Project

Container for operational work. Fields: `id`, `organization_id`, optional `team_id`, `key`, `name`, `description`, `status`, `owner_membership_id`, `start_date`, `target_date`, `archived_at`, timestamps, `version`.

Constraints: unique `(organization_id, key)` and optionally normalized active name within organization; dates must be coherent. Owner is active in the organization and included as a project member. Index `(organization_id, status, updated_at desc)`, `(organization_id, owner_membership_id, status)`, and team lookup.

### ProjectMember

Access/participation join. Fields: `organization_id`, `project_id`, `membership_id`, `created_at`; unique `(project_id, membership_id)`. V1 has no project-specific role—the Project owner is on `Project`, while organization role supplies coarse permissions.

## Work and collaboration

### WorkItem

Tenant/project-owned unit of work. Fields: `id`, `organization_id`, `project_id`, stable project-local `number`, `title`, optional structured/plain description, `status`, `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), `creator_membership_id`, optional `assignee_membership_id`, optional `start_date`, optional `due_date`, `completed_at`, `archived_at`, timestamps, `version`.

Constraints: unique `(project_id, number)`; project and assignee must share tenant, and assignee must have project access under policy. Completion timestamp follows status transactionally. Description format must be chosen before implementation; sanitized Markdown is preferred over storing arbitrary HTML.

Primary indexes follow query shapes:

- `(organization_id, project_id, archived_at, status, updated_at desc)` for project lists
- `(organization_id, assignee_membership_id, status, due_date)` for workload/overdue views
- `(organization_id, due_date)` partial on active non-done work for overdue queries
- normalized text search index for title/key, adding PostgreSQL trigram/full-text support only after query evaluation

### Comment

Work-item discussion. Fields: `id`, `organization_id`, `work_item_id`, `author_membership_id`, body, `edited_at`, optional `removed_at`, timestamps. Comment removal retains a tombstone for activity/reference integrity; content retention for moderated removal is a policy decision. Index `(organization_id, work_item_id, created_at, id)` for cursor pagination.

Mentions are parsed/validated against project-accessible active memberships at command time. A `CommentMention` join is warranted only when notifications/search require durable mention queries.

### Notification

User-specific durable inbox item. Fields: `id`, `organization_id`, `recipient_membership_id`, `type`, `actor_membership_id` nullable, `entity_type`, `entity_id`, small validated `payload`, `read_at`, created time, optional deduplication key.

Payload is presentation-support metadata, not the source of truth. Index `(recipient_membership_id, read_at, created_at desc, id)` and `(organization_id, recipient_membership_id, created_at desc)`. Unique deduplication key prevents repeated delivery where a single logical event maps to one notification.

## Activity and durable side effects

### ActivityEvent

One append-only fact model serves both human-facing activity and privileged audit queries in V1. Fields: `id`, `organization_id`, `actor_user_id`/`actor_membership_id` nullable for system actions, `category` (`PRODUCT`, `ADMIN`, `SECURITY`), `event_type`, `subject_type`, `subject_id`, optional parent project/work IDs, redacted JSON metadata, `audience`, `occurred_at`, `request_id`, optional source IP hash/prefix under a documented retention policy.

Product feeds query `PRODUCT` events visible to the project. Only Owner/Admin can query administrative/security categories. Events are immutable to application users. Metadata is allowlisted per event; do not serialize before/after database objects or secrets. Index tenant/category/time, subject/time, and project/time.

Separate `AuditLog` and `ActivityEvent` tables are deferred. Split them later only if retention, access control, tamper-evidence, or storage/query requirements genuinely diverge.

### OutboxMessage

Durable internal delivery record written in the same transaction as the triggering state change. Fields: `id`, `organization_id` nullable for global events, `topic`, `aggregate_type/id`, version, minimal payload, `available_at`, `claimed_at/by`, `attempts`, `processed_at`, `last_error_code`, created time.

Index pending `available_at`; enforce an event/deduplication identifier. Consumers are idempotent. Payload excludes secrets and unnecessary personal content. Processed rows are pruned under a retention policy after observability needs are met.

## Analytics model

V1 dashboard metrics are SQL aggregates over indexed transactional tables:

- Active projects: tenant/project status count
- Work by status: accessible work grouped by status
- Overdue: active work with due date before the organization-local current date
- Workload: open work grouped by assignee, explicitly showing unassigned
- Completion trend: work completed per week using `completed_at`
- Recent activity: scoped ActivityEvent query

No analytics table is introduced initially. If measured queries become expensive, start with purpose-built SQL/materialized views and documented freshness before any cache or warehouse.

## Lifecycle and cascade policy

- Membership removal/deactivation revokes access and sessions as appropriate, removes active team/project joins, and unassigns or flags assigned work through an explicit transaction; authorship stays intact.
- Team archive preserves projects. Project archive preserves work/comments and removes it from default queries.
- Work-item archive preserves comments/activity; normal users do not hard-delete it.
- Parent deletion uses `RESTRICT` for historical/business entities unless a reviewed organization-erasure workflow explicitly processes children. Join rows and ephemeral tokens may use cascade deletion.
- Token, session, outbox, and telemetry cleanup uses bounded maintenance jobs with retention documented before launch.

## Concurrency and transactions

- Invitation acceptance, ownership transfer, member deactivation, role changes, work-number allocation, status completion timestamps, notifications/activity, and outbox creation use transactions.
- `version` supports optimistic concurrency on frequently edited projects/work items. A stale update returns a conflict with current version metadata rather than silently overwriting.
- Work item numbers use a locked per-project counter or a transaction-safe database mechanism; `max + 1` without locking is prohibited.
- Authorization preconditions that can change during a command are rechecked in the transaction where practical.
