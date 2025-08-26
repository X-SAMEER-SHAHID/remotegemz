-- Remove problematic triggers that are causing signup failures
-- These triggers try to insert into tables with RLS policies during auth user creation

-- 1. Drop the problematic triggers
DROP TRIGGER IF EXISTS create_default_categories_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_default_preferences_trigger ON auth.users;

-- 2. Drop the trigger functions
DROP FUNCTION IF EXISTS create_default_categories();
DROP FUNCTION IF EXISTS create_default_preferences();

-- 3. Verify no triggers remain on auth.users
-- This will help ensure no other triggers interfere with user creation
