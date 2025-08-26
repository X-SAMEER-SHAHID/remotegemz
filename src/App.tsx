import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { AuthLayout } from './components/AuthLayout';
import { AdminLayout } from './components/AdminLayout';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { AdminLoginForm } from './components/AdminLoginForm';
import { AdminSignupForm } from './components/AdminSignupForm';
import { TrackWork } from './pages/TrackWork';
import { Dashboard } from './pages/Dashboard';
import { MonthlyView } from './pages/MonthlyView';
import { MonthlyEarnings } from './components/MonthlyEarnings';
import { Export } from './pages/Export';
import { Settings } from './pages/Settings';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminTeams } from './pages/AdminTeams';
import { AdminTasks } from './pages/AdminTasks';
import { AdminReports } from './pages/AdminReports';
import { AdminSettings } from './pages/AdminSettings';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="App">
        {user ? (
          <AuthenticatedRoutes />
        ) : (
          <AuthLayout>
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/admin/login" element={<AdminLoginForm />} />
              <Route path="/admin/signup" element={<AdminSignupForm />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AuthLayout>
        )}
      </div>
    </BrowserRouter>
  );
}

function AuthenticatedRoutes() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      setIsAdmin(!!data);
    } catch (error) {
      console.log('Admin check error:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    );
  } else {
    return (
      <Routes>
        <Route path="/*" element={<UserRoutes />} />
      </Routes>
    );
  }
}

function AdminRoutes() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/teams" element={<AdminTeams />} />
        <Route path="/tasks" element={<AdminTasks />} />
        <Route path="/reports" element={<AdminReports />} />
        <Route path="/settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
}

function UserRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<TrackWork />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/monthly" element={<MonthlyView />} />
        <Route path="/monthly-earnings" element={<MonthlyEarnings />} />
        <Route path="/export" element={<Export />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;