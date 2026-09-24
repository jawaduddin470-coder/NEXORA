import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BookingItem } from '../types';
import { Button } from '../components/ui/Button';
import {
  Ticket,
  Calendar,
  MapPin,
  Search,
  ExternalLink,
  ArrowRight,
  XCircle,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  QrCode,
} from 'lucide-react';

export const MyBookings: React.FC = () => {
  const { user, getIdToken } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');

  // Cancellation Modal state
  const [cancellingBooking, setCancellingBooking] = useState<BookingItem | null>(null);
  const [cancellingLoader, setCancellingLoader] = useState<boolean>(false);

  useEffect(() => {
    async function loadBookings() {
      if (!user || !db) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const q = query(collection(db, 'bookings'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => d.data()) as BookingItem[];
        list.sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());
        setBookings(list);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [user]);

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    try {
      setCancellingLoader(true);
      const token = await getIdToken();
      if (!token) {
        addToast('Session Expired', 'Please sign in again to continue.', 'error');
        return;
      }

      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const res = await fetch(`${apiBase}/bookings/${cancellingBooking.bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to cancel booking.');
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.bookingId === cancellingBooking.bookingId
            ? { ...b, status: 'cancelled', updatedAt: new Date().toISOString() }
            : b
        )
      );

      addToast(
        'Pass Cancelled',
        `Reservation ${cancellingBooking.bookingReference} cancelled. Seats restored to event inventory.`,
        'success'
      );
      setCancellingBooking(null);
    } catch (err: any) {
      console.error('Cancellation error:', err);
      addToast('Cancellation Failed', err.message || 'Failed to cancel reservation.', 'error');
    } finally {
      setCancellingLoader(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const isPast = b.eventDate ? new Date(b.eventDate).getTime() < new Date().setHours(0, 0, 0, 0) : false;

    if (activeTab === 'upcoming' && (b.status === 'cancelled' || isPast)) return false;
    if (activeTab === 'past' && (!isPast || b.status === 'cancelled')) return false;
    if (activeTab === 'cancelled' && b.status !== 'cancelled') return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.eventTitle?.toLowerCase().includes(term) ||
      b.bookingReference?.toLowerCase().includes(term) ||
      b.eventVenue?.toLowerCase().includes(term) ||
      b.eventLocation?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-8">
        <div className="space-y-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
            WALLET // DIGITAL EVENT PASSES
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-slate-900 dark:text-white leading-tight">
            My Event Passes
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            All confirmed, past, and archived collectible tickets with instant QR access.
          </p>
        </div>

        <Button
          onClick={() => navigate('/events')}
          variant="primary"
          size="sm"
          icon={<Ticket className="w-4 h-4" />}
        >
          Explore More Events
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Passes' },
            { id: 'upcoming', label: 'Active & Upcoming' },
            { id: 'past', label: 'Past Events' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search passes or ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
          />
        </div>
      </div>

      {/* Pass Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((b) => (
            <div
              key={b.bookingId}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between space-y-6 shadow-sm hover:border-slate-400 dark:hover:border-slate-600 transition-colors relative overflow-hidden"
            >
              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    REF // {b.bookingReference}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white leading-snug">
                  {b.eventTitle}
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{b.eventDate || 'Date TBA'} {b.eventTime ? `• ${b.eventTime}` : ''}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{b.eventVenue || 'Venue'}, {b.eventLocation || 'Location'}</span>
                  </div>
                </div>
              </div>

              {/* Perforation Divider Line */}
              <div className="border-t border-dashed border-slate-200 dark:border-slate-800 relative">
                <div className="absolute -left-8 -top-3 w-6 h-6 rounded-full bg-[#F8FAFC] dark:bg-[#030712]" />
                <div className="absolute -right-8 -top-3 w-6 h-6 rounded-full bg-[#F8FAFC] dark:bg-[#030712]" />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs">
                  <span className="font-mono text-slate-400 block">Quantity</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {b.quantity} {b.quantity === 1 ? 'Pass' : 'Passes'} (${b.totalAmount})
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {b.status === 'confirmed' && (
                    <button
                      onClick={() => setCancellingBooking(b)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <Button
                    onClick={() => navigate(`/booking-success/${b.bookingId}`)}
                    variant="primary"
                    size="sm"
                    icon={<QrCode className="w-3.5 h-3.5" />}
                  >
                    View 3D Pass
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <Ticket className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
            No event passes found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any bookings matching this category. Reserve a pass from our live events catalog.
          </p>
          <Button onClick={() => navigate('/events')} variant="primary" size="sm">
            Explore Events
          </Button>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                Cancel Pass Reservation?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Are you sure you want to cancel your pass for <strong>{cancellingBooking.eventTitle}</strong>? The reserved seats ({cancellingBooking.quantity}) will be immediately restored to the public capacity inventory.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setCancellingBooking(null)}
                disabled={cancellingLoader}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Keep Pass
              </button>
              <Button
                onClick={handleCancelBooking}
                loading={cancellingLoader}
                variant="danger"
                size="sm"
                className="flex-1"
              >
                Confirm Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
