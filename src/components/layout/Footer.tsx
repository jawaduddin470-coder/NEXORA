import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Linkedin, Github, Compass, ArrowRight, ShieldCheck, Ticket, Sparkles, Zap, ChevronRight } from 'lucide-react';
import { FooterCanvas } from '../3d/FooterCanvas';
import { NexoraLogo } from '../common/NexoraLogo';
import { Button } from '../ui/Button';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="w-full bg-[#030712] text-slate-100 border-t border-slate-800/80 pt-20 pb-12 mt-28 relative overflow-hidden selection:bg-brand-purple selection:text-white">
      {/* Ambient Atmospheric Glows */}
      <div className="absolute top-0 left-1/4 w-[700px] h-[350px] bg-violet-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[300px] bg-cyan-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Geometric Orbital Hairlines */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full border border-indigo-500/10 pointer-events-none -translate-y-1/2" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1600px] h-[800px] rounded-full border border-dashed border-violet-500/10 pointer-events-none -translate-y-1/2" />
      <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* =========================================================================
            UPPER SIGNATURE CTA SECTION
        ========================================================================= */}
        <div className="relative rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-slate-800/90 p-8 sm:p-12 lg:p-16 overflow-hidden shadow-2xl">
          {/* Internal Glow Effects */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-purple/20 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-cyan/15 blur-3xl rounded-full pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* CTA Typography & Action */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-violet-200">
                  THE NEXT EXPERIENCE IS WAITING
                </span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight leading-[1.1]">
                Find something worth <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  showing up for.
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto lg:mx-0 font-normal leading-relaxed">
                Discover curated summits, live music, workshops, and sports. Reserve your place with atomic capacity locks and carry your 3D pass everywhere.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button
                  onClick={() => navigate('/events')}
                  size="lg"
                  variant="primary"
                  className="w-full sm:w-auto shadow-lg shadow-violet-500/20"
                  icon={<Compass className="w-4 h-4" />}
                >
                  Explore Events
                </Button>
                <Link
                  to="/my-bookings"
                  className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors group px-4 py-3"
                >
                  <Ticket className="w-4 h-4 text-cyan-400" />
                  <span>View My Passes</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* 3D Visual Brand Moment */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <FooterCanvas className="w-64 h-64 sm:w-80 sm:h-80" />
            </div>
          </div>
        </div>

        {/* =========================================================================
            MAIN 4-COLUMN FOOTER GRID
        ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pt-4 border-t border-slate-800/80">
          {/* Column 1: NEXORA Brand Identity (4 cols) */}
          <div className="lg:col-span-4 space-y-4 text-left">
            <NexoraLogo size="md" showTagline={false} />
            <div className="text-xs font-mono font-bold tracking-widest uppercase text-slate-300">
              DISCOVER. EXPERIENCE. BELONG.
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              A next-generation event discovery and booking platform engineered to connect people with meaningful live experiences with guaranteed seat inventory and 3D collectible passes.
            </p>
            <div className="pt-2 flex items-center space-x-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cryptographically secured transactions & pass generation</span>
            </div>
          </div>

          {/* Column 2: Explore Navigation (2.5 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
              EXPLORE
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/events" className="hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                  <span className="text-violet-400">›</span> Explore Events
                </Link>
              </li>
              <li>
                <Link to="/events?category=Technology" className="hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                  <span className="text-violet-400">›</span> Event Categories
                </Link>
              </li>
              <li>
                <a href="/#ecosystem-flow" className="hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                  <span className="text-violet-400">›</span> How It Works
                </a>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                  <span className="text-violet-400">›</span> User Dashboard
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                  <span className="text-violet-400">›</span> My Passes
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform Architecture (2.5 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
              PLATFORM
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/events" className="hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                  <span className="text-cyan-400">›</span> Secure Booking
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                  <span className="text-cyan-400">›</span> Digital Passes
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                  <span className="text-cyan-400">›</span> Real-Time Availability
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                  <span className="text-cyan-400">›</span> Notifications
                </Link>
              </li>
              <li>
                <Link to="/login/admin" className="hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                  <span className="text-cyan-400">›</span> Event Management
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Connect & Attribution (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
              CONNECT
            </h4>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">Platform Architect</span>
              <p className="text-sm font-bold font-heading text-white">
                Mohammed Meraj Uddin
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 pt-1">
              <a
                href="https://www.linkedin.com/in/mohammed-meraj-uddin-0751a6396/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-violet-500/50 hover:bg-violet-950/30 transition-all text-xs font-semibold group shadow-sm"
              >
                <Linkedin className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                <span>Connect on LinkedIn</span>
              </a>

              <a
                href="https://github.com/jawaduddin470-coder"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-violet-500/50 hover:bg-violet-950/30 transition-all text-xs font-semibold group shadow-sm"
              >
                <Github className="w-4 h-4 text-slate-300 group-hover:scale-110 transition-transform" />
                <span>View Source on GitHub</span>
              </a>
            </div>
          </div>
        </div>

        {/* =========================================================================
            BOTTOM COPYRIGHT BAR
        ========================================================================= */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 NEXORA Experience Platform. All rights reserved.</p>
          <p className="font-mono text-[11px] text-slate-400 flex items-center space-x-1.5">
            <span>Built with React</span>
            <span className="text-slate-600">•</span>
            <span>Three.js</span>
            <span className="text-slate-600">•</span>
            <span>Firebase</span>
            <span className="text-slate-600">•</span>
            <span>Express</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
