// A staff member's own choices: which notifications they want and their profile photo.
// DEMO ONLY: kept in this browser's localStorage, one entry per staff member. The backend
// phase stores these on the server, against the signed-in account.
//
// The keys deliberately avoid the "gymio-demo" prefix, so saving here never triggers the
// owner sign-in sync.

export const STAFF_NOTIFICATION_KINDS = [
  {
    key: "requests",
    label: "Access requests",
    description: "When a member asks to open their member area and is waiting for a decision.",
    permission: "access.review",
  },
  {
    key: "expiry",
    label: "Expiring memberships",
    description: "One reminder when memberships are close to their end date.",
    permission: "members.view",
  },
  {
    key: "payments",
    label: "Payments recorded",
    description: "When a payment is recorded. Kept for 3 days.",
    permission: "payments.view",
  },
  {
    key: "posts",
    label: "Gym updates",
    description: "When an announcement is published. Kept for 3 days.",
    permission: "updates.publish",
  },
];

export const DEFAULT_STAFF_PREFS = { inApp: true, requests: true, expiry: true, payments: true, posts: true };

const prefsKey = (staffId) => `gymio-staff-prefs-${staffId}`;
const photoKey = (staffId) => `gymio-staff-photo-${staffId}`;

const listeners = new Set();

/** Anything saved, in any shape, becomes a complete set of true/false choices. Missing ones stay on. */
export function parseStaffPrefs(raw) {
  let saved = {};
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object") saved = parsed;
  } catch {
    // Unreadable data: fall back to the defaults.
  }
  return Object.fromEntries(
    Object.entries(DEFAULT_STAFF_PREFS).map(([key, fallback]) => [key, typeof saved[key] === "boolean" ? saved[key] : fallback]),
  );
}

export function readStaffPrefsRaw(staffId) {
  try {
    return localStorage.getItem(prefsKey(staffId)) ?? "";
  } catch {
    return "";
  }
}

export function saveStaffPrefs(staffId, prefs) {
  try {
    localStorage.setItem(prefsKey(staffId), JSON.stringify(parseStaffPrefs(JSON.stringify(prefs))));
  } catch {
    // Storage blocked or full: the choices last until refresh.
  }
  listeners.forEach((listener) => listener());
}

/** For useSyncExternalStore: this tab's saves, and saves made in another tab. */
export function subscribeStaffPrefs(listener) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function readStaffPhoto(staffId) {
  try {
    return localStorage.getItem(photoKey(staffId)) ?? "";
  } catch {
    return "";
  }
}

export function saveStaffPhoto(staffId, dataUrl) {
  try {
    if (dataUrl) localStorage.setItem(photoKey(staffId), dataUrl);
    else localStorage.removeItem(photoKey(staffId));
  } catch {
    // Storage blocked or full: the photo is not kept.
  }
}