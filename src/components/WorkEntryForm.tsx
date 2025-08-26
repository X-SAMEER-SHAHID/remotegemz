import React, { useState, useEffect } from 'react';
import { Plus, Upload, Loader2, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { useWorkEntries } from '../hooks/useWorkEntries';
import { supabase } from '../lib/supabase';

interface WorkEntryFormProps {
  onDateChange?: (date: string) => void;
}

export function WorkEntryForm({ onDateChange }: WorkEntryFormProps) {
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
  const [tasks, setTasks] = useState<Array<{id: string, title: string, team_name: string}>>([]);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [isDeveloper, setIsDeveloper] = useState(false);
  
  const { addEntry, uploadScreenshot } = useWorkEntries();

  // Check if user is a developer and fetch their tasks
  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if user is a team member
        const { data: memberData } = await supabase
          .from('team_members')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (memberData) {
          setIsDeveloper(true);
          fetchUserTasks(user.id);
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchUserTasks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          teams(name)
        `)
        .eq('assigned_to', userId)
        .in('status', ['pending', 'in_progress']);

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

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
      const { data: workEntry, error: addError } = await addEntry({
        work_date: formData.work_date,
        work_time: formData.work_time,
        description: formData.description,
        hours_spent: parseFloat(formData.hours_spent),
        commit_link: formData.commit_link || null,
        screenshot_url: screenshotUrl,
      });

      // If user is a developer and selected a task, link the work entry to the task
      if (isDeveloper && selectedTask && workEntry) {
        await supabase
          .from('task_work_entries')
          .insert({
            task_id: selectedTask,
            work_entry_id: workEntry.id,
          });
      }

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

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Plus className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Add Programming Work</h2>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {isDeveloper && tasks.length > 0 && (
          <div>
            <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-1">
              <ClipboardList className="inline h-4 w-4 mr-1" />
              Related Task (Optional)
            </label>
            <select
              id="task"
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a task (optional)</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} - {task.teams?.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Link this work entry to a specific task for better tracking
            </p>
          </div>
        )}

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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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