import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AdminLayout } from '../components/admin/AdminLayout';
import { BookingItem } from '../types';
import { getApiBaseUrl } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Ticket3D } from '../components/3d/Ticket3D';
import {
  Ticket,
  Search,
  ShieldCheck,
  Calendar,
  User,
  X,
  MapPin,
  Clock,
  Ban,
  Download,
  AlertCircle,
} from 'lucide-react';

export const AdminBookings: React.FC = () => {
  const { getIdToken } = useAuth();
  const { addToast } = useToast();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = await getIdToken();
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/admin/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Error fetching admin bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [getIdToken]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking and restore the event seat inventory?')) {
      return;
    }
    try {
      setCancelling(true);
      const token = await getIdToken();
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to cancel reservation');
      }
      addToast('Reservation Cancelled', 'The booking was cancelled and seat capacity has been restored.', 'success');
      setSelectedBooking(null);
      await fetchBookings();
    } catch (err: any) {
      addToast('Cancellation Error', err.message, 'error');
    } finally {
      setCancelling(false);
    }
  };

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      b.bookingReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              <span>Reservation Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
              All Platform Bookings
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Live Cloud Firestore transactional booking records and digital pass ledger.
            </p>
          </div>

          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Ticket className="w-4 h-4 text-cyan-400" />
            <span>Total Records: <strong className="text-white">{bookings.length}</strong></span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by reference, attendee, email, or event..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple font-medium"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === 'all'
                  ? 'bg-brand-purple text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === 'confirmed'
                  ? 'bg-brand-purple text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Confirmed ({bookings.filter((b) => b.status === 'confirmed').length})
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === 'cancelled'
                  ? 'bg-brand-purple text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Cancelled ({bookings.filter((b) => b.status === 'cancelled').length})
            </button>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-4 px-6">Reference ID</th>
                  <th className="py-4 px-6">Attendee</th>
                  <th className="py-4 px-6">Event Title</th>
                  <th className="py-4 px-6">Tickets</th>
                  <th className="py-4 px-6">Booking Value</th>
                  <th className="py-4 px-6">Date Booked</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      Loading Firestore transactional booking records...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No matching bookings found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.bookingId} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6 font-mono font-bold text-cyan-400">
                        {b.bookingReference}
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-bold text-white block">{b.userName}</span>
                        <span className="text-[10px] text-slate-400 block">{b.userEmail}</span>
                      </td>

                      <td className="py-4 px-6 font-bold text-white max-w-[200px] truncate">
                        {b.eventTitle}
                      </td>

                      <td className="py-4 px-6 font-bold text-violet-300">
                        {b.quantity} seat(s)
                      </td>

                      <td className="py-4 px-6 font-extrabold text-white font-heading">
                        ${b.totalAmount}
                      </td>

                      <td className="py-4 px-6 text-slate-400">
                        {new Date(b.bookedAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-6">
                        <Badge variant={b.status === 'confirmed' ? 'emerald' : 'red'} size="sm">
                          {b.status}
                        </Badge>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold transition"
                        >
                          View Pass
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3D Ticket Pass Inspection Drawer / Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 relative shadow-soft-lg">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Ticket className="w-5 h-5 text-brand-purple" />
                  <h3 className="text-lg font-bold font-heading text-white">
                    Pass Inspection: {selectedBooking.bookingReference}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 3D Ticket Pass Model */}
              <div className="flex justify-center py-2">
                <Ticket3D
                  title={selectedBooking.eventTitle}
                  date={selectedBooking.eventDate || '2026 Season'}
                  reference={selectedBooking.bookingReference}
                  category={selectedBooking.status === 'confirmed' ? 'CONFIRMED ATTENDEE' : 'CANCELLED PASS'}
                  ticketQuantity={selectedBooking.quantity}
                />
              </div>

              {/* Booking Metadata Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 uppercase tracking-wider block text-[10px] font-bold">Attendee</span>
                  <span className="text-white font-bold block">{selectedBooking.userName}</span>
                  <span className="text-slate-400 text-[11px]">{selectedBooking.userEmail}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase tracking-wider block text-[10px] font-bold">Event</span>
                  <span className="text-white font-bold block truncate">{selectedBooking.eventTitle}</span>
                  <span className="text-slate-400 text-[11px]">{selectedBooking.eventVenue}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase tracking-wider block text-[10px] font-bold">Quantity & Total</span>
                  <span className="text-cyan-300 font-bold block">{selectedBooking.quantity} Ticket(s) reserved</span>
                  <span className="text-slate-400 text-[11px]">Simulated Value: ${selectedBooking.totalAmount}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase tracking-wider block text-[10px] font-bold">Status</span>
                  <div className="mt-1">
                    <Badge variant={selectedBooking.status === 'confirmed' ? 'emerald' : 'red'} size="sm">
                      {selectedBooking.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Cancellation Action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                {selectedBooking.status === 'confirmed' ? (
                  <button
                    onClick={() => handleCancelBooking(selectedBooking.bookingId)}
                    disabled={cancelling}
                    className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition disabled:opacity-50"
                  >
                    <Ban className="w-4 h-4" />
                    <span>{cancelling ? 'Cancelling...' : 'Cancel Reservation'}</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 font-semibold">Reservation is cancelled</span>
                )}

                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;
