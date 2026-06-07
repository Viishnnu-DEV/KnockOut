import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTimezone, TIMEZONES } from '../utils/timezones';

const STORAGE_KEY = 'kickoff_timezone';
const TimezoneContext = createContext(null);

function detectBrowserTimezone() {
  try {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const found = TIMEZONES.find((tz) => tz.id === browserTz);
    return found ? browserTz : 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
}

export function TimezoneProvider({ children }) {
  const [timezoneId, setTimezoneId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && TIMEZONES.find((tz) => tz.id === saved)) return saved;
    return detectBrowserTimezone();
  });

  const [timezone, setTimezone] = useState(() => getTimezone(timezoneId));

  const changeTimezone = useCallback((newId) => {
    const tz = getTimezone(newId);
    setTimezoneId(newId);
    setTimezone(tz);
    localStorage.setItem(STORAGE_KEY, newId);
  }, []);

  useEffect(() => {
    setTimezone(getTimezone(timezoneId));
  }, [timezoneId]);

  return (
    <TimezoneContext.Provider value={{ timezoneId, timezone, changeTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const ctx = useContext(TimezoneContext);
  if (!ctx) {
    throw new Error('useTimezone must be used within TimezoneProvider');
  }
  return ctx;
}
