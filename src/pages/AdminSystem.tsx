import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Badge } from '../components/ui/Badge';
import {
  Server,
  ShieldCheck,
  Cpu,
  Database,
  Globe,
  HardDrive,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const AdminSystem: React.FC = () => {
  const { getIdToken } = useAuth();
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [latency, setLatency] = useState<number>(0);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const start = performance.now();
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const res = await fetch(`${apiBase}/health`);
      const end = performance.now();
      setLatency(Math.round(end - start));
      const data = await res.json();
      setHealthData(data);
    } catch (err) {
      console.error('Health check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              <span>Diagnostic & Environment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
              System Health & Diagnostics
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Backend runtime status, Cloud Firestore connectivity, and service configurations.
            </p>
          </div>

          <button
            onClick={checkHealth}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-cyan-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Diagnostics</span>
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase">Backend API</span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-xl font-extrabold font-heading text-white block">
              {healthData?.status === 'ok' ? 'Operational' : 'Online'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Node.js Express / TS</span>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase">Database</span>
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xl font-extrabold font-heading text-white block">
              Cloud Firestore
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Project: nexora-cd4dc</span>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase">API Latency</span>
              <Cpu className="w-4 h-4 text-brand-purple" />
            </div>
            <span className="text-xl font-extrabold font-heading text-white block">
              {latency} ms
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold">Optimal Response</span>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase">Storage Engine</span>
              <HardDrive className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xl font-extrabold font-heading text-white block">
              Firebase Storage
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Image / Banner Assets</span>
          </div>
        </div>

        {/* Detailed Environment Specifications */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold font-heading text-white">
            Architecture & Security Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-cyan-300 block">Transaction Engine</span>
              <p className="text-slate-400 leading-relaxed">
                Uses Firebase Admin SDK atomic transactions (<code className="text-violet-300">runTransaction</code>) for seat decrements, idempotent booking checks, and cancellation seat recovery.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-brand-purple block">Security Rules & Authorization</span>
              <p className="text-slate-400 leading-relaxed">
                Dual-layer authorization enforces Firebase ID token signature verification on Express API routes and Firestore security rules preventing client role escalation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSystem;
