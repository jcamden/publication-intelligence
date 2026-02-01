#!/bin/bash
set -e

# Clear Auth Identities - Useful for cleaning up auth extension data
# This removes all authentication identities from the specified branch
# 
# Usage:
#   ./clear-auth-identities.sh           # Clears test branch
#   ./clear-auth-identities.sh main      # Clears main branch (use with caution!)
#   ./clear-auth-identities.sh test      # Explicitly clear test branch

INSTANCE="publication_intelligence"
BRANCH="${1:-test}"  # Default to test branch for safety

echo "🧹 Clearing auth identities from branch: $BRANCH"

if [ "$BRANCH" = "main" ]; then
  echo "⚠️  WARNING: You are about to clear auth identities from the MAIN branch!"
  echo "   This will log out all users and require re-registration."
  read -p "   Are you sure? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "   Aborted."
    exit 0
  fi
fi

# Delete all email/password factors first (cascade won't handle these automatically)
echo "  Deleting email/password factors..."
gel -I "$INSTANCE" -b "$BRANCH" query "
  DELETE ext::auth::EmailPasswordFactor;
" > /dev/null 2>&1 || echo "    No email/password factors to delete"

# Delete all email factors
echo "  Deleting email factors..."
gel -I "$INSTANCE" -b "$BRANCH" query "
  DELETE ext::auth::EmailFactor;
" > /dev/null 2>&1 || echo "    No email factors to delete"

# Delete all identities (this will cascade to associated factors if any remain)
echo "  Deleting identities..."
DELETED=$(gel -I "$INSTANCE" -b "$BRANCH" query "
  SELECT count((DELETE ext::auth::Identity));
" --output-format=json | jq -r '.[0]')

echo ""
echo "✅ Cleared $DELETED auth identities from branch: $BRANCH"
echo "   All users will need to re-register"
