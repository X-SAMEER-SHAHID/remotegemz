import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  ClipboardList, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  estimated_hours: number;
  actual_hours: number;
  due_date: string;
  assigned_to: string;
  team_name: string;
  assigned_user_name: string;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    team_id: '',
    assigned_to: '',
    priority: 'medium',
    estimated_hours: 0,
    due_date: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchTeams();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          estimated_hours,
          actual_hours,
          due_date,
          assigned_to,
          created_at,
          teams(name),
          user_profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tasksWithDetails = data?.map((task: any) => ({
        ...task,
        team_name: task.teams?.name || 'Unknown',
        assigned_user_name: task.user_profiles?.full_name || 'Unassigned'
      })) || [];

      setTasks(tasksWithDetails);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          role,
          user_profiles(full_name),
          auth_users(email)
        `)
        .eq('team_id', teamId)
        .eq('is_active', true);

      if (error) throw error;

      const members = data?.map((member: any) => ({
        id: member.id,
        full_name: member.user_profiles?.full_name || 'Unknown',
        email: member.auth_users?.email || 'Unknown',
        role: member.role
      })) || [];

      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const createTask = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description,
          team_id: newTask.team_id,
          assigned_to: newTask.assigned_to || null,
          priority: newTask.priority,
          estimated_hours: newTask.estimated_hours,
          due_date: newTask.due_date || null,
        });

      if (error) throw error;

      setShowCreateTask(false);
      setNewTask({
        title: '',
        description: '',
        team_id: '',
        assigned_to: '',
        priority: 'medium',
        estimated_hours: 0,
        due_date: ''
      });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleTeamChange = (teamId: string) => {
    setNewTask({ ...newTask, team_id: teamId, assigned_to: '' });
    if (teamId) {
      fetchTeamMembers(teamId);
    } else {
      setTeamMembers([]);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Play className="h-4 w-4" />;
      case 'on_hold':
        return <Pause className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (selectedStatus === 'all') return true;
    return task.status === selectedStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Create and manage tasks for your teams</p>
        </div>
        <button 
          onClick={() => setShowCreateTask(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex space-x-2">
        <button
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            selectedStatus === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setSelectedStatus('all')}
        >
          All Tasks
        </button>
        <button
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            selectedStatus === 'pending' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setSelectedStatus('pending')}
        >
          Pending
        </button>
        <button
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            selectedStatus === 'in_progress' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setSelectedStatus('in_progress')}
        >
          In Progress
        </button>
        <button
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            selectedStatus === 'completed' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setSelectedStatus('completed')}
        >
          Completed
        </button>
        <button
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            selectedStatus === 'on_hold' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setSelectedStatus('on_hold')}
        >
          On Hold
        </button>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <div key={task.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                <p className="text-sm text-gray-600">{task.team_name} • {task.assigned_user_name}</p>
              </div>
              <div className="flex items-center space-x-1">
                {getStatusIcon(task.status)}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {task.description}
            </p>
            
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Estimated:</span>
                <span>{task.estimated_hours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Actual:</span>
                <span>{task.actual_hours}h</span>
              </div>
              {task.due_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Due:</span>
                  <span>{new Date(task.due_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              {task.status === 'pending' && (
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded transition-colors"
                  onClick={() => updateTaskStatus(task.id, 'in_progress')}
                >
                  Start
                </button>
              )}
              {task.status === 'in_progress' && (
                <>
                  <button
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium py-1 px-3 rounded transition-colors"
                    onClick={() => updateTaskStatus(task.id, 'on_hold')}
                  >
                    Pause
                  </button>
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1 px-3 rounded transition-colors"
                    onClick={() => updateTaskStatus(task.id, 'completed')}
                  >
                    Complete
                  </button>
                </>
              )}
              {task.status === 'on_hold' && (
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded transition-colors"
                  onClick={() => updateTaskStatus(task.id, 'in_progress')}
                >
                  Resume
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <ClipboardList className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p>No tasks found.</p>
          <p className="text-sm">Create your first task to get started.</p>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Task</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Enter task description"
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team
                </label>
                <select
                  value={newTask.team_id}
                  onChange={(e) => handleTeamChange(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>
                <select
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={!newTask.team_id}
                >
                  <option value="">Select team member</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  value={newTask.estimated_hours}
                  onChange={(e) => setNewTask({ ...newTask, estimated_hours: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateTask(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createTask}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
