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
- **Token TTL**: 336 hours (14 days)
- **Allowed redirect URLs**: localhost:3000, localhost:3001

### Auth Flow

1. **Sign Up**: `ext::auth::EmailPasswordSignup` creates an Identity
2. **Create User**: Backend creates a User linked to the Identity
3. **Sign In**: `ext::auth::EmailPasswordSignIn` returns auth token
4. **Authenticated Requests**: Pass token as global `ext::auth::client_token`

### Example Queries

**Create a user after signup:**

```edgeql
INSERT User {
  email := <str>$email,
  name := <optional str>$name,
  identity := (
    SELECT ext::auth::Identity 
    FILTER .id = <uuid>$identity_id
  )
}
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

```bash
cd db/gel
gel database wipe --non-interactive
gel migrate
```

### Query the database

```bash
cd db/gel
gel query "SELECT User { id, email, name }"
```

### Inspect auth tokens

```bash
gel query "SELECT ext::auth::AuthToken { identity: { id } }"
```

### Delete all auth tokens (force logout all users)

```bash
gel query "DELETE ext::auth::AuthToken"
```

## Production Considerations

1. **Auth Signing Key**: Generate a secure key and store in environment variables
2. **SMTP Provider**: Configure a production email service
3. **Email Verification**: Enable `require_verification := true`
4. **Allowed Redirect URLs**: Update for production domains
5. **TLS Security**: Use proper TLS certificates
6. **Backups**: Set up automated backups
7. **Monitoring**: Enable query logging and performance monitoring

## Resources

- [Gel Documentation](https://docs.geldata.com)
- [Gel Auth Reference](https://docs.geldata.com/reference/auth)
- [EdgeDB TypeScript Client](https://www.edgedb.com/docs/clients/01_js/index)
- [Schema Cheatsheet](https://www.edgedb.com/docs/guides/cheatsheet/index)
