import { useMemo, useSyncExternalStore } from "react";

import { parseStaffPrefs, readStaffPrefsRaw, subscribeStaffPrefs } from "@/lib/staffAccount";

/** A staff member's notification choices. Re-renders when they are saved, here or in another tab. */
export function useStaffPrefs(staffId) {
  const raw = useSyncExternalStore(subscribeStaffPrefs, () => readStaffPrefsRaw(staffId));
  return useMemo(() => parseStaffPrefs(raw), [raw]);
}