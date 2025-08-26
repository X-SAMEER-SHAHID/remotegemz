import React, { useState } from 'react';
import { Download, FileText, Calendar, Loader2 } from 'lucide-react';
import { useWorkEntries } from '../hooks/useWorkEntries';
import { format, parseISO } from 'date-fns';

export function Export() {
  const { entries, getTotalHours, getTotalTasks, getWorkDays } = useWorkEntries();
  const [loading, setLoading] = useState(false);

  const exportToCSV = () => {
    setLoading(true);
    
    try {
      const csvContent = [
        ['Date', 'Time', 'Description', 'Hours', 'Commit Link', 'Screenshot URL'].join(','),
        ...entries.map(entry => [
          entry.work_date,
          entry.work_time,
          `"${entry.description.replace(/"/g, '""')}"`,
          entry.hours_spent,
          entry.commit_link || '',
          entry.screenshot_url || ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `programming-work-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToJSON = () => {
    setLoading(true);
    
    try {
      const data = {
        exported_at: new Date().toISOString(),
        summary: {
          total_hours: getTotalHours(),
          total_tasks: getTotalTasks(),
          work_days: getWorkDays(),
        },
        entries: entries
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `programming-work-${format(new Date(), 'yyyy-MM-dd')}.json`;
      link.click();
    } catch (error) {
      console.error('Error exporting JSON:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Export Header */}
      <div className="text-center">
        <Download className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Export Your Work Data</h1>
        <p className="text-gray-600">
          Download your programming work entries in various formats
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {getTotalHours().toFixed(1)}h
          </div>
          <div className="text-gray-600">Total Hours</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {getTotalTasks()}
          </div>
          <div className="text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {getWorkDays()}
          </div>
          <div className="text-gray-600">Work Days</div>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">CSV Export</h3>
              <p className="text-sm text-gray-600">
                Perfect for spreadsheet analysis
              </p>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Export all your work entries as a CSV file that can be opened in Excel, Google Sheets, or any spreadsheet application.
          </p>
          <button
            onClick={exportToCSV}
            disabled={loading || entries.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Download CSV</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">JSON Export</h3>
              <p className="text-sm text-gray-600">
                Complete data with metadata
              </p>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Export all your work entries as a structured JSON file including summary statistics and complete entry details.
          </p>
          <button
            onClick={exportToJSON}
            disabled={loading || entries.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            No work entries found. Start tracking your programming work to enable exports.
          </p>
        </div>
      )}

      {/* Recent Entries Preview */}
      {entries.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Entries Preview</h3>
          <div className="space-y-3">
            {entries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium text-gray-900">{entry.description}</div>
                  <div className="text-sm text-gray-500">
                    {format(parseISO(entry.work_date + 'T00:00:00'), 'MMM dd, yyyy')} - {entry.work_time}
                  </div>
                </div>
                <div className="text-sm font-semibold text-blue-600">
                  {entry.hours_spent}h
                </div>
              </div>
            ))}
          </div>
          {entries.length > 5 && (
            <p className="text-sm text-gray-500 mt-3">
              And {entries.length - 5} more entries...
            </p>
          )}
        </div>
      )}
    </div>
  );
}