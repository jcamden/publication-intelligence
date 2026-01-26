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
# Permissions: MINIMAL - Relies on access policies for actual data access
# Use case: Web/mobile app backend, user-facing API
# ============================================================================
#
# SECURITY PRINCIPLE: Fail-closed
# - If access policies break, app_user has NO unrestricted data access
# - Only has auth permissions + custom app_access
# - All data operations gated by access policies
#
# This is significantly safer than data_modification which would allow
# unrestricted access if policies failed.
# ============================================================================

CREATE ROLE app_user {
  SET password := 'dev_password_12345';  # Change in production!
  SET permissions := {
    # Auth permissions (required for token verification and user management)
    ext::auth::perm::auth_read,       # Verify tokens, read user data
    ext::auth::perm::auth_write,      # Create users, issue tokens
    
    # Custom application permission (used by access policies)
    default::app_access
    
    # NOTE: NO data_modification - all data access via policies only
    # NOTE: NO policy_bypass - app MUST respect access policies
    # This ensures fail-closed security (if policies break, no data access)
  };
};

# ============================================================================
# Role: app_migration
# Purpose: Schema migrations AND data seeding
# Permissions: Full data + DDL access (bypasses access policies)
# Use case: CI/CD migration pipelines, schema updates, data seeding
# ============================================================================
#
# DESIGN NOTE: This role can modify data AND schema
# - Needed for migrations that include data transformations
# - Needed for seeding initial data
# - Bypasses access policies (unrestricted)
# - Should ONLY be used in CI/CD pipelines, never in app code
# ============================================================================

CREATE ROLE app_migration {
  SET password := 'dev_migration_12345';  # Change in production!
  SET permissions := {
    sys::perm::ddl_modification,      # Schema changes
    sys::perm::data_modification,     # Data access (for seeding/transforms)
    default::policy_bypass            # Bypass policies (needed for migrations)
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
# Role            | Data Read | Data Write | Auth | DDL | Policies | policy_bypass | Use Case
# ----------------|-----------|------------|------|-----|----------|---------------|------------------
# app_readonly    | ✅        | ❌         | ❌   | ❌  | ✅       | ❌            | Analytics/BI
# app_worker      | ✅        | ✅         | ❌   | ❌  | ✅       | ❌            | Background jobs
# app_user        | via policy| via policy | ✅   | ❌  | ✅       | ❌            | API access (FAIL-CLOSED)
# app_migration   | ✅        | ✅         | ❌   | ✅  | bypass   | ✅            | Migrations/seeding
# app_admin       | ✅        | ✅         | ✅   | ✅  | bypass   | ✅            | Admin/debugging
# admin (super)   | ✅        | ✅         | ✅   | ✅  | bypass   | ✅            | Full system access
#
# KEY INSIGHTS:
# 1. app_user has NO data_modification and NO policy_bypass
#    - All data access is gated by access policies
#    - If policies break → app_user has ZERO data access (fail-closed)
# 2. policy_bypass only for trusted roles
#    - app_migration: needs unrestricted access for data migrations
#    - app_admin: needs unrestricted access for debugging/admin tools
#    - NEVER for app_user, app_worker, or app_readonly
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
