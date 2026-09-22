# UI and UX direction

## Experience principles

NexusOps should feel calm, exact, and operational. The design prioritizes orientation, scanability, explicit state, and quick recovery over decorative novelty. It must look intentional without imitating a named product.

- Show the current organization and project context persistently.
- Put the next useful action near the information it affects.
- Favor progressive disclosure: summaries first, detail in dedicated pages/drawers when context preservation matters.
- Use density appropriate to work software, with comfortable defaults and strong grouping.
- Make system status visible: saved, saving, stale, offline, blocked, permission-limited.

## Visual system

- Typography: a high-legibility variable sans for UI; tabular numerals for metrics. Use a restrained type scale (roughly 12–32 px) with weight and spacing, not many sizes, creating hierarchy.
- Spacing: a 4 px base with common 8/12/16/24/32 steps. Dense table cells may use 8–12 px vertical spacing; forms and page sections breathe more.
- Radius: 6–10 px for controls/cards and slightly larger dialogs; pills only for compact statuses/tags. Avoid making every surface a rounded card.
- Elevation: borders and surface contrast establish most hierarchy. Shadows are soft and limited to overlays, menus, sticky elements, and deliberate lift.
- Color: neutral slate/ink surfaces with one confident indigo-blue brand accent. Semantic green/amber/red/cyan are reserved for meaning and paired with text/icons, never color alone. Support light first and prepare semantic tokens for dark mode without making dark mode a V1 commitment.
- Surfaces: page canvas, navigation surface, primary panel, and raised overlay; avoid nested card grids when simple sections/dividers work.
- Icons: one consistent outline family, normally 16–20 px, always labeled when meaning is not universally clear.
- Focus: a visible high-contrast ring separated from hover/selected styling.

Tokens should express semantic intent (`surface`, `text-muted`, `border-danger`) rather than raw palette names in feature code.

## Component patterns

- Buttons have clear primary, secondary, quiet, and destructive hierarchy. A page should rarely contain multiple competing primary actions.
- Forms use persistent labels, optional help, required indicators, input-adjacent errors, and a summary/focus strategy for failed submissions. Destructive actions require consequence-specific confirmation.
- Tables support keyboard-reachable actions, sticky headers only when helpful, readable empty/error rows, sorting feedback, and URL-backed filters. Row click must not be the only navigation affordance.
- Cards summarize one concept and expose the detail route. Dashboard cards avoid ornamental charts where a number/list communicates better.
- Dialogs are for short, focused decisions. Multi-step/detail editing uses a page or side panel. Focus is trapped, initial focus is deliberate, and focus returns to the trigger.
- Toasts confirm transient outcomes; they do not carry essential errors or become the only record of a result.
- Search/command interactions are scoped and labeled. A command palette is deferred until navigation breadth proves it valuable.

## Major layouts

### Authentication

A focused two-column desktop layout with a restrained brand/context panel and a compact form; one-column on mobile. Password reset and verification explain next steps and recovery without leaking account existence.

### App shell

Desktop uses a 240–264 px sidebar, top bar, and fluid content canvas with an approximate 1440 px readable maximum for dashboards while data tables can use the full viewport. The sidebar contains organization switcher, primary navigation, compact create action, and user menu. The top bar supplies breadcrumb/context, scoped search, notifications, and page actions—not duplicate navigation.

### Dashboard

Starts with a plain-language operational summary and time/context label. A compact metric row leads to work-by-status, overdue work, workload, and recent activity. Every metric is clickable and states its scope. Empty dashboards guide project/work creation rather than showing zero-filled charts.

### Project detail

Header includes key, name, status, owner, dates, and explicit actions. Tabs or subnavigation cover Overview, Work, Activity, and Members. Work defaults to a filterable list; board view is deferred unless it serves a demonstrated workflow. Filter/sort state lives in the URL.

### Work-item detail

Desktop uses a focused main column for title/description/comments and a 280–340 px properties rail. It may open as a route-backed drawer from lists, preserving deep-linking and back behavior. Mobile becomes a full page with collapsible properties. Save status and conflict resolution are explicit.

### Members, settings, and notifications

- Members: searchable table/list with role, status, teams, joined date, and permission-aware actions. Pending invitations are visually distinct.
- Settings: section navigation and narrow forms; dangerous actions isolated at the end with clear consequences.
- Notifications: chronological, grouped lightly by date, with unread state that remains perceivable without color; bulk mark-read is reversible only if feasible, otherwise explicit.

## Responsive behavior

| Range | Behavior |
| --- | --- |
| Mobile `<640px` | Sidebar becomes an accessible modal navigation; page actions collapse thoughtfully; tables become labeled record lists or horizontal regions only when comparison demands it; work detail is full-screen; dialogs use near-full-screen sheets for complex forms |
| Tablet `640–1023px` | Collapsed icon rail or overlay sidebar; two-column dashboard only when content remains readable; property rails may become drawers |
| Laptop `1024–1439px` | Persistent sidebar; compact two/three-column dashboard; tables prioritize key columns and expose secondary fields in detail |
| Desktop `1440–1919px` | Full navigation and balanced content width; larger tables use available space without stretching text measures |
| Wide `>=1920px` | Content remains bounded or uses intentional split views; no uncontrolled line-length expansion |

Touch targets aim for at least 44 by 44 CSS pixels where feasible. Hover is enhancement only. Viewport behavior is verified at representative sizes, zoom, keyboard-only use, and long localized-like strings.

## Motion

- Direct feedback: 100–160 ms; menus/popovers: 140–200 ms; dialogs/drawers/sidebar: 180–240 ms.
- Use ease-out for entrance and standard/ease-in for exit; spring motion only for small direct manipulation where overshoot is not distracting.
- Animate opacity and transforms rather than layout-heavy dimensions when possible. Skeletons do not pulse aggressively.
- Status changes use a brief highlight and persistent text/icon result. Optimistic actions visibly settle or revert with an inline explanation.
- `prefers-reduced-motion` removes nonessential transitions and avoids spatial movement while retaining immediate state feedback.

## Accessibility requirements

Target WCAG 2.2 AA intent for the core product journeys. Use semantic landmarks/headings, native controls, logical DOM/focus order, skip navigation, keyboard-operable menus/tables, visible focus, text alternatives, sufficient contrast, and live regions only for relevant asynchronous changes. Dialogs and menus follow established accessible primitives. Form errors are programmatically associated and submission focuses the first error or summary. Status never relies on color alone. Dynamic route/title changes and real-time updates provide restrained screen-reader announcements.

## State design catalog

| State | Product treatment |
| --- | --- |
| Initial/route loading | Stable shell plus skeleton shaped like expected content; no fake data |
| Background refresh | Keep valid content, show a subtle freshness indicator; avoid full-page blocking |
| Empty organization | Welcome context with Create project and Invite teammates actions, permission-aware |
| Empty team/project/work list | Explain the value and next action; filters can be cleared separately from true emptiness |
| No search results | Echo safe query context, offer clear filters/reset, do not present as system failure |
| API error | Preserve inputs/context; explain retryable vs persistent failure and provide request ID for support |
| Authorization denied | Explain missing capability and safe route back; conceal cross-tenant existence as not found |
| Validation error | Inline specific correction, retain user input, focus/summary behavior |
| Offline/network loss | Persistent non-blocking banner, pause unsafe optimistic work, offer retry; never claim a save succeeded |
| Destructive confirmation | Name the object and consequence; require stronger confirmation only for irreversible/high-impact actions |
| Optimistic failure | Revert affected state, show inline/toast explanation, retain draft where possible |
| Concurrent edit | Show stale-data conflict, current server version, and safe review/reapply path; no blind overwrite |
| Partial dashboard data | Render independent successful sections and mark unavailable panels with retry |

## UX validation

Each feature milestone reviews the happy path plus the state catalog, at mobile/laptop widths, keyboard-only, 200% zoom, and reduced motion. Automated accessibility checks supplement—not replace—manual focus, naming, contrast, and screen-reader smoke testing.
