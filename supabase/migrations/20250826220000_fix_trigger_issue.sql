-- Fix trigger issue that's causing signup failures
-- The trigger is causing "Database error saving new user" because it's trying to insert
-- into user_profiles during auth user creation, which can cause conflicts

-- 1. Drop the problematic trigger
DROP TRIGGER IF EXISTS create_default_user_profile_trigger ON auth.users;

-- 2. Drop the trigger function
DROP FUNCTION IF EXISTS create_default_user_profile();

-- 3. Create a better approach - use a function that can be called after user creation
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called by the application after successful signup
  -- instead of using a trigger that can interfere with auth user creation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update the ensure_user_profile function to be more robust
CREATE OR REPLACE FUNCTION ensure_user_profile(user_uuid UUID DEFAULT auth.uid())
RETURNS JSON AS $$
DECLARE
  profile_exists BOOLEAN;
  result JSON;
BEGIN
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE user_id = user_uuid) INTO profile_exists;
  
  IF NOT profile_exists THEN
    -- Create profile with default values
    INSERT INTO user_profiles (user_id, timezone, daily_hours_goal, weekly_hours_goal) 
    VALUES (user_uuid, 'UTC', 8.0, 40.0);
    
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

-- 5. Create a function to handle the complete signup process
CREATE OR REPLACE FUNCTION complete_user_signup(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  profile_result JSON;
  preferences_result JSON;
  categories_result JSON;
  final_result JSON;
BEGIN
  -- Ensure user profile exists
  SELECT ensure_user_profile(user_uuid) INTO profile_result;
  
  -- Ensure user preferences exist
  INSERT INTO user_preferences (user_id) 
  VALUES (user_uuid)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create default categories for the user
  INSERT INTO categories (user_id, name, description, color, icon) 
  VALUES 
    (user_uuid, 'Development', 'General software development tasks', '#3B82F6', 'Code2'),
    (user_uuid, 'Bug Fixes', 'Bug fixing and debugging work', '#EF4444', 'Bug'),
    (user_uuid, 'Code Review', 'Reviewing code and pull requests', '#10B981', 'Eye'),
    (user_uuid, 'Documentation', 'Writing and updating documentation', '#F59E0B', 'FileText'),
    (user_uuid, 'Testing', 'Writing and running tests', '#8B5CF6', 'TestTube'),
    (user_uuid, 'Planning', 'Project planning and architecture', '#6366F1', 'Target'),
    (user_uuid, 'Meetings', 'Team meetings and discussions', '#EC4899', 'Users')
  ON CONFLICT DO NOTHING;
  
  final_result := json_build_object(
    'success', true,
    'user_id', user_uuid,
    'profile_created', (profile_result->>'action') = 'created',
    'message', 'User signup completed successfully'
  );
  
  RETURN final_result;
EXCEPTION
  WHEN OTHERS THEN
    final_result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
    RETURN final_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
