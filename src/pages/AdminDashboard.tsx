import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AdminLayout } from '../components/admin/AdminLayout';
import { AdminAnalyticsData, EventPerformanceItem } from '../types';
import { getApiBaseUrl } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  ShieldCheck,
  Calendar,
  Ticket,
  Users,
  DollarSign,
  TrendingUp,
  PlusCircle,
  FileSpreadsheet,
  PieChart as PieIcon,
  Loader2,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  Search,
  Activity,
  Layers,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const PIE_COLORS = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#6366F1', '#3B82F6', '#14B8A6'];

export const AdminDashboard: React.FC = () => {
  const { getIdToken } = useAuth();
  const { theme } = useTheme();

  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [timeRange, setTimeRange] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [trendMetric, setTrendMetric] = useState<'bookings' | 'tickets' | 'bookingValue'>('bookings');

  // Event Performance Table Search & Sort
  const [eventSearch, setEventSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'ticketsSold' | 'utilization' | 'bookingValue' | 'availableSeats' | 'date'>('ticketsSold');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getIdToken();
      const apiBase = getApiBaseUrl();
      const params = new URLSearchParams();
      if (timeRange !== 'all') params.append('timeRange', timeRange);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);

      const res = await fetch(`${apiBase}/admin/analytics?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load authoritative admin analytics from Firestore.');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Analytics Fetch Error:', err);
      setError(err.message || 'Error fetching analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, categoryFilter]);

  const metrics = data?.metrics || {
    totalEvents: 0,
    publishedEvents: 0,
    draftEvents: 0,
    cancelledEvents: 0,
    completedEvents: 0,
    upcomingEvents: 0,
    soldOutEvents: 0,
    totalCapacity: 0,
    remainingCapacity: 0,
    registeredUsers: 0,
    usersWithBookings: 0,
    totalBookings: 0,
    activeBookings: 0,
    cancelledBookings: 0,
    ticketsSold: 0,
    avgTicketsPerBooking: 0,
    simulatedBookingValue: 0,
    avgBookingValue: 0,
    overallUtilization: 0,
  };

  // Filtered & Sorted Event Performance List
  const filteredEvents = useMemo(() => {
    if (!data?.eventPerformance) return [];
    let list = [...data.eventPerformance];

    if (categoryFilter !== 'all') {
      list = list.filter((e) => e.category.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (eventSearch.trim()) {
      const q = eventSearch.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];
      if (sortBy === 'date') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      if (sortOrder === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

    return list;
  }, [data?.eventPerformance, categoryFilter, eventSearch, sortBy, sortOrder]);

  // Top 5 Events by Tickets Sold
  const topEvents = useMemo(() => {
    if (!data?.eventPerformance) return [];
    return [...data.eventPerformance]
      .sort((a, b) => b.ticketsSold - a.ticketsSold)
      .slice(0, 5);
  }, [data?.eventPerformance]);

  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const isDark = theme === 'dark';

  return (
    <AdminLayout>
      <div className="space-y-8">
      {/* Admin Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
            Platform Intelligence & Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Authoritative real-time aggregation across Cloud Firestore events, reservations, and user activity.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={() => window.location.href = '/admin/events/create'}
            variant="primary"
            size="sm"
            icon={<PlusCircle className="w-4 h-4" />}
          >
            Create New Event
          </Button>
          <Button
            onClick={() => window.location.href = '/admin/reports'}
            variant="secondary"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
          >
            Export Reports
          </Button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-panel p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4 text-xs shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center space-x-1 mr-1">
            <Clock className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span>Timeframe:</span>
          </span>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: '90d', label: 'Last 90 Days' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold font-heading transition shadow-soft-sm ${
                timeRange === t.id
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-semibold shadow-soft-sm"
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
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-28 bg-slate-200 dark:bg-slate-800/80 rounded-3xl animate-pulse" />
            ))}
          </div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800/80 rounded-3xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* Primary 8 KPI Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Events */}
            <div className="glass-panel p-5 rounded-3xl space-y-1 border border-slate-200 dark:border-slate-800 shadow-soft">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                <span>Total Events</span>
                <Calendar className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white block">
                {metrics.totalEvents}
              </span>
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-medium">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{metrics.publishedEvents} Published</span>
                <span>•</span>
                <span>{metrics.draftEvents} Drafts</span>
              </div>
            </div>

            {/* 2. Upcoming Events */}
            <div className="glass-panel p-5 rounded-3xl space-y-1 border border-slate-200 dark:border-slate-800 shadow-soft">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                <span>Upcoming Events</span>
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-2xl font-extrabold font-heading text-slate-900 dark:text-emerald-300 block">
                {metrics.upcomingEvents}
              </span>
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-medium">
                <span className="text-amber-600 dark:text-amber-400 font-bold">{metrics.soldOutEvents} Sold Out</span>
                <span>•</span>
                <span>{metrics.completedEvents} Completed</span>
              </div>
            </div>

            {/* 3. Registered Users */}
            <div className="glass-panel p-5 rounded-3xl space-y-1 border border-slate-200 dark:border-slate-800 shadow-soft">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                <span>Registered Users</span>
                <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <span className="text-2xl font-extrabold font-heading text-slate-900 dark:text-cyan-300 block">
                {metrics.registeredUsers}
              </span>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-medium">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">{metrics.usersWithBookings}</span> active booking users
              </div>
            </div>

            {/* 4. Total Bookings */}
            <div className="glass-panel p-5 rounded-3xl space-y-1 border border-slate-200 dark:border-slate-800 shadow-soft">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                <span>Total Bookings</span>
                <Ticket className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-2xl font-extrabold font-heading text-slate-900 dark:text-indigo-300 block">
                {metrics.totalBookings}
              </span>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-medium">
                All platform reservations
              </div>
            </div>

            {/* 5. Active Confirmed Bookings */}
            <div className="glass-panel p-5 rounded-3xl space-y-1 border border-emerald-200 dark:border-emerald-500/20 shadow-soft">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                <span>Active Bookings</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-2xl font-extrabold font-heading text-emerald-600 dark:text-emerald-300 block">
                {metrics.activeBookings}
              </span>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-medium">
                Confirmed reservations active
              </div>
            </div>

            {/* 6. Cancelled Bookings */}
            <div className="glass-panel p-5 rounded-3xl space-y-1 border border-rose-200 dark:border-rose-500/20 shadow-soft">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                <span>Cancelled Bookings</span>
                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <span className="text-2xl font-extrabold font-heading text-rose-600 dark:text-rose-400 block">
                {metrics.cancelledBookings}
              </span>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-medium">
                Seats restored to live inventory
              </div>
            </div>

            {/* 7. Tickets Sold */}
            <div className="glass-panel p-5 rounded-3xl space-y-1 border border-amber-200 dark:border-amber-500/20 shadow-soft">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                <span>Tickets Sold</span>
                <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-2xl font-extrabold font-heading text-amber-600 dark:text-amber-300 block">
                {metrics.ticketsSold}
              </span>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-medium">
                {metrics.overallUtilization}% capacity utilization
              </div>
            </div>

            {/* 8. Simulated Booking Value */}
            <div className="glass-panel p-5 rounded-3xl space-y-1 border border-violet-200 dark:border-violet-500/30 shadow-soft">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                <span>Simulated Booking Value</span>
                <DollarSign className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-2xl font-extrabold font-heading text-violet-700 dark:text-violet-300 block">
                ${metrics.simulatedBookingValue}
              </span>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-medium">
                Avg ${metrics.avgBookingValue} per reservation
              </div>
            </div>
          </div>

          {/* Secondary Context Metric Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shadow-soft-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-bold">Total Seat Inventory</span>
                <span className="text-sm font-extrabold font-heading text-slate-900 dark:text-white">
                  {metrics.totalCapacity} Total Seats
                </span>
              </div>
              <Badge variant="emerald">{metrics.remainingCapacity} Available</Badge>
            </div>

            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shadow-soft-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-bold">Average Tickets / Booking</span>
                <span className="text-sm font-extrabold font-heading text-slate-900 dark:text-white">
                  {metrics.avgTicketsPerBooking} Passes
                </span>
              </div>
              <Badge variant="cyan">Active Orders</Badge>
            </div>

            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shadow-soft-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-bold">Overall Venue Utilization</span>
                <span className="text-sm font-extrabold font-heading text-slate-900 dark:text-white">
                  {metrics.overallUtilization}%
                </span>
              </div>
              <div className="w-24 bg-slate-200 dark:bg-slate-950 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-600 to-cyan-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, metrics.overallUtilization)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Area Chart */}
            <div className="lg:col-span-8 glass-panel p-6 rounded-3xl space-y-4 border border-slate-200 dark:border-slate-800 shadow-soft">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                    Velocity & Trends Over Time
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Aggregated daily reservation timeline</p>
                </div>

                <div className="flex items-center space-x-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => setTrendMetric('bookings')}
                    className={`px-3 py-1 rounded-xl font-bold transition shadow-soft-sm ${
                      trendMetric === 'bookings'
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Bookings
                  </button>
                  <button
                    onClick={() => setTrendMetric('tickets')}
                    className={`px-3 py-1 rounded-xl font-bold transition shadow-soft-sm ${
                      trendMetric === 'tickets'
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Tickets
                  </button>
                  <button
                    onClick={() => setTrendMetric('bookingValue')}
                    className={`px-3 py-1 rounded-xl font-bold transition shadow-soft-sm ${
                      trendMetric === 'bookingValue'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Value ($)
                  </button>
                </div>
              </div>

              <div className="h-72 w-full pt-4">
                {data?.bookingTrends && data.bookingTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.bookingTrends}>
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={trendMetric === 'tickets' ? '#06B6D4' : trendMetric === 'bookingValue' ? '#6366F1' : '#7C3AED'}
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor={trendMetric === 'tickets' ? '#06B6D4' : trendMetric === 'bookingValue' ? '#6366F1' : '#7C3AED'}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#E2E8F0'} />
                      <XAxis dataKey="date" stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={11} />
                      <YAxis stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                          borderColor: isDark ? '#334155' : '#E2E8F0',
                          borderRadius: '16px',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                          color: isDark ? '#F8FAFC' : '#0F172A',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey={trendMetric}
                        stroke={trendMetric === 'tickets' ? '#06B6D4' : trendMetric === 'bookingValue' ? '#6366F1' : '#7C3AED'}
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#trendGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No booking data recorded in this period.
                  </div>
                )}
              </div>
            </div>

            {/* Right Category Donut Chart */}
            <div className="lg:col-span-4 glass-panel p-6 rounded-3xl space-y-4 border border-slate-200 dark:border-slate-800 shadow-soft">
              <div className="flex items-center space-x-2">
                <PieIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                  Category Distribution
                </h2>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.categoryData || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={4}
                      dataKey="eventsCount"
                    >
                      {(data?.categoryData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                        borderRadius: '16px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {(data?.categoryData || []).map((cat, idx) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{cat.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {cat.eventsCount} events ({cat.ticketsSold} tix)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Master Table: Event Inventory & Performance */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4 border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                  Event Inventory & Performance
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Per-event seating utilization, tickets sold, and simulated value
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter event title/venue..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 font-medium shadow-soft-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Event Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => toggleSort('date')}>
                      <div className="flex items-center space-x-1">
                        <span>Date</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => toggleSort('ticketsSold')}>
                      <div className="flex items-center space-x-1">
                        <span>Tickets Sold</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => toggleSort('availableSeats')}>
                      <div className="flex items-center space-x-1">
                        <span>Available Seats</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => toggleSort('utilization')}>
                      <div className="flex items-center space-x-1">
                        <span>Utilization</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => toggleSort('bookingValue')}>
                      <div className="flex items-center space-x-1">
                        <span>Booking Value</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No events match current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((evt) => (
                      <tr key={evt.eventId} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                          {evt.title}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{evt.category}</td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{evt.date}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              evt.status === 'published' ? 'emerald' : evt.status === 'draft' ? 'amber' : 'red'
                            }
                            size="sm"
                          >
                            {evt.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-extrabold text-amber-600 dark:text-amber-300">
                          {evt.ticketsSold}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {evt.availableSeats} / {evt.capacity}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="w-8 font-bold">{evt.utilization}%</span>
                            <div className="w-16 bg-slate-200 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-violet-600 to-cyan-500 h-full rounded-full"
                                style={{ width: `${evt.utilization}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-cyan-300 font-heading">
                          ${evt.bookingValue}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      </div>
    </AdminLayout>
  );
};
