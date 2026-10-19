import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getApiBaseUrl } from '../lib/api';
import { AdminLayout } from '../components/admin/AdminLayout';
import { EventItem, EventCategory, EventStatus } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Calendar,
  PlusCircle,
  Search,
  Edit,
  Trash2,
  ShieldCheck,
  Star,
  Layers,
  Filter,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';

const CATEGORIES: string[] = [
  'All',
  'Technology',
  'Music',
  'Business',
  'Workshop',
  'Sports',
  'Education',
  'Art',
  'Conference',
];

const STATUSES: string[] = ['All', 'published', 'draft', 'cancelled', 'completed'];

export const AdminEvents: React.FC = () => {
  const { getIdToken } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [featuredOnly, setFeaturedOnly] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<string>('date-asc');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);

  const fetchAdminEvents = async () => {
    try {
      setLoading(true);
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/events?status=all`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching admin events:', err);
      addToast('Error Loading Events', 'Failed to fetch events catalog.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminEvents();
  }, []);

  // Safe Deletion Handler with Booking Check
  const handleDelete = async (evt: EventItem) => {
    const confirmMessage = `Are you sure you want to delete "${evt.title}"?\n\nNote: Events with existing bookings cannot be hard-deleted for safety.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setDeletingId(evt.eventId);
      const token = await getIdToken();
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/events/${evt.eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        addToast('Deletion Blocked', data.message || 'Cannot delete event with active bookings.', 'error');
        return;
      }

      setEvents((prev) => prev.filter((e) => e.eventId !== evt.eventId));
      addToast('Event Deleted', `Successfully deleted "${evt.title}".`, 'success');
    } catch (err: any) {
      console.error('Delete error:', err);
      addToast('Deletion Error', err.message || 'Failed to delete event.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Toggle Featured Flag
  const handleToggleFeatured = async (evt: EventItem) => {
    try {
      setTogglingFeaturedId(evt.eventId);
      const token = await getIdToken();
      const apiBase = getApiBaseUrl();
      const newFeatured = !evt.featured;

      const res = await fetch(`${apiBase}/events/${evt.eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ featured: newFeatured }),
      });

      if (!res.ok) {
        throw new Error('Failed to update featured flag');
      }

      setEvents((prev) =>
        prev.map((e) => (e.eventId === evt.eventId ? { ...e, featured: newFeatured } : e))
      );
      addToast(
        newFeatured ? 'Event Featured' : 'Featured Removed',
        `"${evt.title}" spotlight status updated.`,
        'success'
      );
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update featured flag', 'error');
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  // Filter & Sort Logic
  const filtered = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.location && e.location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || e.status === selectedStatus;
    const matchesFeatured = !featuredOnly || Boolean(e.featured);

    return matchesSearch && matchesCategory && matchesStatus && matchesFeatured;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortOption === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortOption === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortOption === 'capacity-desc') return b.capacity - a.capacity;
    if (sortOption === 'price-desc') return b.ticketPrice - a.ticketPrice;
    return 0;
  });

  // Calculate Statistics from live Firestore data
  const totalEvents = events.length;
  const publishedEvents = events.filter((e) => e.status === 'published').length;
  const draftEvents = events.filter((e) => e.status === 'draft').length;
  const upcomingEvents = events.filter(
    (e) => e.date && new Date(e.date).getTime() >= new Date().setHours(0, 0, 0, 0)
  ).length;
  const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>Management Console</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
            Event Catalog Workspace
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={fetchAdminEvents}
            variant="secondary"
            size="sm"
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            onClick={() => navigate('/admin/events/create')}
            variant="primary"
            size="sm"
            icon={<PlusCircle className="w-4 h-4" />}
          >
            Create Event
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="glass-panel p-4 rounded-3xl space-y-1 shadow-soft">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">Total Events</span>
          <span className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white">{totalEvents}</span>
        </div>
        <div className="glass-panel p-4 rounded-3xl space-y-1 shadow-soft">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">Published</span>
          <span className="text-2xl font-extrabold font-heading text-emerald-600 dark:text-emerald-400">{publishedEvents}</span>
        </div>
        <div className="glass-panel p-4 rounded-3xl space-y-1 shadow-soft">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">Drafts</span>
          <span className="text-2xl font-extrabold font-heading text-amber-600 dark:text-amber-400">{draftEvents}</span>
        </div>
        <div className="glass-panel p-4 rounded-3xl space-y-1 shadow-soft">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">Upcoming</span>
          <span className="text-2xl font-extrabold font-heading text-cyan-600 dark:text-cyan-300">{upcomingEvents}</span>
        </div>
        <div className="glass-panel p-4 rounded-3xl space-y-1 col-span-2 sm:col-span-1 shadow-soft">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">Total Capacity</span>
          <span className="text-2xl font-extrabold font-heading text-violet-600 dark:text-violet-400">{totalCapacity} seats</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-3xl space-y-4 shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Search */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, category, or venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 font-medium"
            />
          </div>

          {/* Category Selector */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 font-semibold"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div className="md:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 font-semibold"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  Status: {st.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Featured Toggle */}
          <div className="md:col-span-2 flex items-center justify-end">
            <button
              onClick={() => setFeaturedOnly(!featuredOnly)}
              className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-soft-sm ${
                featuredOnly
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{featuredOnly ? 'Featured Only' : 'All Events'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-4 px-6">Event Info</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Date & Time</th>
                <th className="py-4 px-6">Capacity & Reserved</th>
                <th className="py-4 px-6">Price</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-center">Spotlight</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading live Firestore event catalog...
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching events found in database.
                  </td>
                </tr>
              ) : (
                sorted.map((evt) => (
                  <tr key={evt.eventId} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                    <td className="py-4 px-6 font-medium">
                      <div className="flex items-center space-x-3">
                        <img
                          src={evt.bannerImage}
                          alt={evt.title}
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block line-clamp-1 font-heading">{evt.title}</span>
                          <span className="text-[11px] text-slate-400 block">{evt.venue}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <Badge variant="violet" size="sm">
                        {evt.category}
                      </Badge>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{evt.date}</span>
                      <span className="text-[11px] text-slate-400 block">{evt.time}</span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="space-y-1 max-w-[130px]">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Booked</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {evt.capacity - evt.availableSeats} / {evt.capacity}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, Math.max(0, ((evt.capacity - evt.availableSeats) / evt.capacity) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white font-heading">${evt.ticketPrice}</td>

                    <td className="py-4 px-6">
                      <Badge
                        variant={evt.status === 'published' ? 'emerald' : evt.status === 'draft' ? 'amber' : 'red'}
                        size="sm"
                      >
                        {evt.status}
                      </Badge>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleFeatured(evt)}
                        disabled={togglingFeaturedId === evt.eventId}
                        className={`p-2 rounded-xl border transition shadow-soft-sm ${
                          evt.featured
                            ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-600 dark:text-amber-400'
                            : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white'
                        }`}
                        title={evt.featured ? 'Featured on Landing Page' : 'Click to feature'}
                      >
                        <Star className={`w-4 h-4 ${evt.featured ? 'fill-current' : ''}`} />
                      </button>
                    </td>

                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/admin/events/${evt.eventId}/edit`)}
                        className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-violet-600 dark:hover:text-white hover:border-violet-400 transition shadow-soft-sm"
                        title="Edit Event Specs & Seating"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(evt)}
                        disabled={deletingId === evt.eventId}
                        className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition shadow-soft-sm"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
};
