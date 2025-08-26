# Database Schema Documentation

## Overview

This document describes the complete database schema for the Programming Work Tracker application. The schema is designed to support comprehensive work tracking, project management, and user customization features.

## Tables

### 1. Core Tables

#### `work_entries` (Main Table)
The primary table for storing work entries.

**Columns:**
- `id` (uuid, PK) - Unique identifier
- `user_id` (uuid, FK) - References auth.users(id)
- `work_date` (date) - Date of work
- `work_time` (time) - Time of work entry
- `description` (text) - Description of work done
- `hours_spent` (decimal(4,2)) - Hours spent on work
- `commit_link` (text, nullable) - Link to commit/repository
- `screenshot_url` (text, nullable) - URL to screenshot
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Indexes:**
- `work_entries_user_date_idx` - (user_id, work_date)
- `work_entries_user_created_idx` - (user_id, created_at)

### 2. User Management Tables

#### `user_profiles`
Extended user information beyond basic auth.

**Columns:**
- `id` (uuid, PK) - Unique identifier
- `user_id` (uuid, FK, UNIQUE) - References auth.users(id)
- `full_name` (text, nullable) - User's full name
- `bio` (text, nullable) - User biography
- `timezone` (text) - User's timezone (default: 'UTC')
- `daily_hours_goal` (decimal(4,2)) - Daily work hours goal (default: 8.0)
- `weekly_hours_goal` (decimal(5,2)) - Weekly work hours goal (default: 40.0)
- `avatar_url` (text, nullable) - Profile picture URL
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

#### `user_preferences`
User settings and application preferences.

**Columns:**
- `id` (uuid, PK) - Unique identifier
- `user_id` (uuid, FK, UNIQUE) - References auth.users(id)
- `theme` (text) - UI theme preference (default: 'light')
- `language` (text) - Language preference (default: 'en')
- `date_format` (text) - Date format preference (default: 'MM/dd/yyyy')
- `time_format` (text) - Time format preference (default: '12h')
- `notifications_enabled` (boolean) - Enable notifications (default: true)
- `email_notifications` (boolean) - Enable email notifications (default: true)
- `weekly_report` (boolean) - Enable weekly reports (default: true)
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

### 3. Project Management Tables

#### `projects`
User-defined projects for organizing work.

**Columns:**
- `id` (uuid, PK) - Unique identifier
- `user_id` (uuid, FK) - References auth.users(id)
- `name` (text) - Project name
- `description` (text, nullable) - Project description
- `color` (text) - Project color for UI (default: '#3B82F6')
- `is_active` (boolean) - Whether project is active (default: true)
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

#### `work_entry_projects` (Junction Table)
Many-to-many relationship between work entries and projects.

**Columns:**
- `id` (uuid, PK) - Unique identifier
- `work_entry_id` (uuid, FK) - References work_entries(id)
- `project_id` (uuid, FK) - References projects(id)
- `created_at` (timestamptz) - Creation timestamp

**Constraints:**
- UNIQUE(work_entry_id, project_id) - Prevents duplicate associations

### 4. Categorization Tables

#### `categories`
User-defined categories for organizing work types.

**Columns:**
- `id` (uuid, PK) - Unique identifier
- `user_id` (uuid, FK) - References auth.users(id)
- `name` (text) - Category name
- `description` (text, nullable) - Category description
- `color` (text) - Category color for UI (default: '#6B7280')
- `icon` (text) - Icon name for UI (default: 'Code2')
- `is_active` (boolean) - Whether category is active (default: true)
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Default Categories (created automatically for new users):**
- Development (General software development tasks)
- Bug Fixes (Bug fixing and debugging work)
- Code Review (Reviewing code and pull requests)
- Documentation (Writing and updating documentation)
- Testing (Writing and running tests)
- Planning (Project planning and architecture)
- Meetings (Team meetings and discussions)

#### `work_entry_categories` (Junction Table)
Many-to-many relationship between work entries and categories.

**Columns:**
- `id` (uuid, PK) - Unique identifier
- `work_entry_id` (uuid, FK) - References work_entries(id)
- `category_id` (uuid, FK) - References categories(id)
- `created_at` (timestamptz) - Creation timestamp

**Constraints:**
- UNIQUE(work_entry_id, category_id) - Prevents duplicate associations

### 5. Goal Tracking Tables

#### `work_goals`
User-defined goals for work hours or tasks.

**Columns:**
- `id` (uuid, PK) - Unique identifier
- `user_id` (uuid, FK) - References auth.users(id)
- `title` (text) - Goal title
- `description` (text, nullable) - Goal description
- `goal_type` (text) - Type of goal (daily_hours, weekly_hours, monthly_hours, daily_tasks, weekly_tasks, monthly_tasks)
- `target_value` (decimal(8,2)) - Target value for the goal
- `current_value` (decimal(8,2)) - Current progress value (default: 0)
- `start_date` (date) - Goal start date
- `end_date` (date, nullable) - Goal end date
- `is_active` (boolean) - Whether goal is active (default: true)
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

### 6. Time Tracking Tables

#### `work_sessions`
Detailed time tracking sessions for precise work tracking.

**Columns:**
- `id` (uuid, PK) - Unique identifier
- `user_id` (uuid, FK) - References auth.users(id)
- `work_entry_id` (uuid, FK, nullable) - References work_entries(id)
- `start_time` (timestamptz) - Session start time
- `end_time` (timestamptz, nullable) - Session end time
- `duration_minutes` (integer, nullable) - Session duration in minutes
- `description` (text, nullable) - Session description
- `is_active` (boolean) - Whether session is active (default: true)
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

## Storage

### `images` Bucket
Storage bucket for screenshots and other images.

**Configuration:**
- Public access enabled
- 5MB file size limit
- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
- Organized by user: `screenshots/{user_id}/{filename}`

## Security

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:

1. **User Isolation**: Users can only access their own data
2. **Authenticated Access**: All operations require authentication
3. **Cascade Protection**: Junction tables respect user ownership through related tables

### Policies
- Users can manage their own profiles, preferences, projects, categories, and goals
- Work entry associations respect user ownership through the work_entries table
- Storage access is restricted to user's own files

## Indexes

Performance indexes are created for:
- User-based queries (user_id)
- Date range queries (start_date, end_date)
- Active status filtering (is_active)
- Junction table lookups (work_entry_id, category_id, project_id)
- Time-based queries (start_time, end_time)

## Triggers

### Automatic Timestamps
All tables with `updated_at` columns have triggers to automatically update the timestamp on row updates.

### Default Data Creation
- New users automatically get default categories
- New users automatically get default preferences

## Relationships

```
auth.users (1) ←→ (1) user_profiles
auth.users (1) ←→ (1) user_preferences
auth.users (1) ←→ (N) work_entries
auth.users (1) ←→ (N) projects
auth.users (1) ←→ (N) categories
auth.users (1) ←→ (N) work_goals
auth.users (1) ←→ (N) work_sessions

work_entries (1) ←→ (N) work_entry_categories (N) ←→ (1) categories
work_entries (1) ←→ (N) work_entry_projects (N) ←→ (1) projects
work_entries (1) ←→ (N) work_sessions
```

## Usage Examples

### Creating a Work Entry with Categories and Projects
```sql
-- Insert work entry
INSERT INTO work_entries (user_id, work_date, work_time, description, hours_spent)
VALUES (auth.uid(), '2024-01-15', '09:00', 'Implemented user authentication', 4.5)
RETURNING id;

-- Associate with categories
INSERT INTO work_entry_categories (work_entry_id, category_id)
SELECT we.id, c.id 
FROM work_entries we, categories c 
WHERE we.id = 'work_entry_id' AND c.name = 'Development';

-- Associate with projects
INSERT INTO work_entry_projects (work_entry_id, project_id)
SELECT we.id, p.id 
FROM work_entries we, projects p 
WHERE we.id = 'work_entry_id' AND p.name = 'User Management';
```

### Querying Work Entries with Related Data
```sql
-- Get work entries with categories and projects
SELECT 
  we.*,
  array_agg(DISTINCT c.name) as categories,
  array_agg(DISTINCT p.name) as projects
FROM work_entries we
LEFT JOIN work_entry_categories wec ON we.id = wec.work_entry_id
LEFT JOIN categories c ON wec.category_id = c.id
LEFT JOIN work_entry_projects wep ON we.id = wep.work_entry_id
LEFT JOIN projects p ON wep.project_id = p.id
WHERE we.user_id = auth.uid()
GROUP BY we.id
ORDER BY we.work_date DESC;
```

## Migration Files

1. `20250826191552_old_hall.sql` - Initial work_entries table
2. `20250826192000_create_additional_tables.sql` - Additional tables and relationships
3. `20250826192500_create_storage_bucket.sql` - Storage bucket setup

## Future Enhancements

Potential additions to the schema:
- Team collaboration features
- Time tracking integrations
- Advanced reporting tables
- Notification preferences
- API rate limiting
- Audit logging
