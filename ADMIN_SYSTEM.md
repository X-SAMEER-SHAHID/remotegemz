# Admin System Documentation

## Overview

The admin system provides comprehensive team and task management capabilities for administrators to oversee developer work and track project progress.

## Features

### 1. Admin Authentication
- **Separate Admin Signup**: `/admin/signup` - Only accessible to authorized admins
- **Admin Login**: `/admin/login` - Separate login for admin accounts
- **Role-based Access**: Admins have different permissions than regular users

### 2. Admin Dashboard (`/admin/dashboard`)
- Overview of all teams and their status
- Recent task activity
- Team member statistics
- Quick access to key metrics

### 3. Team Management (`/admin/teams`)
- Create and manage teams
- Add/remove team members
- Assign roles (developer, senior, lead)
- Set hourly rates for team members
- View team member details

### 4. Task Management (`/admin/tasks`)
- Create tasks and assign to team members
- Set task priorities (low, medium, high, urgent)
- Track task status (pending, in progress, completed, on hold)
- Estimate and track actual hours
- Set due dates for tasks

### 5. Developer Reports (`/admin/reports`)
- Monthly work evaluation for each developer
- Calculate total hours worked
- Track earnings based on hourly rates
- Export reports to CSV
- Detailed work entry analysis
- Task completion tracking

### 6. Admin Settings (`/admin/settings`)
- Update company information
- View admin account details
- System status information

## Database Schema

### Admin Tables

#### `admin_users`
- Stores admin account information
- Links to auth.users for authentication
- Company name and admin level

#### `teams`
- Team information and organization
- Links to admin_users for ownership

#### `team_members`
- Junction table between teams and users
- Stores role, hourly rate, and membership status

#### `tasks`
- Task definitions and assignments
- Status tracking and time estimates
- Links to teams and assigned developers

#### `task_work_entries`
- Links work entries to specific tasks
- Enables task-based work tracking

## User Roles

### Admin
- Full access to admin panel
- Can create/manage teams
- Can assign tasks to developers
- Can view all reports and analytics
- Can manage team members

### Developer
- Regular user with team membership
- Can view assigned tasks
- Can link work entries to tasks
- Can track their own progress

## Workflow

### 1. Admin Setup
1. Admin creates account via `/admin/signup`
2. Admin logs in via `/admin/login`
3. Admin creates teams and adds members
4. Admin assigns tasks to team members

### 2. Developer Work
1. Developer logs in as regular user
2. Developer sees assigned tasks
3. Developer creates work entries and links to tasks
4. Work is automatically tracked and calculated

### 3. Admin Monitoring
1. Admin views dashboard for overview
2. Admin checks task progress in task management
3. Admin evaluates developer work in reports
4. Admin exports monthly reports for billing

## Security

- Row Level Security (RLS) enabled on all tables
- Admins can only access their own teams and data
- Developers can only see their assigned tasks
- Separate authentication flows for admin and regular users

## API Endpoints

### Admin Functions
- `get_admin_teams()` - Get teams for current admin
- `get_developer_tasks()` - Get tasks for current developer
- `get_user_role()` - Determine user role (admin/developer/user)

### Database Policies
- Admin users can manage their own profile
- Admins can manage teams they own
- Team members can view their assignments
- Task access is restricted by team ownership

## Usage Examples

### Creating a Team
```sql
-- Admin creates a team
INSERT INTO teams (admin_id, name, description)
VALUES (admin_id, 'Frontend Team', 'React and UI development');

-- Admin adds team member
INSERT INTO team_members (team_id, user_id, role, hourly_rate)
VALUES (team_id, user_id, 'developer', 50.00);
```

### Assigning a Task
```sql
-- Admin creates a task
INSERT INTO tasks (team_id, assigned_to, title, description, priority, estimated_hours)
VALUES (team_id, user_id, 'Implement Login', 'Create user authentication', 'high', 8.0);
```

### Linking Work to Task
```sql
-- Developer's work entry gets linked to task
INSERT INTO task_work_entries (task_id, work_entry_id)
VALUES (task_id, work_entry_id);
```

## Future Enhancements

- Real-time notifications for task updates
- Advanced reporting and analytics
- Time tracking integrations
- Project milestone tracking
- Team performance metrics
- Automated billing calculations
