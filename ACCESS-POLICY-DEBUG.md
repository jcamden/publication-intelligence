# Gel Access Policy Enforcement Issue

## Problem Statement

Access policies defined on the `Project` type in our Gel (EdgeDB) database are **not being enforced** when connecting from Node.js application code using the `gel` client library. User2 can access User1's projects despite access policies that should prevent this.

**Current Status**: 38/39 tests passing. The failing test verifies that User2 cannot access User1's project via the API, but User2 successfully retrieves the project (HTTP 200 instead of expected 404).

---

## Environment

- **Database**: Gel (EdgeDB) v7.1
- **Client**: `gel` npm package v2.2.0 (Node.js/TypeScript)
- **Stack**: Node.js 23.11.0, Fastify, tRPC
- **Connection**: Local development instance on `localhost:10701`
- **Project Structure**: `apps/index-pdf-backend/gel.toml` links to `db/gel/` (admin credentials)

---

## Schema Configuration

### Access Policies Defined

```edgeql
type Project {
  required title: str;
  required owner: User;
  multi collaborators: User;
  
  # Access control: only owner and collaborators can access
  # Default behavior: once policies exist, all operations are denied unless explicitly allowed
  access policy owner_full_access
    allow all
    using (.owner ?= global current_user);
  
  access policy collaborator_full_access
    allow all
    using (exists (global current_user in .collaborators));
  
  # Allow insert for any authenticated user (they become the owner via owner link)
  access policy authenticated_can_insert
    allow insert
    using (exists global current_user);
}
```

### Global Variable Definition

```edgeql
# In default.gel
global current_user := (
  assert_single((
    select User
    filter .identity = global ext::auth::ClientTokenIdentity
  ))
);
```

### Configuration Verification

```bash
$ gel query "SELECT cfg::Config.apply_access_policies"
# Result: true ✓
```

---

## Roles Created

### admin (superuser)
- Created automatically during instance setup
- `is_superuser: true`
- Bypasses all access policies (by design)

### app_user (non-superuser)
Created via:
```edgeql
CREATE ROLE app_user {
  SET password := 'dev_password_12345';
  SET permissions := {
    sys::perm::data_modification,
    ext::auth::perm::auth_read,
    ext::auth::perm::auth_write,
    default::app_access  # custom permission
  };
}
```

Verified via:
```bash
$ gel query "SELECT sys::Role { name, is_superuser, permissions } FILTER .name = 'app_user'"
# Result: is_superuser: false, permissions: [list above] ✓
```

---

## Client Connection Attempts

### Attempt 1: Using `instanceName` with credentials
```typescript
createClient({
  instanceName: "instance",
  tlsSecurity: "insecure",
  user: "app_user",
  password: "dev_password_12345",
})
```
**Result**: Client ignores `user`/`password` and connects as `admin` (superuser) ❌

### Attempt 2: Using explicit host/port
```typescript
createClient({
  host: "localhost",
  port: 10701,
  user: "app_user",
  password: "dev_password_12345",
  database: "main",
  tlsSecurity: "insecure",
})
```
**Result**: Still connects as `admin` (superuser) ❌

### Attempt 3: Using DSN connection string
```typescript
const dsn = `edgedb://app_user:dev_password_12345@localhost:10701/main`;
createClient({
  dsn,
  tlsSecurity: "insecure",
})
```
**Result**: Still connects as `admin` (superuser) ❌

### Attempt 4: Setting environment variables before client creation
```typescript
process.env.EDGEDB_USER = "app_user";
process.env.EDGEDB_PASSWORD = "dev_password_12345";
// ... set other vars
const client = createClient({ dsn, tlsSecurity: "insecure" });
```
**Result**: Still connects as `admin` (superuser) ❌

---

## Verification Methods

### Testing if client is superuser:
```typescript
// In Node.js client
try {
  await client.query(`SELECT sys::Role LIMIT 1`);
  console.log("Connected as SUPERUSER"); // ← This executes
} catch (e) {
  console.log("Connected as non-superuser"); // ← Never reached
}
```

### Testing if credentials work via CLI:
```bash
$ gel query "SELECT 1 + 1" --user app_user --password-from-stdin <<< "dev_password_12345"
# Result: 2 ✓  (credentials work!)
```

### Testing access policy behavior:
```typescript
// Debug output from test:
[DEBUG] global current_user: { id: '95ee90a8...' }  // User2
[DEBUG] Project owner: 95ae70f4...  // User1
[DEBUG] Match: false
// Query STILL returns the project ❌
```

---

## Project Structure Context

```
/apps/index-pdf-backend/
  ├── gel.toml  # Links to ../../db/gel (project directory)
  └── src/db/client.ts  # Creates Gel client

/db/gel/
  ├── gel-project.toml  # Gel project config
  ├── gel.toml  # Instance config
  └── dbschema/  # Schema files
```

The presence of `gel.toml` / `gel-project.toml` causes the Gel client library to **auto-discover** the linked project and use its stored credentials (admin).

---

## Key Insights from Documentation

From [Gel Access Policies docs](https://docs.geldata.com/reference/datamodel/access_policies):

1. **Deny-by-default**: "Once a policy is added to a particular object type, **all operations** on any object of that type are now **disallowed by default** unless specifically allowed by an access policy!"

2. **Superuser bypass**: Superuser roles are exempt from all permission checks and access policies

3. **Global variables**: Access policies use globals like `current_user` to define a "subgraph" of data visible to queries

From [Gel Permissions docs](https://docs.geldata.com/reference/datamodel/permissions):

4. **Permissions vs Access Policies**: Permissions are role-level capabilities (e.g., `sys::perm::data_modification`). Access policies are object-level security rules.

---

## What We've Confirmed

✅ Access policies are correctly defined in schema  
✅ `apply_access_policies` is globally enabled (`true`)  
✅ Non-superuser `app_user` role exists with proper permissions  
✅ `app_user` credentials work via CLI  
✅ `global current_user` is correctly populated in queries  
✅ The `gel` client library can successfully query using `app_user` credentials via CLI

❌ Node.js `gel` client **always** connects as `admin` (superuser) regardless of connection parameters  
❌ Access policies are bypassed because client is superuser  
❌ No way found to force Node.js client to use `app_user` instead of auto-discovered admin credentials

---

## The Core Question

**How do we force the Node.js Gel client library to connect as a specific non-superuser role (`app_user`) when a `gel.toml` project file exists that links to stored admin credentials?**

The client's project auto-discovery mechanism appears to always take precedence over explicit connection parameters (`user`, `password`, `host`, `port`, `dsn`, environment variables).

---

## What We Need

One of the following solutions:

1. A way to **disable project auto-discovery** in `createClient()` while still being able to query the correct instance
2. A client configuration option that **forces credential override** despite project linkage
3. A way to **configure the project** itself to use `app_user` as the default connection role
4. An alternative client creation pattern that bypasses project discovery entirely
5. Confirmation that this is expected behavior and access policies cannot be fully tested in local development with project-linked instances

---

## Authentication Configuration

```bash
$ gel query "SELECT cfg::Auth { priority, method, user }"
# Result: 
# { priority: 10, method: Password, user: ['app_user'] }
# { priority: 0, method: Trust, user: ['admin'] }
```

Password authentication is configured for `app_user`. Trust authentication for `admin` (lower priority).

---

## Unsuccessful Workarounds Attempted

- ❌ Removing `instanceName` parameter
- ❌ Using DSN instead of connection params  
- ❌ Setting env vars before `createClient()`
- ❌ Using explicit `host`/`port`/`user`/`password` params
- ❌ Adding explicit `deny` policies (not needed per docs)
- ❌ Configuring session-level settings
- ❌ Using `projectDir: null` parameter (recommended solution from community)
- ❌ Temporarily removing `gel.toml` file

**ALL methods result in client connecting as `admin` (superuser), confirmed by successfully querying `sys::Role`.**

---

## Additional Findings

- ✅ `app_user` credentials work perfectly via CLI: `gel query "SELECT 1+1" --user app_user --password-from-stdin`
- ✅ Client options are logged correctly with all expected values including `projectDir: null`
- ❌ Despite all correct configuration, `await client.query('SELECT sys::Role')` succeeds (should fail for non-superuser)
- ❌ May be a bug in `gel` client library v2.2.0 or undocumented behavior
