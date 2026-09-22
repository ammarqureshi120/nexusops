# NexusOps

Operations, connected.

## Overview

NexusOps is a multi-tenant B2B operations and work-management platform for teams that need a clear place to coordinate projects, ownership, and day-to-day work.

The project is under active development. The repository currently provides the web and API application foundations, shared engineering standards, automated quality checks, and a health endpoint. Business workflows are not yet available.

## Core Capabilities

NexusOps is being developed to support:

- Organization workspaces, membership, and role-based access
- Teams, projects, work items, ownership, priorities, and due dates
- Contextual comments, activity history, and notifications
- Selective real-time updates for operational events
- Search, workload visibility, and explainable operational dashboards

These capabilities describe the product direction and should not be interpreted as completed functionality.

## Tech Stack

- **Web:** Next.js 16, React 19, TypeScript, and Tailwind CSS
- **API:** NestJS 12, TypeScript, Express, and Helmet
- **Tooling:** pnpm workspaces, ESLint, Prettier, and Vitest
- **Automation:** GitHub Actions for formatting, linting, type checking, tests, and production builds

## Project Structure

```text
apps/
  web/       Next.js application
  api/       NestJS REST API
.github/
  workflows/ Continuous integration
```

Shared packages will be introduced only when application code has a concrete sharing requirement.

## Getting Started

### Prerequisites

- Node.js 22.12 or newer within the Node 22 release line
- Corepack, included with the supported Node.js installation

Install dependencies:

```powershell
corepack pnpm install
```

Start the web and API applications together:

```powershell
corepack pnpm dev
```

The web application runs at `http://localhost:3000`. The API health endpoint is available at `http://localhost:3001/api/v1/health`.

The API defaults to port `3001` with cross-origin requests disabled. Safe local configuration examples are available in `apps/api/.env.example`.

## Available Scripts

Run commands from the repository root:

| Command                      | Purpose                                                   |
| ---------------------------- | --------------------------------------------------------- |
| `corepack pnpm dev`          | Start the web and API development servers                 |
| `corepack pnpm build`        | Create production builds for both applications            |
| `corepack pnpm lint`         | Run lint checks across the workspace                      |
| `corepack pnpm typecheck`    | Run strict TypeScript checks                              |
| `corepack pnpm test`         | Run the currently available automated tests               |
| `corepack pnpm format:check` | Verify formatting for application and configuration files |

## Development Status

NexusOps is under active development. The current codebase establishes a production-oriented frontend, backend, and quality foundation; product features will be added incrementally as complete, tested workflows.
