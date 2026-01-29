# Development Scripts

This directory contains utility scripts for development, testing, and security enforcement.

## Build & Setup Scripts

### `copy-pdf-workers.ts`

Automatically copies the PDF.js worker file from `node_modules` to the required public directories.

**What it does:**
- Finds the PDF.js worker file in node_modules (handles both pnpm and npm structures)
- Copies `pdf.worker.min.mjs` to:
  - `packages/yaboujee/.storybook/public/` (for yaboujee Storybook)
  - `apps/index-pdf-frontend/public/` (for Next.js app + Storybook)

**Usage:**
```bash
# Runs automatically after pnpm install
pnpm install

# Run manually
pnpm pdf:copy-workers
```

**When to use:**
- Automatically runs after any `pnpm install`
- Manually run after upgrading `pdfjs-dist`
- Run if worker files are missing

**Why it's needed:** PDF.js requires a separate worker file for off-main-thread PDF parsing. The worker must be accessible from the public directory, but it's distributed in node_modules, so it must be copied during the build process.

---

## Test Scripts

### `test-affected-workspaces.ts`

Comprehensive pre-commit checks for workspaces affected by staged changes, including their dependents.

**Features:**
- Detects which workspaces have staged changes
- Analyzes workspace dependency graph to find all affected workspaces
- For each affected workspace, runs:
  - **Biome linting** (code quality and formatting)
  - **TypeScript type checking** (if workspace has typecheck script)
  - **Unit tests** (if workspace has test script)
  - **VRT tests** (for yaboujee and index-pdf-frontend)
- Conditionally runs access policy linting only if `db/` folder has changes
- Skips checks for workspaces without the corresponding scripts

**Usage:**
```bash
# Runs automatically on pre-commit
git commit -m "message"

# Run manually
pnpm exec tsx scripts/test-affected-workspaces.ts

# Dry run to see what would be checked (without running checks)
pnpm exec tsx scripts/test-affected-workspaces.ts --dry-run
```

**Example workflow:**
1. You modify code in `packages/core`
2. Script detects `@pubint/core` has changes
3. Script finds `@pubint/index-pdf-backend` and `@pubint/index-pdf-frontend` depend on `@pubint/core`
4. For each workspace (core, backend, frontend):
   - Runs biome linting
   - Runs type checking
   - Runs unit tests
5. Runs VRT for `@pubint/index-pdf-frontend`
6. If you also changed `db/gel/dbschema/`, runs access policy linting

**CI Integration:** Runs automatically on pre-commit hook as the sole check (replaces individual lint/typecheck commands).

---

## Security Scripts

### `lint-access-policies.sh`

Validates Gel/EdgeDB access policies for security issues.

**Checks:**
- Detects unsafe object equality patterns (`= global current_user`)
- Ensures `global current_user_id` is defined

**Usage:**
```bash
pnpm lint:access-policies
```

**Why it matters:** Object equality in EdgeDB has subtle set semantics that can leak data. Only ID-based comparisons are safe and deterministic. This lint rule prevents accidental data leaks.

**CI Integration:** Runs automatically on pre-commit hook.

---

### `validate-env.ts` (Node/TypeScript)

Validates all environment variables including the EdgeDB/Gel auth signing key.

**Checks:**
- Key is set in environment (`EDGEDB_AUTH_SIGNING_KEY`)
- Key is not using placeholder value
- Key meets minimum length requirement (32+ bytes)
- Key appears to be properly base64-encoded

**Usage:**

The script automatically loads from `.env` in the project root using dotenv:

```bash
# Simple - just run it (loads from .env automatically)
pnpm lint:env
```

**Why Node/TypeScript:**
- ✅ Consistent with codebase (TypeScript/Node.js)
- ✅ Uses dotenv (same as the application)
- ✅ Type-safe validation
- ✅ Easy to extend with more validation logic

---

### `validate-auth-key.sh` (Bash - Legacy)

**Deprecated:** Use `validate-env.ts` (Node version) instead.

This bash version is kept for reference but will be removed in the future.

**Generate a secure key:**
```bash
openssl rand -base64 32
```

**Why it matters:** The auth signing key is used to sign JWT tokens. A weak or leaked key allows attackers to forge authentication tokens and impersonate any user.

**CI Integration:** Runs automatically on pre-commit hook.

**Implementation:** Uses dotenv to load from `.env` file in monorepo root.

**Security Policy:**
- ✅ Minimum 32 bytes
- ✅ Never commit to git (use `.env` file)
- ✅ Use cryptographically secure random generation
- ✅ Rotate keys if leaked
- ✅ Use different keys per environment (dev/staging/prod)

---

## Setup

### First-time setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Generate auth signing key:**
   ```bash
   openssl rand -base64 32
   ```

3. **Update `.env` file:**
   ```bash
   EDGEDB_AUTH_SIGNING_KEY=<paste-generated-key>
   ```

4. **Apply auth configuration:**
   ```bash
   source .env && cd db/gel && gel query -f dbschema/auth-config.edgeql
   ```

5. **Verify setup:**
   ```bash
   pnpm lint:auth-key
   ```

---

## CI/CD Notes

**Pre-commit hooks run:**
- Affected workspace checks (linting, type checking, tests, VRT) via `test-affected-workspaces.ts`
- Access policy linting (only if `db/` folder changes detected)

**To skip hooks (emergency only):**
```bash
git commit --no-verify
```

⚠️ **Warning:** Only skip hooks if you understand the security implications.
