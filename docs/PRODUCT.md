# Product definition

## Vision and positioning

NexusOps is a focused operations workspace for small and mid-sized organizations coordinating recurring and project-based work. It combines clear ownership, team and project context, lightweight collaboration, timely notifications, and an auditable record without adopting the complexity of enterprise workflow platforms.

The product differentiator is coherence rather than feature volume: a manager should understand operational health, and a contributor should understand what needs attention, without maintaining a highly configurable system.

## Personas and responsibilities

| Persona | Responsibilities | Typical permissions |
| --- | --- | --- |
| Owner | Accountable for the workspace, governance, and continuity | All organization capabilities; transfer ownership; manage admins; organization deletion (post-V1 unless recovery is designed) |
| Administrator | Operates membership, teams, and organization settings | Invite/deactivate members; change Manager/Member roles; manage teams and all projects; cannot transfer ownership or demote the Owner |
| Manager | Coordinates teams and delivery | Create projects; manage projects they own or belong to; assign work within accessible projects; view operational summaries |
| Team Member | Performs and collaborates on work | View accessible teams/projects; create or update permitted work; comment; manage own notification state |

Roles are organization-scoped. Project ownership and project membership add resource context; they are not new global roles. An organization always has exactly one active Owner.

## Primary journey

1. A user registers, verifies email, and signs in.
2. The user creates an organization with a unique slug and becomes Owner.
3. Lightweight onboarding asks for organization details and offers, but does not require, an initial team, project, and invitations.
4. Invitees accept a single-use, expiring invitation and join with the assigned role.
5. Authorized members create teams and projects, add project members, and define work.
6. Members assign, prioritize, schedule, filter, and discuss work in the context of a project.
7. Assignments, mentions, comments, and material status changes create durable in-app notifications; connected clients receive selected events promptly.
8. Managers review status distribution, overdue work, workload, and recent activity, then navigate to the underlying records.
9. Important administrative and security actions remain auditable.

Users may belong to multiple organizations. Organization selection is explicit in the URL and app switcher; recent selection is convenience state, never an authorization input.

## V1 scope

### Accounts and access

- Registration, email verification, login, logout from the current session, and logout from all sessions
- Forgot/reset password with single-use, expiring tokens
- Session list and revocation are desirable in V1 if delivery remains small; at minimum password reset revokes all existing sessions
- Organization invitations for existing or new users

### Organization and membership

- Create and switch organizations; edit name and basic settings
- List, invite, resend/revoke invitation, change permitted roles, deactivate, and remove memberships
- Owner, Admin, Manager, and Member roles with an explicit permission matrix
- Create teams, update team details, and add/remove active organization members

### Projects and work

- Create, update, archive, and list projects; status (`PLANNED`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`), owner, members, and team association
- Create, view, update, archive, filter, sort, and paginate work items
- Work fields: title, description, assignee, creator, status (`BACKLOG`, `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`), priority, start/due dates, and optimistic-concurrency version
- Comments with edit history reduced to timestamps in V1; authors may edit their own comments, while privileged moderation is audited
- Project and work-item activity feed for meaningful changes, not every read or cosmetic edit

### Notifications and operational insight

- In-app notification inbox with unread/read state, deep links, and unread count
- Notifications for invitations, assignments, mentions, new comments on followed work, and material project/work changes
- Selective real-time delivery for created notifications and visible work-item/comment changes
- Dashboard: active-project count, work by status, overdue items, workload by assignee, and recent activity
- Scoped search across accessible projects, work items, and members using PostgreSQL capabilities; no separate search service

## Permission matrix

`Own/accessible` means the actor is project owner/member or the project is exposed through a team they can access under the finalized visibility rule.

| Capability | Owner | Admin | Manager | Member |
| --- | :---: | :---: | :---: | :---: |
| Edit organization settings | Yes | Yes | No | No |
| Transfer ownership / manage Owner | Yes | No | No | No |
| Invite or deactivate members | Yes | Yes | No | No |
| Assign Manager/Member roles | Yes | Yes | No | No |
| Assign Admin role | Yes | No | No | No |
| Manage teams | Yes | Yes | Own/accessible | No |
| Create projects | Yes | Yes | Yes | No by default |
| Manage any project | Yes | Yes | No | No |
| Manage accessible project | Yes | Yes | Owner | No |
| Create/update work in accessible project | Yes | Yes | Yes | Yes |
| Delete/archive others' work | Yes | Yes | Project owner | No |
| Comment in accessible project | Yes | Yes | Yes | Yes |
| View organization audit log | Yes | Yes | No | No |
| View operational dashboard | Yes | Yes | Yes | Personal/project-scoped view |

Fine-grained action rules belong in a versioned authorization policy, not scattered role comparisons. The matrix will be confirmed with acceptance examples before M4.

## Explicitly out of scope for V1

- Billing, subscriptions, payments, quotas, and plan enforcement
- Microservices, Kubernetes, multi-region operation, event sourcing, or CQRS
- Enterprise SSO/SAML, SCIM, custom roles, or a policy-builder UI
- Custom workflows, custom fields, automation rules, dependencies, Gantt views, time tracking, or capacity planning
- Chat, video, document editing, file uploads/attachments, plugins, marketplace, or broad third-party integrations
- AI assistants, predictions, generated summaries, or fabricated insights
- Native mobile or desktop apps; public API/webhooks; import/export beyond small administrative CSV needs (deferred)
- Complex notification preference matrices and scheduled email digests
- Separate analytics warehouse or search engine
- Hard deletion of an organization through the routine UI until retention, recovery, and cascading rules are implemented

## Product principles and success evidence

- Default workflows must work without configuration.
- Every dashboard number must link to explainable source records.
- Empty states teach the next useful action and respect permissions.
- Operational views favor scanability and fast filtering over decorative presentation.
- Claims will be supported later by measured Core Web Vitals, API latency distributions, accessibility checks, task completion observations, and escaped-defect evidence. No target is reported as an achieved result.

## Deferred decisions

- Whether project visibility is explicit-members-only or organization-readable with restricted editing. The recommended default is explicit project membership plus Owner/Admin oversight because it yields clearer privacy boundaries.
- Whether Members may create projects. The recommended V1 default is no, with Managers and above responsible for structure.
- Email provider and deployment host remain environment decisions and should not shape core domain code.
