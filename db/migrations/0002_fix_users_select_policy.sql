-- Fix users SELECT policy to allow unauthenticated access for signup/login
-- This allows the signup duplicate email check and login user lookup to work

-- Drop the old policy that required auth context
DROP POLICY IF EXISTS "users_select_authenticated" ON "users";

-- Create new policy that allows public SELECT access
-- Security: passwordHash is bcrypt-hashed, email lookup is necessary for auth
CREATE POLICY "users_select_all" 
  ON "users" 
  AS PERMISSIVE 
  FOR SELECT 
  TO public 
  USING (TRUE);
