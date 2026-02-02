# Testing Policies

## ❌ Never Run Automatically

- `pnpm test:interaction` - Requires Playwright binaries
- `pnpm vrt:yaboujee` - Requires Playwright + generates large snapshot images
- `pnpm test:e2e` - Requires Playwright

## ✅ Can Run Automatically

- `pnpm test` - Unit/integration tests
- `pnpm typecheck` - Type checking
- `pnpm check` / `pnpm format` - Linting/formatting

## When Tests Are Needed

Tell the user which command to run and what it verifies. Wait for results.
