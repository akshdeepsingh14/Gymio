import { useCallback, useEffect, useState } from "react";

import { getRequestStatus } from "@/services/accessService";

const same = (a, b) =>
  (!a && !b) || Boolean(a && b && a.requestId === b.requestId && a.status === b.status);

/**
 * Follows the member's access request. It re-checks every 2 seconds, and at once
 * when another tab saves (for example the owner approving).
 */
export function useRequestStatus() {
  const [request, setRequest] = useState(() => getRequestStatus());

  const refresh = useCallback(() => {
    const next = getRequestStatus();
    setRequest((current) => (same(current, next) ? current : next));
  }, []);

  useEffect(() => {
    const timer = setInterval(refresh, 2000);
    window.addEventListener("storage", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return { request, refresh };
}