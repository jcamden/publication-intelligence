# Quick Command Reference

All commands can be run from the repository root.

## Development

```bash
# Start all app dev servers in parallel
pnpm dev

# Start Storybook
pnpm storybook

# Generate Playwright tests from VRT stories
pnpm generate:visual-tests
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
# Backend development
pnpm dev

# Frontend component development
pnpm storybook
```

### Before Committing

```bash
# Run tests
pnpm test

# Check code quality
pnpm check
```

### After Visual Changes

```bash
# Review visual changes
pnpm test:visual:ui

# Update snapshots if intentional
pnpm test:visual:update
```
