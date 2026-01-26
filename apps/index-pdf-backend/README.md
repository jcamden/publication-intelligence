# Publication Intelligence Backend

Production-grade backend API for the Publication Intelligence platform. Built with Fastify, tRPC, and Gel (EdgeDB).

## Architecture

```
src/
├── modules/               # Domain modules
│   └── project/
│       ├── project.types.ts      # DTOs and domain types
│       ├── project.repo.ts       # Data layer (edgeql-js)
│       ├── project.service.ts    # Business logic
│       ├── project.router.ts     # API layer (tRPC)
│       ├── project.service.test.ts       # Domain tests
│       └── project.integration.test.ts   # API tests
├── routers/              # tRPC route aggregation
├── auth/                 # Authentication utilities
├── db/                   # Database client setup
├── events/               # Domain event emitter
├── middleware/           # Request middleware
├── test/                 # Test infrastructure
│   ├── setup.ts          # Test database config
│   ├── factories.ts      # Test data generators
│   ├── server-harness.ts # HTTP test utilities
│   └── *.test.ts         # Shared integration tests
├── logger.ts             # Structured logging
└── server.ts             # Fastify server setup
```

## Tech Stack

- **Web Framework**: Fastify 5.x (high-performance HTTP)
- **API Layer**: tRPC 11.x (type-safe RPC)
- **Database**: Gel (EdgeDB) 2.x (graph-relational DB)
- **Query Builder**: edgeql-js (type-safe queries)
- **Validation**: Zod 4.x (schema validation)
- **Logging**: Pino (structured JSON logging)
- **Testing**: Vitest (fast unit/integration tests)

## Getting Started

### Prerequisites

- Node.js 23+
- pnpm 10+
- Gel (EdgeDB) running locally

### Installation

```bash
# Install dependencies
pnpm install

# Start Gel database
pnpm gel:ui

# Run migrations
pnpm gel:migrate:apply

# Generate edgeql-js query builder
pnpm gel:generate
```

### Development

```bash
# Start development server (with hot reload)
pnpm dev

# Server runs on http://localhost:3001
# Health check: http://localhost:3001/health
# tRPC endpoint: http://localhost:3001/trpc
```

## Scripts

```bash
# Development
pnpm dev              # Start with hot reload
pnpm build            # Compile TypeScript
pnpm start            # Run production build

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
pnpm test:integration # Integration tests only
pnpm test:service     # Service layer tests only
pnpm test:coverage    # Generate coverage report

# Code Quality
pnpm typecheck        # TypeScript validation
pnpm lint             # Biome linting
pnpm format           # Auto-format code
```

## API Documentation

### Authentication

**Sign Up**
```typescript
trpc.auth.signUp.mutate({
  email: "user@example.com",
  password: "secure-password",
  name: "User Name" // optional
})
```

**Sign In**
```typescript
const { authToken } = await trpc.auth.signIn.mutate({
  email: "user@example.com",
  password: "secure-password"
})
```

**Get Current User**
```typescript
const user = await trpc.auth.me.query()
```

**Sign Out**
```typescript
await trpc.auth.signOut.mutate()
```

### Projects

**Create Project**
```typescript
const project = await trpc.project.create.mutate({
  title: "My Book",
  description: "A comprehensive guide",
  workspace: "workspace-uuid" // optional
})
```

**List Projects**
```typescript
const projects = await trpc.project.list.query()
```

**Get Project**
```typescript
const project = await trpc.project.getById.query({
  id: "project-uuid"
})
```

**Update Project**
```typescript
const updated = await trpc.project.update.mutate({
  id: "project-uuid",
  data: {
    title: "Updated Title",
    description: "New description"
  }
})
```

**Delete Project (Soft Delete)**
```typescript
await trpc.project.delete.mutate({
  id: "project-uuid"
})
```

## Testing

See [TESTING.md](./TESTING.md) for comprehensive testing documentation.

### Quick Start

```bash
# Run all tests
pnpm test

# Watch mode for TDD
pnpm test:watch

# Test a specific file
pnpm vitest src/modules/project/project.service.test.ts
```

### Test Structure

- **Domain Tests** (`*.service.test.ts`) - Business logic with real database
- **Integration Tests** (`*.integration.test.ts`) - Full HTTP stack
- **Contract Tests** (future) - tRPC schema validation

All tests use real Gel database with isolated test data. No mocking unless absolutely necessary.

## Logging

Structured JSON logging with Pino:

```typescript
import { logEvent } from "./logger";

logEvent({
  event: "project.created",
  context: {
    requestId: "req-123",
    userId: "user-456",
    metadata: {
      projectId: "proj-789",
      title: "My Book"
    }
  }
});
```

**Log Levels**:
- `info` - Normal operations
- `warn` - Recoverable issues
- `error` - Failures requiring attention
- `debug` - Development-only details

See `.cursor/rules/logging-standards.mdc` for full guidelines.

## Event Emission

Domain events are emitted for audit trail and debugging:

```typescript
await eventEmitter.emit({
  type: "project.created",
  timestamp: new Date(),
  userId: "user-id",
  projectId: "project-id",
  metadata: { /* ... */ }
});
```

Events are also persisted to Gel's `Event` table for queryable history.

See `.cursor/rules/event-emission.mdc` for standards.

## Database Migrations

```bash
# Create new migration
pnpm gel:migrate

# Apply migrations
pnpm gel:migrate:apply

# Check migration status
pnpm gel:status

# Open Gel UI
pnpm gel:ui

# Reset database (destructive!)
pnpm gel:reset
```

## Environment Variables

```bash
# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Database
GEL_AUTH_URL=http://localhost:10702/db/main/ext/auth

# Logging
LOG_LEVEL=info
```

## Error Handling

All errors follow tRPC error codes:

- `BAD_REQUEST` (400) - Invalid input
- `UNAUTHORIZED` (401) - Not authenticated
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource doesn't exist
- `INTERNAL_SERVER_ERROR` (500) - Unexpected failures

## Design Principles

1. **Layered Architecture** - Routes → Services → Repositories → Database
2. **Type Safety** - End-to-end TypeScript with edgeql-js
3. **Domain-Driven** - Business logic separate from infrastructure
4. **Testable** - Real database tests, minimal mocking
5. **Observable** - Structured logs, domain events, request tracing
6. **Secure** - Gel access policies, auth middleware, input validation

## Project Structure Conventions

- **Types** (`*.types.ts`) - DTOs, domain types, Zod schemas
- **Repository** (`*.repo.ts`) - Database queries only (edgeql-js)
- **Service** (`*.service.ts`) - Business logic, orchestration
- **Router** (`*.router.ts`) - tRPC procedures, HTTP layer
- **Tests** (`*.test.ts`) - Domain/unit tests
- **Integration Tests** (`*.integration.test.ts`) - Full-stack tests

## Contributing

1. Write tests first (TDD preferred)
2. Follow existing patterns (repo → service → router)
3. Use edgeql-js for all database queries
4. Log domain events with `logEvent`
5. Emit events with `eventEmitter`
6. Run `pnpm typecheck` before committing
7. Ensure tests pass: `pnpm test`

## Troubleshooting

### Server won't start
- Check Gel is running: `pnpm gel:ui`
- Verify migrations applied: `pnpm gel:migrate:apply`
- Check port 3001 is available

### Tests failing
- Ensure Gel is running
- Check auth endpoint: `http://localhost:10702/db/main/ext/auth`
- Clear test data if needed

### Type errors
- Regenerate types: `pnpm gel:generate`
- Run typecheck: `pnpm typecheck`

## License

MIT
