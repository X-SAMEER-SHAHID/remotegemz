import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { AuthLayout } from './components/AuthLayout';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { TrackWork } from './pages/TrackWork';
import { Dashboard } from './pages/Dashboard';
import { MonthlyView } from './pages/MonthlyView';
import { MonthlyEarnings } from './components/MonthlyEarnings';
import { Export } from './pages/Export';
import { Settings } from './pages/Settings';
import { Loader2 } from 'lucide-react';

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
        ) : (
          <AuthLayout>
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AuthLayout>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;