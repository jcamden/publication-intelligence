#!/bin/bash
set -e

# Lint Access Policies - Prevent Object Equality Bugs
# ====================================================
#
# This script checks for unsafe access policy patterns in Gel schema files.
# It should be run in CI and pre-commit hooks.

SCHEMA_DIR="db/gel/dbschema"
FAILED=0

echo "🔍 Linting Gel access policies..."
echo ""

# Check 1: Detect object equality with global current_user
echo "Checking for object equality with global current_user..."
if grep -rn "= global current_user" "$SCHEMA_DIR" --include="*.gel" --include="*.edgeql" | grep -v "current_user_id" | grep -v "#.*= global current_user" | grep -v "current_user :="; then
  echo ""
  echo "❌ FAIL: Found object equality with 'global current_user'"
  echo ""
  echo "This pattern is unsafe and can leak data due to EdgeDB set semantics."
  echo ""
  echo "✅ Correct pattern:"
  echo "   using (.owner.id ?= global current_user_id)"
  echo ""
  echo "❌ Wrong patterns:"
  echo "   using (.owner = global current_user)"
  echo "   using (.owner ?= global current_user)"
  echo ""
  FAILED=1
else
  echo "✅ PASS: No object equality detected"
fi

echo ""

# Check 2: Ensure global current_user_id is defined
echo "Checking for global current_user_id definition..."
if ! grep -q "global current_user_id :=" "$SCHEMA_DIR/default.gel"; then
  echo "❌ FAIL: global current_user_id is not defined in default.gel"
  echo ""
  echo "This global is required for safe access policies."
  echo ""
  FAILED=1
else
  echo "✅ PASS: global current_user_id is defined"
fi

echo ""

if [ $FAILED -eq 1 ]; then
  echo "❌ Access policy lint FAILED"
  echo ""
  echo "Fix the issues above and try again."
  exit 1
else
  echo "✅ All access policy checks passed!"
  exit 0
fi
