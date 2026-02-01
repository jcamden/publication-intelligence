# EdgeDB Auth Extension Cleanup

## Problem

EdgeDB's `ext::auth` module stores authentication data (identities, passwords, etc.) **separately** from your application schema. This means:

1. **`gel branch wipe`** only clears your schema data (User, Project, etc.) but **NOT** auth extension data
2. **Deleting a User** doesn't automatically delete the associated `ext::auth::Identity`
3. **Tests can fail** with "User already registered" errors if auth data persists between runs

## Solution

### 1. Deleting Users Properly (Programmatic)

When deleting a user, you must delete both the User record AND the auth Identity:

```typescript
import { deleteUserWithIdentity } from './modules/user/user.service';

// ✅ Correct - deletes both User and Identity
await deleteUserWithIdentity({ gelClient, userId });

// ❌ Wrong - leaves orphaned Identity
await gelClient.execute('DELETE User FILTER .id = <uuid>$userId', { userId });
```

**Why this matters:**
- Prevents "User already registered" errors on re-registration
- Avoids violating the `User.identity` constraint
- Keeps auth data in sync with user data

### 2. Clearing Auth Data Before Tests

The `reset-test-branch.sh` script now **automatically clears auth identities** when resetting the test branch:

```bash
pnpm db:reset-test
```

This ensures each test run starts with a clean auth state.

### 3. Manual Auth Cleanup

If you need to manually clear auth identities (e.g., after debugging):

```bash
# Clear test branch (safe)
pnpm db:clear-auth-test

# Clear specific branch
./db/gel/clear-auth-identities.sh test

# Clear main branch (requires confirmation)
pnpm db:clear-auth
```

## Technical Details

### Auth Extension Tables

The auth extension uses these types:

- `ext::auth::Identity` - Main identity record (linked to User)
- `ext::auth::EmailPasswordFactor` - Password hash
- `ext::auth::EmailFactor` - Email verification data

### Why Can't We Cascade Delete?

You might expect to add `on target delete delete source` to the User.identity link, but:

1. `Identity` is owned by `ext::auth`, not your schema
2. EdgeDB doesn't allow cascade rules across module boundaries
3. The relationship direction is `User → Identity` (not the other way)

Therefore, deletion must be handled **programmatically** via the `deleteUserWithIdentity` service function.

## Best Practices

1. **Always use `deleteUserWithIdentity`** when deleting users programmatically
2. **Run `pnpm db:reset-test`** before test runs to ensure clean state
3. **Use `gel branch wipe` + `db:clear-auth`** to fully reset a branch
4. **Never manually delete Users** without also deleting their Identity

## Migration Note

If you have existing code that deletes users, update it to use `deleteUserWithIdentity`:

```diff
- await gelClient.execute('DELETE User FILTER .id = <uuid>$userId', { userId });
+ import { deleteUserWithIdentity } from '@/modules/user/user.service';
+ await deleteUserWithIdentity({ gelClient, userId });
```
