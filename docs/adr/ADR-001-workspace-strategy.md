# ADR-001: Use a pnpm workspace without a build orchestrator

- **Status:** Proposed
- **Date:** 2026-09-22

## Context

NexusOps needs independently deployable web and API applications, coordinated tooling, and potentially generated API contracts. The planning phase must avoid speculative packages and infrastructure.

## Decision

Use a single repository with pnpm workspaces containing `apps/web` and `apps/api`. Begin with direct pnpm scripts and CI jobs. Add a package only after two real consumers need a stable shared asset; the first likely candidate is generated API contracts. Do not adopt Turborepo initially.

## Alternatives

- Separate repositories: clearer deployment ownership but duplicates tooling and makes coordinated contract changes harder for one maintainer.
- Turborepo/Nx: useful caching and task graphs, but adds configuration before repository scale makes it valuable.
- A single application: simpler repository, but couples distinct Next.js and NestJS runtimes and deployment concerns.

## Consequences

Cross-application changes remain reviewable and setup is simple. CI may run more work until timing demonstrates a need for task caching. Package boundaries cannot be used as architecture theater; module rules remain necessary inside each app.
