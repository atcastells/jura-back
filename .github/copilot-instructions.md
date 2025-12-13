## Purpose

Short, targeted instructions to help AI coding assistants be productive in this repository.

## Big picture (what to know immediately)

- Architecture: this is a Node.js backend using Hexagonal/Ports-and-Adapters. Core layers:
  - `src/adapters/` — inbound controllers (Express) and outbound service adapters (Supabase, Gemini, MongoDB).
  - `src/application/` — use-cases (one use case per file, `*.use-case.ts`).
  - `src/domain/` — entities, ports, and domain services.
  - `src/infrastructure/` — server, configuration and `openapi.yaml`.

- DI: `typedi` is used. Use-case classes are decorated with `@Service()` and injected where needed (`src/application/*`).

## Quick setup & common commands

- Use pnpm (workspace): `pnpm install`.
- Dev server: `pnpm dev` (nodemon).
- Build: `pnpm build` (tsc) and run production with `pnpm start`.
- Tests: `pnpm test`, `pnpm test:watch`, `pnpm test:coverage` (Jest).
- Lint & format: `pnpm lint`, `pnpm lint:fix`, `pnpm format`.

Scripts are defined in `package.json` (see `agent:demo`, `dev`, `build`, `test`).

## Key project-specific conventions (do not invent alternatives)

- Hexagonal rules: keep domain pure. Adapters must translate between external shapes and domain models (`src/adapters/*` ↔ `src/domain/*`).
- Use-case rules (from `src/application/AGENTS.md`): one use case per file, files named `*.use-case.ts`, classes named `XxxUseCase` and registered with TypeDI.
- HTTP routes: When adding/altering Express routes under `src/adapters/inbound/http/`, update the OpenAPI spec at `src/infrastructure/openapi.yaml` so `/docs` stays accurate.

## Important integration points

- Vector store: Supabase pgvector integration and SQL migrations live under `supabase/` (see `supabase/migrations/20251213143345_setup_vector_store.sql`).
- Auth: Supabase client adapter at `src/adapters/outbound/authentication/supabase-client.ts`.
- LLM / embeddings: adapters in `src/adapters/outbound/external-services/` (e.g., `gemini-adapter.ts`, `gemini-embedding-adapter.ts`, `lang-chain-gemini-adapter.ts`). Follow existing adapter signatures when adding new providers.

## Files to reference for common tasks (examples)

- Start point: `src/infrastructure/server.ts` and `src/infrastructure/config.ts` (env-driven configuration).
- HTTP wiring: `src/adapters/inbound/http/app.ts` and `src/adapters/inbound/http/controllers/`.
- RAG logic: `src/application/services/rag-service.ts` and `src/application/services/retrieve-context.use-case.ts` (how retrieval + LLM are orchestrated).
- Persistence ports: `src/domain/ports/outbound/` contains interfaces (e.g., `document-repository.ts`, `embedding-service.ts`, `vector-store.ts`) — implement adapters matching those interfaces.

## Tests & verification

- Unit tests live alongside use-cases and services under `src/application/` (files named `*.test.ts`). Use Jest; `ts-jest` is configured in `package.json`.
- Add fast unit tests for core logic; integration tests that talk to Supabase/Mongo should be explicit about env variables and marked accordingly.

## Project policies that AI agents must enforce

1. Always work towards an existing Linear task (see root `AGENTS.md`). Verify status before starting and update the task as you make progress.
2. Preserve existing public APIs and OpenAPI operations unless the task explicitly requires breaking changes and the change is approved.
3. When adding routes, update `src/infrastructure/openapi.yaml` and validate `/docs` locally.

## Examples of actions an agent can take (concrete)

- To add a new inbound route: add handler in `src/adapters/inbound/http/controllers/`, register it in `app.ts`, and add an OpenAPI entry in `src/infrastructure/openapi.yaml`.
- To add a new external provider: implement the outbound port interface from `src/domain/ports/outbound/`, add an adapter under `src/adapters/outbound/`, and wire it into DI in the appropriate composition point.

## Where to look for additional guidance

- Root `AGENTS.md` — task management, setup and CI expectations.
- `src/adapters/inbound/http/AGENTS.md` — rules for HTTP routes and OpenAPI requirements.
- `src/application/AGENTS.md` — use-case naming and DI conventions.

If anything important is missing or unclear, tell me what area you'd like expanded (e.g., more examples for adapters, how to run migrations, or common test patterns) and I will update this file.
