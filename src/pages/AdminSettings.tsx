import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Settings, 
  Building2, 
  User, 
  Mail, 
  Calendar,
  Shield,
  Save,
  CheckCircle
} from 'lucide-react';

interface AdminProfile {
  id: string;
  company_name: string;
  admin_level: string;
  is_active: boolean;
  created_at: string;
}

export function AdminSettings() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setCompanyName(data.company_name || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!profile) return;

    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ company_name: companyName })
        .eq('id', profile.id);

      if (error) throw error;

      setMessage('Profile updated successfully!');
      setProfile({ ...profile, company_name: companyName });
    } catch (error) {
      setMessage('Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600">Manage your admin account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <Settings className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
            </div>

            {message && (
              <div className={`mb-4 p-4 rounded-md flex items-center ${
                message.includes('Error') 
                  ? 'bg-red-50 border border-red-200 text-red-600' 
                  : 'bg-green-50 border border-green-200 text-green-600'
              }`}>
                {message.includes('Error') ? (
                  <div className="text-red-600">⚠️ {message}</div>
                ) : (
                  <div className="text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {message}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter your company name"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Level
                </label>
                <input
                  type="text"
                  value={profile?.admin_level || ''}
                  disabled
                  className="w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Admin level cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Status
                </label>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile?.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profile?.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <input
                  type="text"
                  value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ''}
                  disabled
                  className="w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={updateProfile}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <Shield className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            </div>

            <div className="space-y-3">
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Manage Teams</p>
                    <p className="text-sm text-gray-500">Add or remove team members</p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">View Reports</p>
                    <p className="text-sm text-gray-500">Check developer performance</p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">User Management</p>
                    <p className="text-sm text-gray-500">Manage user permissions</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <div className="flex items-center mb-4">
              <Mail className="h-5 w-5 text-gray-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile?.id ? 'admin@company.com' : 'Not available'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Admin ID</p>
                <p className="text-sm font-medium text-gray-900">{profile?.id || 'Not available'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Not available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
