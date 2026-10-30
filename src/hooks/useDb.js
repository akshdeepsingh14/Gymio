import { useSyncExternalStore } from "react";
import { getDb, subscribe } from "@/services/mockDb";

/** Re-renders the component whenever members, plans or payments change. */
export function useDb() {
  return useSyncExternalStore(subscribe, getDb);
}