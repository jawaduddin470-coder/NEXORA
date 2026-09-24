import React from 'react';

interface AmbientBackgroundProps {
  variant?: 'showcase' | 'platform' | 'admin';
  className?: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  variant = 'platform',
  className = '',
}) => {
  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden z-0 select-none ${className}`}>
      {/* 1. Base Slate/Icy Architecture Canvas */}
      <div className="absolute inset-0 bg-[#F8FAFC] dark:bg-[#030712] transition-colors duration-500" />

      {/* 2. Atmospheric Gradients */}
      {variant === 'showcase' && (
        <>
          <div className="absolute top-0 right-1/4 w-[800px] h-[500px] bg-sky-200/30 dark:bg-violet-950/30 blur-[150px] rounded-full" />
          <div className="absolute top-[40%] -left-20 w-[600px] h-[600px] bg-indigo-200/25 dark:bg-cyan-950/20 blur-[140px] rounded-full" />
        </>
      )}

      {variant === 'platform' && (
        <>
          <div className="absolute top-0 right-10 w-[600px] h-[400px] bg-indigo-100/30 dark:bg-violet-950/25 blur-[140px] rounded-full" />
        </>
      )}

      {variant === 'admin' && (
        <>
          <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-indigo-950/30 blur-[140px] rounded-full" />
        </>
      )}

      {/* 3. Architectural Dot Grid */}
      <div className="absolute inset-0 bg-dot-grid opacity-60 dark:opacity-35" />

      {/* 4. High-Precision Orbital Rings & Geometric Arcs (Crisp & Visible) */}
      {/* Inner Primary Orbit */}
      <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full border border-indigo-500/20 dark:border-indigo-400/25 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500/40 dark:bg-indigo-400/60" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500/40 dark:bg-indigo-400/60" />
      </div>

      {/* Mid Orbit (Dashed) */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[1100px] h-[1100px] rounded-full border border-dashed border-violet-500/25 dark:border-violet-400/30 pointer-events-none" />

      {/* Outer Major Orbit */}
      <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[1600px] h-[1600px] rounded-full border border-slate-300/60 dark:border-slate-700/40 pointer-events-none">
        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-indigo-400/50 dark:border-indigo-400/70" />
        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-indigo-400/50 dark:border-indigo-400/70" />
      </div>

      {/* Deep Elliptical Arc */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[2100px] h-[2100px] rounded-full border border-cyan-500/15 dark:border-cyan-400/20 pointer-events-none" />

      {/* Fine Geometric Crosshairs & Hairline Axes */}
      <div className="hidden md:block absolute top-[28%] left-8 right-8 h-px bg-gradient-to-r from-transparent via-indigo-400/20 dark:via-indigo-400/15 to-transparent" />
      <div className="hidden lg:block absolute left-1/2 top-12 bottom-12 w-px bg-gradient-to-b from-transparent via-violet-400/20 dark:via-violet-400/15 to-transparent -translate-x-1/2" />

      {/* 5. Minimal Corner Coordinates & Status */}
      <div className="hidden lg:flex items-center space-x-2 absolute top-6 left-8 text-[9px] font-mono text-slate-400 dark:text-slate-500 tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 animate-pulse" />
        <span>SYS.LOC // 37.7749° N, 122.4194° W</span>
      </div>
      <div className="hidden lg:block absolute top-6 right-8 text-[9px] font-mono text-slate-400 dark:text-slate-500 tracking-widest">
        NEXORA.CORE // ORBITAL.V7
      </div>
    </div>
  );
};

export default AmbientBackground;
