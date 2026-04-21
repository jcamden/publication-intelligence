# Testing

## Commands (user runs — not the agent)

Prefix with `nvm use 25` before `pnpm`. Examples:

- `pnpm test`, `pnpm test:backend` — backend/unit tests
- `pnpm test:interaction`, `pnpm test:e2e`, `pnpm vrt*` — Playwright-heavy; expensive
- `pnpm typecheck`, `pnpm check`, `pnpm format` — quality checks

Ask the user to run what’s needed and report pass/fail or logs.

## Where to read more

- [backend-integration-tests.md](./backend-integration-tests.md) — PGLite, factories, setup
- [frontend-component-testing.md](./frontend-component-testing.md) — Storybook / VRT / E2E split
- [testing-policies.md](./testing-policies.md) — who runs what

Backend detail: `apps/index-pdf-backend/TESTING.md`.
