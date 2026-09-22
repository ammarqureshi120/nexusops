# Performance strategy

## Measurement policy

Performance work follows baseline → profile → identify bottleneck → change → measure again → document. This planning document defines budgets and collection methods, not achieved metrics. No performance claim may appear in documentation without a reproducible environment, dataset, command/tool, before/after result, and tradeoff note.

## User-centered expectations

Initial targets are engineering budgets to validate on representative deployed hardware/network and realistic seeded organizations:

- Core Web Vitals at the 75th percentile: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 for key authenticated routes, using standard “good” thresholds as product goals.
- Common API reads/writes: define route-specific p50/p95 latency budgets after the first deployed baseline; never invent a universal latency claim during planning.
- Interactions show immediate acknowledgment; operations beyond roughly one second expose progress without blocking unrelated work.
- Lists remain usable with the documented V1 pagination ceiling and realistic seed sizes; virtualization is introduced only after profiling long client-rendered views.

These are targets, not current results, and may be refined from field evidence.

## Frontend strategy

- Rendering: default to Server Components for non-interactive route structure and small client islands for tables/forms/realtime. Avoid placing the whole authenticated shell behind one client boundary.
- Bundles: inspect route chunks during each UI milestone. Dynamically load genuinely heavy, infrequent experiences such as rich description editing; do not lazy-load every small control.
- Data: eliminate request waterfalls by defining route data needs; deduplicate server state; prefetch likely detail navigation selectively; abort stale search requests; debounce only network search, not basic UI input.
- Cache: RTK Query uses endpoint-specific freshness and tag invalidation. Frequently changing work/notifications use short freshness or event-driven invalidation; stable member/team reference lists may remain fresh longer. Exact durations follow usage measurement.
- Updates: prefer targeted invalidation/refetch for aggregate truth. Use optimistic updates for reversible, deterministic commands such as mark-read/status changes, with rollback and conflict handling.
- Lists: cursor paginate work, comments, activity, notifications, and members; keep DOM bounded. Profile before virtualization because it complicates accessibility, focus, and variable-height content.
- Images/fonts: product UI uses minimal imagery. Self-host/subset a variable font if license allows, preload only necessary faces, use `font-display: swap`, reserve dimensions, and avoid icon-font payloads.
- React: keep state local, derive rather than duplicate, and profile render frequency before memoization. Stable keys use entity IDs.
- Layout: reserve skeleton/media dimensions, animate transforms/opacity, and avoid synchronous layout reads during interaction.

## Backend and database strategy

- Query shapes are explicit: select needed columns, paginate all unbounded collections, batch relationship reads, and prevent N+1 through reviewed includes/joins rather than broad eager loading.
- Every major list/aggregate query is paired with an index rationale in the data model and checked using `EXPLAIN (ANALYZE, BUFFERS)` against realistic generated data before release.
- Cursor ordering is deterministic with an ID tiebreaker. Offset pagination is limited to small administrative collections where random page access is truly useful.
- Pool size is derived from deployment instances and PostgreSQL capacity; serverless connection behavior is evaluated only after choosing a host. Apply statement/transaction timeouts proportionately.
- Payloads use list/detail projections, bounded descriptions, compression at ingress, and no unbounded nested relations.
- Transactions remain short and do not perform email/network calls. Outbox workers use bounded concurrency, lease timeouts, backoff, and batch sizes.
- Search begins with indexed PostgreSQL normalized/trigram/full-text queries. Add a search service only when measured relevance/scale demands it.

## Analytics and real time

Dashboard panels use a small number of tenant-scoped aggregate queries that can fail independently. Measure plans against high-cardinality tenants before considering short-TTL caching or materialized views. Any cache must document key including tenant/scope, TTL, invalidation, acceptable staleness, and stampede behavior.

WebSocket messages carry identifiers and compact change facts, not full entity graphs. Reconnection uses bounded refetch, and event storms coalesce invalidations. Track connections, delivery failures, event lag, and reconnect rate before introducing Redis fan-out. Single-instance deployment is an explicit constraint until an adapter exists.

## Candidate budgets and guardrails

Budgets should be encoded in CI only after a stable baseline avoids noisy enforcement:

- Route bundle and total JavaScript budgets from framework analyzer output
- Lighthouse/Lab checks for representative public and authenticated routes, with variance-aware thresholds
- Maximum API page size and response-body guardrails
- Slow-query threshold and sampled query-plan review
- Load scenario for login protection, work-item listing, status update, notification fan-out, and dashboard reads

Do not optimize a metric by harming accessibility, correctness, security, debuggability, or meaningful freshness.

## Measurement record template

For each investigation record:

```text
Scenario and user impact:
Environment/commit/date:
Dataset and concurrency:
Tool and exact command/config:
Baseline distribution and traces:
Identified bottleneck:
Change and hypothesis:
Post-change distribution:
Correctness/resource regressions checked:
Decision and follow-up:
```

## Milestone checks

- M1 establishes bundle analysis, browser profiling procedure, and Web Vitals collection hook without claiming results.
- Each data milestone adds query-plan fixtures for new high-cardinality paths and checks request counts for N+1 regressions.
- Dashboard and real-time milestones run realistic-data load scenarios before cache/infrastructure decisions.
- Hardening captures deployed field data where privacy/consent permit, compares it with lab evidence, and documents real measurements in a versioned report.
