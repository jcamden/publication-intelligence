# Implement Transaction-Based RLS Enforcement

**Priority:** Post-MVP  
**Effort:** Medium  
**Type:** Security Enhancement (Defense-in-Depth)

## Context

Currently, authorization is enforced at the **application level** using WHERE clauses in Drizzle queries:

```typescript
// Current approach (Option 2)
const projects = await db
  .select()
  .from(projects)
  .where(eq(projects.ownerId, userId));
```

This is secure and industry-standard (used by Netflix, Stripe, etc.), but we also have PostgreSQL Row-Level Security (RLS) policies defined in `db/migrations/0003_create_policies.sql` that are not actively enforced because we don't set the user context correctly.

## Problem with Current `setUserContext`

The current implementation has security vulnerabilities:

```typescript
// INSECURE - Don't use this pattern
export const setUserContext = async ({ userId }: { userId: string }) => {
  await db.execute(sql.raw(`SET jwt.claims.sub = '${userId}'`)); // SQL injection risk
};
```

**Issues:**
1. **SQL Injection**: String interpolation bypasses parameter binding
2. **Connection Pooling Leak**: `SET` persists across connection reuse, potentially leaking user context
3. **No Transaction Boundaries**: `SET LOCAL` requires explicit transactions

## Goal: Defense-in-Depth

Implement proper transaction-based RLS enforcement so that:
1. Application-level authorization remains the **primary** security mechanism
2. Database-level RLS policies act as a **safety net** (defense-in-depth)
3. Even if a developer forgets a WHERE clause, RLS prevents unauthorized access

## Implementation Approach

### Option 1A: Transaction Wrapper (Recommended)

Create a wrapper that ensures all queries run within a transaction with user context:

```typescript
// db/client.ts
export const withUserContext = async <T>({
  userId,
  fn,
}: {
  userId: string;
  fn: (tx: Transaction) => Promise<T>;
}): Promise<T> => {
  return await db.transaction(async (tx) => {
    // SET LOCAL only affects this transaction
    await tx.execute(sql`SET LOCAL jwt.claims.sub = ${userId}`);
    return await fn(tx);
  });
};

// Usage in service layer
export const listProjectsForUser = async ({ userId, requestId }: {...}) => {
  return await withUserContext({
    userId,
    fn: async (tx) => {
      // All queries use tx, not db
      return await tx
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.ownerId, userId), // Application-level (primary)
            isNull(projects.deletedAt)
          )
        );
      // RLS policies also enforce access (defense-in-depth)
    },
  });
};
```

### Option 1B: Middleware/Interceptor Pattern

Create a Drizzle extension/plugin that automatically wraps queries:

```typescript
// More advanced - research Drizzle extension APIs
const authenticatedDb = db.withContext({ userId: '...' });
// Automatically uses transactions + SET LOCAL for all queries
```

## Testing Strategy

1. **Positive Tests**: Verify authorized users can access their data
2. **Negative Tests**: Verify RLS blocks unauthorized access even if WHERE clause is missing
3. **Regression Tests**: Create tests that intentionally omit WHERE clauses to verify RLS catches them

```typescript
// Example regression test
it('should block access via RLS even if WHERE clause is missing', async () => {
  const user1 = await createTestUser();
  const user2 = await createTestUser();
  const project = await createTestProject({ userId: user1.userId });

  await withUserContext({
    userId: user2.userId,
    fn: async (tx) => {
      // Intentionally omit WHERE clause
      const projects = await tx.select().from(projects);
      
      // RLS should filter out user1's project
      expect(projects.find(p => p.id === project.id)).toBeUndefined();
    },
  });
});
```

## Migration Path

1. **Phase 1**: Implement `withUserContext` wrapper
2. **Phase 2**: Update one module (e.g., `project.repo.ts`) to use transactions
3. **Phase 3**: Add regression tests for that module
4. **Phase 4**: Gradually migrate other modules
5. **Phase 5**: Add linting rule to prevent direct `db` usage (force `tx` in repos)

## Benefits

- **Defense-in-Depth**: RLS catches authorization bugs before they reach production
- **Compliance**: Some regulations require database-level access controls
- **Auditability**: Database logs show which user context was used for each query
- **Peace of Mind**: Sleep better knowing there's a safety net

## Non-Goals

- **Not a replacement** for application-level authorization
- **Not required for MVP** - current approach is secure
- **Not a performance optimization** - slight overhead from transactions

## Success Criteria

- [ ] All service layer queries use `withUserContext` wrapper
- [ ] RLS policies verified with regression tests
- [ ] No SQL injection vulnerabilities
- [ ] No connection pooling leaks
- [ ] Documentation updated with new patterns

## References

- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgREST Transaction Handling](https://postgrest.org/en/stable/references/transactions.html)
- PostgreSQL docs: `SET LOCAL` vs `SET`
- Drizzle ORM transaction documentation

## Related Tasks

- [ ] Consider: Add linter rule to prevent direct `db` usage in repos
- [ ] Consider: Create template/generator for new modules with RLS built-in
- [ ] Consider: Add RLS policy testing utilities to test helpers
