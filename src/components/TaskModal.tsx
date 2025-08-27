import React from 'react';
import { format, parseISO } from 'date-fns';
import { X, Clock, Calendar, ExternalLink, Image, Trash2 } from 'lucide-react';
import { useWorkEntries } from '../hooks/useWorkEntries';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
}

export function TaskModal({ isOpen, onClose, selectedDate }: TaskModalProps) {
  const { entries, deleteEntry, getEntriesForDate } = useWorkEntries();
  
  const dayEntries = getEntriesForDate(selectedDate);
  const totalHours = dayEntries.reduce((sum, entry) => sum + entry.hours_spent, 0);
  const formattedDate = format(parseISO(selectedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy');

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this work entry?')) {
      await deleteEntry(id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {formattedDate}
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Total Hours: <span className="font-semibold text-green-600">{totalHours.toFixed(1)}h</span></span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {dayEntries.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No programming work for this date.</p>
              <p className="text-gray-400 text-sm">Add your first work entry to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <span>{entry.work_time}</span>
                        <span>•</span>
                        <span className="font-medium text-blue-600">{entry.hours_spent}h</span>
                      </div>
                      <p className="text-gray-900 font-medium mb-2">{entry.description}</p>
                      
                      <div className="flex items-center space-x-4">
                        {entry.commit_link && (
                          <a
                            href={entry.commit_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
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
                            className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm"
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
      </div>
    </div>
  );
}
