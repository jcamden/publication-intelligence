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
# ============================================================================

# Check we're in the right directory
if [ ! -f "gel.toml" ]; then
  echo "❌ Error: Must run from db/gel directory"
  exit 1
fi

# Load environment variables from .env (for GEL_AUTO_BACKUP_MODE, etc.)
if [ -f "../../.env" ]; then
  set -a
  source ../../.env
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

echo "📦 Step 3/3: Regenerating TypeScript client..."
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
