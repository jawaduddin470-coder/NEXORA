import React from 'react';

interface NexoraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showText?: boolean;
  showTagline?: boolean;
  showSecondaryTagline?: boolean;
  className?: string;
}

export const NexoraLogo: React.FC<NexoraLogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  showSecondaryTagline = false,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 32, text: 'text-lg', subtext: 'text-[9px]', sub2: 'text-[8px]', tracking: 'tracking-[0.18em]' },
    md: { icon: 42, text: 'text-2xl', subtext: 'text-[10px]', sub2: 'text-[9px]', tracking: 'tracking-[0.24em]' },
    lg: { icon: 64, text: 'text-3xl', subtext: 'text-xs', sub2: 'text-[10px]', tracking: 'tracking-[0.28em]' },
    xl: { icon: 96, text: 'text-5xl', subtext: 'text-sm', sub2: 'text-xs', tracking: 'tracking-[0.32em]' },
    hero: { icon: 140, text: 'text-6xl sm:text-7xl', subtext: 'text-sm sm:text-base', sub2: 'text-xs sm:text-sm', tracking: 'tracking-[0.35em]' },
  };

  const { icon, text, subtext, sub2, tracking } = sizeMap[size];

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <div className="flex items-center gap-3.5">
        {/* Official NEXORA Faceted Crystalline Symbol SVG */}
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 transition-transform duration-300 group-hover:scale-105 filter drop-shadow-sm"
        >
          <defs>
            {/* Gradients matching the official reference */}
            <linearGradient id="leftPillarGrad" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="40%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>

            <linearGradient id="leftFacetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C084FC" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.4" />
            </linearGradient>

            <linearGradient id="diagMainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="45%" stopColor="#06B6D4" />
              <stop offset="75%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#4338CA" />
            </linearGradient>

            <linearGradient id="diagFacetHighlight" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#67E8F9" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
            </linearGradient>

            <linearGradient id="rightPillarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.75" />
            </linearGradient>

            <linearGradient id="rightFacetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="orbitalRingGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C084FC" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="sphereGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>

            <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Ambient Subtle Radial Glow */}
          <ellipse cx="100" cy="100" rx="65" ry="45" fill="#818CF8" fillOpacity="0.1" filter="url(#softGlow)" />

          {/* Rear Segment of Orbital Ring */}
          <path
            d="M 45 80 C 60 55, 140 45, 165 95"
            stroke="url(#orbitalRingGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.65"
          />

          {/* Left Vertical Crystalline Pillar */}
          {/* Main Body */}
          <polygon
            points="65,35 88,48 88,110 65,97"
            fill="url(#leftPillarGrad)"
          />
          {/* Left Pillar Front Bevel */}
          <polygon
            points="65,35 65,97 88,110 88,48"
            fill="url(#leftFacetGrad)"
            opacity="0.85"
          />
          {/* Left Pillar Top Crystal Cap */}
          <polygon
            points="65,35 77,28 88,48 65,35"
            fill="#DDD6FE"
            opacity="0.9"
          />

          {/* Faceted Diagonal Crystalline Slash */}
          {/* Main Body */}
          <polygon
            points="65,35 140,118 118,118 65,58"
            fill="url(#diagMainGrad)"
          />
          {/* Lower Extension Slash */}
          <polygon
            points="88,110 135,165 148,155 102,100"
            fill="url(#diagMainGrad)"
            opacity="0.95"
          />
          {/* Diagonal Specular Spine Highlight */}
          <polygon
            points="70,40 142,122 138,126 66,45"
            fill="url(#diagFacetHighlight)"
          />

          {/* Right Vertical Crystalline Pillar */}
          {/* Main Body */}
          <polygon
            points="112,48 135,35 135,110 112,118"
            fill="url(#rightPillarGrad)"
          />
          {/* Right Pillar Top Facet */}
          <polygon
            points="112,48 124,28 135,35 112,48"
            fill="url(#rightFacetGrad)"
          />
          {/* Right Pillar Beveled Edge */}
          <polygon
            points="128,38 135,35 135,110 128,114"
            fill="#BAE6FD"
            opacity="0.75"
          />

          {/* Front Segment of Orbital Ring */}
          <path
            d="M 165 95 C 175 120, 110 160, 45 80"
            stroke="url(#orbitalRingGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Orbiting Satellite Sphere */}
          <circle cx="150" cy="108" r="7.5" fill="url(#sphereGrad)" filter="url(#softGlow)" />
          <circle cx="148" cy="106" r="2.5" fill="#FFFFFF" opacity="0.8" />

          {/* Twin 4-Pointed Sparkle Stars (Upper Right) */}
          {/* Star 1 (Major) */}
          <path
            d="M 148 38 C 148 44, 150 46, 156 46 C 150 46, 148 48, 148 54 C 148 48, 146 46, 140 46 C 146 46, 148 44, 148 38 Z"
            fill="#7C3AED"
            filter="url(#softGlow)"
          />
          <path
            d="M 148 38 C 148 44, 150 46, 156 46 C 150 46, 148 48, 148 54 C 148 48, 146 46, 140 46 C 146 46, 148 44, 148 38 Z"
            fill="#C084FC"
          />

          {/* Star 2 (Minor) */}
          <path
            d="M 160 52 C 160 56, 161 57, 165 57 C 161 57, 160 58, 160 62 C 160 58, 159 57, 155 57 C 159 57, 160 56, 160 52 Z"
            fill="#8B5CF6"
          />
        </svg>

        {/* Official Wordmark with Star inside the 'O' */}
        {showText && (
          <div className="flex flex-col">
            <div className={`font-heading font-extrabold ${tracking} text-slate-900 dark:text-white ${text} flex items-center leading-none`}>
              <span>N</span>
              <span>E</span>
              <span>X</span>
              
              {/* Custom 'O' with Embedded 4-Pointed Star */}
              <span className="relative inline-flex items-center justify-center mx-[0.04em]">
                <span className="opacity-90">O</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="absolute w-[44%] h-[44%] text-brand-purple dark:text-brand-violet-light pointer-events-none"
                >
                  <path
                    d="M12 2 C12 7.5, 14 9.5, 22 12 C14 14.5, 12 16.5, 12 22 C12 16.5, 10 14.5, 2 12 C10 9.5, 12 7.5, 12 2 Z"
                    fill="currentColor"
                  />
                </svg>
              </span>

              <span>R</span>
              
              {/* Custom 'A' with subtle gradient accent on leg */}
              <span className="relative inline-block">
                A
                <span className="absolute bottom-0 right-0 w-[35%] h-[40%] bg-gradient-to-t from-brand-purple to-transparent opacity-40 mix-blend-overlay"></span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Official Primary Tagline */}
      {showTagline && (
        <div className="w-full text-center mt-2.5">
          <span className={`font-sans font-bold uppercase tracking-[0.38em] text-slate-700 dark:text-slate-300 ${subtext} block`}>
            Discover . Experience . Belong.
          </span>
        </div>
      )}

      {/* Official Secondary Tagline with Fine Horizontal Accent Rules */}
      {showSecondaryTagline && (
        <div className="w-full flex items-center justify-center gap-3 mt-1.5 opacity-85">
          <div className="h-[1px] w-8 sm:w-12 bg-slate-400 dark:bg-slate-600" />
          <span className={`font-sans font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 ${sub2}`}>
            Events for a brighter tomorrow
          </span>
          <div className="h-[1px] w-8 sm:w-12 bg-slate-400 dark:bg-slate-600" />
        </div>
      )}
    </div>
  );
};

export default NexoraLogo;
