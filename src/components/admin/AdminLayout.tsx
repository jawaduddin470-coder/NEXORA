import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NexoraLogo } from '../common/NexoraLogo';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  BarChart3,
  Bell,
  FileSpreadsheet,
  Server,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Overview', path: '/admin/overview', altPath: '/admin', icon: LayoutDashboard },
    { name: 'Events', path: '/admin/events', icon: Calendar },
    { name: 'Bookings', path: '/admin/bookings', icon: Ticket },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
    { name: 'Reports', path: '/admin/reports', icon: FileSpreadsheet },
  ];

  const isActive = (item: typeof navItems[0]) => {
    if (item.altPath && location.pathname === item.altPath) return true;
    return location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans relative">
      {/* Background Mission Control Grid */}
      <div className="fixed inset-0 bg-orbital-texture opacity-35 pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[550px] h-[550px] bg-brand-purple/10 blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-1/4 w-[450px] h-[450px] bg-brand-cyan/8 blur-[120px] pointer-events-none z-0" />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col justify-between w-64 border-r border-slate-800/80 bg-slate-900/70 backdrop-blur-xl p-5 sticky top-0 h-screen z-30 shrink-0">
        <div className="space-y-6">
          {/* Header Brand */}
          <div className="space-y-2 pb-4 border-b border-slate-800">
            <Link to="/" className="inline-block group" title="Return to Public Homepage">
              <NexoraLogo size="sm" showTagline={false} />
            </Link>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-violet-950/60 border border-violet-800/50 text-[10px] font-bold tracking-widest text-cyan-300 uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>COMMAND CENTER</span>
            </div>
          </div>

          {/* Primary Navigation Menu */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold font-heading transition-all ${
                    active
                      ? 'bg-gradient-to-r from-brand-purple to-brand-indigo text-white shadow-md shadow-violet-900/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {active && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom System & Profile Actions */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <Link
            to="/admin/system"
            className={`flex items-center space-x-3 px-3.5 py-2 rounded-2xl text-xs font-bold font-heading transition-all ${
              location.pathname === '/admin/system'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Server className="w-4 h-4 text-cyan-400" />
            <span>System Diagnostic</span>
          </Link>

          <Link
            to="/events"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          >
            <span className="flex items-center space-x-3">
              <ExternalLink className="w-4 h-4 text-slate-400" />
              <span>Attendee Catalog</span>
            </span>
          </Link>

          {/* Admin User Card */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="truncate pr-2">
              <span className="text-xs font-bold text-white block truncate">{userProfile?.name || 'Administrator'}</span>
              <span className="text-[10px] text-slate-400 block truncate">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition shrink-0"
              title="Sign Out of Command Center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        {/* Mobile Command Center Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
          <NexoraLogo size="sm" showTagline={false} />
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-800">
              ADMIN
            </span>
            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="p-2 rounded-xl bg-slate-800 text-slate-200"
            >
              {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileDrawerOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-2 animate-in slide-in-from-top-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileDrawerOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold font-heading ${
                  isActive(item) ? 'bg-brand-purple text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
            <Link
              to="/admin/system"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold font-heading text-slate-300 hover:bg-slate-800"
            >
              <Server className="w-4 h-4 text-cyan-400" />
              <span>System Diagnostic</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Body Content */}
        <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
