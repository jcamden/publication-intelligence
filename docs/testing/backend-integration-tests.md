# Backend integration tests

Tests use in-memory Postgres via [PGLite](https://github.com/electric-sql/pglite) — **no external DB**. Authoritative setup, factories, RLS, troubleshooting: [`apps/index-pdf-backend/TESTING.md`](../../apps/index-pdf-backend/TESTING.md).

## Run (user’s machine)

`nvm use 25 && pnpm test` / `pnpm test:backend` / filtered watch — see root `package.json`. Agent should not assume runs; see `.cursor/rules/user-run-commands.mdc`.

## Layout

`apps/index-pdf-backend/src/test/`: `setup.ts` (PGLite + migrations + `afterEach` cleanup), `factories.ts`, `server-harness.ts`, `mocks.ts`.

**Service tests** — call services directly. **Integration tests** — `createTestServer()` + tRPC/HTTP.

## Patterns

- Factories: `createTestUser`, `createTestProject`, … from `test/factories`.
- HTTP: `createTestServer`, `makeAuthenticatedRequest`, `closeTestServer` from `test/server-harness`.
- RLS: `withTestUserContext` when hitting `testDb` directly — details in `TESTING.md`.
