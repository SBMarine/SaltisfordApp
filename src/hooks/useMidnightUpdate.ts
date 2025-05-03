import { useEffect } from 'react';

export function useMidnightUpdate(callback: () => void) {
  useEffect(() => {
    // Run initial update
    callback();

    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    // Set up the daily update
    const timeout = setTimeout(() => {
      callback();
      // Set up interval for subsequent days
      const interval = setInterval(callback, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, timeUntilMidnight);

    return () => clearTimeout(timeout);
  }, [callback]);
}