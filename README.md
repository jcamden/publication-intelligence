# Publication Intelligence

PDF indexing and search platform powered by AI.

## Workspace Structure

This is a pnpm monorepo with the following structure:

```
/apps
  /index-pdf-frontend    # Next.js frontend application (tRPC client + React Query)
  /index-pdf-backend     # tRPC API server and PDF processing backend
/packages
  /core                  # Shared types and utilities
  /pdf                   # PDF extraction helpers (PDF.js, PyMuPDF)
  /llm                   # LLM prompts and indexing logic
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4, Base UI
- **Backend**: Node.js 23, Fastify, tRPC, Zod
- **Database**: PostgreSQL with Drizzle ORM
- **Type Safety**: TypeScript, end-to-end via tRPC + Drizzle
- **Authentication**: JWT-based (bcrypt + jsonwebtoken)
- **Security**: Row-Level Security (RLS) policies in Drizzle schemas
- **Data Fetching**: React Query (TanStack Query)
- **Testing**: Vitest + PGLite, Playwright, Storybook
- **Code Quality**: Biome (linting + formatting)

## Prerequisites

- Node.js 23+
- pnpm 10+

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development servers (backend + frontend)
pnpm dev

# Backend: http://localhost:3001
# Frontend: http://localhost:3000
```

## Documentation

- **[COMMANDS.md](./COMMANDS.md)** - Quick command reference for all available scripts
- **[TESTING.md](./TESTING.md)** - Testing guide (Vitest, Storybook, Playwright)
- **[apps/index-pdf-backend/TESTING.md](./apps/index-pdf-backend/TESTING.md)** - Backend testing with PGLite

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
