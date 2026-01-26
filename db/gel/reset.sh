#!/bin/bash
set -e

# Database Reset Script (Destructive)
# ============================================================================
# This script DESTROYS all database state:
# - Drops all application roles (instance-level)
# - Wipes the database branch (schema + data)
#
# After running this, you MUST run ./setup.sh to restore functionality.
# ============================================================================

# Load environment variables from .env (for GEL_AUTO_BACKUP_MODE, etc.)
if [ -f "../../.env" ]; then
  set -a
  source ../../.env
  set +a
fi

echo "⚠️  DATABASE RESET - This will destroy ALL data and roles!"
echo ""
echo "Press Ctrl+C to cancel, or Enter to continue..."
read -r

echo ""
echo "🧹 Step 1/2: Dropping application roles..."
echo ""

# Drop roles in reverse dependency order
for role in app_admin app_migration app_user app_worker app_readonly; do
  echo "  Dropping $role..."
  gel query "DROP ROLE $role" 2>&1 | grep -q "OK: DROP ROLE" && echo "    ✓ Dropped" || echo "    (doesn't exist, skipping)"
done

echo "✅ Application roles dropped"
echo ""

echo "🗑️  Step 2/2: Wiping database branch..."
gel branch wipe --non-interactive main

echo "✅ Database wiped"
echo ""
echo "⚠️  RESET COMPLETE - Database is now empty!"
echo ""
echo "Next step:"
echo "  Run ./setup.sh to recreate roles, schema, and auth"
echo ""
