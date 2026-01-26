#!/bin/bash
set -e

# Reset Test Branch - Drop and recreate for clean test isolation
# This is the proper way to handle test cleanup in EdgeDB/Gel
# Can be run from project root or db/gel directory.

# Detect script location and navigate to db/gel directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Change to db/gel directory
cd "$SCRIPT_DIR"

INSTANCE="publication_intelligence"
BRANCH="test"

echo "🧹 Resetting test branch for clean test run..."

# Drop existing test branch (force, non-interactive)
echo "  Dropping test branch..."
if gel -I "$INSTANCE" branch drop "$BRANCH" --force --non-interactive 2>/dev/null; then
  echo "    ✓ Branch dropped"
else
  echo "    Branch doesn't exist or already dropped"
fi

# Create fresh test branch from main
echo "  Creating fresh test branch from main..."
gel -I "$INSTANCE" branch create "$BRANCH" --from main

# Run migrations on test branch
echo "  Applying migrations..."
gel -I "$INSTANCE" -b "$BRANCH" migrate

# Configure auth extension on test branch
echo "  Configuring auth..."

# Load auth signing key from .env.test
if [ -f "$PROJECT_ROOT/.env.test" ]; then
  source "$PROJECT_ROOT/.env.test"
fi

if [ -z "$EDGEDB_AUTH_SIGNING_KEY" ]; then
  echo "    ⚠️  Warning: EDGEDB_AUTH_SIGNING_KEY not found"
  exit 1
fi

# Configure auth (provider configs are inherited, just set the key and settings)
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
" > /dev/null

echo "✅ Test branch reset complete"
echo "   Branch: $BRANCH"
echo "   Ready for testing"
