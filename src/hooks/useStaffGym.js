import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { useStaffAuth } from "@/hooks/useStaffAuth";
import { findAccountById } from "@/services/authService";
import { getGymSnapshot, subscribe } from "@/services/mockDb";

function subscribeToGym(listener) {
  const stop = subscribe(listener); // changes made in this tab
  window.addEventListener("storage", listener); // changes made in another tab (for example the owner's)
  return () => {
    stop();
    window.removeEventListener("storage", listener);
  };
}

/**
 * The staff member's own gym: its data (members, payments, requests...) and its public
 * profile (name, logo, currency, grace days). It re-renders when either one changes.
 * Use it only inside the staff portal.
 */
export function useStaffGym() {
  const { user } = useStaffAuth();
  const ownerId = user.ownerId;
  const [owner, setOwner] = useState(() => findAccountById(ownerId));

  // Pick up changes the owner makes to the gym profile or rules in another tab
  useEffect(() => {
    const refresh = () =>
      setOwner((current) => {
        const next = findAccountById(ownerId);
        // Keep the same object when nothing changed, so charts do not reload for no reason
        return JSON.stringify(current) === JSON.stringify(next) ? current : next;
      });

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [ownerId]);

  const getSnapshot = useCallback(() => getGymSnapshot(owner), [owner]);
  const db = useSyncExternalStore(subscribeToGym, getSnapshot);

  return { db, gym: owner?.gym ?? null, owner };
}