import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { Loader2, Building2, Shield } from 'lucide-react';

export function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Check if user is an admin
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', data.user.id)
          .eq('is_active', true)
          .single();

        if (adminError || !adminData) {
          await supabase.auth.signOut();
          throw new Error('Access denied. This account is not authorized as an admin.');
        }

        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow p-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <Shield className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Login</h2>
        <p className="text-gray-600 mt-2">
          Sign in to your admin account to manage teams and tasks
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            'Sign In as Admin'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Need an admin account?{' '}
          <button
            onClick={() => navigate('/admin/signup')}
            className="text-blue-600 hover:underline font-medium"
          >
            Create one here
          </button>
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Regular user?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:underline font-medium"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}
