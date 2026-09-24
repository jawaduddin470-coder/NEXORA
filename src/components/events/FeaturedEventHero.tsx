import React from 'react';
import { EventItem } from '../../types';
import { Calendar, MapPin, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';

interface FeaturedEventHeroProps {
  event: EventItem;
  onSelect: () => void;
}

export const FeaturedEventHero: React.FC<FeaturedEventHeroProps> = ({ event, onSelect }) => {
  const isSoldOut = event.availableSeats <= 0;

  return (
    <div
      onClick={onSelect}
      className="group cursor-pointer relative rounded-3xl overflow-hidden bg-slate-900 text-white border border-slate-800 shadow-xl transition-all duration-300 hover:border-slate-700"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
        {/* Left Editorial Info */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-6 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-white/10 text-white backdrop-blur-md border border-white/15">
                {event.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Featured Experience
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-white leading-tight group-hover:text-cyan-300 transition-colors">
              {event.title}
            </h2>

            <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-xl font-normal">
              {event.description}
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-300">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block">Date & Time</span>
                <span className="font-semibold text-white block mt-0.5">{event.date} {event.time ? `• ${event.time}` : ''}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block">Location</span>
                <span className="font-semibold text-white block mt-0.5 truncate">{event.venue}, {event.location}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block">Pass Price</span>
                <span className="font-semibold text-cyan-300 block mt-0.5 text-sm">
                  {event.ticketPrice === 0 ? 'FREE ACCESS' : `$${event.ticketPrice}`}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center space-x-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${isSoldOut ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`} />
                <span className="text-slate-300 font-medium">
                  {isSoldOut ? 'Sold Out' : `${event.availableSeats} of ${event.capacity} seats remaining`}
                </span>
              </div>

              <div className="inline-flex items-center space-x-2 text-sm font-bold text-white group-hover:text-cyan-300 group-hover:translate-x-1 transition-all">
                <span>Reserve Pass</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Image Banner */}
        <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full overflow-hidden">
          <img
            src={event.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900 via-slate-900/30 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default FeaturedEventHero;
