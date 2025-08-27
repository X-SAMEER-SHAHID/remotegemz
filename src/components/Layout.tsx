import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Code2, 
  BarChart3, 
  Calendar, 
  Download, 
  Settings, 
  LogOut, 
  User 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Track Work', icon: Code2 },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/monthly', label: 'Monthly View', icon: Calendar },
    { path: '/export', label: 'Export', icon: Download },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center py-3 sm:py-0 sm:h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg shrink-0">
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Programming Work Tracker</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Track your daily programming tasks & features</p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              <div className="hidden md:flex items-center gap-2 text-gray-700 min-w-0">
                <User className="h-4 w-4 shrink-0" />
                <span className="text-xs sm:text-sm truncate max-w-[40vw] sm:max-w-xs">{user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="hidden md:flex items-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2 text-gray-700 hover:text-gray-900 transition-colors border rounded-md sm:border-0 sm:rounded-none"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex gap-4 overflow-x-auto no-scrollbar whitespace-nowrap">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 px-2 sm:px-3 py-3 sm:py-4 text-sm font-medium transition-colors border-b-2 ${
                      isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}