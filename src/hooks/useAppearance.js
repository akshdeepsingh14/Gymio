import { useSyncExternalStore } from "react";

import { getAppearance, subscribe } from "@/lib/appearance";

/** The current look-and-feel preferences. Re-renders when they change. */
export function useAppearance() {
  return useSyncExternalStore(subscribe, getAppearance);
}