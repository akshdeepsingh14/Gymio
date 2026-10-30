// Sessions, sign-in activity and the two-factor switch for each owner account.
// DEMO ONLY: these records live in this browser's localStorage, so "other sessions"
// are sample entries or earlier sign-ins from this browser, not real devices.
// In the backend phase the server stores sessions and ends them for real.
//
// authService calls the record* functions when someone signs in, fails to sign in,
// changes a password or signs out. The Security tab reads and changes the rest.

import { describeDevice } from "@/lib/security";

const DEMO_OWNER_ID = "owner_demo";
const CURRENT_KEY = "gymio-current-session";
const MAX_SESSIONS = 10;
const MAX_ACTIVITY = 20;

// Deliberately not prefixed "gymio-demo", so saving here does not trigger the sign-in sync in AuthProvider
const recordKey = (ownerId) => `gymio-security-${ownerId}`;

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));
const newId = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const ago = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();
const MINUTES = { hour: 60, day: 1440 };

const emptyRecord = () => ({ sessions: [], activity: [], twoFactor: false });

// The demo account starts with a few labelled sample entries, so the screen has something to show
function sampleRecord() {
  return {
    sessions: [
      {
        id: "sample_android",
        device: "Chrome on Android",
        startedAt: ago(2 * MINUTES.day),
        lastActiveAt: ago(3 * MINUTES.hour),
        sample: true,
      },
      {
        id: "sample_iphone",
        device: "Safari on iPhone",
        startedAt: ago(6 * MINUTES.day),
        lastActiveAt: ago(MINUTES.day),
        sample: true,
      },
    ],
    activity: [
      { id: "sample_a1", kind: "signin", at: ago(2 * MINUTES.day), device: "Chrome on Android", sample: true },
      { id: "sample_a2", kind: "failed", at: ago(4 * MINUTES.day), device: "Chrome on Windows", sample: true },
      { id: "sample_a3", kind: "signin", at: ago(6 * MINUTES.day), device: "Safari on iPhone", sample: true },
    ],
    twoFactor: false,
  };
}

function read(ownerId) {
  try {
    const raw = localStorage.getItem(recordKey(ownerId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        activity: Array.isArray(parsed.activity) ? parsed.activity : [],
        twoFactor: parsed.twoFactor === true,
      };
    }
  } catch {
    // Unreadable data: start again below.
  }
  return ownerId === DEMO_OWNER_ID ? sampleRecord() : emptyRecord();
}

function write(ownerId, record) {
  try {
    localStorage.setItem(recordKey(ownerId), JSON.stringify(record));
  } catch {
    // Storage blocked or full: the record lasts until refresh.
  }
  return record;
}

function getCurrentId() {
  try {
    return localStorage.getItem(CURRENT_KEY);
  } catch {
    return null;
  }
}

function setCurrentId(id) {
  try {
    if (id) localStorage.setItem(CURRENT_KEY, id);
    else localStorage.removeItem(CURRENT_KEY);
  } catch {
    // ignore
  }
}

const currentDevice = () => describeDevice(typeof navigator === "undefined" ? "" : navigator.userAgent);

function withActivity(record, kind) {
  const entry = { id: newId("act"), kind, at: new Date().toISOString(), device: currentDevice() };
  return { ...record, activity: [entry, ...record.activity].slice(0, MAX_ACTIVITY) };
}

function newSession() {
  const now = new Date().toISOString();
  return { id: newId("sess"), device: currentDevice(), startedAt: now, lastActiveAt: now };
}

const view = (record) => ({ ...record, currentSessionId: getCurrentId() });

// ---- Called by authService ----

export function recordSignIn(ownerId) {
  const session = newSession();
  const record = read(ownerId);
  write(ownerId, withActivity({ ...record, sessions: [session, ...record.sessions].slice(0, MAX_SESSIONS) }, "signin"));
  setCurrentId(session.id);
}

export function recordFailedSignIn(ownerId) {
  write(ownerId, withActivity(read(ownerId), "failed"));
}

export function recordPasswordChange(ownerId) {
  write(ownerId, withActivity(read(ownerId), "password"));
}

/** Sign out: this session leaves the list. */
export function endCurrentSession(ownerId) {
  const id = getCurrentId();
  const record = read(ownerId);
  write(ownerId, { ...record, sessions: record.sessions.filter((session) => session.id !== id) });
  setCurrentId(null);
}

/** Ends every session except the one in use. Shared by the Sessions card and the change-password form. */
export function endOtherSessionsNow(ownerId) {
  const id = getCurrentId();
  const record = read(ownerId);
  const kept = record.sessions.filter((session) => session.id === id);
  if (kept.length === record.sessions.length) return record;
  return write(ownerId, withActivity({ ...record, sessions: kept }, "sessions"));
}

// ---- Used by the Security tab ----

/**
 * The owner's security record, with the session in use marked as current.
 * Someone who signed in before sessions were tracked has no record yet, so this one starts now.
 */
export function getSecurity(ownerId) {
  let record = read(ownerId);
  const id = getCurrentId();
  const now = new Date().toISOString();

  if (id && record.sessions.some((session) => session.id === id)) {
    record = {
      ...record,
      sessions: record.sessions.map((session) => (session.id === id ? { ...session, lastActiveAt: now } : session)),
    };
  } else {
    const session = newSession();
    record = { ...record, sessions: [session, ...record.sessions].slice(0, MAX_SESSIONS) };
    setCurrentId(session.id);
  }

  write(ownerId, record);
  return view(record);
}

export async function endOtherSessions(ownerId) {
  await wait();
  endOtherSessionsNow(ownerId);
  return getSecurity(ownerId);
}

export async function setTwoFactor(ownerId, enabled) {
  await wait(250);
  write(ownerId, { ...read(ownerId), twoFactor: enabled === true });
  return getSecurity(ownerId);
}