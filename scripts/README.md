# Development Scripts

## lint-access-policies.sh

Checks Gel/EdgeDB schema files for unsafe access policy patterns that can cause data leaks.

### What it checks:

1. **Object equality violations**: Prevents using `= global current_user` or `?= global current_user` in access policies
2. **Global definition**: Ensures `global current_user_id` is defined

### Usage:

```bash
# From project root
pnpm lint:access-policies

# Or run directly
./scripts/lint-access-policies.sh
```

### When it runs:

- **Pre-commit hook**: Automatically runs before every commit
- **CI pipeline**: Should be added to CI to prevent merging unsafe code
- **Manual**: Run anytime you modify schema files

### Why this matters:

EdgeDB/Gel has subtle set semantics for object equality that can accidentally allow unauthorized access. ID-based comparisons are deterministic and safe.

**Example of caught violation:**

```edgeql
# ❌ UNSAFE - Will be caught by linter
access policy owner_access
  allow all
  using (.owner ?= global current_user);

# ✅ SAFE - Passes linter
access policy owner_access
  allow all
  using (.owner.id ?= global current_user_id);
```

### Exit codes:

- `0`: All checks passed
- `1`: Violations found - commit will be blocked
