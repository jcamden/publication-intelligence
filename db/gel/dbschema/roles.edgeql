# Role & Permission Architecture
# ============================================================================
# 
# This file defines the application role hierarchy for the Gel database.
# Each role has specific permissions based on its intended use case.
#
# Apply with: gel query -f dbschema/roles.edgeql
#
# NOTE: Run ./reset.sh first if you need to recreate roles from scratch.
# This script uses CREATE ROLE which will fail if roles already exist.
# ============================================================================

# ============================================================================
# Role: app_readonly
# Purpose: Analytics, BI tools, monitoring dashboards
# Permissions: Read-only access to application data
# Use case: Data warehouse sync, reporting tools, dashboards
# ============================================================================

CREATE ROLE app_readonly {
  SET password := 'dev_readonly_12345';  # Change in production!
  SET permissions := {
    sys::perm::data_read
  };
};

# ============================================================================
# Role: app_worker
# Purpose: Background jobs, async tasks, queue processors
# Permissions: Read + Write data, but NO auth management
# Use case: Email sender, PDF processor, index rebuilder
# ============================================================================

CREATE ROLE app_worker {
  SET password := 'dev_worker_12345';  # Change in production!
  SET permissions := {
    sys::perm::data_modification  # Includes read + write + delete
  };
};

# ============================================================================
# Role: app_user
# Purpose: Normal API access for authenticated users
# Permissions: Data modification + Auth read/write
# Use case: Web/mobile app backend, user-facing API
# ============================================================================

CREATE ROLE app_user {
  SET password := 'dev_password_12345';  # Change in production!
  SET permissions := {
    sys::perm::data_modification,     # Read + write + delete data
    ext::auth::perm::auth_read,       # Verify tokens, read user data
    ext::auth::perm::auth_write,      # Create users, issue tokens
    default::app_access               # Custom application permission
  };
};

# ============================================================================
# Role: app_migration
# Purpose: Schema migrations only
# Permissions: DDL operations (CREATE TYPE, ALTER TYPE, etc.)
# Use case: CI/CD migration pipelines, schema updates
# ============================================================================

CREATE ROLE app_migration {
  SET password := 'dev_migration_12345';  # Change in production!
  SET permissions := {
    sys::perm::ddl_modification  # Schema changes only, no data access
  };
};

# ============================================================================
# Role: app_admin
# Purpose: Administrative operations, debugging, emergency access
# Permissions: Full access (except superuser operations)
# Use case: DevOps troubleshooting, admin panels, support tools
# ============================================================================

CREATE ROLE app_admin {
  SET password := 'dev_admin_12345';  # Change in production!
  SET permissions := {
    sys::perm::all  # Full permissions except superuser-only operations
  };
};

# ============================================================================
# Permission Matrix Summary
# ============================================================================
#
# Role            | Data Read | Data Write | Auth | DDL | Use Case
# ----------------|-----------|------------|------|-----|------------------
# app_readonly    | ✅        | ❌         | ❌   | ❌  | Analytics/BI
# app_worker      | ✅        | ✅         | ❌   | ❌  | Background jobs
# app_user        | ✅        | ✅         | ✅   | ❌  | API access
# app_migration   | ❌        | ❌         | ❌   | ✅  | Schema updates
# app_admin       | ✅        | ✅         | ✅   | ✅  | Admin/debugging
# admin (super)   | ✅        | ✅         | ✅   | ✅  | Full system access
#
# ============================================================================
# Security Best Practices
# ============================================================================
#
# 1. ✅ Use app_user for normal API operations (least privilege)
# 2. ✅ Use app_worker for background jobs (no auth access)
# 3. ✅ Use app_readonly for analytics (prevent accidental writes)
# 4. ✅ Use app_migration ONLY for schema changes (CI/CD)
# 5. ✅ Use app_admin sparingly (emergency/debugging only)
# 6. ❌ NEVER use admin role for application code
#
# ============================================================================
