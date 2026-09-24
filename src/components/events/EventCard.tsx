import React from 'react';
import { EventItem } from '../../types';
import { Calendar, MapPin, ArrowRight, Sparkles, Users } from 'lucide-react';

interface EventCardProps {
  event: EventItem;
  onClick?: () => void;
  featured?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onClick, featured = false }) => {
  // Format Date (e.g., 'OCT 15')
  const dateObj = new Date(event.date);
  const month = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    : 'DATE';
  const day = !isNaN(dateObj.getTime()) ? dateObj.getDate() : '--';

  const isSoldOut = event.availableSeats <= 0;

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md flex flex-col justify-between ${
        featured ? 'ring-1 ring-slate-900/10 dark:ring-white/10' : ''
      }`}
    >
      {/* Visual Image Header */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={event.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Date Stamp Overlay (Top Left) */}
        <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md rounded-xl p-2 text-center min-w-[48px] shadow-sm border border-slate-200/60 dark:border-slate-800">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono leading-none">
            {month}
          </span>
          <span className="block text-base font-extrabold font-heading text-slate-900 dark:text-white leading-tight mt-0.5">
            {day}
          </span>
        </div>

        {/* Category & Status Overlay (Top Right) */}
        <div className="absolute top-3 right-3 flex items-center space-x-1.5">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-950/80 text-white backdrop-blur-md">
            {event.category}
          </span>
          {event.featured && (
            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Price Tag (Bottom Right) */}
        <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg text-xs font-extrabold font-heading bg-white/95 dark:bg-slate-950/95 text-slate-900 dark:text-white backdrop-blur-md border border-slate-200/60 dark:border-slate-800 shadow-sm">
          {event.ticketPrice === 0 ? 'FREE ACCESS' : `$${event.ticketPrice}`}
        </div>
      </div>

      {/* Editorial Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white line-clamp-1 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
            {event.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Metadata Details */}
        <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{event.venue}, {event.location}</span>
          </div>
          {event.time && (
            <div className="flex items-center space-x-1.5 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{event.time}</span>
            </div>
          )}
        </div>

        {/* Footer Availability & Link */}
        <div className="pt-2 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isSoldOut ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span
              className={`font-medium ${
                isSoldOut ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {isSoldOut ? 'Sold Out' : `${event.availableSeats} passes left`}
            </span>
          </div>

          <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            {isSoldOut ? 'View Pass' : 'Reserve'}
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
