// Sessions and sign-in activity for each staff member. Same idea as securityService.js for
// owners, with its own keys so an owner tab and a staff tab never mix.
// DEMO ONLY: these records live in this browser's localStorage, so "other sessions" are
// sample entries or earlier sign-ins from this browser, not real devices.

import { describeDevice } from "@/lib/security";

const CURRENT_KEY = "gymio-staff-current-session";
const MAX_SESSIONS = 10;
const MAX_ACTIVITY = 20;

const recordKey = (staffId) => `gymio-staff-security-${staffId}`;

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));
const newId = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const ago = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();
const MINUTES = { hour: 60, day: 1440 };

const isSampleStaff = (staffId) => staffId.startsWith("staff_demo_");

const emptyRecord = () => ({ sessions: [], activity: [] });

// The sample team starts with a few labelled entries, so the screen has something to show
function sampleRecord() {
  return {
    sessions: [
      {
        id: "sample_android",
        device: "Chrome on Android",
        startedAt: ago(3 * MINUTES.day),
        lastActiveAt: ago(5 * MINUTES.hour),
        sample: true,
      },
    ],
    activity: [
      { id: "sample_a1", kind: "signin", at: ago(3 * MINUTES.day), device: "Chrome on Android", sample: true },
      { id: "sample_a2", kind: "failed", at: ago(5 * MINUTES.day), device: "Chrome on Windows", sample: true },
    ],
  };
}

function read(staffId) {
  try {
    const raw = localStorage.getItem(recordKey(staffId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        activity: Array.isArray(parsed.activity) ? parsed.activity : [],
      };
    }
  } catch {
    // Unreadable data: start again below.
  }
  return isSampleStaff(staffId) ? sampleRecord() : emptyRecord();
}

function write(staffId, record) {
  try {
    localStorage.setItem(recordKey(staffId), JSON.stringify(record));
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

// ---- Called by staffAuthService ----

export function recordStaffSignIn(staffId) {
  const session = newSession();
  const record = read(staffId);
  write(staffId, withActivity({ ...record, sessions: [session, ...record.sessions].slice(0, MAX_SESSIONS) }, "signin"));
  setCurrentId(session.id);
}

export function recordStaffFailedSignIn(staffId) {
  write(staffId, withActivity(read(staffId), "failed"));
}

export function recordStaffPasswordChange(staffId) {
  write(staffId, withActivity(read(staffId), "password"));
}

/** Sign out: this session leaves the list. */
export function endCurrentStaffSession(staffId) {
  const id = getCurrentId();
  const record = read(staffId);
  write(staffId, { ...record, sessions: record.sessions.filter((session) => session.id !== id) });
  setCurrentId(null);
}

/** Ends every session except the one in use. Shared by the Sessions card and the change-password form. */
export function endOtherStaffSessionsNow(staffId) {
  const id = getCurrentId();
  const record = read(staffId);
  const kept = record.sessions.filter((session) => session.id === id);
  if (kept.length === record.sessions.length) return record;
  return write(staffId, withActivity({ ...record, sessions: kept }, "sessions"));
}

// ---- Used by the Security page ----

/**
 * The staff member's security record, with the session in use marked as current.
 * Someone who signed in before sessions were tracked has no record yet, so this one starts now.
 */
export function getStaffSecurity(staffId) {
  let record = read(staffId);
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

  write(staffId, record);
  return { ...record, currentSessionId: getCurrentId() };
}

export async function endOtherStaffSessions(staffId) {
  await wait();
  endOtherStaffSessionsNow(staffId);
  return getStaffSecurity(staffId);
}