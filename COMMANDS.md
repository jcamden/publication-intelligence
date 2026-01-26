# Quick Command Reference

All commands can be run from the repository root.

## Development

```bash
# Start all app dev servers in parallel (backend on :3001, frontend on :3000)
pnpm dev

# Start backend only (tRPC server on :3001)
pnpm --filter @pubint/index-pdf-backend dev

# Start frontend only (Next.js on :3000)
pnpm --filter @pubint/index-pdf-frontend dev

# Start Storybook for component development
pnpm storybook

# Generate Playwright tests from VRT stories
pnpm generate:visual-tests
```

## Database (Gel/EdgeDB)

All Gel commands can now be run from the root:

```bash
# Open Gel UI (schema browser, queries, auth admin)
pnpm gel:ui

# Create a migration after schema changes
pnpm gel:migrate
pnpm gel:migrate:apply

# Generate TypeScript client (run after schema changes)
pnpm gel:generate

# Watch mode for TypeScript generation
pnpm gel:generate:watch

# Check migration status
pnpm gel:status

# Reset database (DESTRUCTIVE - deletes all data)
pnpm gel:wipe
pnpm gel:migrate:apply

# Or manually:
cd db/gel
gel branch wipe --non-interactive main
gel migrate

# Query the database (use gel CLI directly)
cd db/gel
gel query "SELECT User { id, email, name }"

# Check instance status
cd db/gel
gel instance status
```

## Testing

### Backend/Package Tests (Vitest)

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Interactive test UI
pnpm test:ui
```

### Frontend Component Visual Regression Tests (Playwright + Storybook)

```bash
# Run component VRT tests
pnpm test:vrt

# Run in interactive UI mode
pnpm test:vrt:ui

# Update snapshots (after intentional visual changes)
pnpm test:vrt:update
```

### Frontend End-to-End Tests (Playwright + Next.js)

```bash
# Run E2E tests
pnpm test:e2e

# Run in interactive UI mode
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed
```

## Building

```bash
# Build all packages and apps
pnpm build

# Build Storybook
pnpm build-storybook
```

## Code Quality

```bash
# Lint all files
pnpm lint

# Format all files
pnpm format

# Check and fix formatting + linting
pnpm check

# Type check all packages
pnpm typecheck

# CI check (no auto-fix)
pnpm ci
```

## Cleaning

```bash
# Clean all build outputs
pnpm clean
```

## Package-Specific Commands

If you need to run commands for a specific package:

```bash
# Use --filter flag
pnpm --filter @pubint/core test
pnpm --filter @pubint/llm build
pnpm --filter @pubint/index-pdf-backend dev

# Or cd into the package
cd packages/core
pnpm test
```

## Workspace Info

```bash
# List all packages
pnpm list --depth=0 -r

# Check for outdated dependencies
pnpm outdated -r
```

## Most Common Workflows

### Starting Development

```bash
# Full stack development (backend + frontend)
pnpm dev
# Backend tRPC server: http://localhost:3001
# Frontend Next.js app: http://localhost:3000

# Frontend component development
pnpm storybook
# Storybook UI: http://localhost:6006
```

### Before Committing

```bash
# Run tests
pnpm test

# Check code quality
pnpm check

# Type check
pnpm typecheck
```

### After Visual Changes

```bash
# Review visual changes
pnpm test:visual:ui

# Update snapshots if intentional
pnpm test:visual:update
```

### Database Reset (Development)

```bash
# Clear all data and start fresh
pnpm gel:wipe
pnpm gel:migrate:apply
pnpm gel:generate
```
