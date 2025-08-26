import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BarChart3, 
  Download, 
  Calendar,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  Eye,
  Search
} from 'lucide-react';

interface DeveloperReport {
  user_id: string;
  full_name: string;
  email: string;
  team_name: string;
  role: string;
  hourly_rate: number;
  total_hours: number;
  total_earnings: number;
  tasks_completed: number;
  work_entries: number;
  last_activity: string;
}

interface WorkEntry {
  id: string;
  work_date: string;
  hours_spent: number;
  description: string;
  task_title?: string;
}

export function AdminReports() {
  const [developers, setDevelopers] = useState<DeveloperReport[]>([]);
  const [selectedDeveloper, setSelectedDeveloper] = useState<DeveloperReport | null>(null);
  const [developerWorkEntries, setDeveloperWorkEntries] = useState<WorkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [showWorkDetails, setShowWorkDetails] = useState(false);

  useEffect(() => {
    fetchDeveloperReports();
  }, [selectedMonth]);

  const fetchDeveloperReports = async () => {
    try {
      const startDate = new Date(selectedMonth + '-01');
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select(`
          id,
          role,
          hourly_rate,
          teams(name),
          user_profiles(full_name),
          auth_users(email)
        `)
        .eq('is_active', true);

      if (membersError) throw membersError;

      const developersWithWork = await Promise.all(
        membersData.map(async (member: any) => {
          const { data: workData } = await supabase
            .from('work_entries')
            .select('id, hours_spent, work_date, description')
            .eq('user_id', member.auth_users?.id)
            .gte('work_date', startDate.toISOString().split('T')[0])
            .lte('work_date', endDate.toISOString().split('T')[0]);

          const { data: tasksData } = await supabase
            .from('tasks')
            .select('id, title, status')
            .eq('assigned_to', member.auth_users?.id)
            .eq('status', 'completed');

          const totalHours = workData?.reduce((sum, work) => sum + (work.hours_spent || 0), 0) || 0;
          const totalEarnings = totalHours * (member.hourly_rate || 0);
          const tasksCompleted = tasksData?.length || 0;
          const workEntries = workData?.length || 0;
          const lastActivity = workData && workData.length > 0 
            ? workData[workData.length - 1].work_date 
            : 'No activity';

          return {
            user_id: member.auth_users?.id || '',
            full_name: member.user_profiles?.full_name || 'Unknown',
            email: member.auth_users?.email || 'Unknown',
            team_name: member.teams?.name || 'Unknown',
            role: member.role,
            hourly_rate: member.hourly_rate || 0,
            total_hours: totalHours,
            total_earnings: totalEarnings,
            tasks_completed: tasksCompleted,
            work_entries: workEntries,
            last_activity: lastActivity
          };
        })
      );
      setDevelopers(developersWithWork);
    } catch (error) {
      console.error('Error fetching developer reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeveloperWorkEntries = async (userId: string) => {
    try {
      const startDate = new Date(selectedMonth + '-01');
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('work_entries')
        .select(`
          id,
          work_date,
          hours_spent,
          description,
          task_work_entries(
            tasks(title)
          )
        `)
        .eq('user_id', userId)
        .gte('work_date', startDate.toISOString().split('T')[0])
        .lte('work_date', endDate.toISOString().split('T')[0])
        .order('work_date', { ascending: false });

      if (error) throw error;

      const workEntries = data?.map((entry: any) => ({
        id: entry.id,
        work_date: entry.work_date,
        hours_spent: entry.hours_spent,
        description: entry.description,
        task_title: entry.task_work_entries?.[0]?.tasks?.title || 'No task linked'
      })) || [];

      setDeveloperWorkEntries(workEntries);
    } catch (error) {
      console.error('Error fetching work entries:', error);
    }
  };

  const handleViewWorkDetails = (developer: DeveloperReport) => {
    setSelectedDeveloper(developer);
    fetchDeveloperWorkEntries(developer.user_id);
    setShowWorkDetails(true);
  };

  const exportToCSV = () => {
    const headers = [
      'Name',
      'Email',
      'Team',
      'Role',
      'Hourly Rate',
      'Total Hours',
      'Total Earnings',
      'Tasks Completed',
      'Work Entries',
      'Last Activity'
    ];

    const csvContent = [
      headers.join(','),
      ...developers.map(dev => [
        dev.full_name,
        dev.email,
        dev.team_name,
        dev.role,
        dev.hourly_rate,
        dev.total_hours,
        dev.total_earnings,
        dev.tasks_completed,
        dev.work_entries,
        dev.last_activity
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `developer-reports-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredDevelopers = developers.filter(developer =>
    developer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    developer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    developer.team_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalHours = developers.reduce((sum, dev) => sum + dev.total_hours, 0);
  const totalEarnings = developers.reduce((sum, dev) => sum + dev.total_earnings, 0);
  const totalTasks = developers.reduce((sum, dev) => sum + dev.tasks_completed, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Developer Reports</h1>
          <p className="text-gray-600">Monthly evaluation and performance tracking</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 items-center">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Search className="h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search developers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
              <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Developers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Developer Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Developer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Earnings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDevelopers.map((developer) => (
                <tr key={developer.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{developer.full_name}</div>
                      <div className="text-sm text-gray-500">{developer.email}</div>
                      <div className="text-xs text-gray-400">{developer.role}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {developer.team_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {developer.total_hours.toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${developer.total_earnings.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {developer.tasks_completed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {developer.last_activity === 'No activity' 
                      ? 'No activity' 
                      : new Date(developer.last_activity).toLocaleDateString()
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewWorkDetails(developer)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredDevelopers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p>No developers found.</p>
          <p className="text-sm">Try adjusting your search or month filter.</p>
        </div>
      )}

      {/* Work Details Modal */}
      {showWorkDetails && selectedDeveloper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Work Details - {selectedDeveloper.full_name}
              </h3>
              <button
                onClick={() => setShowWorkDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Hours</p>
                <p className="text-2xl font-bold text-blue-900">{selectedDeveloper.total_hours.toFixed(1)}h</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Earnings</p>
                <p className="text-2xl font-bold text-green-900">${selectedDeveloper.total_earnings.toFixed(2)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Tasks Completed</p>
                <p className="text-2xl font-bold text-purple-900">{selectedDeveloper.tasks_completed}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">Work Entries</p>
                <p className="text-2xl font-bold text-orange-900">{selectedDeveloper.work_entries}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-md font-semibold mb-4">Work Entries for {selectedMonth}</h4>
              <div className="space-y-3">
                {developerWorkEntries.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{entry.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(entry.work_date).toLocaleDateString()} • {entry.hours_spent}h
                        </p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {entry.task_title}
                      </span>
                    </div>
                  </div>
                ))}
                {developerWorkEntries.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No work entries found for this month.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
