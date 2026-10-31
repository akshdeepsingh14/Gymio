import { useEffect, useRef, useState } from "react";

import { useDb } from "@/hooks/useDb";
import { getDashboard } from "@/services/dashboardService";

/**
 * Loads dashboard data for a date range.
 * - Changing the range (or pressing retry) shows the loading state and keeps the old figures on screen.
 * - When the gym's data changes (a payment, a new member, a decision on a request) the figures
 *   refresh quietly, with no loading state.
 * - The owner portal calls this with two arguments. The staff portal passes the gym's data as a
 *   third argument, because staff have no owner session for useDb() to read.
 */
export function useDashboard(range, gym, source) {
  const ownerDb = useDb();
  const db = source ?? ownerDb;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const loadedKey = useRef(null);

  const key = `${range}:${attempt}`;

  useEffect(() => {
    let active = true;
    const quiet = loadedKey.current === key; // same range, so only the data changed

    getDashboard({ range, gym, db: source, delay: quiet ? 0 : 450 })
      .then((data) => {
        if (!active) return;
        loadedKey.current = key;
        setResult({ key, data, error: null });
      })
      .catch(() => {
        if (active) setResult((current) => ({ ...current, key, error: "Could not load the dashboard." }));
      });

    return () => {
      active = false;
    };
  }, [key, range, gym, db, source]);

  const loading = result.key !== key;

  return {
    data: result.data,
    loading,
    error: loading ? null : result.error,
    retry: () => setAttempt((n) => n + 1),
  };
}