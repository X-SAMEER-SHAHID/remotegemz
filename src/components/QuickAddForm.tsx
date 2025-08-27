import React, { useState } from 'react';
import { Plus, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { useWorkEntries } from '../hooks/useWorkEntries';

interface QuickAddFormProps {
  selectedDate: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuickAddForm({ selectedDate, onClose, onSuccess }: QuickAddFormProps) {
  const [formData, setFormData] = useState({
    work_time: format(new Date(), 'HH:mm'),
    description: '',
    hours_spent: '',
    commit_link: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { addEntry } = useWorkEntries();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: addError } = await addEntry({
        work_date: selectedDate,
        work_time: formData.work_time,
        description: formData.description,
        hours_spent: parseFloat(formData.hours_spent),
        commit_link: formData.commit_link || null,
        screenshot_url: null,
      });

      if (addError) {
        throw new Error(addError.message);
      }

      // Reset form
      setFormData({
        work_time: format(new Date(), 'HH:mm'),
        description: '',
        hours_spent: '',
        commit_link: '',
      });
      
      onSuccess();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Quick Add Task
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="work_time" className="block text-sm font-medium text-gray-700 mb-1">
                Work Time *
              </label>
              <input
                type="time"
                id="work_time"
                name="work_time"
                required
                value={formData.work_time}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Task Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g., User authentication system, Dashboard UI..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="hours_spent" className="block text-sm font-medium text-gray-700 mb-1">
                Time Spent (hours) *
              </label>
              <input
                type="number"
                id="hours_spent"
                name="hours_spent"
                required
                step="0.25"
                min="0.25"
                value={formData.hours_spent}
                onChange={handleInputChange}
                placeholder="e.g., 2.5"
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="commit_link" className="block text-sm font-medium text-gray-700 mb-1">
                Commit Link (Optional)
              </label>
              <input
                type="url"
                id="commit_link"
                name="commit_link"
                value={formData.commit_link}
                onChange={handleInputChange}
                placeholder="https://github.com/user/repo/commit/..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Add Task</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
