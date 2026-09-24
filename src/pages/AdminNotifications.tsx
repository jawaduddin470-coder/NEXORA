import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { NotificationItem } from '../types';
import {
  Bell,
  ShieldCheck,
  Calendar,
  Ticket,
  User,
  Mail,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Search,
  RefreshCw,
  CheckCheck,
  Filter,
  X,
  Clock,
  Sparkles,
  Inbox,
  Check,
} from 'lucide-react';

type FilterType = 'all' | 'unread' | 'read' | 'bookings' | 'events' | 'system';

export const AdminNotifications: React.FC = () => {
  const { getIdToken } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const res = await fetch(`${apiBase}/admin/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load notifications (Status: ${res.status})`);
      }

      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err: any) {
      console.error('Error fetching admin notifications:', err);
      setError(err.message || 'Failed to fetch notifications from the server.');
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      setActionLoadingId(id);
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, read: true } : n))
      );

      const token = await getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const res = await fetch(`${apiBase}/admin/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.warn('Failed to mark notification as read on backend, re-fetching...');
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      await fetchNotifications();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    if (unreadCount === 0) return;

    try {
      setMarkingAllRead(true);
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

      const token = await getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const res = await fetch(`${apiBase}/admin/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.warn('Failed to mark all as read on backend, re-fetching...');
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      await fetchNotifications();
    } finally {
      setMarkingAllRead(false);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return { relative: 'Unknown time', absolute: '' };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { relative: 'Recently', absolute: dateStr };

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let relative = '';
    if (diffMins < 1) relative = 'Just now';
    else if (diffMins < 60) relative = `${diffMins}m ago`;
    else if (diffHours < 24) relative = `${diffHours}h ago`;
    else if (diffDays === 1) relative = 'Yesterday';
    else if (diffDays < 7) relative = `${diffDays}d ago`;
    else relative = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const absolute = date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return { relative, absolute };
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'booking_confirmation':
        return {
          icon: <Ticket className="w-4 h-4 text-emerald-400" />,
          badgeVariant: 'emerald' as const,
          label: 'Booking Confirmed',
          iconBg: 'bg-emerald-500/10 border-emerald-500/20',
        };
      case 'booking_cancelled':
        return {
          icon: <XCircle className="w-4 h-4 text-rose-400" />,
          badgeVariant: 'red' as const,
          label: 'Booking Cancelled',
          iconBg: 'bg-rose-500/10 border-rose-500/20',
        };
      case 'event_update':
        return {
          icon: <Calendar className="w-4 h-4 text-brand-purple" />,
          badgeVariant: 'violet' as const,
          label: 'Event Update',
          iconBg: 'bg-violet-500/10 border-violet-500/20',
        };
      case 'event_cancelled':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          badgeVariant: 'amber' as const,
          label: 'Event Cancelled',
          iconBg: 'bg-amber-500/10 border-amber-500/20',
        };
      case 'system':
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
          badgeVariant: 'cyan' as const,
          label: 'System Alert',
          iconBg: 'bg-cyan-500/10 border-cyan-500/20',
        };
    }
  };

  const counts = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.read).length;
    const read = total - unread;
    const bookings = notifications.filter(
      (n) => n.type === 'booking_confirmation' || n.type === 'booking_cancelled'
    ).length;
    const events = notifications.filter(
      (n) => n.type === 'event_update' || n.type === 'event_cancelled'
    ).length;
    const system = notifications.filter((n) => n.type === 'system').length;

    return { total, unread, read, bookings, events, system };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // Type Filter
      if (filterType === 'unread' && notif.read) return false;
      if (filterType === 'read' && !notif.read) return false;
      if (
        filterType === 'bookings' &&
        notif.type !== 'booking_confirmation' &&
        notif.type !== 'booking_cancelled'
      )
        return false;
      if (
        filterType === 'events' &&
        notif.type !== 'event_update' &&
        notif.type !== 'event_cancelled'
      )
        return false;
      if (filterType === 'system' && notif.type !== 'system') return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = notif.title?.toLowerCase().includes(query);
        const matchesMessage = notif.message?.toLowerCase().includes(query);
        const matchesUser = notif.userName?.toLowerCase().includes(query);
        const matchesEmail = notif.userEmail?.toLowerCase().includes(query);
        const matchesEvent = notif.eventTitle?.toLowerCase().includes(query);
        const matchesBooking = notif.bookingId?.toLowerCase().includes(query);
        const matchesType = notif.type?.toLowerCase().includes(query);

        return (
          matchesTitle ||
          matchesMessage ||
          matchesUser ||
          matchesEmail ||
          matchesEvent ||
          matchesBooking ||
          matchesType
        );
      }

      return true;
    });
  }, [notifications, filterType, searchQuery]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight mt-1">
              Notifications & Alerts
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Live transaction alerts, attendee bookings, event updates, and system broadcasts recorded in Cloud Firestore.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNotifications}
              disabled={loading}
              className="border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-brand-purple' : ''}`} />
              Refresh
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead || counts.unread === 0}
              className="bg-brand-purple/20 hover:bg-brand-purple/30 text-violet-200 border border-brand-purple/30 text-xs"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-brand-cyan" />
              {markingAllRead ? 'Marking Read...' : `Mark All Read (${counts.unread})`}
            </Button>
          </div>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total Stream</span>
              <Bell className="w-4 h-4 text-brand-purple" />
            </div>
            <div className="text-2xl font-bold text-white mt-1 font-heading">{counts.total}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Unread Alerts</span>
              <span className="relative flex h-2.5 w-2.5">
                {counts.unread > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${counts.unread > 0 ? 'bg-brand-cyan' : 'bg-slate-600'}`}></span>
              </span>
            </div>
            <div className="text-2xl font-bold text-cyan-400 mt-1 font-heading">{counts.unread}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Bookings</span>
              <Ticket className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-heading">{counts.bookings}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Events & System</span>
              <Calendar className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl font-bold text-violet-400 mt-1 font-heading">{counts.events + counts.system}</div>
          </div>
        </div>

        {/* Search and Filters Toolbar */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alerts by title, user name, email, event or booking ID..."
                className="w-full pl-10 pr-10 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple/60 focus:ring-1 focus:ring-brand-purple/60 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Clear Filter Indicator */}
            {(searchQuery || filterType !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
                className="text-xs text-brand-cyan hover:underline flex items-center justify-center space-x-1 shrink-0 py-1"
              >
                <X className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-slate-500 text-[11px] font-semibold flex items-center mr-1 shrink-0">
              <Filter className="w-3 h-3 mr-1" /> Filter:
            </span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-xl font-medium transition shrink-0 ${
                filterType === 'all'
                  ? 'bg-brand-purple text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              All ({counts.total})
            </button>
            <button
              onClick={() => setFilterType('unread')}
              className={`px-3 py-1 rounded-xl font-medium transition shrink-0 ${
                filterType === 'unread'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              Unread ({counts.unread})
            </button>
            <button
              onClick={() => setFilterType('read')}
              className={`px-3 py-1 rounded-xl font-medium transition shrink-0 ${
                filterType === 'read'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              Read ({counts.read})
            </button>
            <button
              onClick={() => setFilterType('bookings')}
              className={`px-3 py-1 rounded-xl font-medium transition shrink-0 ${
                filterType === 'bookings'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              Bookings ({counts.bookings})
            </button>
            <button
              onClick={() => setFilterType('events')}
              className={`px-3 py-1 rounded-xl font-medium transition shrink-0 ${
                filterType === 'events'
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              Events ({counts.events})
            </button>
            <button
              onClick={() => setFilterType('system')}
              className={`px-3 py-1 rounded-xl font-medium transition shrink-0 ${
                filterType === 'system'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              System ({counts.system})
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-xs text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Unable to load notifications</p>
              <p className="mt-0.5 text-rose-300/80">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNotifications}
              className="border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs shrink-0"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Notifications Feed */}
        <div className="space-y-3">
          {loading ? (
            /* Skeleton Loading State */
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 animate-pulse space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-800" />
                      <div className="w-24 h-4 bg-slate-800 rounded-md" />
                    </div>
                    <div className="w-16 h-3 bg-slate-800 rounded-md" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-3/4 h-4 bg-slate-800 rounded-md" />
                    <div className="w-1/2 h-3 bg-slate-800/60 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            /* Empty State */
            <div className="py-16 px-4 rounded-3xl border border-slate-800/80 bg-slate-900/40 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
                <Inbox className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No notifications found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery || filterType !== 'all'
                    ? 'No notifications match your current filter and search criteria.'
                    : 'There are currently no platform notifications or transaction alerts recorded.'}
                </p>
              </div>
              {(searchQuery || filterType !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                  }}
                  className="text-xs border-slate-700 text-slate-300"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            /* Notification Cards */
            filteredNotifications.map((notif) => {
              const typeCfg = getTypeConfig(notif.type);
              const time = formatTimestamp(notif.createdAt);
              const isActionLoading = actionLoadingId === notif.notificationId;

              return (
                <div
                  key={notif.notificationId}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all relative ${
                    notif.read
                      ? 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700/60'
                      : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600 shadow-lg shadow-black/20'
                  }`}
                >
                  {/* Unread Glow Indicator */}
                  {!notif.read && (
                    <div className="absolute top-4 right-4 sm:top-5 sm:right-5 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                        New
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-start gap-3.5">
                    {/* Icon Container */}
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${typeCfg.iconBg}`}
                    >
                      {typeCfg.icon}
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 pr-12 sm:pr-0">
                        <Badge variant={typeCfg.badgeVariant} size="sm">
                          {typeCfg.label}
                        </Badge>
                        <span
                          className="text-[11px] text-slate-400 flex items-center space-x-1 font-mono"
                          title={time.absolute}
                        >
                          <Clock className="w-3 h-3 inline mr-1 text-slate-500" />
                          {time.relative}
                        </span>
                      </div>

                      {/* Title & Message */}
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {notif.title}
                        </h3>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>

                      {/* Context Chips (User, Event, Booking ID) */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                        {/* Attendee Info */}
                        {(notif.userName || notif.userEmail) && (
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                            <User className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="font-medium text-white">
                              {notif.userName || 'User'}
                            </span>
                            {notif.userEmail && (
                              <span className="text-slate-500 text-[10px]">
                                ({notif.userEmail})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Event Title */}
                        {notif.eventTitle && (
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                            <Calendar className="w-3 h-3 text-violet-400 shrink-0" />
                            <span className="truncate max-w-[200px]" title={notif.eventTitle}>
                              {notif.eventTitle}
                            </span>
                          </div>
                        )}

                        {/* Booking ID */}
                        {notif.bookingId && (
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                            <Ticket className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="text-[10px]">
                              ID: {notif.bookingId.slice(0, 12)}...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    {!notif.read && (
                      <div className="pt-2 sm:pt-0 sm:self-center shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notif.notificationId)}
                          disabled={isActionLoading}
                          className="text-xs text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/30 px-3 py-1.5 h-auto rounded-xl"
                        >
                          <Check className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                          {isActionLoading ? 'Saving...' : 'Mark as Read'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
