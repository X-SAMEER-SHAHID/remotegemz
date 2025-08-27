import React, { useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Clock, Calendar, ExternalLink, Image, Trash2 } from 'lucide-react';
import { useWorkEntries } from '../hooks/useWorkEntries';

interface WorkEntryListProps {
  selectedDate?: string;
  refreshSignal?: number;
}

export function WorkEntryList({ selectedDate, refreshSignal }: WorkEntryListProps) {
  const { entries, deleteEntry, getEntriesForDate, getTotalHours, refetch } = useWorkEntries();

  // When the refresh signal changes, re-fetch from the server to stay in sync
  useEffect(() => {
    if (refreshSignal !== undefined) {
      refetch();
    }
  }, [refreshSignal]);
  
  const displayEntries = selectedDate 
    ? getEntriesForDate(selectedDate)
    : entries;

  const totalHours = selectedDate
    ? getEntriesForDate(selectedDate).reduce((sum, entry) => sum + entry.hours_spent, 0)
    : getTotalHours();

  const displayDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
  const formattedDate = format(parseISO(displayDate + 'T00:00:00'), 'M/d/yyyy');

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this work entry?')) {
      await deleteEntry(id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center space-x-2 min-w-0">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 truncate">Programming Work - {formattedDate}</h2>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Total Hours: <span className="font-semibold text-green-600">{totalHours.toFixed(1)}h</span></span>
        </div>
      </div>

      {displayEntries.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No programming work for this date.</p>
          <p className="text-gray-400 text-sm">Add your first work entry above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayEntries.map((entry) => (
            <div
              key={entry.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
                    <span>{entry.work_time}</span>
                    <span>•</span>
                    <span className="font-medium text-blue-600">{entry.hours_spent}h</span>
                  </div>
                  <p className="text-gray-900 font-medium mb-2 break-words">{entry.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    {entry.commit_link && (
                      <a
                        href={entry.commit_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm break-all"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>View Commit</span>
                      </a>
                    )}
                    
                    {entry.screenshot_url && (
                      <a
                        href={entry.screenshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm break-all"
                      >
                        <Image className="h-3 w-3" />
                        <span>Screenshot</span>
                      </a>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition-colors"
                  title="Delete entry"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}