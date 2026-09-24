import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { EventItem } from '../types';
import { HeroCanvas } from '../components/3d/HeroCanvas';
import { Ticket3D } from '../components/3d/Ticket3D';
import { useIntro } from '../context/IntroContext';
import { EventCard } from '../components/events/EventCard';
import { FeaturedEventHero } from '../components/events/FeaturedEventHero';
import { Button } from '../components/ui/Button';
import {
  Compass,
  Sparkles,
  Calendar,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  TrendingUp,
  ChevronDown,
  Search,
  Play,
  QrCode,
  Lock,
  Cpu,
  Ticket,
  CheckCircle2,
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Technology', icon: Zap, desc: 'Global summits, developer conferences, and AI keynote events.', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600' },
  { name: 'Music', icon: Sparkles, desc: 'Electronic festivals, acoustic performances, and symphonies.', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600' },
  { name: 'Business', icon: ShieldCheck, desc: 'Executive summits, venture forums, and leadership seminars.', image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600' },
  { name: 'Workshop', icon: Compass, desc: 'Interactive masterclasses and hands-on skill labs.', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600' },
  { name: 'Sports', icon: TrendingUp, desc: 'Championship tournaments, esports arenas, and matches.', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600' },
  { name: 'Education', icon: Users, desc: 'Academic symposiums, campus summits, and tech expos.', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600' },
  { name: 'Art', icon: Sparkles, desc: 'Immersive digital exhibits and contemporary art expos.', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600' },
  { name: 'Conference', icon: Calendar, desc: 'Multi-track industry conventions and networking summits.', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600' },
];

const ECOSYSTEM_FLOW = [
  { title: 'Discovery', desc: 'Curated global events', step: '01' },
  { title: 'Selection', desc: 'Real-time seat inventory', step: '02' },
  { title: 'Reservation', desc: 'Atomic transaction locks', step: '03' },
  { title: 'Digital Pass', desc: '3D WebGL collectible ticket', step: '04' },
  { title: 'Event Day', desc: 'Instant QR access check-in', step: '05' },
];

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { playIntro } = useIntro();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalCapacity: 0,
    categoriesCount: 8,
    totalBookings: 0,
  });

  const handleReplayIntro = () => {
    playIntro();
  };

  const handleEnterPlatform = (destination = '/events') => {
    navigate(destination);
  };

  useEffect(() => {
    async function loadData() {
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, 'events'));
        const list = snap.docs.map((d) => ({ eventId: d.id, ...d.data() })) as EventItem[];
        const publishedList = list.filter((e) => e.status !== 'draft');

        // Compute community booking statistics from published events capacity
        const totalCap = publishedList.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
        const totalBookingsCount = publishedList.reduce(
          (acc, curr) => acc + Math.max(0, (curr.capacity || 0) - (curr.availableSeats ?? (curr.capacity || 0))),
          0
        );

        publishedList.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        setEvents(publishedList);

        setStats({
          totalEvents: publishedList.length,
          totalCapacity: totalCap,
          categoriesCount: CATEGORIES.length,
          totalBookings: totalBookingsCount,
        });
      } catch (err) {
        console.error('Failed to load events for showcase:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const featuredEvent = events.find((e) => e.featured) || events[0];
  const remainingEvents = featuredEvent ? events.filter((e) => e.eventId !== featuredEvent.eventId) : events;

  const spotlightEvent = events[0] || {
    eventId: 'sample',
    title: 'Global AI & Web3 Summit 2026',
    date: '2026-10-15',
    time: '09:00 AM',
    venue: 'Metropolis Convention Center',
    location: 'San Francisco, CA',
    ticketPrice: 299,
    capacity: 500,
    availableSeats: 482,
  };

  return (
    <div className="space-y-24 sm:space-y-32 pb-24 overflow-hidden">
        {/* =========================================================================
            HERO SECTION
        ========================================================================= */}
        <section className="relative pt-6 sm:pt-12 pb-8 sm:pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Editorial Column */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
                    EVENT PLATFORM // 2026
                  </span>

                  <button
                    onClick={handleReplayIntro}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                    title="Replay the 3D brand film"
                  >
                    <Play className="w-3 h-3 fill-current text-slate-900 dark:text-white" />
                    <span>Replay Brand Film</span>
                  </button>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-heading tracking-tight text-slate-900 dark:text-white leading-[1.05]">
                  DISCOVER.{' '}
                  <span className="text-slate-400 dark:text-slate-500">EXPERIENCE.</span>{' '}
                  BELONG.
                </h1>

                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Connect with curated live experiences across technology, arts, music, and business with atomic concurrency handling.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                  <Button
                    onClick={() => handleEnterPlatform('/events')}
                    size="lg"
                    variant="primary"
                    icon={<Compass className="w-4 h-4" />}
                  >
                    Explore Experiences
                  </Button>

                  <a
                    href="#live-events"
                    className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors"
                  >
                    <span>View Live Events</span>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </a>
                </div>

                {/* Technical Architecture Badges */}
                <div className="pt-8 grid grid-cols-3 gap-6 border-t border-slate-200/80 dark:border-slate-800 max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                  <div>
                    <span className="block text-xl sm:text-2xl font-extrabold font-heading text-slate-900 dark:text-white">Atomic</span>
                    <span className="text-[11px] text-slate-500 font-mono block mt-0.5">Reservation Locks</span>
                  </div>
                  <div>
                    <span className="block text-xl sm:text-2xl font-extrabold font-heading text-slate-900 dark:text-white">3D Pass</span>
                    <span className="text-[11px] text-slate-500 font-mono block mt-0.5">WebGL Tickets</span>
                  </div>
                  <div>
                    <span className="block text-xl sm:text-2xl font-extrabold font-heading text-slate-900 dark:text-white">Real-Time</span>
                    <span className="text-[11px] text-slate-500 font-mono block mt-0.5">Cloud Firestore</span>
                  </div>
                </div>
              </div>

              {/* Right 3D Interactive Canvas */}
              <div className="lg:col-span-5 relative">
                <HeroCanvas />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SYSTEM ARCHITECTURE FLOW (CONTINUOUS HORIZONTAL PROGRESSION)
        ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                SYSTEM ARCHITECTURE
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">
                One platform. Every experience.
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              From developer summits to acoustic masterclasses, discovery and ticketing are unified.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {ECOSYSTEM_FLOW.map((item, idx) => (
              <div
                key={item.title}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    {item.step}
                  </span>
                  {idx < ECOSYSTEM_FLOW.length - 1 && (
                    <ArrowRight className="hidden lg:block w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            CURATED EXPERIENCES (GENRES)
        ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                CURATED EXPERIENCES
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">
                Explore by Category
              </h2>
            </div>
            <button
              onClick={() => handleEnterPlatform('/events')}
              className="text-xs font-semibold text-slate-900 dark:text-white hover:underline flex items-center space-x-1 group"
            >
              <span>Explore All Categories</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                onClick={() => handleEnterPlatform(`/events?category=${encodeURIComponent(cat.name)}`)}
                className="relative h-60 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer group hover:border-slate-400 dark:hover:border-slate-600 transition-all shadow-sm"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent p-5 flex flex-col justify-end">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400">GENRE</span>
                  <h4 className="text-lg font-bold font-heading text-white mt-0.5">{cat.name}</h4>
                  <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 leading-snug">
                    {cat.desc}
                  </p>
                  <span className="text-xs font-semibold text-white mt-3 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Browse Passes →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            LIVE & UPCOMING EVENTS (REAL FIRESTORE INTEGRATION)
        ========================================================================= */}
        <section id="live-events" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                LIVE INVENTORY
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">
                Featured & Upcoming Events
              </h2>
            </div>
            <button
              onClick={() => handleEnterPlatform('/events')}
              className="text-xs font-semibold text-slate-900 dark:text-white hover:underline flex items-center space-x-1 group"
            >
              <span>View Full Catalog ({events.length})</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-6">
              <div className="h-72 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-8">
              {featuredEvent && (
                <FeaturedEventHero
                  event={featuredEvent}
                  onSelect={() => handleEnterPlatform(`/events/${featuredEvent.eventId}`)}
                />
              )}

              {remainingEvents.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {remainingEvents.slice(0, 6).map((evt) => (
                    <EventCard
                      key={evt.eventId}
                      event={evt}
                      onClick={() => handleEnterPlatform(`/events/${evt.eventId}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No events currently listed</h3>
              <p className="text-xs text-slate-500">Check back soon for newly published community experiences.</p>
            </div>
          )}
        </section>

        {/* =========================================================================
            TRANSACTION INTEGRITY & CONCURRENCY
        ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center shadow-sm">
            <div className="lg:col-span-6 space-y-6">
              <span className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold">
                TRANSACTION INTEGRITY
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white leading-tight">
                Engineered for concurrency. Authoritative seat locks.
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                NEXORA's transaction engine uses atomic server-side locks with Cloud Firestore. When attendees reserve simultaneous seats, every ticket decrement is guaranteed consistent.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
                    <span>Atomic Locks</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Prevents concurrent seat decrement conflicts.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
                    <span>Real-Time Sync</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Live seat inventory reflected across all clients.
                  </p>
                </div>
              </div>
            </div>

            {/* Dynamic Capacity Gauge Visualizer */}
            <div className="lg:col-span-6 bg-slate-950 text-white p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Live Capacity Telemetry
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">ID: {spotlightEvent.eventId.slice(0, 8)}</span>
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold font-heading text-white truncate">
                  {spotlightEvent.title}
                </h4>
                <p className="text-xs text-slate-400">{spotlightEvent.venue}, {spotlightEvent.location}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Reserved: {spotlightEvent.capacity - (spotlightEvent.availableSeats ?? 0)}</span>
                  <span className="text-white font-bold">{spotlightEvent.availableSeats} Passes Left</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{
                      width: `${Math.max(15, Math.min(95, ((spotlightEvent.capacity - (spotlightEvent.availableSeats ?? 0)) / spotlightEvent.capacity) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Total Venue Capacity: {spotlightEvent.capacity}</span>
                <span className="text-emerald-400 font-semibold">Status: Accepting Reservations</span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            DIGITAL PASS SYSTEM
        ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                DIGITAL IDENTITY
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">
                Your pass starts before you arrive.
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              Every confirmed reservation generates an interactive 3D WebGL attendee pass with instant QR verification.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 flex justify-center">
              <Ticket3D
                title={spotlightEvent.title}
                date={spotlightEvent.date}
                reference="NX-2026-SHOWCASE"
                category="VIP ACCESS"
                ticketQuantity={1}
              />
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-white">
                  <QrCode className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span>Instant Verification QR</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Structured booking reference allows event organizers to verify attendee access on check-in.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-white">
                  <Sparkles className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span>Interactive 3D Pass</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tilt and rotate your pass in full 3D space with reactive specular highlights and holographic edge lighting.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span>Permanent Attendance Archive</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Access past passes, verified timestamps, and seat records anytime from your personal user dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            PLATFORM TELEMETRY (REAL FIRESTORE DATA)
        ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-10 rounded-2xl bg-slate-900 text-white border border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <span className="text-3xl sm:text-4xl font-extrabold font-heading text-white block">
                {stats.totalEvents}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                Live Events
              </span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-extrabold font-heading text-white block">
                {stats.totalCapacity.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                Seat Inventory
              </span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-extrabold font-heading text-white block">
                {stats.categoriesCount}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                Active Categories
              </span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-extrabold font-heading text-white block">
                {stats.totalBookings}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                Confirmed Bookings
              </span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            FINAL INVITATION
        ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-14 border border-slate-800 space-y-6">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
              DISCOVER • EXPERIENCE • BELONG
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-heading leading-tight max-w-2xl">
              Your next experience is waiting.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-normal max-w-xl">
              Join attendees reserving verified summits, masterclasses, and esports arenas on NEXORA.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Button
                onClick={() => handleEnterPlatform('/events')}
                size="lg"
                variant="white"
                icon={<Compass className="w-4 h-4 text-slate-900" />}
              >
                Explore Experiences
              </Button>
            </div>
          </div>
        </section>
      </div>
  );
};

export default LandingPage;
