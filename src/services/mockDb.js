// A tiny fake database that lives in localStorage, so members, plans and
// payments survive a refresh. DEMO ONLY: in the backend phase this file is
// deleted and the services call the real API instead.
//
// - The demo account gets the generated sample gym. Its data is stored under a
//   key that includes today's date, so sample dates never go stale.
// - Every other account starts with default plans and nothing else.
// - The owner screens use getDb / updateDb (the signed-in gym).
// - The member portal has no owner session, so it uses readGymState /
//   writeGymState, which take the gym's account explicitly.

import { createDemoStaff } from "@/data/mock/staff";
import { plans as seedPlans, mockDb as seedDb } from "@/data/mock/seed";
import { todayISO } from "@/lib/dates";
import { getSessionId, getSessionUser } from "@/services/authService";

const DEMO_OWNER_ID = "owner_demo";

const EMPTY_STATE = {
  plans: [],
  members: [],
  payments: [],
  accessRequests: [],
  announcements: [],
  photos: [],
  auditLog: [],
  staff: [],
  rolePermissions: null, // null = use the default permissions for each role
  dataPolicy: null, // null = default data retention
  deletionRequest: null, // { requestedAt, scheduledFor } once the owner asks to delete the account
  memberPrefix: "GY",
};

const listeners = new Set();
let cache = { ownerId: null, key: null, state: EMPTY_STATE };

function makePrefix(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length > 1 ? words.slice(0, 3).map((word) => word[0]).join("") : (words[0] ?? "GY").slice(0, 2);
  return letters.toUpperCase().replace(/[^A-Z0-9]/g, "") || "GY";
}

function createInitialState(user) {
  if (user.id === DEMO_OWNER_ID) {
    return { ...EMPTY_STATE, ...structuredClone(seedDb), staff: createDemoStaff(), memberPrefix: "IF" };
  }
  return {
    ...EMPTY_STATE,
    plans: structuredClone(seedPlans),
    memberPrefix: makePrefix(user.gymName),
  };
}

const storageKey = (user) =>
  user.id === DEMO_OWNER_ID ? `gymio-db-demo-${todayISO()}` : `gymio-db-${user.id}`;

function persist() {
  if (!cache.key) return;
  try {
    localStorage.setItem(cache.key, JSON.stringify(cache.state));
  } catch {
    // Storage blocked or full: data lasts until refresh.
  }
}

function load(user) {
  const key = storageKey(user);
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { key, state: { ...EMPTY_STATE, ...JSON.parse(raw) } };
  } catch {
    // fall through to a fresh state
  }
  return { key, state: createInitialState(user) };
}

/** Current gym's data. The same object is returned until something changes. */
export function getDb() {
  const ownerId = getSessionId();
  if (!ownerId) return EMPTY_STATE;

  if (cache.ownerId !== ownerId) {
    const user = getSessionUser();
    if (!user) return EMPTY_STATE;
    const { key, state } = load(user);
    cache = { ownerId, key, state };
    persist();
  }
  return cache.state;
}

/** Replace the data with the result of `updater(currentData)` and notify the UI. */
export function updateDb(updater) {
  const next = updater(getDb());
  cache = { ...cache, state: next };
  persist();
  listeners.forEach((listener) => listener());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Removes a gym's saved data. Used when an account is deleted. */
export function clearGymData(ownerId) {
  try {
    localStorage.removeItem(`gymio-db-${ownerId}`);
  } catch {
    // Storage blocked: nothing saved to remove.
  }
  if (cache.ownerId === ownerId) cache = { ownerId: null, key: null, state: EMPTY_STATE };
}

// ---- Used by the member portal (no owner session) ----

/** Reads any gym's data straight from storage. `user` is the gym owner's public account. */
export function readGymState(user) {
  return load(user).state;
}

/**
 * Saves `updater(currentData)` for any gym. Return the same object from the
 * updater to save nothing. If that gym is open in this tab, its screens refresh.
 */
export function writeGymState(user, updater) {
  const { key, state } = load(user);
  const next = updater(state);
  if (next === state) return state;

  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Storage blocked or full: the change is lost.
  }
  if (cache.key === key) {
    cache = { ...cache, state: next };
    listeners.forEach((listener) => listener());
  }
  return next;
}

// Another tab saved this gym's data (for example a member sent a request):
// pick it up so the owner's screens update without a reload.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (!cache.key || event.key !== cache.key || !event.newValue) return;
    try {
      cache = { ...cache, state: { ...EMPTY_STATE, ...JSON.parse(event.newValue) } };
      listeners.forEach((listener) => listener());
    } catch {
      // Unreadable data: keep what we have.
    }
  });
}