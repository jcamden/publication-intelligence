# Testing

## Commands

```bash
# Backend (can run automatically)
pnpm test                                        # all workspace tests
pnpm test:backend                                # backend only
pnpm --filter @pubint/index-pdf-backend test:watch
pnpm test:coverage

# Frontend interaction tests (requires user approval - Playwright)
pnpm test:interaction

# VRT (requires user approval - Playwright + large snapshots)
pnpm vrt:yaboujee
pnpm vrt:frontend

# E2E (requires user approval - Playwright)
pnpm test:e2e

# Code quality (can run automatically)
pnpm typecheck
pnpm check
pnpm format
```

## Repo-Specific Patterns

**Backend:**
- Tests use PGLite (in-memory PostgreSQL) — no external DB needed.
- Automatic table cleanup via `afterEach` hook in `apps/index-pdf-backend/src/test/setup.ts`.
- Factories in `apps/index-pdf-backend/src/test/factories.ts`.
- See [`apps/index-pdf-backend/TESTING.md`](../../apps/index-pdf-backend/TESTING.md) for the detailed backend testing guide.

**Frontend:**
- Component behavior → Storybook interaction tests.
- Visual states → VRT stories.
- Full flows → E2E tests (Playwright).
- Pages get documentation stories only (no complex mocks).

| Change Type | Test Type |
|-------------|-----------|
| UI component | Storybook interaction + VRT |
| Page route | Doc story + E2E |
| API endpoint | Integration test |
| Service logic | Service test |
| Utility/hook | Unit test |

## Further Reading

- [`backend-integration-tests.md`](./backend-integration-tests.md) — Backend integration test structure and patterns.
- [`frontend-component-testing.md`](./frontend-component-testing.md) — Frontend test layout (Storybook / VRT / E2E).
- [`testing-policies.md`](./testing-policies.md) — What can run automatically vs what requires user approval.
