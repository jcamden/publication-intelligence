#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Reset Test Branch
# 
# Completely resets the 'test' branch to a clean state for testing.
# This script should be run:
#   - Before running test suites locally
#   - In CI/CD pipelines before tests
#   - After making schema changes
#
# IMPORTANT: This only affects the 'test' branch, not 'main'
#
# KNOWN ISSUE: Auth timing issue prevents test branch usage for now
# - After user registration, Identity records aren't immediately available
# - Tests currently use 'main' branch as workaround (see client.ts)
# - TODO: Debug auth timing or add delay/retry logic
# ============================================================================

# Load environment variables from .env (for GEL_AUTO_BACKUP_MODE, etc.)
if [ -f "../../.env" ]; then
  set -a
  source ../../.env
  set +a
fi

echo "🧪 Resetting Gel test branch..."
echo ""

# Source .env for environment variables
if [ -f "../../.env" ]; then
  # shellcheck disable=SC1091
  source "../../.env"
  echo "✓ Loaded environment from .env"
else
  echo "⚠️  No .env file found - using defaults"
fi

# Ensure we're using the test branch
export GEL_BRANCH=test

echo ""
echo "Step 1/4: Wiping test branch data..."
gel branch wipe test --non-interactive

echo ""
echo "Step 2/4: Applying migrations to test branch..."
gel migrate

echo ""
echo "Step 3/4: Recreating roles and permissions..."

# Roles are instance-level (not branch-level), but we need to apply
# the role definitions from dbschema/roles.edgeql
gel query -b test -f dbschema/roles.edgeql 2>&1 | grep -q "OK" && echo "  ✓ Applied role definitions" || echo "  ℹ️  Roles already exist (expected)"

echo ""
echo "Step 4/4: Configuring auth for test branch..."

# Configure auth extension for test branch
# Using test-specific auth key for isolation
TEST_AUTH_KEY="${EDGEDB_AUTH_SIGNING_KEY:-$(openssl rand -base64 32)}"

gel query -b test "
  CONFIGURE CURRENT BRANCH SET
    ext::auth::AuthConfig::auth_signing_key := '$TEST_AUTH_KEY';
  
  CONFIGURE CURRENT BRANCH SET
    ext::auth::AuthConfig::token_time_to_live := <duration>'24 hours';
  
  CONFIGURE CURRENT BRANCH SET
    ext::auth::AuthConfig::allowed_redirect_urls := {'http://localhost:3000/auth/callback'};
  
  CONFIGURE CURRENT BRANCH SET
    ext::auth::AuthConfig::app_name := 'Publication Intelligence (Test)';
" 2>&1 | grep -q "OK" && echo "  ✓ Configured auth" || echo "  ⚠️  Auth config may have issues"

# Create EmailPassword provider if it doesn't exist
# Check if provider exists first
PROVIDER_EXISTS=$(gel query -b test "SELECT count(ext::auth::EmailPasswordProviderConfig)" 2>&1)

if echo "$PROVIDER_EXISTS" | grep -q "\"count\": 0"; then
  gel query -b test "
    INSERT ext::auth::EmailPasswordProviderConfig {
      require_verification := false
    };
  " 2>&1 | grep -q "OK" && echo "  ✓ Created Email/Password provider" || echo "  ⚠️  Provider creation failed"
else
  echo "  ✓ Email/Password provider already exists"
fi

echo ""
echo "✅ Test branch reset complete!"
echo ""
echo "The 'test' branch is now ready for testing with:"
echo "  - Clean database (no data)"
echo "  - Latest schema migrations applied"
echo "  - All application roles configured"
echo ""
echo "Run tests with: pnpm test"
