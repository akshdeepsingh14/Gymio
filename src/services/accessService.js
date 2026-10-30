
// The member side of the access flow.
//
// DEMO ONLY: everything here runs in the browser, so none of it is real security.
// In the backend phase the server does all of it: it checks the code, limits
// attempts per IP, gym and member, creates the request, and issues the session.

import { getCredentialState, verifyCode } from "@/lib/credentials";
import { addDays, todayISO } from "@/lib/dates";
import { getMemberStatus } from "@/lib/membership";
import { findAccountById, findAccountByUsername } from "@/services/authService";
import { readGymState, writeGymState } from "@/services/mockDb";

export const MAX_ATTEMPTS = 5;
export const LOCK_MINUTES = 5;

const ATTEMPTS_KEY = "gymio-member-attempts";
const PENDING_KEY = "gymio-member-pending";
const SESSION_KEY = "gymio-member-session";

// One message for every failure, so nobody can tell a wrong gym from a wrong code
// from a revoked code from a member who does not exist.
const MISMATCH =
  "These details don't match. Check the gym username and your access code, or ask the gym for a new code.";

export class AccessError extends Error {
  constructor(message, { locked = false } = {}) {
    super(message);
    this.name = "AccessError";
    this.locked = locked;
  }
}

const wait = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));
const firstName = (name) => name.trim().split(/\s+/)[0];

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked: the demo just won't remember.
  }
}

function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ---- Attempt limiting ----

export function getLockState() {
  const { lockedUntil = 0 } = read(ATTEMPTS_KEY, {});
  const secondsLeft = Math.max(
    0,
    Math.ceil((lockedUntil - Date.now()) / 1000)
  );

  return { locked: secondsLeft > 0, secondsLeft };
}

const lockMessage = (minutes) =>
  `Too many attempts. Try again in ${minutes} min.`;

function assertNotLocked() {
  const { locked, secondsLeft } = getLockState();

  if (locked) {
    throw new AccessError(lockMessage(Math.ceil(secondsLeft / 60)), {
      locked: true,
    });
  }
}

function failMismatch() {
  const { count = 0 } = read(ATTEMPTS_KEY, {});
  const next = count + 1;

  if (next >= MAX_ATTEMPTS) {
    write(ATTEMPTS_KEY, {
      count: 0,
      lockedUntil: Date.now() + LOCK_MINUTES * 60_000,
    });

    throw new AccessError(lockMessage(LOCK_MINUTES), {
      locked: true,
    });
  }

  write(ATTEMPTS_KEY, { count: next, lockedUntil: 0 });

  const left = MAX_ATTEMPTS - next;

  throw new AccessError(
    `${MISMATCH} ${left} ${left === 1 ? "attempt" : "attempts"} left.`
  );
}

// ---- Checking the code ----

/** Finds the member this code belongs to. Returns null for any kind of failure. */
function findMatch(username, code) {
  const account = findAccountByUsername(username);

  if (!account) return null;

  const state = readGymState(account);

  // Check every member so a match is not faster or slower than a miss.
  let match = null;

  for (const member of state.members) {
    if (
      member.credential &&
      verifyCode(code, member.credential) &&
      !match
    ) {
      match = member;
    }
  }

  if (!match) return null;

  if (getCredentialState(match.credential, todayISO()) !== "active") {
    return null;
  }

  if (match.accessStatus !== "active") {
    return null; // suspended or inactive
  }

  return { account, state, member: match };
}

function getStanding(member, account) {
  const graceDays = Number(account.gym?.graceDays ?? 10);

  const info = getMemberStatus(member, todayISO(), { graceDays });

  return {
    status: info.status,
    inGrace: info.inGrace,
    expiresOn: member.expiresOn,
    graceEndsOn: addDays(member.expiresOn, graceDays),
    canRequest: info.status === "active" || info.inGrace,
  };
}

/**
 * Step 1 of 2. Proves the code is real and returns only what is safe to show:
 * first name, member ID, plan and membership standing. Nothing else about the member.
 */
export async function identifyMember({ username, code }) {
  await wait();
  assertNotLocked();

  const found = findMatch(username, code);

  if (!found) failMismatch();

  write(ATTEMPTS_KEY, { count: 0, lockedUntil: 0 });

  const { account, state, member } = found;

  return {
    gymName: account.gymName,
    memberId: member.id,
    firstName: firstName(member.name),
    planName:
      state.plans.find((plan) => plan.id === member.planId)?.name ??
      "Membership",
    standing: getStanding(member, account),
    hasPending: state.accessRequests.some(
      (r) => r.memberId === member.id && r.status === "pending"
    ),
  };
}

/**
 * Step 2 of 2. Checks the code again (the browser's word is never enough),
 * then creates one pending request. Asking twice returns the same request.
 */
export async function requestAccess({ username, code }) {
  await wait();
  assertNotLocked();

  const found = findMatch(username, code);

  if (!found) failMismatch();

  const { account, member } = found;

  if (!getStanding(member, account).canRequest) {
    throw new AccessError(
      "Your membership has ended. Ask the gym to renew it, then try again."
    );
  }

  let request = null;

  writeGymState(account, (current) => {
    const existing = current.accessRequests.find(
      (r) => r.memberId === member.id && r.status === "pending"
    );

    if (existing) {
      request = existing;
      return current;
    }

    request = {
      id: `req_${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 6)}`,
      memberId: member.id,
      memberName: member.name,
      requestedAt: new Date().toISOString(),
      status: "pending",
    };

    return {
      ...current,
      accessRequests: [request, ...current.accessRequests],
    };
  });

  // The browser remembers only WHICH request is its own, never the code.
  write(PENDING_KEY, {
    ownerId: account.id,
    requestId: request.id,
    memberId: member.id,
    firstName: firstName(member.name),
    gymName: account.gymName,
  });
}

// ---- Following the request ----

/** The member's own request and what the owner decided. Null if there is none. */
export function getRequestStatus() {
  const pointer = read(PENDING_KEY, null);

  if (!pointer) return null;

  const account = findAccountById(pointer.ownerId);

  const request = account
    ? readGymState(account).accessRequests.find(
        (r) => r.id === pointer.requestId
      )
    : null;

  if (!request) {
    remove(PENDING_KEY);
    return null;
  }

  return {
    ...pointer,
    status: request.status,
    requestedAt: request.requestedAt,
  };
}

export async function cancelRequest() {
  await wait(250);

  const pointer = read(PENDING_KEY, null);
  const account = pointer ? findAccountById(pointer.ownerId) : null;

  if (account) {
    writeGymState(account, (state) => ({
      ...state,
      accessRequests: state.accessRequests.map((r) =>
        r.id === pointer.requestId && r.status === "pending"
          ? { ...r, status: "cancelled", decidedAt: new Date().toISOString() }
          : r
      ),
    }));
  }

  remove(PENDING_KEY);
}

/** Closes a finished request (for example a declined one) so the member can start again. */
export function dismissRequest() {
  remove(PENDING_KEY);
}

// ---- Member session ----

// DEMO ONLY: the real session is an httpOnly cookie issued by the server.

/** Turns an approved request into a signed-in member. */
export function claimSession() {
  const status = getRequestStatus();

  if (!status || status.status !== "approved") {
    throw new AccessError("This request has not been approved.");
  }

  write(SESSION_KEY, {
    ownerId: status.ownerId,
    memberId: status.memberId,
    requestId: status.requestId,
    startedAt: new Date().toISOString(),
  });

  remove(PENDING_KEY);
}

/**
 * The signed-in member with their gym's data, or null. A session for a member who
 * no longer exists, or who was deactivated, is cleared on the spot.
 * Used by the member portal, which re-checks it on every load.
 */
export function getPortalContext() {
  const session = read(SESSION_KEY, null);

  if (!session) return null;

  const account = findAccountById(session.ownerId);
  const state = account ? readGymState(account) : null;

  const member = state
    ? state.members.find((m) => m.id === session.memberId)
    : null;

  if (!member || member.accessStatus === "inactive") {
    remove(SESSION_KEY);
    return null;
  }

  return { account, state, member };
}

/** Who is signed in to the member portal, or null. */
export function getMemberSession() {
  const context = getPortalContext();

  if (!context) return null;

  const { account, member } = context;

  return {
    gymName: account.gymName,
    memberId: member.id,
    firstName: firstName(member.name),
  };
}

// Keep this function unchanged.
export function endMemberSession() {
  remove(SESSION_KEY);
}
