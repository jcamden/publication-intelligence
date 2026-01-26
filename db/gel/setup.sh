#!/bin/bash
set -e

# Database Setup Script (Constructive)
# ============================================================================
# This script sets up a fresh or wiped database:
# 1. Applies schema migrations
# 2. Creates application roles
# 3. Regenerates TypeScript client
#
# Safe to run multiple times (idempotent).
# Can be run from project root or db/gel directory.
# ============================================================================

# Detect script location and navigate to db/gel directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Change to db/gel directory
cd "$SCRIPT_DIR"

# Load environment variables from .env (for GEL_AUTO_BACKUP_MODE, etc.)
if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

echo "🔧 Setting up Gel database..."
echo ""

echo "🔄 Step 1/3: Applying migrations..."
gel migrate

echo "✅ Migrations applied"
echo ""

echo "👥 Step 2/4: Creating application roles..."
echo ""

# Create each role if it doesn't exist
for role_config in \
  "app_readonly:dev_readonly_12345:sys::perm::data_read" \
  "app_worker:dev_worker_12345:sys::perm::data_modification" \
  "app_user:dev_password_12345:ext::auth::perm::auth_read,ext::auth::perm::auth_write,default::app_access" \
  "app_migration:dev_migration_12345:sys::perm::ddl_modification,sys::perm::data_modification,default::policy_bypass" \
  "app_admin:dev_admin_12345:sys::perm::all,default::policy_bypass"
do
  IFS=':' read -r role_name password permissions <<< "$role_config"
  
  if gel query "SELECT sys::Role FILTER .name = '$role_name'" 2>/dev/null | grep -q "$role_name"; then
    echo "  $role_name already exists ✓"
  else
    echo "  Creating $role_name..."
    gel query "CREATE ROLE $role_name { SET password := '$password'; SET permissions := { $permissions }; }" >/dev/null
    echo "    ✓ Created"
  fi
done

echo ""
echo "✅ Roles ready"
echo ""

echo "🔐 Step 3/4: Configuring auth extension..."
echo ""

if [ -z "$EDGEDB_AUTH_SIGNING_KEY" ]; then
  echo "  ⚠️  Warning: EDGEDB_AUTH_SIGNING_KEY not set in .env"
  echo "  Skipping auth configuration - tests will fail"
else
  # Configure auth settings
  gel query "
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
  " >/dev/null 2>&1 || echo "  (Auth config may already be set)"
  
  # Reset and create EmailPasswordProvider (ensures exactly one)
  gel query "
    CONFIGURE CURRENT BRANCH RESET ext::auth::EmailPasswordProviderConfig FILTER true;
    
    CONFIGURE CURRENT BRANCH INSERT ext::auth::EmailPasswordProviderConfig {
      require_verification := false,
    };
  " >/dev/null 2>&1 || echo "  (Provider config may already be set)"
  
  echo "  ✓ Auth extension configured"
fi

echo ""
echo "✅ Auth configured"
echo ""

echo "📦 Step 4/4: Regenerating TypeScript client..."
npx @edgedb/generate edgeql-js --output-dir ./generated --target ts >/dev/null

echo ""
echo "✅ SETUP COMPLETE!"
echo ""
echo "Database state:"
echo "  📊 Schema: Up to date"
echo "  👥 Roles: 5 application roles ready"
echo "  📝 Client: TypeScript types regenerated"
echo ""
echo "Application roles:"
echo "  📖 app_readonly   - Analytics/BI (read-only)"
echo "  ⚙️  app_worker     - Background jobs"
echo "  👤 app_user       - Normal API access (use this for app)"
echo "  🔧 app_migration  - Schema migrations"
echo "  🔑 app_admin      - Admin/debugging"
echo ""
echo "Next steps:"
echo "  1. Run tests: cd apps/index-pdf-backend && pnpm test"
echo "  2. Start dev server: pnpm dev"
echo ""
