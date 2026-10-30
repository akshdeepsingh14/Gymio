import { useEffect, useState } from "react";

import { loadPortal } from "@/services/memberPortalService";

/**
 * Loads the member portal and keeps it honest: it checks again whenever the tab
 * gets focus or another tab saves, so a suspension or a renewal shows up without a reload.
 * status: "loading" | "ready" | "signed-out"
 */
export function usePortal() {
  const [state, setState] = useState({ status: "loading", data: null });

  useEffect(() => {
    let active = true;
    let latest = 0;

    const run = (delay) => {
      const id = ++latest;
      loadPortal(delay).then((data) => {
        if (!active || id !== latest) return;
        setState(data ? { status: "ready", data } : { status: "signed-out", data: null });
      });
    };

    run(350);
    const refresh = () => run(0);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      active = false;
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return state;
}