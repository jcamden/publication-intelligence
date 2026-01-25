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
```

## Development

### Run individual apps

```bash
# Frontend only
pnpm --filter @pubint/index-pdf-frontend dev

# Backend only
pnpm --filter @pubint/index-pdf-backend dev
```

### Build packages

```bash
# Build all packages
pnpm --recursive build

# Build specific package
pnpm --filter @pubint/core build
```
