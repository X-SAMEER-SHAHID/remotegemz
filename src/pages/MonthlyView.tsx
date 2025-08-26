import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useWorkEntries } from '../hooks/useWorkEntries';

export function MonthlyView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { entries, getEntriesForDate } = useWorkEntries();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getDayStats = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayEntries = getEntriesForDate(dateString);
    const hours = dayEntries.reduce((sum, entry) => sum + entry.hours_spent, 0);
    return { entries: dayEntries.length, hours };
  };

  // Generate calendar grid (6 weeks × 7 days)
  const calendarDays = [];
  const firstDayOfMonth = monthStart.getDay();
  
  // Add days from previous month to fill the first week
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (i + 1));
    calendarDays.push(date);
  }
  
  // Add all days of current month
  days.forEach(day => calendarDays.push(day));
  
  // Add days from next month to fill remaining cells
  const remainingCells = 42 - calendarDays.length; // 6 weeks × 7 days
  for (let i = 1; i <= remainingCells; i++) {
    const date = new Date(monthEnd);
    date.setDate(date.getDate() + i);
    calendarDays.push(date);
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 border-b">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-4 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const stats = getDayStats(date);
          
          return (
            <div
              key={index}
              className={`min-h-[120px] p-2 border-b border-r hover:bg-gray-50 transition-colors ${
                !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
              } ${isToday ? 'bg-blue-50' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-sm font-medium ${
                    isToday ? 'bg-blue-600 text-white px-2 py-1 rounded-full' : ''
                  }`}
                >
                  {format(date, 'd')}
                </span>
                {isCurrentMonth && (
                  <button className="text-gray-400 hover:text-blue-600 transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {stats.entries > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-blue-600">
                    {stats.hours.toFixed(1)}h
                  </div>
                  <div className="text-xs text-gray-500">
                    {stats.entries} task{stats.entries !== 1 ? 's' : ''}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-blue-600 h-1 rounded-full"
                      style={{
                        width: `${Math.min((stats.hours / 8) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}