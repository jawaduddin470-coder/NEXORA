import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Shield, Check, Loader2, Image as ImageIcon, Sparkles, Calendar, Ticket } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const ProfilePage: React.FC = () => {
  const { user, userProfile, updateProfileData, getUserInitials } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState<string>(userProfile?.name || '');
  const [profileImage, setProfileImage] = useState<string>(userProfile?.profileImage || '');
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      await updateProfileData({ name: name.trim(), profileImage: profileImage.trim() });
      setSuccess(true);
      addToast('Profile Updated', 'Your profile details have been synchronized with Firestore.', 'success');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile data.');
    } finally {
      setSaving(false);
    }
  };

  const initials = getUserInitials();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header Profile Summary */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
        <div className="relative">
          {userProfile?.profileImage ? (
            <img
              src={userProfile.profileImage}
              alt={userProfile.name}
              className="w-20 h-20 rounded-3xl object-cover border-2 border-violet-500/40 shadow-soft"
            />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white font-extrabold font-heading text-2xl flex items-center justify-center border-2 border-violet-400 shadow-soft">
              {initials}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center" title="Active Account">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div className="space-y-1 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white">
              {userProfile?.name || 'My Account'}
            </h1>
            <Badge variant={userProfile?.role === 'admin' ? 'cyan' : 'violet'}>
              {userProfile?.role}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{user?.email}</p>
          <div className="pt-2 flex items-center justify-center sm:justify-start space-x-4 text-[11px] text-slate-400">
            <span>Member since: {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : '2026'}</span>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-soft">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
            Personal Information
          </h2>
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Shield className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Role: <strong className="uppercase text-violet-600 dark:text-violet-400">{userProfile?.role}</strong></span>
          </div>
        </div>

        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Profile information synchronized with Firestore successfully.</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mohammed Meraj"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-colors font-medium shadow-soft-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Email Address (Read-Only)
            </label>
            <div className="relative opacity-70">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Profile Image URL (Optional)
            </label>
            <div className="relative">
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-colors font-medium shadow-soft-sm"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Leave empty to automatically use your stylized initials avatar.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 shadow-soft-sm">
            <span className="font-bold text-violet-600 dark:text-violet-400 block">Security Notice</span>
            <p>
              Your account access role is managed strictly server-side through Firebase Admin SDK and protected via Firestore Security Rules.
            </p>
          </div>

          <Button
            type="submit"
            disabled={saving}
            loading={saving}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Save Profile Changes
          </Button>
        </form>
      </div>
    </div>
  );
};
