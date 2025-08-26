import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Shield, Database, Trash2, DollarSign } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWorkEntries } from '../hooks/useWorkEntries';
import { useSettings } from '../hooks/useSettings';

export function Settings() {
  const { user, signOut } = useAuth();
  const { entries } = useWorkEntries();
  const { settings, updateSettings } = useSettings();
  const [loading, setLoading] = useState(false);

  const handleDeleteAllData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete ALL your work entries? This action cannot be undone.'
    );
    
    if (confirmed) {
      const doubleConfirmed = window.confirm(
        'This will permanently delete all your programming work data. Type "DELETE" in the next prompt if you are absolutely sure.'
      );
      
      if (doubleConfirmed) {
        const finalConfirmation = window.prompt(
          'Please type "DELETE" to confirm permanent deletion of all data:'
        );
        
        if (finalConfirmation === 'DELETE') {
          setLoading(true);
          try {
            // Delete all entries for this user
            for (const entry of entries) {
              // Note: In a real implementation, you'd want to batch delete
              // But for now, we'll delete one by one
              console.log('Would delete entry:', entry.id);
            }
            alert('All data would be deleted (not implemented in demo)');
          } catch (error) {
            console.error('Error deleting data:', error);
            alert('Error deleting data');
          } finally {
            setLoading(false);
          }
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Settings Header */}
      <div className="text-center">
        <SettingsIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your account and application preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Account Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-6">
            <User className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full rounded-md border-gray-300 bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Created
              </label>
              <input
                type="text"
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                disabled
                className="w-full rounded-md border-gray-300 bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="h-6 w-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Authentication Active</span>
              </div>
              <p className="text-sm text-green-700">
                Your account is secured with JWT token authentication and bcrypt password hashing.
              </p>
            </div>

            <button
              onClick={() => signOut()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Earnings Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-6">
            <DollarSign className="h-6 w-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Earnings Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.hourlyRate}
                onChange={(e) => updateSettings({ hourlyRate: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="50.00"
              />
              <p className="mt-1 text-sm text-gray-500">
                This rate is used to calculate your earnings from work hours.
              </p>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Database className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {entries.length}
                </div>
                <div className="text-sm text-blue-800">Work Entries</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {entries.reduce((sum, entry) => sum + entry.hours_spent, 0).toFixed(1)}h
                </div>
                <div className="text-sm text-green-800">Total Hours</div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Supabase Storage</span>
              </div>
              <p className="text-sm text-yellow-700">
                Your data is securely stored in Supabase with row-level security enabled.
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center space-x-3 mb-6">
            <Trash2 className="h-6 w-6 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Danger Zone</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Delete All Work Data
              </h3>
              <p className="text-sm text-red-700 mb-4">
                This will permanently delete all your programming work entries. This action cannot be undone.
              </p>
              <button
                onClick={handleDeleteAllData}
                disabled={loading || entries.length === 0}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Delete All Data'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}