import { useEffect, useState } from "react";
import { getDashboard } from "@/services/dashboardService";

/** Loads dashboard data. Keeps the previous data on screen while a new range loads. */
export function useDashboard(range, gym) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    getDashboard({ range, gym })
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch(() =>
        active &&
        setState((current) => ({ ...current, loading: false, error: "Could not load the dashboard." })),
      );

    return () => {
      active = false;
    };
  }, [range, gym, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}