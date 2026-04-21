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
- Python 3.11+ (for `apps/index-pdf-extractor`; on Ubuntu/WSL you may need `python3.12-venv` or the matching `python3.x-venv` package)

## Getting Started

## 🛠 System Prerequisites

This project uses native modules (like Rust via Neon) that require system-level build tools.

## 1. Install Build Tools

```bash
sudo apt update && sudo apt install build-essential -y
```

## 2. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://rustup.rs | sh
```

Choose Option 1 (default) when prompted.

## 3. Update Path

After installation, refresh your shell to make `cargo` available:

```bash
source $HOME/.cargo/env
```

## 4. Python virtual environment (`apps/index-pdf-extractor`)

On Ubuntu/WSL, Python may be present without the `venv` stdlib package. Install it, then create a venv and install the extractor in editable mode:

```bash
sudo apt install python3.12-venv
cd apps/index-pdf-extractor
python3 -m venv venv
source venv/bin/activate
pip install -e .
```

The `-e` flag needs a project path: use `pip install -e .` from `apps/index-pdf-extractor`, not `pip install -e` alone. More detail: [apps/index-pdf-extractor/README.md](./apps/index-pdf-extractor/README.md).

## 5. Install Dependencies (Node)

```bash
pnpm install

# Start development servers (backend + frontend)
pnpm dev

# Backend: http://localhost:3001
# Frontend: http://localhost:3000
```

## Documentation

- **[COMMANDS.md](./COMMANDS.md)** - Quick command reference for all available scripts
- **[docs/testing/README.md](./docs/testing/README.md)** - Testing guide (Vitest, Storybook, Playwright)
- **[apps/index-pdf-backend/TESTING.md](./apps/index-pdf-backend/TESTING.md)** - Backend testing with PGLite
- **[docs/](./docs/)** - Architecture, business context, and development docs

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
