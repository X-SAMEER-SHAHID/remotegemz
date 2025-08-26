import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { Loader2, Building2, Shield } from 'lucide-react';

export function AdminSignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('Starting signup process...');
      
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        
        // Provide specific error messages
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          setError('An account with this email already exists. Please try logging in instead.');
        } else if (authError.message.includes('password')) {
          setError('Password does not meet requirements. Please use a stronger password.');
        } else if (authError.message.includes('email')) {
          setError('Please enter a valid email address.');
        } else {
          setError(`Signup failed: ${authError.message}`);
        }
        setLoading(false);
        return;
      }

      console.log('Auth data:', authData);

      if (authData.user) {
        console.log('User created successfully:', authData.user.id);
        
        // Use the database function to create admin profile
        console.log('Attempting to create admin profile using function...');
        const { data: functionResult, error: functionError } = await supabase
          .rpc('create_admin_user', {
            p_user_id: authData.user.id,
            p_company_name: companyName
          });

        console.log('Function result:', { data: functionResult, error: functionError });

        if (functionError) {
          console.error('Admin creation function error:', functionError);
          throw new Error(`Admin creation failed: ${functionError.message}`);
        }

        if (!functionResult || !functionResult.success) {
          const errorMsg = functionResult?.error || 'Unknown error occurred';
          throw new Error(`Admin creation failed: ${errorMsg}`);
        }

        console.log('Admin profile created successfully:', functionResult);
        setSuccess(true);
        setTimeout(() => {
          navigate('/admin/login');
        }, 2000);
      } else {
        throw new Error('User creation failed - no user data returned');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Admin Account Created!</h3>
          <p className="text-gray-600 mb-4">
            Your admin account has been created successfully. You can now log in to manage your teams and tasks.
          </p>
          <button 
            onClick={() => navigate('/admin/login')} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow p-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <Building2 className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Signup</h2>
        <p className="text-gray-600 mt-2">
          Create your admin account to manage teams and tasks
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="company" className="block text-sm font-medium text-gray-700">
            Company Name
          </label>
          <input
            id="company"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter your company name"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

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
            placeholder="Create a password"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
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
              Creating Account...
            </>
          ) : (
            'Create Admin Account'
          )}
        </button>


      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an admin account?{' '}
          <button
            onClick={() => navigate('/admin/login')}
            className="text-blue-600 hover:underline font-medium"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}
