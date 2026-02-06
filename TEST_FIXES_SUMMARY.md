# Backend Test Fixes Summary

## What Was Fixed

### 1. RLS + PGLite Integration ✅
**Problem**: Tests were failing with foreign key violations and "current transaction is aborted" errors.

**Root Cause**: Row Level Security (RLS) policies require auth context (`auth.user_id()`) to be set, but test factories weren't setting this properly.

**Solution**: 
- Modified test factories (`createTestUser`, `createTestProject`, `grantIndexTypeAddon`) to wrap inserts in transactions with proper RLS context
- Each factory now sets `request.jwt.claim.sub` and `SET LOCAL ROLE authenticated` before inserting

### 2. Database Cleanup Strategy ✅
**Problem**: Tests were hanging for 30+ seconds during cleanup with RLS-protected deletes.

**Solution**: **Fresh database per test** instead of cleanup!
- Changed `beforeAll` → `beforeEach` in `test/setup.ts`
- Each test gets a brand new PGLite instance with migrations
- No cleanup needed - just close the instance in `afterEach`
- **Result**: Tests run in ~40s instead of 7+ minutes

### 3. Nested Transaction Deadlock ✅
**Problem**: `project.update` test was timing out after 30 seconds.

**Root Cause**: `updateProject()` calls `withUserContext()` (transaction #1), then inside calls `getProjectById()` which also calls `withUserContext()` (transaction #2). Nested transactions caused deadlock in PGLite.

**Solution**: Inlined the project retrieval logic in `updateProject()` to avoid nested `withUserContext()` calls.

### 4. Test Setup Pattern ✅
**Problem**: Integration tests used `beforeAll` to create test users, but global `afterEach` was deleting all data.

**Solution**: Changed all integration tests to use `beforeEach` to recreate test users/data for each test.

## Results

### Before
- **63 failing tests** out of 109
- Tests taking **7+ minutes** (with many timeouts)
- Frequent "transaction aborted" errors
- FK constraint violations

### After  
- **7 failing tests** out of 109 (93.5% pass rate!)
- Tests completing in **~40 seconds**
- No timeouts or hangs
- All RLS policies working correctly

## Remaining Issues (7 tests)

### 1. Project-Index-Type Tests (6 failures)
**Files**: 
- `src/modules/project-index-type/project-index-type.integration.test.ts` (5 tests)
- `src/modules/project-index-type/project-index-type.security.test.ts` (1 test)

**Issue**: Tests create addons in `beforeEach` but don't actually enable them for the project. The `list` endpoint returns empty arrays.

**Fix Needed**: After granting addons, need to call `projectIndexType.enable` to actually enable them for the project.

### 2. User Deletion Test (1 failure)
**File**: `src/modules/user/user.integration.test.ts`

**Test**: "should delete authenticated user account"

**Issue**: After deleting a user, the JWT token is still valid (returns 200) when it should return 401.

**Current Behavior**: 
1. Sign up user
2. Delete user account (succeeds)
3. Try to access `/trpc/auth.me` with old token → Returns 200 ✅
4. Test expects 401 ❌

**Fix Needed**: Either:
- Option A: Update JWT verification to check if user still exists in DB
- Option B: Update test expectation (JWT tokens remain valid until expiration even if user deleted)

## Key Changes Made

### Files Modified
1. `apps/index-pdf-backend/src/test/factories.ts` - Added RLS context to all factories
2. `apps/index-pdf-backend/src/test/setup.ts` - Changed to fresh DB per test
3. `apps/index-pdf-backend/src/db/client.ts` - Added lazy DB proxy for test injection
4. `apps/index-pdf-backend/src/modules/project/project.repo.ts` - Fixed nested transaction in `updateProject`
5. All integration test files - Changed `beforeAll` → `beforeEach` for user creation

### Test Performance
- **project.integration.test.ts**: 14 tests in ~5.6s (was hanging)
- **sourceDocument.integration.test.ts**: 12 tests in ~5.2s  
- **download.routes.integration.test.ts**: 6 tests in ~2.5s
- **Total**: 109 tests in ~40s (was 7+ minutes with timeouts)

## Next Steps

To get to 100% passing:

1. **Fix project-index-type tests**: Enable index types after granting addons
2. **Fix user deletion test**: Decide on JWT token behavior after user deletion
3. **Run full test suite**: Verify no regressions

## Lessons Learned

1. **Fresh DB > Cleanup**: For in-memory databases like PGLite, creating a fresh instance per test is faster and simpler than complex cleanup logic
2. **Watch for nested transactions**: When using transaction wrappers like `withUserContext()`, be careful not to nest them
3. **RLS requires proper context**: Every insert/update/delete with RLS enabled needs `SET LOCAL ROLE` and `set_config()` calls
4. **Test isolation matters**: `beforeEach` > `beforeAll` when using per-test databases
