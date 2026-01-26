#!/bin/bash
# Setup dedicated test database for isolated testing
# 
# This creates a separate EdgeDB branch for tests to avoid:
# - Polluting production data
# - Access policy conflicts with cleanup
# - Test data leakage
#
# Usage:
#   ./setup-test-db.sh          # Create/reset test branch
#   ./setup-test-db.sh --drop   # Drop and recreate from scratch
# Can be run from project root or db/gel directory.

set -e

INSTANCE="publication_intelligence"
BRANCH="test"
MAIN_BRANCH="main"

# Detect script location and navigate to db/gel directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Change to db/gel directory
cd "$SCRIPT_DIR"

echo "🧪 Setting up test database branch: $BRANCH"

# Check if instance exists and is running
if ! gel instance list | grep -q "^│ local │ $INSTANCE"; then
  echo "❌ EdgeDB instance '$INSTANCE' not found"
  echo "   Run './setup.sh' first to create the main instance"
  exit 1
fi

# Drop existing test branch if --drop flag provided
if [ "$1" == "--drop" ]; then
  echo "🗑️  Dropping existing test branch..."
  gel -I "$INSTANCE" branch drop "$BRANCH" --force 2>/dev/null || true
fi

# Check if test branch exists
if gel -I "$INSTANCE" branch list | grep -q "^$BRANCH\$"; then
  echo "♻️  Test branch '$BRANCH' already exists"
  echo "   Use './setup-test-db.sh --drop' to recreate from scratch"
else
  echo "🌱 Creating test branch from '$MAIN_BRANCH'..."
  gel -I "$INSTANCE" branch create "$BRANCH" --from "$MAIN_BRANCH"
fi

# Run migrations on test branch
echo "🔄 Running migrations on test branch..."
gel -I "$INSTANCE" -b "$BRANCH" migrate

# Configure auth extension on test branch
echo "🔐 Configuring auth extension..."

# Load auth signing key from .env.test or .env
if [ -f "$PROJECT_ROOT/.env.test" ]; then
  source "$PROJECT_ROOT/.env.test"
elif [ -f "$PROJECT_ROOT/.env" ]; then
  source "$PROJECT_ROOT/.env"
fi

if [ -z "$EDGEDB_AUTH_SIGNING_KEY" ]; then
  echo "⚠️  Warning: EDGEDB_AUTH_SIGNING_KEY not set"
  echo "   Auth configuration skipped - tests may fail"
else
  # Configure auth settings (provider configs are inherited from main)
  gel -I "$INSTANCE" -b "$BRANCH" query "
    CONFIGURE CURRENT BRANCH SET
      ext::auth::AuthConfig::auth_signing_key := '$EDGEDB_AUTH_SIGNING_KEY';
    
    CONFIGURE CURRENT BRANCH SET
      ext::auth::AuthConfig::token_time_to_live := <duration>'24 hours';
    
    CONFIGURE CURRENT BRANCH SET
      ext::auth::AuthConfig::allowed_redirect_urls := {
        'http://localhost:3000',
        'http://localhost:3000/auth',
        'http://localhost:3001',
        'http://localhost:3001/auth'
      };
    
    CONFIGURE CURRENT BRANCH SET
      ext::auth::AuthConfig::app_name := 'Publication Intelligence';
  " >/dev/null 2>&1 || echo "⚠️  Auth config may already be set"
  
  echo "✅ Auth extension configured"
fi

# Verify schema
echo "✅ Verifying test branch schema..."
TABLE_COUNT=$(gel -I "$INSTANCE" -b "$BRANCH" query "SELECT count(schema::ObjectType FILTER .name LIKE 'default::%')" --output-format=json | jq -r '.[0]')

echo ""
echo "✅ Test database ready!"
echo "   Instance: $INSTANCE"
echo "   Branch: $BRANCH"
echo "   Tables: $TABLE_COUNT"
echo ""
echo "💡 Update your .env.test:"
echo "   GEL_DSN=edgedb://$INSTANCE/$BRANCH"
echo ""
echo "🧹 To reset test data between runs:"
echo "   ./setup-test-db.sh --drop"
