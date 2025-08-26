import React from 'react';
import { Clock, Target, Calendar, TrendingUp, BarChart3, DollarSign, ArrowRight } from 'lucide-react';
import { useWorkEntries } from '../hooks/useWorkEntries';
import { useSettings } from '../hooks/useSettings';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { entries } = useWorkEntries();
  const { settings } = useSettings();
  const navigate = useNavigate();

  // Get current month entries only
  const getCurrentMonthEntries = () => {
    const now = new Date();
    const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(now), 'yyyy-MM-dd');
    
    return entries.filter(entry => {
      const entryDate = entry.work_date;
      return entryDate >= startDate && entryDate <= endDate;
    });
  };

  const currentMonthEntries = getCurrentMonthEntries();
  
  // Calculate current month stats
  const totalHours = currentMonthEntries.reduce((sum, entry) => sum + entry.hours_spent, 0);
  const totalTasks = currentMonthEntries.length;
  const workDays = new Set(currentMonthEntries.map(entry => entry.work_date)).size;
  const avgHoursPerDay = workDays > 0 ? totalHours / workDays : 0;
  
  // Calculate earnings using configurable hourly rate
  const totalEarnings = totalHours * settings.hourlyRate;

  // Get unique work dates for the current month
  const uniqueDates = Array.from(new Set(currentMonthEntries.map(entry => entry.work_date)))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, 10); // Show last 10 work days

  const stats = [
    {
      label: 'Total Hours',
      value: `${totalHours.toFixed(1)}h`,
      icon: Clock,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      label: 'Total Tasks',
      value: totalTasks,
      icon: Target,
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
    {
      label: 'Work Days',
      value: workDays,
      icon: Calendar,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
    },
    {
      label: 'Avg Hours/Day',
      value: `${avgHoursPerDay.toFixed(1)}h`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.textColor} mt-1`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Earnings Button */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Total Earnings</h2>
            <p className="text-3xl font-bold text-green-600">{totalEarnings.toFixed(0)}</p>
            <p className="text-sm text-gray-600 mt-1">Current month earnings</p>
          </div>
          <button
            onClick={() => navigate('/monthly-earnings')}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            <DollarSign className="h-4 w-4" />
            <span>View All Months</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Work Days Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-6">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            This Month's Work Days ({workDays} days)
          </h2>
        </div>

        {uniqueDates.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No work days recorded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueDates.map((date) => {
              const dayEntries = entries.filter(entry => entry.work_date === date);
              const dayHours = dayEntries.reduce((sum, entry) => sum + entry.hours_spent, 0);
              const dayTasks = dayEntries.length;
              
              return (
                <div key={date} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">
                      {format(parseISO(date + 'T00:00:00'), 'MMM dd, yyyy')}
                    </h3>
                    <span className="text-sm font-semibold text-blue-600">
                      {dayHours.toFixed(1)}h
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {dayTasks} task{dayTasks !== 1 ? 's' : ''} completed
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((dayHours / Math.max(avgHoursPerDay * 2, 1)) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}