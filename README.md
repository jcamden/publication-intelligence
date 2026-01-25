# Publication Intelligence

PDF indexing and search platform powered by AI.

## Workspace Structure

This is a pnpm monorepo with the following structure:

```
/apps
  /index-pdf-frontend    # Next.js frontend application
  /index-pdf-backend     # API and PDF processing backend
/packages
  /core                  # Shared types and utilities
  /pdf                   # PDF extraction helpers (PDF.js, PyMuPDF)
  /llm                   # LLM prompts and indexing logic
```

## Prerequisites

- Node.js 23+
- pnpm 10+

## Getting Started

```bash
# Switch to Node.js 23
nvm use 23

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run frontend and backend in dev mode
pnpm dev

# Or run Storybook for component development
pnpm storybook
```

## Documentation

- **[COMMANDS.md](./COMMANDS.md)** - Quick command reference for all available scripts
- **[TESTING.md](./TESTING.md)** - Complete testing guide (Vitest + Storybook + Playwright)
- **[apps/index-pdf-frontend/STORYBOOK.md](./apps/index-pdf-frontend/STORYBOOK.md)** - Storybook patterns and component development
- **[apps/index-pdf-frontend/VISUAL_TEST_GENERATOR.md](./apps/index-pdf-frontend/VISUAL_TEST_GENERATOR.md)** - Auto-generate Playwright tests from VRT stories

## Development

### Run Tests

```bash
# Run all backend tests (Vitest)
pnpm test

# Run with coverage
pnpm test:coverage

# Run visual regression tests (Playwright)
pnpm test:visual

# Interactive test UI
pnpm test:ui
```

### Run individual apps

```bash
# Frontend app
pnpm --filter @pubint/index-pdf-frontend dev

# Backend app
pnpm --filter @pubint/index-pdf-backend dev

# Storybook (component development)
pnpm storybook
```

### Build packages

```bash
# Build all packages
pnpm build

# Build Storybook
pnpm build-storybook

# Build specific package
pnpm --filter @pubint/core build
```

### Code Quality

```bash
# Format and lint all files
pnpm check

# Lint only
pnpm lint

# Format only
pnpm format
```
