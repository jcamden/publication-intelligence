#!/bin/bash
set -e

# Database Setup Script
# Run this after wiping the database to recreate roles and authentication

echo "🔧 Setting up Gel database after reset..."
echo ""

# Check we're in the right directory
if [ ! -f "gel.toml" ]; then
  echo "❌ Error: Must run from db/gel directory"
  exit 1
fi

echo "1️⃣ Creating app_user role..."
gel query "
CREATE ROLE app_user {
  SET password := 'dev_password_12345';
  SET permissions := {
    sys::perm::data_modification,
    ext::auth::perm::auth_read,
    ext::auth::perm::auth_write,
    default::app_access
  };
}
"

echo "2️⃣ Configuring password authentication..."
gel query "
CONFIGURE INSTANCE INSERT cfg::Auth {
  priority := 10,
  method := (INSERT cfg::Password),
  user := 'app_user'
}
"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "  1. Generate TypeScript client: cd ../../apps/index-pdf-backend && pnpm gel:generate"
echo "  2. Run tests: pnpm test"
echo ""
