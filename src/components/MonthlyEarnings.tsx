import React, { useState } from 'react';
import { DollarSign, Calendar, TrendingUp, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWorkEntries } from '../hooks/useWorkEntries';
import { useSettings } from '../hooks/useSettings';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';

export function MonthlyEarnings() {
  const { entries } = useWorkEntries();
  const { settings } = useSettings();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Get entries for a specific month
  const getEntriesForMonth = (date: Date) => {
    const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
    
    return entries.filter(entry => {
      const entryDate = entry.work_date;
      return entryDate >= startDate && entryDate <= endDate;
    });
  };

  // Calculate monthly stats
  const getMonthlyStats = (date: Date) => {
    const monthEntries = getEntriesForMonth(date);
    const totalHours = monthEntries.reduce((sum, entry) => sum + entry.hours_spent, 0);
    const totalTasks = monthEntries.length;
    const workDays = new Set(monthEntries.map(entry => entry.work_date)).size;
    const avgHoursPerDay = workDays > 0 ? totalHours / workDays : 0;
    
    // Calculate earnings using configurable hourly rate
    const totalEarnings = totalHours * settings.hourlyRate;
    
    return {
      totalHours,
      totalTasks,
      workDays,
      avgHoursPerDay,
      totalEarnings
    };
  };

  // Get all months with data
  const getAllMonths = () => {
    const months = new Set<string>();
    entries.forEach(entry => {
      const monthKey = format(parseISO(entry.work_date + 'T00:00:00'), 'yyyy-MM');
      months.add(monthKey);
    });
    
    return Array.from(months)
      .map(month => parseISO(month + '-01'))
      .sort((a, b) => b.getTime() - a.getTime());
  };

  const currentMonthStats = getMonthlyStats(selectedMonth);
  const allMonths = getAllMonths();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {format(selectedMonth, 'MMMM yyyy')}
          </h1>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Current Month Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {currentMonthStats.totalHours.toFixed(1)}h
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {currentMonthStats.totalTasks}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Work Days</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {currentMonthStats.workDays}
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Hours/Day</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {currentMonthStats.avgHoursPerDay.toFixed(1)}h
              </p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

                    <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {currentMonthStats.totalEarnings.toFixed(0)}
                  </p>
                </div>
                <div className="bg-green-500 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
      </div>

      {/* Monthly History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Monthly History</h2>
        
        {allMonths.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No monthly data available.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allMonths.map((month) => {
              const stats = getMonthlyStats(month);
              const isSelected = format(month, 'yyyy-MM') === format(selectedMonth, 'yyyy-MM');
              
              return (
                <div
                  key={format(month, 'yyyy-MM')}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedMonth(month)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {format(month, 'MMMM yyyy')}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {stats.workDays} work days • {stats.totalTasks} tasks
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">
                        {stats.totalEarnings.toFixed(0)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {stats.totalHours.toFixed(1)}h
                      </p>
                    </div>
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
