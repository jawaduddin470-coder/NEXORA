import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { EventItem } from '../types';
import { Ticket3D } from '../components/3d/Ticket3D';
import { Button } from '../components/ui/Button';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  Share2,
  Sparkles,
  CheckCircle2,
  Check,
} from 'lucide-react';

export const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [quantity, setQuantity] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!id || !db) {
      setLoading(false);
      return;
    }

    const eventRef = doc(db, 'events', id);
    const unsubscribe = onSnapshot(
      eventRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setEvent({ eventId: docSnap.id, ...docSnap.data() } as EventItem);
        } else {
          setEvent(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Realtime Event detail error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4">
        <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">Event Not Found</h2>
        <p className="text-xs text-slate-500">The requested event listing does not exist or has been removed.</p>
        <Link
          to="/events"
          className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold"
        >
          Back to Events Catalog
        </Link>
      </div>
    );
  }

  const isSoldOut = event.availableSeats <= 0;
  const maxSelectable = Math.min(10, Math.max(1, event.availableSeats));
  const orderTotal = event.ticketPrice * quantity;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Link Copied' : 'Share Event'}</span>
        </button>
      </div>

      {/* Cinematic Banner Image */}
      <div className="relative aspect-[21/9] sm:aspect-[2.5/1] rounded-3xl overflow-hidden bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md">
        <img
          src={event.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600'}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-6 sm:p-10 flex flex-col justify-end">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-white/20 text-white backdrop-blur-md border border-white/20">
              {event.category}
            </span>
            {event.featured && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3" /> Featured
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-white leading-tight">
            {event.title}
          </h1>
        </div>
      </div>

      {/* 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Information & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Metadata Specs Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">Date</span>
              <div className="flex items-center space-x-1.5 mt-1 font-semibold text-slate-900 dark:text-white text-sm">
                <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{event.date}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">Time</span>
              <div className="flex items-center space-x-1.5 mt-1 font-semibold text-slate-900 dark:text-white text-sm">
                <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{event.time || '09:00 AM'}</span>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">Venue</span>
              <div className="flex items-center space-x-1.5 mt-1 font-semibold text-slate-900 dark:text-white text-sm">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="truncate">{event.venue}, {event.location}</span>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
              About This Experience
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* 3D Ticket Pass Spotlight */}
          <div className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                3D Collectible Pass Preview
              </h3>
              <span className="text-xs text-slate-500 font-mono">INTERACTIVE WEBGL</span>
            </div>
            <div className="flex justify-center p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <Ticket3D
                title={event.title}
                date={event.date}
                reference={`NX-${event.eventId.slice(0, 6).toUpperCase()}`}
                category={event.category}
                ticketQuantity={quantity}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Transactional Booking Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 h-fit">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Pass Price</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
                  {event.ticketPrice === 0 ? 'FREE' : `$${event.ticketPrice}`}
                </span>
                <span className="text-xs text-slate-500">per attendee pass</span>
              </div>
            </div>

            {/* Live Availability Gauge */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${isSoldOut ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                  <span className={isSoldOut ? 'text-rose-600' : 'text-slate-900 dark:text-white'}>
                    {isSoldOut ? 'Sold Out' : `${event.availableSeats} of ${event.capacity} passes left`}
                  </span>
                </div>
                <span className="font-mono text-slate-400">Total: {event.capacity}</span>
              </div>

              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-slate-900 dark:bg-white transition-all duration-300"
                  style={{
                    width: `${Math.max(10, Math.min(100, ((event.capacity - event.availableSeats) / event.capacity) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Quantity Selector */}
            {!isSoldOut && (
              <div className="space-y-2">
                <label className="text-xs font-bold font-heading text-slate-900 dark:text-white uppercase tracking-wider block">
                  Select Pass Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-base hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-lg font-bold font-heading text-slate-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(maxSelectable, quantity + 1))}
                    disabled={quantity >= maxSelectable}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-base hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Order Breakdown */}
            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Pass Price</span>
                <span className="font-semibold text-slate-900 dark:text-white">${event.ticketPrice} x {quantity}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Processing</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">FREE (Demo)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white">
                <span>Simulated Order Total</span>
                <span className="text-lg font-heading">${orderTotal}</span>
              </div>
            </div>

            {/* Concurrency Guarantee Notice */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
                <span>Atomic Transaction Lock</span>
              </div>
              <p className="leading-snug text-slate-500">
                Seats decrement via server-side Cloud Firestore transaction to guarantee zero overbooking.
              </p>
            </div>

            <Button
              onClick={() => {
                const bookingUrl = `/booking/${event.eventId}?quantity=${quantity}`;
                if (!user) {
                  navigate(`/login?redirect=${encodeURIComponent(bookingUrl)}`);
                } else {
                  navigate(bookingUrl);
                }
              }}
              disabled={isSoldOut}
              variant="primary"
              size="lg"
              className="w-full"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isSoldOut ? 'Sold Out' : `Reserve Passes ($${orderTotal})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
