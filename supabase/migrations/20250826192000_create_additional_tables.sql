/*
  # Additional Tables for Programming Work Tracker

  This migration creates additional tables to enhance the work tracking functionality:
  
  1. `user_profiles` - Extended user information
  2. `projects` - Project management
  3. `categories` - Work categorization
  4. `work_entry_categories` - Many-to-many relationship between entries and categories
  5. `work_entry_projects` - Many-to-many relationship between entries and projects
  6. `user_preferences` - User settings and preferences
  7. `work_goals` - Goal tracking for work hours/tasks
  8. `work_sessions` - Detailed time tracking sessions
*/

-- Function to update updated_at timestamp (create this first)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text,
  bio text,
  timezone text DEFAULT 'UTC',
  daily_hours_goal decimal(4,2) DEFAULT 8.0,
  weekly_hours_goal decimal(5,2) DEFAULT 40.0,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#6B7280',
  icon text DEFAULT 'Code2',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Work Entry Categories (Many-to-Many)
CREATE TABLE IF NOT EXISTS work_entry_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_entry_id uuid REFERENCES work_entries(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(work_entry_id, category_id)
);

-- 5. Work Entry Projects (Many-to-Many)
CREATE TABLE IF NOT EXISTS work_entry_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_entry_id uuid REFERENCES work_entries(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(work_entry_id, project_id)
);

-- 6. User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  theme text DEFAULT 'light',
  language text DEFAULT 'en',
  date_format text DEFAULT 'MM/dd/yyyy',
  time_format text DEFAULT '12h',
  notifications_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  weekly_report boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Work Goals Table
CREATE TABLE IF NOT EXISTS work_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  goal_type text NOT NULL CHECK (goal_type IN ('daily_hours', 'weekly_hours', 'monthly_hours', 'daily_tasks', 'weekly_tasks', 'monthly_tasks')),
  target_value decimal(8,2) NOT NULL,
  current_value decimal(8,2) DEFAULT 0,
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. Work Sessions Table (for detailed time tracking)
CREATE TABLE IF NOT EXISTS work_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  work_entry_id uuid REFERENCES work_entries(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_minutes integer,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_entry_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_entry_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can manage own profile"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Projects Policies
CREATE POLICY "Users can manage own projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Categories Policies
CREATE POLICY "Users can manage own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Work Entry Categories Policies
CREATE POLICY "Users can manage own work entry categories"
  ON work_entry_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM work_entries 
      WHERE work_entries.id = work_entry_categories.work_entry_id 
      AND work_entries.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_entries 
      WHERE work_entries.id = work_entry_categories.work_entry_id 
      AND work_entries.user_id = auth.uid()
    )
  );

-- Work Entry Projects Policies
CREATE POLICY "Users can manage own work entry projects"
  ON work_entry_projects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM work_entries 
      WHERE work_entries.id = work_entry_projects.work_entry_id 
      AND work_entries.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_entries 
      WHERE work_entries.id = work_entry_projects.work_entry_id 
      AND work_entries.user_id = auth.uid()
    )
  );

-- User Preferences Policies
CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Work Goals Policies
CREATE POLICY "Users can manage own goals"
  ON work_goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Work Sessions Policies
CREATE POLICY "Users can manage own sessions"
  ON work_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_active_idx ON projects(is_active);
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories(user_id);
CREATE INDEX IF NOT EXISTS categories_active_idx ON categories(is_active);
CREATE INDEX IF NOT EXISTS work_entry_categories_entry_idx ON work_entry_categories(work_entry_id);
CREATE INDEX IF NOT EXISTS work_entry_categories_category_idx ON work_entry_categories(category_id);
CREATE INDEX IF NOT EXISTS work_entry_projects_entry_idx ON work_entry_projects(work_entry_id);
CREATE INDEX IF NOT EXISTS work_entry_projects_project_idx ON work_entry_projects(project_id);
CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS work_goals_user_id_idx ON work_goals(user_id);
CREATE INDEX IF NOT EXISTS work_goals_active_idx ON work_goals(is_active);
CREATE INDEX IF NOT EXISTS work_goals_date_range_idx ON work_goals(start_date, end_date);
CREATE INDEX IF NOT EXISTS work_sessions_user_id_idx ON work_sessions(user_id);
CREATE INDEX IF NOT EXISTS work_sessions_entry_idx ON work_sessions(work_entry_id);
CREATE INDEX IF NOT EXISTS work_sessions_time_range_idx ON work_sessions(start_time, end_time);

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_goals_updated_at
  BEFORE UPDATE ON work_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_sessions_updated_at
  BEFORE UPDATE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO categories (user_id, name, description, color, icon) VALUES
    (NEW.id, 'Development', 'General software development tasks', '#3B82F6', 'Code2'),
    (NEW.id, 'Bug Fixes', 'Bug fixing and debugging work', '#EF4444', 'Bug'),
    (NEW.id, 'Code Review', 'Reviewing code and pull requests', '#10B981', 'Eye'),
    (NEW.id, 'Documentation', 'Writing and updating documentation', '#F59E0B', 'FileText'),
    (NEW.id, 'Testing', 'Writing and running tests', '#8B5CF6', 'TestTube'),
    (NEW.id, 'Planning', 'Project planning and architecture', '#6366F1', 'Target'),
    (NEW.id, 'Meetings', 'Team meetings and discussions', '#EC4899', 'Users');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default categories when a user signs up
CREATE TRIGGER create_default_categories_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories();

-- Insert default preferences for new users
CREATE OR REPLACE FUNCTION create_default_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences when a user signs up
CREATE TRIGGER create_default_preferences_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_preferences();
