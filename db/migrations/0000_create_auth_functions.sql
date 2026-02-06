-- Create auth schema, role, and helper functions for RLS
-- This migration must run BEFORE any tables with RLS policies are created

-- Create authenticated role (referenced by RLS policies)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
END $$;

-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Function to get current user ID from JWT claim
-- This mimics Supabase's auth.uid() function
-- The function reads from the session variable set by withUserContext()
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;--> statement-breakpoint

-- Grant usage on schemas to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;--> statement-breakpoint
GRANT USAGE ON SCHEMA auth TO authenticated;--> statement-breakpoint

-- Grant ALL privileges on all tables to authenticated role
-- RLS policies will handle the actual access control
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;--> statement-breakpoint
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;--> statement-breakpoint

-- Grant permissions on future tables (for new migrations)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
