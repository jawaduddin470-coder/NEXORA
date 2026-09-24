import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface IntroContextType {
  isIntroActive: boolean;
  playIntro: () => void;
  closeIntro: () => void;
}

const IntroContext = createContext<IntroContextType | undefined>(undefined);

export const IntroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Determine initial auto-play for first visit to landing page '/'
  const [isIntroActive, setIsIntroActive] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('skipIntro') === 'true') return false;
      if (params.get('intro') === 'true') return true;

      // Only auto-play on root landing page '/'
      if (window.location.pathname !== '/') return false;

      const viewed = sessionStorage.getItem('nexora_intro_viewed');
      return viewed !== 'true';
    } catch {
      return false;
    }
  });

  const playIntro = useCallback(() => {
    setIsIntroActive(true);
  }, []);

  const closeIntro = useCallback(() => {
    setIsIntroActive(false);
    try {
      sessionStorage.setItem('nexora_intro_viewed', 'true');
    } catch (e) {
      console.warn('Session storage write error', e);
    }
  }, []);

  // Prevent background scrolling when intro is active
  useEffect(() => {
    if (isIntroActive) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isIntroActive]);

  return (
    <IntroContext.Provider value={{ isIntroActive, playIntro, closeIntro }}>
      {children}
    </IntroContext.Provider>
  );
};

export const useIntro = (): IntroContextType => {
  const context = useContext(IntroContext);
  if (!context) {
    throw new Error('useIntro must be used within an IntroProvider');
  }
  return context;
};
