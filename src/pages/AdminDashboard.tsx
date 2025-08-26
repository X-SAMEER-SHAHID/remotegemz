import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  ClipboardList, 
  Clock, 
  TrendingUp,
  Plus,
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react';

interface Team {
  team_id: string;
  team_name: string;
  team_description: string;
  member_count: number;
  active_tasks_count: number;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigned_to: string;
  due_date: string;
  team_name: string;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  team_name: string;
  hourly_rate: number;
}

export function AdminDashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalMembers: 0,
    totalTasks: 0,
    completedTasks: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch teams
      const { data: teamsData } = await supabase.rpc('get_admin_teams');
      setTeams(teamsData || []);

      // Fetch recent tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          priority,
          assigned_to,
          due_date,
          teams(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (tasksData) {
        setRecentTasks(tasksData.map((task: any) => ({
          ...task,
          team_name: task.teams?.name || 'Unknown'
        })));
      }

      // Fetch team members
      const { data: membersData } = await supabase
        .from('team_members')
        .select(`
          id,
          role,
          hourly_rate,
          teams(name),
          user_profiles(full_name),
          auth_users(email)
        `)
        .eq('is_active', true)
        .limit(10);

      if (membersData) {
        setTeamMembers(membersData.map((member: any) => ({
          id: member.id,
          full_name: member.user_profiles?.full_name || 'Unknown',
          email: member.auth_users?.email || 'Unknown',
          role: member.role,
          team_name: member.teams?.name || 'Unknown',
          hourly_rate: member.hourly_rate
        })));
      }

      // Calculate stats
      const totalTeams = teamsData?.length || 0;
      const totalMembers = membersData?.length || 0;
      const totalTasks = tasksData?.length || 0;
      const completedTasks = tasksData?.filter(task => task.status === 'completed').length || 0;

      setStats({
        totalTeams,
        totalMembers,
        totalTasks,
        completedTasks,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'on_hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your teams and track progress</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Add Team
          </button>
          <button className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md border border-gray-300 transition-colors flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-900">Total Teams</h3>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold text-gray-900">{stats.totalTeams}</div>
            <p className="text-xs text-gray-500">
              Active teams in your organization
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-900">Team Members</h3>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold text-gray-900">{stats.totalMembers}</div>
            <p className="text-xs text-gray-500">
              Active developers and leads
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-900">Total Tasks</h3>
            <ClipboardList className="h-4 w-4 text-gray-400" />
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold text-gray-900">{stats.totalTasks}</div>
            <p className="text-xs text-gray-500">
              Tasks across all teams
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-900">Completed Tasks</h3>
            <CheckCircle className="h-4 w-4 text-gray-400" />
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold text-gray-900">{stats.completedTasks}</div>
            <p className="text-xs text-gray-500">
              Successfully completed
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
            <p className="text-sm text-gray-600">Latest tasks across all teams</p>
          </div>
          <div className="space-y-4">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{task.title}</h4>
                  <p className="text-xs text-gray-500">{task.team_name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
            <p className="text-sm text-gray-600">Active developers and their roles</p>
          </div>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{member.full_name}</h4>
                  <p className="text-xs text-gray-500">{member.email}</p>
                  <p className="text-xs text-gray-500">{member.team_name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs rounded-full border border-gray-300 text-gray-700">
                    {member.role}
                  </span>
                  <span className="text-xs text-gray-500">
                    ${member.hourly_rate}/hr
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Teams Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Teams Overview</h3>
          <p className="text-sm text-gray-600">All teams and their current status</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div key={team.team_id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{team.team_name}</h3>
                <span className="px-2 py-1 text-xs rounded-full border border-gray-300 text-gray-700">
                  {team.member_count} members
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{team.team_description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {team.active_tasks_count} active tasks
                </span>
                <button className="text-gray-600 hover:text-gray-900 px-2 py-1 rounded text-sm">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
