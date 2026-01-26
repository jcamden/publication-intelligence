# Development Scripts

This directory contains utility scripts for development, testing, and security enforcement.

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
- Code formatting (`biome ci`)
- TypeScript type checking
- Access policy linting
- Auth key validation

**To skip hooks (emergency only):**
```bash
git commit --no-verify
```

⚠️ **Warning:** Only skip hooks if you understand the security implications.
