import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { NexoraLogo } from '../components/common/NexoraLogo';
import { GoogleIcon } from '../components/ui/GoogleIcon';

export const RegisterPage: React.FC = () => {
  const { user, userProfile, isAuthenticated, loading: authLoading, register, loginWithGoogle, error, clearError } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Redirect destination priority: ?returnTo -> ?redirect -> router state -> /dashboard
  const returnToParam = searchParams.get('returnTo') || searchParams.get('redirect');
  const fromState = location.state?.from;
  const statePath = typeof fromState === 'string' ? fromState : fromState?.pathname ? `${fromState.pathname}${fromState.search || ''}` : null;
  const destination = returnToParam || statePath || '/dashboard';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // If already authenticated, redirect immediately
  React.useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const target = userProfile?.role === 'admin' && destination === '/dashboard' ? '/admin/overview' : destination;
      navigate(target, { replace: true });
    }
  }, [authLoading, isAuthenticated, user, userProfile, destination, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setValidationError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password);
      addToast('Account Created!', 'Your NEXORA account and profile have been initialized.', 'success');
      const target = userProfile?.role === 'admin' && destination === '/dashboard' ? '/admin/overview' : destination;
      navigate(target, { replace: true });
    } catch (err: any) {
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setValidationError(null);
    clearError();
    try {
      setGoogleLoading(true);
      const profile = await loginWithGoogle();
      if (profile) {
        addToast('Welcome to NEXORA!', `Signed in as ${profile.name || profile.email}.`, 'success');
        const target = profile.role === 'admin' && destination === '/dashboard' ? '/admin/overview' : destination;
        navigate(target, { replace: true });
      }
    } catch (err: any) {
      console.error('Google registration error:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-16">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden glass-panel border border-slate-200/90 dark:border-slate-800 shadow-soft-lg">
        {/* Left Editorial Branding Pane */}
        <div className="lg:col-span-5 bg-gradient-to-br from-brand-purple via-brand-indigo to-slate-950 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/20 blur-3xl rounded-full pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <NexoraLogo size="sm" showTagline={false} />
            <div className="inline-block px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[9px] font-bold tracking-widest uppercase text-violet-200">
              MEMBER REGISTRATION
            </div>
          </div>

          <div className="space-y-4 my-8 relative z-10">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-heading leading-tight">
              Join thousands of live experience seekers.
            </h3>
            <div className="space-y-2 text-xs text-violet-200/90 font-normal">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0" />
                <span>Zero overbooking risk with atomic seat locks</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0" />
                <span>Collectible 3D tickets with QR verification</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0" />
                <span>Real-time event notifications & calendar sync</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 text-[11px] text-violet-200/80 flex items-center space-x-2 relative z-10">
            <ShieldCheck className="w-4 h-4 text-brand-cyan shrink-0" />
            <span>Encrypted Cloud Firestore Security</span>
          </div>
        </div>

        {/* Right Form Pane */}
        <div className="lg:col-span-7 p-8 sm:p-10 bg-white/95 dark:bg-slate-900/95 space-y-5 flex flex-col justify-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white">
              Create Account
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Register as an attendee to discover, reserve, and manage passes
            </p>
          </div>

          {/* Error Banner */}
          {(error || validationError) && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{validationError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearError();
                    setValidationError(null);
                  }}
                  placeholder="Mohammed Meraj"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-purple transition-colors font-medium shadow-soft-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Email Address
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
                    setValidationError(null);
                  }}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-purple transition-colors font-medium shadow-soft-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError();
                      setValidationError(null);
                    }}
                    placeholder="Min. 6 chars"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-purple transition-colors font-medium shadow-soft-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearError();
                      setValidationError(null);
                    }}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-purple transition-colors font-medium shadow-soft-sm"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || googleLoading}
              loading={loading}
              variant="primary"
              size="lg"
              className="w-full mt-2"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Registration
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-white/95 dark:bg-slate-900/95 px-3 text-slate-400 dark:text-slate-500 font-mono">
                OR CONTINUE WITH
              </span>
            </div>
          </div>

          {/* Continue with Google Button */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            loading={googleLoading}
            variant="outline"
            size="lg"
            className="w-full font-bold bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-soft-sm py-3 rounded-2xl transition-all"
            icon={<GoogleIcon className="w-4 h-4" />}
          >
            Continue with Google
          </Button>

          <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to={returnToParam ? `/login?returnTo=${encodeURIComponent(returnToParam)}` : (statePath ? `/login?returnTo=${encodeURIComponent(statePath)}` : '/login')}
              state={location.state}
              className="font-bold text-brand-purple dark:text-brand-violet-light hover:underline"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
