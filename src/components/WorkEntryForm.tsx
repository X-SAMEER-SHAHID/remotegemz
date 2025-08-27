import React, { useState } from 'react';
import { Plus, Upload, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useWorkEntries } from '../hooks/useWorkEntries';

interface WorkEntryFormProps {
  onDateChange?: (date: string) => void;
  onAdded?: () => void;
}

export function WorkEntryForm({ onDateChange, onAdded }: WorkEntryFormProps) {
  const [formData, setFormData] = useState({
    work_date: format(new Date(), 'yyyy-MM-dd'),
    work_time: format(new Date(), 'HH:mm'),
    description: '',
    hours_spent: '',
    commit_link: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { addEntry, uploadScreenshot } = useWorkEntries();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Notify parent component when date changes
    if (name === 'work_date' && onDateChange) {
      onDateChange(value);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let screenshotUrl = null;

      // Upload screenshot if selected
      if (selectedFile) {
        const { data, error: uploadError } = await uploadScreenshot(selectedFile);
        if (uploadError) {
          throw new Error(uploadError.message);
        }
        screenshotUrl = data?.publicUrl || null;
      }

      // Add work entry
      const { error: addError } = await addEntry({
        work_date: formData.work_date,
        work_time: formData.work_time,
        description: formData.description,
        hours_spent: parseFloat(formData.hours_spent),
        commit_link: formData.commit_link || null,
        screenshot_url: screenshotUrl,
      });

      if (addError) {
        throw new Error(addError.message);
      }

      // Reset form
      const newDate = format(new Date(), 'yyyy-MM-dd');
      setFormData({
        work_date: newDate,
        work_time: format(new Date(), 'HH:mm'),
        description: '',
        hours_spent: '',
        commit_link: '',
      });
      
      // Update the selected date in parent component
      if (onDateChange) {
        onDateChange(newDate);
      }
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('screenshot') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Notify parent to refresh lists
      if (onAdded) onAdded();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <Plus className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Add Programming Work</h2>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="work_date" className="block text-sm font-medium text-gray-700 mb-1">
              Work Date *
            </label>
            <input
              type="date"
              id="work_date"
              name="work_date"
              required
              value={formData.work_date}
              onChange={handleInputChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

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
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Feature/Task Description *
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
            placeholder="e.g., User authentication system, Dashboard UI..."
            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-y"
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
            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 break-all"
          />
        </div>

        <div>
          <label htmlFor="screenshot" className="block text-sm font-medium text-gray-700 mb-1">
            <Upload className="inline h-4 w-4 mr-1" />
            Feature Screenshot
          </label>
          <input
            type="file"
            id="screenshot"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="mt-1 text-sm text-gray-500">
            Images are stored as files with date/time metadata
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Adding Work Entry...</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Add Work Entry</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}