# Gel Database Setup

This directory contains the Gel (EdgeDB) database schema, migrations, and generated client code for the Publication Intelligence project.

## Structure

```
db/gel/
├── dbschema/
│   ├── default.gel          # Main schema definition
│   ├── extensions.gel       # Extension configuration (auth enabled)
│   ├── auth-config.edgeql   # Auth extension configuration
│   └── migrations/          # Database migrations
├── generated/               # Auto-generated TypeScript client (gitignored)
├── gel.toml                 # Gel project configuration
└── gel.local.toml           # Local instance configuration (gitignored)
```

## Schema Overview

### Core Types

**User**
- Links to `ext::auth::Identity` for authentication
- Stores application-specific user data (email, name)
- Created automatically after successful signup

**Document**
- Represents uploaded PDF files
- Has access policies: owner has full access, others read-only
- Tracks upload metadata and indexing status

**DocumentChunk**
- Represents chunked content from documents for vector search
- Stores embeddings for semantic search
- Inherits access from parent document

### Global Variables

- `current_user`: Resolves to the authenticated user based on the Gel auth token

## Quick Start

### 1. Initialize Gel Instance

Already done during setup. The instance is named "instance" and runs locally.

### 2. View the Schema

```bash
cd db/gel
gel ui
```

This opens the Gel UI at http://localhost:5656 where you can:
- Browse the schema
- Configure authentication
- Run queries
- View migrations

### 3. Create Migrations

After modifying the schema in `dbschema/default.gel`:

```bash
cd db/gel
gel migration create
gel migrate
```

### 4. Generate TypeScript Client

From the backend directory:

```bash
cd apps/index-pdf-backend
pnpm gel:generate
```

Or from the db/gel directory:

```bash
cd db/gel
npx @edgedb/generate edgeql-js --output-dir ./generated
```

## Authentication Setup

Gel Auth is enabled and configured with:

- **Provider**: Email/Password
- **Email verification**: Disabled for development
- **Token TTL**: 24 hours (hardened for security)
- **Allowed redirect URLs**: localhost:3000, localhost:3001
- **Signing key**: Loaded from `EDGEDB_AUTH_SIGNING_KEY` environment variable

**Security notes:**
- **Token expiry:** 24-hour TTL balances security (short-lived credentials) with usability. Users re-authenticate daily. For production, consider refresh tokens.
- **Signing key:** MUST be 32+ bytes, cryptographically random, never committed to git. Generate with `openssl rand -base64 32`.

### Initial Auth Setup

1. **Generate signing key:**
   ```bash
   openssl rand -base64 32
   ```

2. **Create `.env` file:**
   ```bash
   # In project root
   cp .env.example .env
   # Edit .env and set EDGEDB_AUTH_SIGNING_KEY
   ```

3. **Validate your key:**
   ```bash
   # Automatically loads from .env
   pnpm lint:env
   ```

4. **Apply auth configuration:**
   ```bash
   # Load .env and apply to database
   source .env && cd db/gel && gel query -f dbschema/auth-config.edgeql
   ```

### Auth Flow

1. **Sign Up**: `ext::auth::EmailPasswordSignup` creates an Identity
2. **Create User**: Backend creates a User linked to the Identity
3. **Sign In**: `ext::auth::EmailPasswordSignIn` returns auth token
4. **Authenticated Requests**: Pass token as global `ext::auth::client_token`

### Example Queries

**Create a user after signup (idempotent):**

```edgeql
INSERT User {
  email := <str>$email,
  name := <optional str>$name,
  identity := global ext::auth::ClientTokenIdentity
}
UNLESS CONFLICT ON .identity
ELSE (
  SELECT User FILTER .identity = global ext::auth::ClientTokenIdentity
)
```

**Get current user:**

```edgeql
SELECT User {
  id,
  email,
  name
}
FILTER .identity = global ext::auth::ClientTokenIdentity
LIMIT 1
```

**Insert a document (with access policy):**

```edgeql
WITH authenticated_user := global current_user
INSERT Document {
  filename := <str>$filename,
  original_filename := <str>$original_filename,
  uploaded_by := authenticated_user
}
```

## SMTP Configuration (Optional)

For email verification and password reset emails, configure SMTP:

```edgeql
CONFIGURE CURRENT BRANCH INSERT cfg::SMTPProviderConfig {
  name := 'local_mailpit',
  sender := '"Publication Intelligence" <noreply@pubint.local>',
  host := 'localhost',
  port := <int32>1025,
  security := 'STARTTLSOrPlainText',
  validate_certs := false,
};

CONFIGURE CURRENT BRANCH
SET current_email_provider_name := 'local_mailpit';
```

For local development, use [Mailpit](https://github.com/axllent/mailpit):

```bash
docker run -d --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit
```

Access the Mailpit UI at http://localhost:8025

## Connection Details

The backend connects to Gel using:

```typescript
import { createClient } from "edgedb";

const gel = createClient({
  instanceName: "instance",
  tlsSecurity: "insecure", // OK for local development
});
```

For authenticated requests:

```typescript
const authenticatedClient = gel.withGlobals({
  "ext::auth::client_token": authToken,
});
```

## Common Tasks

### Reset the database

#### Full Reset (Recommended)

**Complete reset including roles, schema, and data:**

```bash
cd db/gel
./full-reset.sh
```

This runs both `reset.sh` (destructive) and `setup.sh` (constructive).

**Note:** Auth configuration is preserved (managed separately with `auth-config.edgeql`). Backups are disabled during reset/setup.

#### Separated Scripts (More Control)

**1. Reset only (destructive):**
```bash
cd db/gel
./reset.sh
```
- Drops all application roles (instance-level)
- Wipes database branch (schema + data)
- **Must be followed by `./setup.sh`**

**2. Setup only (constructive):**
```bash
cd db/gel
./setup.sh
```
- Applies migrations
- Creates application roles
- Regenerates TypeScript client
- **Idempotent** - Safe to run multiple times

**Note:** Auth configuration (`auth-config.edgeql`) is separate and typically only needs to be run once manually.

**Typical workflow:**
```bash
cd db/gel
./reset.sh   # Destroy everything
./setup.sh   # Rebuild everything
```

#### Individual Operations

**Just wipe data (keep roles):**
```bash
cd db/gel
gel branch wipe --non-interactive main
gel migrate

# 2. Apply migrations (includes schema and roles.gel)
gel migrate

# 3. Create the app_user role
gel query "
CREATE ROLE app_user {
  SET password := 'dev_password_12345';
  SET permissions := {
    sys::perm::data_modification,
    ext::auth::perm::auth_read,
    ext::auth::perm::auth_write,
    default::app_access
  };
}
"

# 4. Configure password authentication for app_user
gel query "
CONFIGURE INSTANCE INSERT cfg::Auth {
  priority := 10,
  method := (INSERT cfg::Password),
  user := 'app_user'
}
"

# 5. Regenerate TypeScript client
cd ../../apps/index-pdf-backend
pnpm gel:generate
```

**Why these steps are needed:**

- **app_user role**: Non-superuser role with specific permissions for application access
- **Password auth**: Enables the app to connect with explicit credentials
- **Access policies**: The schema uses access policies that work correctly with any authenticated connection

> **Note**: The access policy fixes ensure authorization works correctly regardless of which role connects. The `app_user` role is optional but provides better security boundaries for development and testing.

### Query the database

```bash
cd db/gel
gel query "SELECT User { id, email, name }"
```

### Lint access policies

```bash
pnpm lint:access-policies
```

This checks for unsafe access policy patterns that can cause data leaks. It runs in CI and should be run before committing schema changes.

### Inspect auth tokens

```bash
gel query "SELECT ext::auth::AuthToken { identity: { id } }"
```

### Delete all auth tokens (force logout all users)

```bash
gel query "DELETE ext::auth::AuthToken"
```

## Roles and Permissions

The database uses a tiered role system for security and separation of concerns:

### admin (Superuser)
- Default role created by Gel
- Full access to all data and system commands
- Used for migrations and schema changes
- **Should NOT be used by the application**

### app_user (Application Role)
- Non-superuser role for runtime application access
- Permissions: `data_modification`, `auth_read`, `auth_write`, `app_access`
- Access policies are enforced for this role
- **This is what the application connects as**

### Access Policies

All types with sensitive data have access policies:
- **Project**: Only owners and collaborators can access
- **SourceDocument**: Only project members can access
- **IndexEntry**: Only project members can access
- And more...

Access policies use safe patterns:
```edgeql
# ✅ SAFE: ID-based comparison with global current_user_id
.owner.id ?= global current_user_id

# ❌ UNSAFE: Object equality (never use - causes data leaks)
.owner ?= global current_user
.owner = global current_user
```

**Safety Enforcement:**
Run `pnpm lint:access-policies` to check for unsafe patterns. This runs automatically in CI and will fail the build if violations are detected.

## Production Considerations

1. **Auth Signing Key**: Generate a secure key and store in environment variables
2. **SMTP Provider**: Configure a production email service
3. **Email Verification**: Enable `require_verification := true`
4. **Allowed Redirect URLs**: Update for production domains
5. **TLS Security**: Use proper TLS certificates
6. **Backups**: Set up automated backups
7. **Monitoring**: Enable query logging and performance monitoring
8. **Application Role**: Create a production role with minimal required permissions
9. **Password Security**: Use strong passwords stored in secrets management

## Resources

- [Gel Documentation](https://docs.geldata.com)
- [Gel Auth Reference](https://docs.geldata.com/reference/auth)
- [EdgeDB TypeScript Client](https://www.edgedb.com/docs/clients/01_js/index)
- [Schema Cheatsheet](https://www.edgedb.com/docs/guides/cheatsheet/index)
