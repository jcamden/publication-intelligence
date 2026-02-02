# Testing

See [docs/testing/](./docs/testing/) for detailed patterns.

## Commands

```bash
# Backend (✅ can run automatically)
pnpm test
pnpm test:watch

# Frontend (❌ requires Playwright - ask user)
pnpm test:interaction      # Storybook interaction tests
pnpm vrt:yaboujee          # Visual regression tests
pnpm test:e2e              # End-to-end tests

# Code quality (✅ can run automatically)
pnpm typecheck
pnpm check
pnpm format
```

## Structure

**Backend:** Tests use real Gel database with auto-reset test branch  
**Frontend:** Component behavior → Storybook, Visual states → VRT, Full flows → E2E

| Change | Test Type |
|--------|-----------|
| UI component | Storybook + VRT |
| Page route | Doc story + E2E |
| API endpoint | Integration test |
| Service logic | Service test |
| Utility/hook | Unit test |
