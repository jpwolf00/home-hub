'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface NightModeContextType {
  isNightMode: boolean;
  toggleNightMode: () => void;
}

const NightModeContext = createContext<NightModeContextType>({
  isNightMode: false,
  toggleNightMode: () => {},
});

export function useNightMode() {
  return useContext(NightModeContext);
}

// Night hours: 10pm (22) to 6am
const NIGHT_START_HOUR = 22;
const NIGHT_END_HOUR = 6;

function isNightTime(): boolean {
  const hour = new Date().getHours();
  if (NIGHT_START_HOUR > NIGHT_END_HOUR) {
    // Night spans across midnight (e.g., 22:00 - 06:00)
    return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
  }
  return hour >= NIGHT_START_HOUR && hour < NIGHT_END_HOUR;
}

export function NightModeProvider({ children }: { children: React.ReactNode }) {
  const [isNightMode, setIsNightMode] = useState(false);
  const [manualOverride, setManualOverride] = useState<boolean | null>(null);

  const checkNightTime = useCallback(() => {
    if (manualOverride !== null) {
      return manualOverride;
    }
    return isNightTime();
  }, [manualOverride]);

  useEffect(() => {
    // Check immediately on mount
    setIsNightMode(checkNightTime());

    // Check every minute for time-based changes
    const interval = setInterval(() => {
      setIsNightMode(checkNightTime());
    }, 60000);

    return () => clearInterval(interval);
  }, [checkNightTime]);

  // Listen for manual toggle via keyboard shortcut (Alt+N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        setManualOverride(prev => {
          const newValue = prev === null ? !isNightTime() : !prev;
          setIsNightMode(newValue);
          return newValue;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleNightMode = useCallback(() => {
    setManualOverride(prev => {
      const newValue = prev === null ? !isNightTime() : !prev;
      setIsNightMode(newValue);
      return newValue;
    });
  }, []);

  return (
    <NightModeContext.Provider value={{ isNightMode, toggleNightMode }}>
      <div
        className={isNightMode ? 'night-mode' : ''}
        data-night-mode={isNightMode}
      >
        {children}
      </div>
    </NightModeContext.Provider>
  );
}
