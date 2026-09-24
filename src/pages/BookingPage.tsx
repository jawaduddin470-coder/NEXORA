import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { EventItem, BookingAttendee } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Ticket,
  Calendar,
  MapPin,
  User,
  Mail,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Info,
  CheckCircle2,
} from 'lucide-react';

export const BookingPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userProfile, getIdToken } = useAuth();

  const initialQty = Math.max(1, parseInt(searchParams.get('quantity') || '1', 10));

  // Unique idempotency key per checkout attempt session
  const [idempotencyKey] = useState<string>(
    () => `ik_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`
  );

  const [event, setEvent] = useState<EventItem | null>(null);
  const [quantity, setQuantity] = useState<number>(initialQty);
  const [attendees, setAttendees] = useState<BookingAttendee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inventoryWarning, setInventoryWarning] = useState<string | null>(null);

  // Real-time listener for event document (live seat availability)
  useEffect(() => {
    if (!eventId || !db) {
      setLoading(false);
      return;
    }

    const eventRef = doc(db, 'events', eventId);
    const unsubscribe = onSnapshot(
      eventRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const evtData = { eventId: docSnap.id, ...docSnap.data() } as EventItem;
          setEvent(evtData);

          // Check real-time seat availability against current selected quantity
          if (evtData.availableSeats <= 0) {
            setInventoryWarning('This event was just sold out by another attendee.');
            setQuantity(0);
          } else if (quantity > evtData.availableSeats) {
            const adjusted = evtData.availableSeats;
            setQuantity(adjusted);
            setInventoryWarning(`Seat availability dropped. Quantity adjusted to ${adjusted} seat(s).`);
          } else {
            setInventoryWarning(null);
          }
        } else {
          setEvent(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Realtime BookingPage event error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [eventId, quantity]);

  // Sync attendee details forms whenever quantity or profile changes
  useEffect(() => {
    if (quantity <= 0) {
      setAttendees([]);
      return;
    }
    setAttendees((prev) => {
      const next = [...prev];
      if (quantity > next.length) {
        for (let i = next.length; i < quantity; i++) {
          next.push({
            name: i === 0 ? userProfile?.name || '' : '',
            email: i === 0 ? userProfile?.email || '' : '',
          });
        }
      } else {
        next.length = quantity;
      }
      return next;
    });
  }, [quantity, userProfile]);

  const handleQuantityChange = (newQty: number) => {
    if (!event) return;
    const maxAllowed = Math.min(10, event.availableSeats);
    const clamped = Math.max(1, Math.min(maxAllowed, newQty));
    setQuantity(clamped);
  };

  const handleAttendeeChange = (index: number, field: 'name' | 'email', value: string) => {
    setAttendees((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !event || submitting) return;
    setError(null);

    if (event.availableSeats <= 0 || quantity <= 0) {
      setError('This event is sold out and no longer accepting reservations.');
      return;
    }

    if (quantity > event.availableSeats) {
      setError(`Only ${event.availableSeats} seat(s) remain available.`);
      return;
    }

    // Validate attendee details
    for (let i = 0; i < attendees.length; i++) {
      if (!attendees[i].name.trim() || !attendees[i].email.trim()) {
        setError(`Please fill in name and email for Ticket #${i + 1}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const token = await getIdToken();
      if (!token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${apiBase}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId,
          quantity,
          attendeeDetails: attendees,
          idempotencyKey,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('These tickets were just booked by another attendee. Please choose a smaller quantity.');
        } else if (response.status === 401) {
          throw new Error('Your session has expired. Please sign in again.');
        }
        throw new Error(data.message || 'Booking reservation failed. Please try again.');
      }

      // Successful backend transaction redirect to confirmation page
      navigate(`/booking-success/${data.booking.bookingId}`, {
        state: { booking: data.booking },
      });
    } catch (err: any) {
      console.error('Booking submission error:', err);
      setError(err.message || 'Failed to process booking transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-96 bg-slate-200 dark:bg-slate-800/80 rounded-3xl animate-pulse border border-slate-200 dark:border-slate-800" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-soft">
        <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">Event Unavailable</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">The event you are attempting to book is no longer available.</p>
        <Button onClick={() => navigate('/events')} variant="primary" size="sm">
          Return to Catalog
        </Button>
      </div>
    );
  }

  const simulatedTotal = event.ticketPrice * Math.max(0, quantity);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-1 text-xs font-bold font-heading text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-white transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Cancel & Back to Event</span>
      </button>

      <div className="space-y-1">
        <div className="inline-flex items-center space-x-2 text-violet-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-widest">
          <Ticket className="w-4 h-4" />
          <span>Checkout Wizard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
          Reserve Attendee Passes
        </h1>
      </div>

      {/* Real-time Inventory Warning */}
      {inventoryWarning && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center space-x-2">
          <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>{inventoryWarning}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Quantity & Attendee Details */}
        <div className="md:col-span-7 space-y-6">
          {/* 1. Quantity Card */}
          <div className="glass-panel p-6 rounded-3xl space-y-4 shadow-soft">
            <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
              1. Ticket Quantity
            </h2>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft-sm">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Remaining Seats</span>
                <span
                  className={`text-sm font-extrabold font-heading ${
                    event.availableSeats > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                  }`}
                >
                  {event.availableSeats > 0 ? `${event.availableSeats} seats remaining` : 'SOLD OUT'}
                </span>
              </div>

              {event.availableSeats > 0 ? (
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1 || submitting}
                    className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition flex items-center justify-center shadow-soft-sm"
                  >
                    -
                  </button>
                  <span className="text-lg font-extrabold font-heading text-slate-900 dark:text-white px-2">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= Math.min(10, event.availableSeats) || submitting}
                    className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition flex items-center justify-center shadow-soft-sm"
                  >
                    +
                  </button>
                </div>
              ) : (
                <Badge variant="red">Unavailable</Badge>
              )}
            </div>
          </div>

          {/* 2. Attendee Details */}
          {event.availableSeats > 0 && (
            <div className="glass-panel p-6 rounded-3xl space-y-5 shadow-soft">
              <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                2. Attendee Passes Information
              </h2>
              {attendees.map((att, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3 shadow-soft-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400 font-heading">
                      Pass #{idx + 1} Attendee
                    </span>
                    <Badge variant="violet" size="sm">Attendee Pass</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={att.name}
                          onChange={(e) => handleAttendeeChange(idx, 'name', e.target.value)}
                          placeholder="Attendee Name"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={att.email}
                          onChange={(e) => handleAttendeeChange(idx, 'email', e.target.value)}
                          placeholder="Attendee Email"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Order Summary */}
        <div className="md:col-span-5 space-y-6 md:sticky md:top-24">
          <div className="glass-panel p-6 rounded-3xl space-y-5 border border-slate-200 dark:border-violet-500/30 shadow-soft">
            <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              3. Order Summary
            </h2>

            {/* Event Header Mini Card */}
            <div className="flex space-x-3 items-center">
              <img
                src={event.bannerImage}
                alt={event.title}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-800"
              />
              <div className="space-y-0.5 flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 font-heading">
                  {event.title}
                </h3>
                <div className="flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3 h-3 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span className="truncate">{event.venue}</span>
                </div>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Pass Price</span>
                <span className="text-slate-900 dark:text-white font-bold">${event.ticketPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity</span>
                <span className="text-slate-900 dark:text-white font-bold">x {quantity}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Processing</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">FREE (Project Demo)</span>
              </div>

              <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-sm">
                <span className="font-bold text-slate-900 dark:text-white">Simulated Booking Value</span>
                <span className="font-extrabold text-slate-900 dark:text-cyan-300 font-heading text-lg">
                  ${simulatedTotal}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-600/10 border border-violet-200 dark:border-violet-500/20 text-[11px] text-violet-700 dark:text-violet-300 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span>Atomic Transaction Lock</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-snug">
                Seats are reserved securely via backend Express Admin SDK Firestore transaction.
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting || event.availableSeats <= 0 || quantity <= 0}
              loading={submitting}
              variant="primary"
              size="lg"
              className="w-full"
              icon={<CheckCircle2 className="w-5 h-5" />}
            >
              {submitting
                ? 'Processing Reservation...'
                : event.availableSeats > 0
                ? `Confirm Booking ($${simulatedTotal})`
                : 'Event Sold Out'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
