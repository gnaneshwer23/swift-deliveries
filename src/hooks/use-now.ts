import { useEffect, useState } from "react";

/**
 * The current time, refreshed every `everyMs` (default 10 minutes), so day-based labels such
 * as "quiet for 7 days" move on while a page stays open.
 */
export function useNow(everyMs = 10 * 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), everyMs);
    return () => window.clearInterval(id);
  }, [everyMs]);
  return now;
}
