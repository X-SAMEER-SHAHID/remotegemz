-- Fix signup issues for both regular users and admins
-- This migration addresses the missing user_profile creation and improves admin signup

-- 1. Add trigger to create user_profile automatically for new users
CREATE OR REPLACE FUNCTION create_default_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_profile creation
-- Drop existing trigger first if it exists
DROP TRIGGER IF EXISTS create_default_user_profile_trigger ON auth.users;

CREATE TRIGGER create_default_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_profile();

-- 2. Improve admin signup by adding a function to handle admin creation
-- Drop existing function first if it exists
DROP FUNCTION IF EXISTS create_admin_user(UUID, TEXT);

CREATE OR REPLACE FUNCTION create_admin_user(
  p_user_id UUID,
  p_company_name TEXT
)
RETURNS JSON AS $$
DECLARE
  admin_record admin_users%ROWTYPE;
  result JSON;
BEGIN
  -- Insert admin user record
  INSERT INTO admin_users (user_id, company_name, admin_level)
  VALUES (p_user_id, p_company_name, 'admin')
  RETURNING * INTO admin_record;
  
  -- Return success result
  result := json_build_object(
    'success', true,
    'admin_id', admin_record.id,
    'company_name', admin_record.company_name,
    'admin_level', admin_record.admin_level
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error result
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add RLS policy to allow the function to work
-- Drop existing policy first if it exists
DROP POLICY IF EXISTS "Allow admin creation function" ON admin_users;

CREATE POLICY "Allow admin creation function" ON admin_users
    FOR INSERT WITH CHECK (true);

-- 4. Create a function to check if user is admin
-- Drop existing function first if it exists
DROP FUNCTION IF EXISTS is_admin_user(UUID);
DROP FUNCTION IF EXISTS is_admin_user();

CREATE OR REPLACE FUNCTION is_admin_user(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = user_uuid 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add function to get user profile safely
-- Drop existing function first if it exists
DROP FUNCTION IF EXISTS get_user_profile(UUID);
DROP FUNCTION IF EXISTS get_user_profile();

CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  bio TEXT,
  timezone TEXT,
  daily_hours_goal DECIMAL(4,2),
  weekly_hours_goal DECIMAL(5,2),
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.full_name,
    up.bio,
    up.timezone,
    up.daily_hours_goal,
    up.weekly_hours_goal,
    up.avatar_url
  FROM user_profiles up
  WHERE up.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add function to create user profile if it doesn't exist
-- Drop existing function first if it exists
DROP FUNCTION IF EXISTS ensure_user_profile(UUID);
DROP FUNCTION IF EXISTS ensure_user_profile();

CREATE OR REPLACE FUNCTION ensure_user_profile(user_uuid UUID DEFAULT auth.uid())
RETURNS JSON AS $$
DECLARE
  profile_exists BOOLEAN;
  result JSON;
BEGIN
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE user_id = user_uuid) INTO profile_exists;
  
  IF NOT profile_exists THEN
    -- Create profile
    INSERT INTO user_profiles (user_id) VALUES (user_uuid);
    result := json_build_object('success', true, 'action', 'created');
  ELSE
    result := json_build_object('success', true, 'action', 'exists');
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
