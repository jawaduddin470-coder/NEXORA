import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { BookingItem, EventItem } from '../types';
import { Button } from '../components/ui/Button';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
  QrCode,
  Compass,
  CheckCircle2,
} from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user, userProfile, getUserInitials } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      if (!user || !db) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Load bookings
        const q = query(collection(db, 'bookings'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => d.data()) as BookingItem[];
        list.sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());
        setBookings(list);

        // Load recommended events
        const evtSnap = await getDocs(collection(db, 'events'));
        const evtList = evtSnap.docs.map((d) => ({ eventId: d.id, ...d.data() })) as EventItem[];
        const valid = evtList.filter((e) => e.status !== 'draft').slice(0, 3);
        setRecommendedEvents(valid);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const initials = getUserInitials();
  const firstName = userProfile?.name?.split(' ')[0] || 'Member';

  // Find next upcoming confirmed booking
  const upcomingBookings = bookings.filter(
    (b) => b.status === 'confirmed' && b.eventDate && new Date(b.eventDate).getTime() >= new Date().setHours(0, 0, 0, 0)
  );
  upcomingBookings.sort((a, b) => new Date(a.eventDate || '').getTime() - new Date(b.eventDate || '').getTime());
  const nextExperience = upcomingBookings[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Editorial Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-8">
        <div className="space-y-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
            MEMBER DASHBOARD // {userProfile?.role?.toUpperCase()}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-slate-900 dark:text-white leading-tight">
            Welcome back, {firstName}.
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Your live event life, passes, and upcoming schedules.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={() => navigate('/events')}
            variant="primary"
            size="sm"
            icon={<Compass className="w-4 h-4" />}
          >
            Explore Events
          </Button>
          <Button
            onClick={() => navigate('/my-bookings')}
            variant="outline"
            size="sm"
            icon={<Ticket className="w-4 h-4" />}
          >
            My Passes ({bookings.length})
          </Button>
        </div>
      </div>

      {/* Next Upcoming Experience Spotlight */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
            NEXT UPCOMING EXPERIENCE
          </span>
        </div>

        {nextExperience ? (
          <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-10 border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center space-x-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-bold font-mono tracking-widest uppercase bg-white/10 text-white border border-white/15">
                    CONFIRMED PASS
                  </span>
                  <span className="text-xs font-mono text-cyan-300">
                    REF // {nextExperience.bookingReference}
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-white leading-tight">
                    {nextExperience.eventTitle}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-300">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{nextExperience.eventDate} {nextExperience.eventTime ? `• ${nextExperience.eventTime}` : ''}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{nextExperience.eventVenue || 'Venue'}, {nextExperience.eventLocation || 'Location'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center space-x-4">
                  <Button
                    onClick={() => navigate(`/booking-success/${nextExperience.bookingId}`)}
                    variant="white"
                    size="sm"
                    icon={<QrCode className="w-4 h-4 text-slate-900" />}
                  >
                    View 3D Digital Pass
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                <Ticket className="w-8 h-8 text-cyan-300" />
                <span className="text-2xl font-extrabold font-heading text-white">{nextExperience.quantity} Passes</span>
                <span className="text-[11px] text-slate-400">Total Value: ${nextExperience.totalAmount}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
            <Ticket className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
              No upcoming events scheduled
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You do not have any confirmed reservations coming up. Discover summits, workshops, and concerts today.
            </p>
            <Button
              onClick={() => navigate('/events')}
              variant="primary"
              size="sm"
            >
              Browse Event Catalog
            </Button>
          </div>
        )}
      </div>

      {/* 2-Column Grid: Recent Passes (7 cols) + Recommendations (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Recent Passes List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
              RECENT RESERVATIONS ({bookings.length})
            </span>
            {bookings.length > 0 && (
              <Link
                to="/my-bookings"
                className="text-xs font-semibold text-slate-900 dark:text-white hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="space-y-3">
            {bookings.length > 0 ? (
              bookings.slice(0, 4).map((b) => (
                <div
                  key={b.bookingId}
                  onClick={() => navigate(`/booking-success/${b.bookingId}`)}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 cursor-pointer transition-colors flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold font-heading text-slate-900 dark:text-white truncate">
                        {b.eventTitle}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                      <span>{b.eventDate}</span>
                      <span>•</span>
                      <span>{b.quantity} passes (${b.totalAmount})</span>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-slate-900 dark:text-white shrink-0 flex items-center gap-1">
                    Pass →
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No past reservations found.
              </div>
            )}
          </div>
        </div>

        {/* Recommended Experiences (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
            RECOMMENDED EXPERIENCES
          </span>

          <div className="space-y-3">
            {recommendedEvents.map((evt) => (
              <div
                key={evt.eventId}
                onClick={() => navigate(`/events/${evt.eventId}`)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 cursor-pointer transition-colors flex items-center space-x-4"
              >
                <img
                  src={evt.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300'}
                  alt={evt.title}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">
                    {evt.category}
                  </span>
                  <h4 className="text-xs font-bold font-heading text-slate-900 dark:text-white truncate">
                    {evt.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{evt.date}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {evt.ticketPrice === 0 ? 'FREE' : `$${evt.ticketPrice}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
