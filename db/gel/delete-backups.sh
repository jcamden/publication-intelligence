#!/bin/bash
set -e

# Delete All Backups Script
# ============================================================================
# EdgeDB/Gel stores backups in: 
# ~/Library/Application Support/edgedb/data/instance.backups/
#
# There's no CLI command to delete them, so we manually remove the directory.
# Can be run from project root or db/gel directory.
# ============================================================================

BACKUP_DIR="$HOME/Library/Application Support/edgedb/data/instance.backups"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "✅ No backups directory found"
  exit 0
fi

echo "🗑️  Deleting all Gel backups..."
echo ""
echo "This will delete backups from:"
echo "  $BACKUP_DIR"
echo ""
echo "Press Ctrl+C to cancel, or Enter to continue..."
read -r

rm -rf "$BACKUP_DIR"

echo "✅ All backups deleted"
echo ""
echo "Note: New backups will be created automatically unless you set:"
echo "  export GEL_AUTO_BACKUP_MODE=disabled"
echo ""
