import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  ShieldCheck,
  UserCheck,
  Users,
  Mail,
  Lock,
  Eye,
  EyeOff,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Clock,
  User,
  Search,
  KeyRound,
} from 'lucide-react';

interface AdminAccount {
  userId: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  createdAt: string;
  lastSignInTime?: string | null;
  disabled?: boolean;
}

export const AdminManagement: React.FC = () => {
  const { user, getIdToken } = useAuth();
  const { addToast } = useToast();

  // Admin list state
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const res = await fetch(`${apiBase}/admin/admins`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to fetch administrators (Status: ${res.status})`);
      }

      const data = await res.json();
      setAdmins(data.admins || []);
    } catch (err: any) {
      console.error('Error fetching admin accounts:', err);
      setError(err.message || 'Failed to load administrator accounts.');
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Form validation
    if (!name.trim()) {
      setFormError('Full Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('A valid Email address is required.');
      return;
    }
    if (!password) {
      setFormError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter your password.');
      return;
    }

    try {
      setFormSubmitting(true);
      const token = await getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const res = await fetch(`${apiBase}/admin/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create administrator account.');
      }

      setFormSuccess(`Admin account for "${name.trim()}" (${email.trim()}) created successfully!`);
      addToast(
        'Administrator Created',
        `Admin account for "${name.trim()}" has been provisioned.`,
        'success'
      );

      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Refresh admin list to show newly created admin
      await fetchAdmins();
    } catch (err: any) {
      console.error('Error creating admin:', err);
      setFormError(err.message || 'An error occurred while creating the admin account.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredAdmins = useMemo(() => {
    if (!searchTerm.trim()) return admins;
    const query = searchTerm.toLowerCase().trim();
    return admins.filter(
      (a) =>
        a.name?.toLowerCase().includes(query) ||
        a.email?.toLowerCase().includes(query) ||
        a.userId?.toLowerCase().includes(query)
    );
  }, [admins, searchTerm]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              <span>Access Control & Team Authority</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight mt-1">
              Admin Account Management
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Provision and manage platform administrators with full cryptographic authority across NEXORA.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAdmins}
              disabled={loading}
              className="border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-brand-purple' : ''}`} />
              Refresh
            </Button>

            <div className="px-3.5 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Active Admins: <strong className="text-white">{admins.length}</strong></span>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Form + List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Create Admin Form (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-7 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-6">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-brand-purple text-xs font-bold uppercase tracking-wider">
                <PlusCircle className="w-4 h-4 text-cyan-400" />
                <span>Create Administrator</span>
              </div>
              <h2 className="text-lg font-bold text-white font-heading">
                Provision New Admin Credentials
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Creates a new Firebase Authentication user and sets immutable administrator privileges in Cloud Firestore.
              </p>
            </div>

            {formError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-3">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mohammed Meraj Uddin"
                  disabled={formSubmitting}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-brand-purple"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Email Address *</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. meraj.admin@nexora.com"
                  disabled={formSubmitting}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-brand-purple"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Password *</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    disabled={formSubmitting}
                    className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-brand-purple"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Confirm Password *</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    disabled={formSubmitting}
                    className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-brand-purple"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                🛡️ <strong>Security Assurance:</strong> Administrator accounts are provisioned server-side via the Firebase Admin SDK. Your current session will not be interrupted.
              </div>

              <Button
                type="submit"
                loading={formSubmitting}
                disabled={formSubmitting}
                variant="primary"
                size="lg"
                className="w-full font-bold bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-95 text-white py-3 rounded-2xl shadow-lg shadow-violet-950/50"
              >
                {formSubmitting ? 'Provisioning Administrator...' : 'Create Administrator Account'}
              </Button>
            </form>
          </div>

          {/* Right Column: Existing Admins List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search administrators by name or email..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={fetchAdmins} className="text-xs">
                  Retry
                </Button>
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800" />
                      <div className="space-y-1.5">
                        <div className="w-32 h-4 bg-slate-800 rounded-md" />
                        <div className="w-44 h-3 bg-slate-800/60 rounded-md" />
                      </div>
                    </div>
                    <div className="w-20 h-6 bg-slate-800 rounded-full" />
                  </div>
                ))}
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-3">
                <UserCheck className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">No administrators found</h3>
                <p className="text-xs text-slate-400">
                  {searchTerm ? 'No administrator accounts match your search filter.' : 'No administrators registered yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAdmins.map((admin) => {
                  const isCurrent = user?.uid === admin.userId || user?.email === admin.email;
                  const createdStr = admin.createdAt
                    ? new Date(admin.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Registered';

                  return (
                    <div
                      key={admin.userId}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isCurrent
                          ? 'bg-slate-900/90 border-brand-purple/50 shadow-lg shadow-violet-950/20'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="relative">
                          <img
                            src={
                              admin.profileImage ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(admin.name || admin.userId)}`
                            }
                            alt={admin.name}
                            className="w-11 h-11 rounded-2xl bg-slate-950 border border-slate-800 object-cover shrink-0"
                          />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 absolute -bottom-0.5 -right-0.5" />
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="text-xs font-bold text-white font-heading">
                              {admin.name}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase font-mono tracking-wider border border-cyan-500/30">
                                You (Active Session)
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block font-mono">
                            {admin.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5 sm:self-center">
                        <Badge variant="violet" size="sm">
                          Administrator
                        </Badge>
                        <Badge variant="emerald" size="sm">
                          Active
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline-block">
                          {createdStr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminManagement;
