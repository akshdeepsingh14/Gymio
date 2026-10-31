
import { createDemoStaff, createDemoStaffAudit } from "@/data/mock/staff";
import { plans as seedPlans, mockDb as seedDb } from "@/data/mock/seed";
import { todayISO } from "@/lib/dates";
import { normalizeStaffRecord } from "@/lib/staff";
import { getSessionId, getSessionUser } from "@/services/authService";
import { ServiceError } from "@/services/errors";

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
  rolePermissions: null,
  dataPolicy: null,
  deletionRequest: null,
  memberPrefix: "GY",
};

const listeners = new Set();

let cache = {
  ownerId: null,
  key: null,
  state: EMPTY_STATE,
};

function makePrefix(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  const letters =
    words.length > 1
      ? words.slice(0, 3).map((word) => word[0]).join("")
      : (words[0] ?? "GY").slice(0, 2);

  return letters.toUpperCase().replace(/[^A-Z0-9]/g, "") || "GY";
}

function createInitialState(user) {
  if (user.id === DEMO_OWNER_ID) {
    const seeded = structuredClone(seedDb);

    return {
      ...EMPTY_STATE,
      ...seeded,
      staff: createDemoStaff(),
      auditLog: [
        ...(seeded.auditLog ?? []),
        ...createDemoStaffAudit(),
      ],
      memberPrefix: "IF",
    };
  }

  return {
    ...EMPTY_STATE,
    plans: structuredClone(seedPlans),
    memberPrefix: makePrefix(user.gymName),
  };
}

const storageKey = (user) =>
  user.id === DEMO_OWNER_ID
    ? `gymio-db-demo-${todayISO()}`
    : `gymio-db-${user.id}`;

let lastSaveOk = true;

const STORAGE_FULL =
  "Your browser has no storage left, so this change was not saved. Delete a gym photo or another large image, then try again.";

const isQuotaError = (error) =>
  error?.name === "QuotaExceededError" ||
  error?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
  error?.code === 22 ||
  error?.code === 1014;

/** Saves the current data. Returns "ok", "full" or "blocked". */
function persist() {
  if (!cache.key) return "ok";

  try {
    localStorage.setItem(cache.key, JSON.stringify(cache.state));
    lastSaveOk = true;
    return "ok";
  } catch (error) {
    lastSaveOk = false;
    return isQuotaError(error) ? "full" : "blocked";
  }
}

/** False when the last save did not fit in browser storage. */
export const lastSaveWorked = () => lastSaveOk;

// The demo gym is saved under a key with today's date.
// Remove older copies so photos do not fill browser storage.
let prunedFor = null;

function pruneOldDemoCopies(keepKey) {
  if (prunedFor === keepKey) return;

  prunedFor = keepKey;

  try {
    const stale = [];

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);

      if (
        key &&
        key.startsWith("gymio-db-demo-") &&
        key !== keepKey
      ) {
        stale.push(key);
      }
    }

    stale.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage blocked: nothing to clean.
  }
}

/** Brings data saved by an older version of the app up to date. */
function upgrade(state) {
  return {
    ...state,
    staff: (state.staff ?? []).map(normalizeStaffRecord),
  };
}

function load(user) {
  const key = storageKey(user);

  if (user.id === DEMO_OWNER_ID) {
    pruneOldDemoCopies(key);
  }

  try {
    const raw = localStorage.getItem(key);

    if (raw) {
      return {
        key,
        state: upgrade({
          ...EMPTY_STATE,
          ...JSON.parse(raw),
        }),
      };
    }
  } catch {
    // Fall through to a fresh state.
  }

  return {
    key,
    state: createInitialState(user),
  };
}

/** Current gym's data. The same object is returned until something changes. */
let gymResolver = {
  id: () => getSessionId(),
  user: () => getSessionUser(),
};

export function setGymResolver(resolver) {
  gymResolver = resolver;
}

export function getDb() {
  const ownerId = gymResolver.id();

  if (!ownerId) return EMPTY_STATE;

  if (cache.ownerId !== ownerId) {
    const user = gymResolver.user();

    if (!user) return EMPTY_STATE;

    const { key, state } = load(user);

    cache = {
      ownerId,
      key,
      state,
    };

    persist();
  }

  return cache.state;
}

/** Replace the data with updater(currentData) and notify the UI. */
export function updateDb(updater) {
  const next = updater(getDb());
  const before = cache;

  cache = {
    ...cache,
    state: next,
  };

  // No room left: undo the change in memory too.
  if (persist() === "full") {
    cache = before;
    throw new ServiceError(STORAGE_FULL);
  }

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

  if (cache.ownerId === ownerId) {
    cache = {
      ownerId: null,
      key: null,
      state: EMPTY_STATE,
    };
  }
}

// ---- Used by the member portal (no owner session) ----

/** Reads any gym's data straight from storage. */
export function readGymState(user) {
  return load(user).state;
}

/**
 * Saves updater(currentData) for any gym.
 * Return the same object from updater to save nothing.
 * If that gym is open in this tab, its screens refresh.
 */
export function writeGymState(user, updater) {
  const { key, state } = load(user);
  const next = updater(state);

  if (next === state) return state;

  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch (error) {
    // Full: report the error instead of pretending the change was saved.
    // Blocked: keep going in memory.
    if (isQuotaError(error)) {
      throw new ServiceError(STORAGE_FULL);
    }
  }

  if (cache.key === key) {
    cache = {
      ...cache,
      state: next,
    };
  }

  // Notify every subscriber, including staff screens.
  listeners.forEach((listener) => listener());

  return next;
}

const snapshots = new Map();

/**
 * A gym's data for screens that have no owner session (the staff portal).
 * The same object is returned until the saved data actually changes.
 */
export function getGymSnapshot(user) {
  if (!user) return EMPTY_STATE;

  const key = storageKey(user);
  let raw = null;

  try {
    raw = localStorage.getItem(key);
  } catch {
    // Storage blocked: fall through to the default state.
  }

  const hit = snapshots.get(key);

  if (hit && hit.raw === raw) {
    return hit.state;
  }

  const { state } = load(user);

  snapshots.set(key, {
    raw,
    state,
  });

  return state;
}

// Another tab saved this gym's data.
// Pick it up so the owner's screens update without a reload.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (!cache.key || event.key !== cache.key || !event.newValue) {
      return;
    }

    try {
      cache = {
        ...cache,
        state: {
          ...EMPTY_STATE,
          ...JSON.parse(event.newValue),
        },
      };

      listeners.forEach((listener) => listener());
    } catch {
      // Unreadable data: keep what we have.
    }
  });
}
