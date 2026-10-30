import { useState } from "react";

const MAX_STORED = 200;

// Not prefixed "gymio-demo", so saving it does not trigger the sign-in sync in AuthProvider
const storageKey = (ownerId) => `gymio-read-notifications-${ownerId}`;

function load(ownerId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(ownerId)) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function save(ownerId, ids) {
  try {
    // Sets keep insertion order, so the slice keeps the most recently read ids
    localStorage.setItem(storageKey(ownerId), JSON.stringify([...ids].slice(-MAX_STORED)));
  } catch {
    // Storage blocked or full: read marks last until refresh.
  }
}

/** Which notification ids the owner has already read. Remembered per owner, so a refresh does not bring them back. */
export function useReadNotifications(ownerId) {
  const [readIds, setReadIds] = useState(() => new Set(load(ownerId)));

  const markRead = (ids) => {
    const next = new Set([...readIds, ...ids]);
    setReadIds(next);
    save(ownerId, next);
  };

  return { readIds, markRead };
}