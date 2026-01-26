#!/bin/bash
set -e

# Database Reset Script (Destructive)
# ============================================================================
# This script DESTROYS all database state:
# - Drops all application roles (instance-level)
# - Wipes the database branch (schema + data)
#
# After running this, you MUST run ./setup.sh to restore functionality.
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

echo "⚠️  DATABASE RESET - This will destroy ALL data and roles!"
echo ""
echo "Press Ctrl+C to cancel, or Enter to continue..."
read -r

echo ""
echo "🧹 Step 1/3: Dropping application roles..."
echo ""

# Drop roles in reverse dependency order
for role in app_admin app_migration app_user app_worker app_readonly; do
  echo "  Dropping $role..."
  gel query "DROP ROLE $role" 2>&1 | grep -q "OK: DROP ROLE" && echo "    ✓ Dropped" || echo "    (doesn't exist, skipping)"
done

echo "✅ Application roles dropped"
echo ""

echo "🗑️  Step 2/3: Cleaning up auth provider configs..."
echo ""

# Reset EmailPasswordProviderConfig to remove all configs before branch wipe
gel query "CONFIGURE CURRENT BRANCH RESET ext::auth::EmailPasswordProviderConfig FILTER true;" 2>&1 | grep -q "OK: CONFIGURE" && echo "  ✓ Provider configs reset" || echo "  (no configs to reset)"

echo "✅ Auth configs reset"
echo ""

echo "🗑️  Step 3/3: Wiping database branch..."
gel branch wipe --non-interactive main

echo "✅ Database wiped"
echo ""
echo "⚠️  RESET COMPLETE - Database is now empty!"
echo ""
echo "Next step:"
echo "  Run ./setup.sh to recreate roles, schema, and auth"
echo ""
