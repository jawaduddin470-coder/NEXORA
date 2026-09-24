import React from 'react';
import { AlertTriangle, Key } from 'lucide-react';
import { isFirebaseConfigured } from '../../lib/firebase';

export const ConfigErrorModal: React.FC = () => {
  if (isFirebaseConfigured) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center space-x-3 text-red-400">
          <div className="p-3 bg-red-500/10 rounded-xl">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-white">Firebase Configuration Missing</h2>
            <p className="text-xs text-red-300">Database & Authentication Source of Truth Required</p>
          </div>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed">
          NEXORA enforces strict production database persistence via Cloud Firestore and Firebase Authentication.
          Environment variables for Firebase Web SDK are missing or using placeholder values.
        </p>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
          <div className="flex items-center space-x-2 text-violet-400 font-semibold mb-2">
            <Key className="w-4 h-4" />
            <span>Required Environment Variables (.env):</span>
          </div>
          <p className="text-slate-400">VITE_FIREBASE_API_KEY=...</p>
          <p className="text-slate-400">VITE_FIREBASE_AUTH_DOMAIN=...</p>
          <p className="text-slate-400">VITE_FIREBASE_PROJECT_ID=...</p>
          <p className="text-slate-400">VITE_FIREBASE_STORAGE_BUCKET=...</p>
          <p className="text-slate-400">VITE_FIREBASE_APP_ID=...</p>
        </div>

        <p className="text-xs text-slate-400 italic">
          Please add your Firebase credentials to the <code className="text-violet-300 font-mono">.env</code> file in the root directory and restart the application server.
        </p>
      </div>
    </div>
  );
};
