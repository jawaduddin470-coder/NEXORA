import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BookingItem } from '../types';
import { Ticket3D } from '../components/3d/Ticket3D';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CheckCircle2, Calendar, MapPin, Ticket, Printer, ArrowRight, Sparkles, Download } from 'lucide-react';

export const BookingSuccess: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const location = useLocation();

  const [booking, setBooking] = useState<BookingItem | null>(
    (location.state as any)?.booking || null
  );
  const [loading, setLoading] = useState<boolean>(!booking);

  useEffect(() => {
    async function loadBooking() {
      if (booking || !bookingId || !db) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'bookings', bookingId));
        if (snap.exists()) {
          setBooking(snap.data() as BookingItem);
        }
      } catch (err) {
        console.error('Error loading booking confirmation:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBooking();
  }, [bookingId, booking]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8">
        <div className="h-96 bg-slate-200 dark:bg-slate-800/80 rounded-3xl animate-pulse border border-slate-200 dark:border-slate-800" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-soft">
        <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">Booking Not Found</h2>
        <Button onClick={() => window.location.href = '/my-bookings'} variant="primary" size="sm">
          Go to My Bookings
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Success Badge */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-500/30 shadow-soft">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
          Booking Confirmed!
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto font-medium">
          Your reservation is officially confirmed in Firestore. An in-app confirmation notification has been dispatched.
        </p>
      </div>

      {/* 3D Interactive Ticket Pass Showcase */}
      <div className="glass-panel p-6 rounded-3xl space-y-3 text-center shadow-soft">
        <span className="text-[10px] uppercase font-bold tracking-widest text-violet-600 dark:text-violet-400">
          Your Verified 3D Event Pass
        </span>
        <Ticket3D
          title={booking.eventTitle}
          category={booking.eventCategory || 'EVENT PASS'}
          date={booking.eventDate || '2026'}
          reference={booking.bookingReference}
          ticketQuantity={booking.quantity}
        />
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Rotate in 3D to inspect your verified holographic pass
        </p>
      </div>

      {/* Booking Specs Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-slate-200 dark:border-violet-500/30 shadow-soft">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block uppercase tracking-wider font-bold">
              Booking Reference
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-cyan-300 font-heading">
              {booking.bookingReference}
            </span>
          </div>

          <Badge variant="emerald" size="md">
            Status: {booking.status.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Event:</span>
            <p className="font-bold text-slate-900 dark:text-white text-sm font-heading">{booking.eventTitle}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Reserved For:</span>
            <p className="font-bold text-slate-900 dark:text-white text-sm">{booking.userName} ({booking.userEmail})</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Date & Time:</span>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {booking.eventDate} at {booking.eventTime}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Venue:</span>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {booking.eventVenue}, {booking.eventLocation}
            </p>
          </div>
        </div>

        {/* Barcode & Reference Strip */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-1.5 shadow-soft-sm">
          <div className="font-mono text-base sm:text-lg tracking-[0.3em] font-extrabold text-slate-600 dark:text-slate-400 uppercase select-all">
            ||||||| | ||||| ||| |||||| ||||
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            {booking.bookingId}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => window.print()}
            variant="secondary"
            size="md"
            className="flex-1"
            icon={<Printer className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
          >
            Print Attendee Pass
          </Button>

          <Button
            onClick={() => window.location.href = '/my-bookings'}
            variant="primary"
            size="md"
            className="flex-1"
            icon={<Ticket className="w-4 h-4" />}
          >
            View My Bookings →
          </Button>
        </div>
      </div>
    </div>
  );
};
