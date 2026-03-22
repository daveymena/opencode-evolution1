# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Project: OpenCode Evolved

A full-stack web-based IDE that wraps and extends OpenCode AI. It provides a professional coding environment with:
- Monaco Editor (VS Code editor in the browser)
- Project management with persistence
- AI chat with memory (via OpenCode CLI)
- Live preview for HTML/CSS/JS, output for other languages
- File management per project

### Deployment
- Built for EasyPanel via Docker
- `Dockerfile` at the root for full container builds
- `docker-compose.yml` for local testing with bundled PostgreSQL
- `docker-serve.mjs` serves the frontend and proxies /api to the backend

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── opencode-evolved/   # React + Vite frontend (IDE)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── Dockerfile              # Docker build for EasyPanel
├── docker-compose.yml      # Local Docker setup with Postgres
├── docker-serve.mjs        # Production server (serves static + proxies API)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/opencode-evolved` (`@workspace/opencode-evolved`)

React + Vite frontend IDE. Key components:
- `src/pages/Dashboard.tsx` — project list/creation home page
- `src/pages/ProjectIde.tsx` — full IDE view for a project
- `src/components/ide/` — IDE components (Toolbar, Sidebar, EditorArea, Preview, ChatPanel)
- `src/contexts/IdeContext.tsx` — global IDE state
- `src/hooks/use-websocket.ts` — WebSocket hook for real-time AI responses

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes:
- `src/routes/projects.ts` — CRUD for projects
- `src/routes/files.ts` — CRUD for files within projects
- `src/routes/messages.ts` — AI chat messages (invokes OpenCode CLI)
- `src/routes/opencode.ts` — OpenCode availability status
- `src/lib/opencode.ts` — OpenCode CLI integration

### `lib/db` (`@workspace/db`)

Database layer. Schema:
- `src/schema/projects.ts` — projects table
- `src/schema/files.ts` — project_files table
- `src/schema/messages.ts` — messages table (AI conversation history)

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec and Orval config.
Run codegen: `pnpm --filter @workspace/api-spec run codegen`

## OpenCode Integration

The backend integrates with the OpenCode CLI tool:
- `GET /api/opencode/status` — checks if `opencode` is in PATH
- Messages route invokes `opencode run --no-interactive --message <prompt>` as a subprocess
- Conversation history (last 10 messages) is included as context

For production (EasyPanel), install OpenCode with: `npm install -g opencode-ai`
