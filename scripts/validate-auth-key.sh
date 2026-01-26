#!/bin/bash
set -e

# Validate EdgeDB/Gel Auth Signing Key
# Ensures the key meets minimum security requirements

MIN_LENGTH=32
KEY_VAR="EDGEDB_AUTH_SIGNING_KEY"

echo "🔐 Validating auth signing key..."
echo ""

# Auto-load from .env if it exists and key not already set
if [ -z "${!KEY_VAR}" ] && [ -f ".env" ]; then
  echo "📄 Loading environment from .env file..."
  # Export only the specific key we need
  export EDGEDB_AUTH_SIGNING_KEY=$(grep "^EDGEDB_AUTH_SIGNING_KEY=" .env | cut -d '=' -f2- | sed 's/^["'"'"']//' | sed 's/["'"'"']$//')
  echo ""
fi

# Check if key is set
if [ -z "${!KEY_VAR}" ]; then
  echo "❌ FAIL: $KEY_VAR is not set"
  echo ""
  echo "Generate a secure key with:"
  echo "  openssl rand -base64 32"
  echo ""
  echo "Then add to .env:"
  echo "  $KEY_VAR=<your-generated-key>"
  echo ""
  exit 1
fi

KEY="${!KEY_VAR}"

# Check for placeholder value
if [ "$KEY" = "REPLACE_WITH_SECURE_KEY_IN_PRODUCTION" ]; then
  echo "❌ FAIL: $KEY_VAR is still using placeholder value"
  echo ""
  echo "Generate a secure key with:"
  echo "  openssl rand -base64 32"
  echo ""
  exit 1
fi

# Check minimum length
KEY_LENGTH=${#KEY}
if [ $KEY_LENGTH -lt $MIN_LENGTH ]; then
  echo "❌ FAIL: $KEY_VAR is too short ($KEY_LENGTH bytes, minimum $MIN_LENGTH)"
  echo ""
  echo "Generate a secure key with:"
  echo "  openssl rand -base64 32"
  echo ""
  exit 1
fi

# Check if key appears to be base64 (basic heuristic)
if ! echo "$KEY" | grep -qE '^[A-Za-z0-9+/]+=*$'; then
  echo "⚠️  WARNING: $KEY_VAR doesn't appear to be base64-encoded"
  echo "   This may be intentional, but consider using: openssl rand -base64 32"
  echo ""
fi

echo "✅ PASS: $KEY_VAR is valid"
echo "   Length: $KEY_LENGTH bytes"
echo "   First 8 chars: ${KEY:0:8}..."
echo ""
exit 0
