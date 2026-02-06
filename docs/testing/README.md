# Testing

## Running Tests

```bash
# Backend (✅ can run automatically)
pnpm test

# Frontend interaction tests (❌ requires user approval - Playwright)
pnpm test:interaction

# VRT (❌ requires user approval - Playwright + large snapshots)
pnpm vrt:yaboujee

# E2E (❌ requires user approval - Playwright)
pnpm test:e2e
```

## Repo-Specific Patterns

**Backend:**
- Tests use PGLite (in-memory PostgreSQL) - no external DB needed
- Automatic table cleanup via `afterEach` hook in `setup.ts`
- Factories in `apps/index-pdf-backend/src/test/factories.ts`
- See `apps/index-pdf-backend/TESTING.md` for detailed guide

**Frontend:**
- Component behavior → Storybook interaction tests
- Visual states → VRT stories
- Full flows → E2E tests
- Pages get documentation stories only (no complex mocks)

| Change Type | Test Type |
|-------------|-----------|
| UI component | Storybook interaction + VRT |
| Page route | Doc story + E2E |
| API endpoint | Integration test |
| Service logic | Service test |
| Utility/hook | Unit test |
