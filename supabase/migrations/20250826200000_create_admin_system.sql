-- Create admin system tables
-- This migration adds admin functionality with team management and task assignment

-- Admin users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    admin_level TEXT DEFAULT 'admin' CHECK (admin_level IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members table (junction between teams and developers)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'developer' CHECK (role IN ('developer', 'lead', 'senior')),
    hourly_rate DECIMAL(8,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    estimated_hours DECIMAL(4,2),
    actual_hours DECIMAL(4,2) DEFAULT 0,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task work entries junction table
CREATE TABLE task_work_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    work_entry_id UUID REFERENCES work_entries(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, work_entry_id)
);

-- Create indexes for performance
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_teams_admin_id ON teams(admin_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_tasks_team_id ON tasks(team_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_task_work_entries_task_id ON task_work_entries(task_id);
CREATE INDEX idx_task_work_entries_work_entry_id ON task_work_entries(work_entry_id);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_work_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users
CREATE POLICY "Admin users can view their own profile" ON admin_users
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin users can update their own profile" ON admin_users
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin users can insert their own profile" ON admin_users
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for teams
CREATE POLICY "Admins can manage their teams" ON teams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = teams.admin_id 
            AND admin_users.user_id = auth.uid()
        )
    );

-- RLS Policies for team_members
CREATE POLICY "Admins can manage team members" ON team_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teams 
            JOIN admin_users ON teams.admin_id = admin_users.id
            WHERE teams.id = team_members.team_id 
            AND admin_users.user_id = auth.uid()
        )
    );

CREATE POLICY "Team members can view their team assignments" ON team_members
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for tasks
CREATE POLICY "Admins can manage tasks" ON tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teams 
            JOIN admin_users ON teams.admin_id = admin_users.id
            WHERE teams.id = tasks.team_id 
            AND admin_users.user_id = auth.uid()
        )
    );

CREATE POLICY "Assigned developers can view their tasks" ON tasks
    FOR SELECT USING (auth.uid() = assigned_to);

-- RLS Policies for task_work_entries
CREATE POLICY "Admins can manage task work entries" ON task_work_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tasks 
            JOIN teams ON tasks.team_id = teams.id
            JOIN admin_users ON teams.admin_id = admin_users.id
            WHERE tasks.id = task_work_entries.task_id 
            AND admin_users.user_id = auth.uid()
        )
    );

CREATE POLICY "Developers can manage their task work entries" ON task_work_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM work_entries 
            WHERE work_entries.id = task_work_entries.work_entry_id 
            AND work_entries.user_id = auth.uid()
        )
    );

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get user role (admin or developer)
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
    -- Check if user is an admin
    IF EXISTS (SELECT 1 FROM admin_users WHERE user_id = user_uuid AND is_active = true) THEN
        RETURN 'admin';
    -- Check if user is a team member
    ELSIF EXISTS (SELECT 1 FROM team_members WHERE user_id = user_uuid AND is_active = true) THEN
        RETURN 'developer';
    ELSE
        RETURN 'user';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin's teams
CREATE OR REPLACE FUNCTION get_admin_teams()
RETURNS TABLE (
    team_id UUID,
    team_name TEXT,
    team_description TEXT,
    member_count BIGINT,
    active_tasks_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as team_id,
        t.name as team_name,
        t.description as team_description,
        COUNT(tm.id) as member_count,
        COUNT(tsk.id) as active_tasks_count
    FROM teams t
    LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
    LEFT JOIN tasks tsk ON t.id = tsk.team_id AND tsk.status IN ('pending', 'in_progress')
    WHERE t.admin_id = (SELECT id FROM admin_users WHERE user_id = auth.uid())
    AND t.is_active = true
    GROUP BY t.id, t.name, t.description;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get developer's tasks
CREATE OR REPLACE FUNCTION get_developer_tasks()
RETURNS TABLE (
    task_id UUID,
    task_title TEXT,
    task_description TEXT,
    task_status TEXT,
    task_priority TEXT,
    team_name TEXT,
    estimated_hours DECIMAL(4,2),
    actual_hours DECIMAL(4,2),
    due_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as task_id,
        t.title as task_title,
        t.description as task_description,
        t.status as task_status,
        t.priority as task_priority,
        tm.name as team_name,
        t.estimated_hours,
        t.actual_hours,
        t.due_date
    FROM tasks t
    JOIN teams tm ON t.team_id = tm.id
    WHERE t.assigned_to = auth.uid()
    AND t.status IN ('pending', 'in_progress')
    ORDER BY t.priority DESC, t.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
