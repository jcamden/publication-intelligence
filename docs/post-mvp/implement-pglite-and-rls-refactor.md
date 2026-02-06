# PGLite + RLS Refactor - In Progress

**Status:** 🚧 In Progress  
**Started:** 2026-02-06

## What We're Doing

Moving from:
- ❌ RLS in SQL migration files (0002, 0003)
- ❌ Postgres test database (slow setup/teardown)
- ❌ No Drizzle relations (missing type-safe queries)
- ❌ App-level + transaction-wrapped RLS (complex, nested transaction issues)

To:
- ✅ RLS declared in Drizzle schemas using `pgPolicy`
- ✅ PGLite for tests (in-memory, fast, isolated)
- ✅ Drizzle relations (type-safe relational queries)
- ✅ Pure RLS enforcement (no app-level WHERE clauses needed)

## Architecture

### RLS Pattern (from Gel/EdgeDB)
```typescript
// Gel used: .owner.id ?= global current_user_id
// PostgreSQL equivalent: owner_id = auth.user_id()

export const projects = pgTable('projects', {
  // ... columns
}, (table) => ({
  rlsEnable: pgPolicy('projects_rls_enable').enable(),
  ownerFullAccess: pgPolicy('projects_owner_full_access')
    .forAll()
    .to('authenticated')
    .using(sql`owner_id = auth.user_id()`),
  collaboratorAccess: pgPolicy('projects_collaborator_access')
    .forSelect()
    .to('authenticated')
    .using(sql`
      EXISTS (
        SELECT 1 FROM project_collaborators 
        WHERE project_id = id 
        AND user_id = auth.user_id()
      )
    `)
}));
```

### PGLite Setup
```typescript
// Test setup
import { PGlite } from '@electric-sql/pglite';
const client = new PGlite(); // In-memory!

// Run migrations on PGlite instance
await migrate(drizzle(client), { migrationsFolder: './db/migrations' });
```

## Steps

- [ ] Install `@electric-sql/pglite`
- [ ] Add relations to all schemas
- [ ] Add RLS policies to schemas  
- [ ] Create PGLite test client
- [ ] Regenerate migrations with `pnpm db:generate`
- [ ] Update test setup to use PGLite
- [ ] Remove app-level WHERE clauses (RLS handles it)
- [ ] Run tests and verify RLS enforcement

## Success Criteria

- [ ] All tests use PGLite (no external Postgres needed)
- [ ] RLS policies enforce access (verified by tests)
- [ ] No app-level WHERE clauses for authorization
- [ ] Tests run faster (in-memory)
- [ ] Schema is single source of truth
