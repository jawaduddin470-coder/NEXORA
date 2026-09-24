import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Calendar,
  Ticket,
  Users,
  Filter,
  CheckCircle2,
  Loader2,
  Table,
} from 'lucide-react';

export const AdminAnalyticsReports: React.FC = () => {
  const { getIdToken } = useAuth();
  const { addToast } = useToast();

  const [downloading, setDownloading] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleDownloadCSV = async (type: 'bookings' | 'events' | 'users') => {
    try {
      setDownloading(type);
      const token = await getIdToken();
      if (!token) {
        addToast('Session Expired', 'Please sign in again to continue.', 'error');
        return;
      }

      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const params = new URLSearchParams();
      params.append('type', type);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`${apiBase}/admin/reports?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to generate authoritative CSV report.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NEXORA-${type}-report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      addToast('Report Downloaded', `Exported NEXORA-${type}-report.csv successfully!`, 'success');
    } catch (err: any) {
      console.error('CSV Export Error:', err);
      addToast('Export Error', err.message || 'Error exporting CSV report.', 'error');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-widest">
          <ShieldCheck className="w-4 h-4" />
          <span>Analytics & Data Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
          Administrative CSV Reporting
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl pt-1 font-medium">
          Export authoritative datasets from live Cloud Firestore for event audits, seating utilization, ticket reservations, and user activity summaries.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4 text-xs shadow-soft">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span className="text-slate-600 dark:text-slate-400 font-bold">Report Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl px-3.5 py-1.5 focus:outline-none focus:border-cyan-500 font-semibold shadow-soft-sm"
            >
              <option value="all">All Categories</option>
              <option value="Technology">Technology</option>
              <option value="Music">Music</option>
              <option value="Business">Business</option>
              <option value="Art">Art</option>
              <option value="Sports">Sports</option>
              <option value="Workshop">Workshop</option>
              <option value="Education">Education</option>
              <option value="Conference">Conference</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl px-3.5 py-1.5 focus:outline-none focus:border-cyan-500 font-semibold shadow-soft-sm"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed / Active</option>
              <option value="published">Published Events</option>
              <option value="draft">Draft Events</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bookings Report Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4 border border-slate-200 dark:border-violet-500/30 flex flex-col justify-between shadow-soft">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-600/20 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-200 dark:border-violet-500/30 shadow-soft-sm">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                Bookings Audit Report
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                Includes unique reference codes (`NX-2026-XXXXXX`), attendee names, emails, event titles, ticket counts, simulated totals, and timestamps.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 shadow-soft-sm">
              <div className="font-bold text-slate-800 dark:text-slate-300">Exported Fields:</div>
              <div>Reference, Title, Attendee, Email, Quantity, Ticket Price, Total Amount, Status, Booked Date</div>
            </div>
          </div>

          <Button
            onClick={() => handleDownloadCSV('bookings')}
            disabled={downloading === 'bookings'}
            loading={downloading === 'bookings'}
            variant="primary"
            size="md"
            className="w-full"
            icon={<Download className="w-4 h-4" />}
          >
            Download Bookings CSV
          </Button>
        </div>

        {/* Events Report Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4 border border-slate-200 dark:border-cyan-500/30 flex flex-col justify-between shadow-soft">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-200 dark:border-cyan-500/30 shadow-soft-sm">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                Events Master Report
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                Export full event catalog metadata, categories, venue details, total capacities, available seats, tickets sold, utilization %, and pricing.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 shadow-soft-sm">
              <div className="font-bold text-slate-800 dark:text-slate-300">Exported Fields:</div>
              <div>Event ID, Title, Category, Date, Time, Venue, Capacity, Available Seats, Tickets Sold, Utilization %</div>
            </div>
          </div>

          <Button
            onClick={() => handleDownloadCSV('events')}
            disabled={downloading === 'events'}
            loading={downloading === 'events'}
            variant="primary"
            size="md"
            className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-cyan-600/25"
            icon={<Download className="w-4 h-4" />}
          >
            Download Events CSV
          </Button>
        </div>

        {/* User Registration Summaries Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4 border border-slate-200 dark:border-emerald-500/30 flex flex-col justify-between shadow-soft">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30 shadow-soft-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                User Registrations Report
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                Export registered user accounts, email addresses, assigned roles (user/admin), registration timestamps, total bookings, and booking values.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 shadow-soft-sm">
              <div className="font-bold text-slate-800 dark:text-slate-300">Exported Fields:</div>
              <div>User ID, Full Name, Email, Role, Registered Date, Total Bookings, Active Bookings, Total Value</div>
            </div>
          </div>

          <Button
            onClick={() => handleDownloadCSV('users')}
            disabled={downloading === 'users'}
            loading={downloading === 'users'}
            variant="primary"
            size="md"
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25"
            icon={<Download className="w-4 h-4" />}
          >
            Download Users CSV
          </Button>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
};
