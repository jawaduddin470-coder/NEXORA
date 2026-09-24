import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CinematicIntroCanvas } from './CinematicIntroCanvas';
import { ArrowRight } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
  durationSeconds?: number;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({
  onComplete,
  durationSeconds = 8.5,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [progress, setProgress] = useState(0); // 0.0 to 1.0
  const [phase, setPhase] = useState(1); // 1 to 7
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isReadyToEnter, setIsReadyToEnter] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReducedMotion) {
      setProgress(1.0);
      setPhase(7);
      setIsReadyToEnter(true);
      return;
    }

    const durationMs = durationSeconds * 1000;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const currentProgress = Math.min(1.0, elapsed / durationMs);
      setProgress(currentProgress);

      // Storyline Sequence
      if (currentProgress < 0.16) setPhase(1); // Discover
      else if (currentProgress < 0.34) setPhase(2); // Experiences
      else if (currentProgress < 0.50) setPhase(3); // Network
      else if (currentProgress < 0.65) setPhase(4); // People
      else if (currentProgress < 0.80) setPhase(5); // Convergence
      else if (currentProgress < 0.95) setPhase(6); // NEXORA Reveal & Climax
      else {
        setPhase(7); // Final State with GET STARTED
        setIsReadyToEnter(true);
      }

      if (currentProgress < 1.0) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [durationSeconds, prefersReducedMotion]);

  const handleSkip = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
      if (location.pathname === '/') {
        navigate('/events');
      }
    }, 450);
  };

  const handleGetStarted = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsFadingOut(true);

    setTimeout(() => {
      onComplete();
      // Unauthenticated visitors navigate to public Explore (/events)
      // Authenticated users go to /dashboard (or stay on current page)
      if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
        if (user) {
          navigate('/dashboard');
        } else {
          navigate('/events');
        }
      }
    }, 650);
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-[#030712] text-white select-none overflow-hidden transition-all duration-700 ease-out ${
        isFadingOut ? 'opacity-0 scale-[1.04] blur-sm pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Cinematic Ambient Atmosphere */}
      <div className="absolute top-0 left-1/3 w-[800px] h-[400px] bg-violet-600/15 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[350px] bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />

      {/* Top Header Bar: Clean & Minimal (NO website navbar) */}
      <div className="relative z-30 w-full max-w-7xl mx-auto px-6 py-6 sm:py-8 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center space-x-3">
          <span className="font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-slate-400 uppercase">
            NEXORA // CINEMATIC INTRO 2.0
          </span>
        </div>

        <button
          onClick={handleSkip}
          className="group inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 backdrop-blur-md border border-white/15 hover:border-white/30 text-slate-200 text-xs font-semibold tracking-wider transition-all shadow-sm"
          aria-label="Skip Intro"
        >
          <span>SKIP INTRO</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-slate-300" />
        </button>
      </div>

      {/* 3D WebGL Canvas Layer (Floating passes, network lines, converging energy) */}
      <div className="absolute inset-0 z-10">
        <CinematicIntroCanvas progress={progress} phase={phase} />
      </div>

      {/* Center Stage: Authoritative Crystalline N Reveal (Emerges from Convergence) */}
      <div className="relative z-20 flex-1 w-full max-w-4xl mx-auto px-6 flex flex-col items-center justify-center pointer-events-auto">
        {progress >= 0.58 ? (
          <div
            className="flex flex-col items-center transition-all duration-1000 ease-out"
            style={{
              opacity: prefersReducedMotion ? 1 : Math.min(1, Math.max(0, (progress - 0.58) / 0.18)),
              transform: prefersReducedMotion
                ? 'scale(1)'
                : `scale(${0.88 + Math.min(0.12, Math.max(0, (progress - 0.58) / 0.18) * 0.12)})`,
            }}
          >
            {/* Luminous Atmospheric Depth & Pure Transparent N Asset */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 w-80 h-80 sm:w-[420px] sm:h-[420px] bg-gradient-to-tr from-violet-600/25 via-indigo-500/15 to-cyan-500/20 blur-[100px] rounded-full pointer-events-none" />

              {/* Authoritative 3D N Asset with True Transparency (NO black rectangle) */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-[380px] md:h-[380px] lg:w-[420px] lg:h-[420px] max-w-[42vw] aspect-square flex items-center justify-center">
                <img
                  src="/brand/nexora-3d-n.png"
                  alt="NEXORA Official Crystalline 3D Identity"
                  className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_0_35px_rgba(99,102,241,0.35)] transition-transform duration-700"
                  loading="eager"
                />
              </div>
            </div>

            {/* Staggered Typography & CTA Hierarchy (N -> NEXORA -> Taglines -> GET STARTED) */}
            <div className="-mt-3 sm:-mt-5 flex flex-col items-center space-y-3 text-center">
              {progress >= 0.74 && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-3 duration-700">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-[0.25em] text-white drop-shadow-md">
                    NEXORA
                  </h1>

                  {progress >= 0.80 && (
                    <p className="text-xs sm:text-sm font-bold font-heading tracking-[0.22em] text-violet-300 uppercase animate-in fade-in duration-500">
                      DISCOVER. EXPERIENCE. BELONG.
                    </p>
                  )}

                  {progress >= 0.85 && (
                    <div className="flex items-center justify-center gap-3 pt-0.5 animate-in fade-in duration-500">
                      <div className="h-[1px] w-6 sm:w-10 bg-slate-600" />
                      <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] text-slate-400 uppercase">
                        EVENTS FOR A BRIGHTER TOMORROW
                      </span>
                      <div className="h-[1px] w-6 sm:w-10 bg-slate-600" />
                    </div>
                  )}
                </div>
              )}

              {/* Final State GET STARTED Button */}
              {isReadyToEnter && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pt-3 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleGetStarted}
                    className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center space-x-2.5"
                  >
                    <span>GET STARTED</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={handleSkip}
                    className="text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-1.5"
                  >
                    Skip to Explore
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Narrative Story Captions (Phases 1 - 5) */
          <div className="w-full max-w-2xl text-center space-y-4 min-h-[140px] flex flex-col items-center justify-center">
            {phase === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-3 duration-600 space-y-1.5">
                <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-violet-300">
                  DISCOVER
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
                  Every experience begins with curiosity.
                </h2>
              </div>
            )}

            {phase === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-3 duration-600 space-y-1.5">
                <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-cyan-300">
                  EXPERIENCES
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
                  Music • Technology • Sports • Arts • Summits
                </h2>
              </div>
            )}

            {phase === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-3 duration-600 space-y-1.5">
                <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-violet-300">
                  NETWORK
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
                  Connecting ideas, creators, and audiences.
                </h2>
              </div>
            )}

            {phase === 4 && (
              <div className="animate-in fade-in slide-in-from-bottom-3 duration-600 space-y-1.5">
                <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-cyan-300">
                  PEOPLE
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
                  Events are about people.
                </h2>
              </div>
            )}

            {phase === 5 && (
              <div className="animate-in fade-in slide-in-from-bottom-3 duration-600 space-y-1.5">
                <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-indigo-300">
                  CONVERGENCE
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
                  Uniting into one synchronized event ecosystem.
                </h2>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Segmented Minimal Progress Bar */}
      <div className="relative z-30 w-full max-w-sm mx-auto px-6 pb-6">
        <div className="w-full h-[2px] bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-400 transition-all duration-100 rounded-full"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default CinematicIntro;
