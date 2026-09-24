import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, KeyRound, Terminal } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { NexoraLogo } from '../components/common/NexoraLogo';

export const AdminLoginPage: React.FC = () => {
  const { user, userProfile, isAuthenticated, loading: authLoading, login, logout, clearError } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated as admin, navigate directly
  React.useEffect(() => {
    if (!authLoading && isAuthenticated && user && userProfile?.role === 'admin') {
      navigate('/admin/overview', { replace: true });
    }
  }, [authLoading, isAuthenticated, user, userProfile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both administrator email and access key.');
      return;
    }

    try {
      setLoading(true);
      const profile = await login(email.trim(), password);

      if (!profile || profile.role !== 'admin') {
        await logout();
        setErrorMessage('Access Denied: The authenticated credentials do not hold administrator authorization.');
        addToast('Unauthorized', 'Admin privileges required to access this portal.', 'error');
        return;
      }

      addToast('Authorized', 'Welcome to the NEXORA Admin Command Center.', 'success');
      navigate('/admin/overview', { replace: true });
    } catch (err: any) {
      console.error('Admin login error:', err);
      setErrorMessage(err.message || 'Failed to authenticate administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-panel rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-soft-lg space-y-6 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-purple/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-cyan/10 blur-3xl rounded-full pointer-events-none" />

        {/* Header Lockup */}
        <div className="text-center space-y-3 relative z-10">
          <div className="inline-flex justify-center mb-1">
            <NexoraLogo size="lg" showText={false} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-bold tracking-widest uppercase">
            <Terminal className="w-3 h-3 text-cyan-400 dark:text-cyan-600" />
            <span>Admin Command Center</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white">
            Executive Authorization
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Internal administrative gateway. All access sessions are cryptographically logged.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError();
                  setErrorMessage(null);
                }}
                placeholder="admin@nexora.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-purple transition-colors font-medium shadow-soft-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Access Secret
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                  setErrorMessage(null);
                }}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-purple transition-colors font-medium shadow-soft-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            variant="primary"
            size="lg"
            className="w-full mt-2"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Authenticate Administrator
          </Button>
        </form>

        {/* Security Notice */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Protected by Firebase Role-Based Security Rules</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
