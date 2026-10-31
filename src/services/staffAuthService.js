// Staff accounts, invitations and sign-in.
//
// DEMO ONLY. Everything here lives in this browser's localStorage, so it is a rehearsal of
// the real thing, not security. Passwords are salted and hashed with SHA-256, which is fine
// for a demo and wrong for production: the backend phase replaces this file with API calls
// (slow password hash, rate limiting, httpOnly session cookie, checks done on the server).
//
// How it fits together:
//   - A staff member's record (name, role, status, invite) lives inside their gym's data,
//     next to the owner's members and plans. staffService.js writes it.
//   - Their login lives in a separate list (gymio-staff-accounts): email, salt, hash and the
//     gym it belongs to. It never holds the owner's credentials.
//   - Their session is a separate key (gymio-staff-session). Signing out of one portal never
//     touches the other.
//   - Every time a session is read, it is checked against the gym's record again. If the
//     owner suspends or removes the person, the next check ends their session.

import { generateSalt } from "@/lib/credentials";
import { hashPassword, sameHash } from "@/lib/passwordHash";
import { getRolePermissions, inviteState, roleLabel } from "@/lib/staff";
import { readStaffPhoto, saveStaffPhoto } from "@/lib/staffAccount";
import { findAccountById, listAccounts } from "@/services/authService";
import { readGymState, writeGymState } from "@/services/mockDb";
import {
  endCurrentStaffSession,
  endOtherStaffSessionsNow,
  recordStaffFailedSignIn,
  recordStaffPasswordChange,
  recordStaffSignIn,
} from "@/services/staffSecurityService";

const ACCOUNTS_KEY = "gymio-staff-accounts";
const SESSION_KEY = "gymio-staff-session";
const DEMO_OWNER_ID = "owner_demo";

export const DEMO_STAFF_PASSWORD = "Staff@1234";

// Sample logins for the demo gym. They match the team in data/mock/staff.js.
export const DEMO_STAFF_LOGINS = [
  { label: "Manager", name: "Priya Nair", staffId: "staff_demo_1", email: "priya.nair@example.com" },
  { label: "Front desk", name: "Rohit Pawar", staffId: "staff_demo_2", email: "rohit.pawar@example.com" },
  { label: "Suspended", name: "Vikram Joshi", staffId: "staff_demo_4", email: "vikram.joshi@example.com" },
];

// Invitation links that show each state of the invitation page. They point at the sample team.
export const DEMO_INVITE_TOKENS = [
  { label: "Valid", token: "demo-staff_demo_3" },
  { label: "Expired", token: "demo-staff_demo_5" },
  { label: "Cancelled", token: "demo-staff_demo_6" },
  { label: "Already used", token: "demo-staff_demo_1" },
  { label: "Not valid", token: "not-a-real-link" },
];

export class StaffAuthError extends Error {
  /**
   * code: "invalid" | "expired" | "cancelled" | "used"      the invitation cannot be used
   *       "email_mismatch" | "exists"                       the accept form needs a fix
   *       "invalid_credentials" | "suspended" | "removed" | "inactive" | "gone"   sign-in refused
   * field: the form field a message belongs to, when there is one (for example "currentPassword").
   */
  constructor(message, code, field) {
    super(message);
    this.name = "StaffAuthError";
    this.code = code;
    this.field = field;
  }
}

const wait = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

const INVITE_MESSAGES = {
  invalid: "This invitation link is not valid.",
  expired: "This invitation has expired.",
  cancelled: "The gym owner cancelled this invitation.",
  used: "This invitation has already been used.",
};

// What a person who typed the right password but cannot get in is told.
const SIGN_IN_MESSAGES = {
  suspended: "Your access has been suspended. Ask the gym owner to reactivate it.",
  removed: "You are no longer on this gym's team. Contact the gym owner if that is a mistake.",
  inactive: "Your account is not active yet. Open your invitation link to finish joining.",
  gone: "This gym account no longer exists.",
};

// ---- Storage ----

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
    // Storage blocked (private mode): the demo just will not persist.
  }
}

function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to remove.
  }
}

// hashPassword and sameHash come from lib/passwordHash, shared with the owner login.

function makeAccount({ staffId, ownerId, email, password }) {
  const salt = generateSalt();
  return {
    staffId,
    ownerId,
    email: email.trim().toLowerCase(),
    salt,
    hash: hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  };
}

/** The list of staff logins. The sample team gets logins the first time, like the owner demo account does. */
function loadStaffAccounts() {
  const stored = read(ACCOUNTS_KEY, null);
  if (Array.isArray(stored)) return stored;

  const seeded = DEMO_STAFF_LOGINS.map((login) =>
    makeAccount({ staffId: login.staffId, ownerId: DEMO_OWNER_ID, email: login.email, password: DEMO_STAFF_PASSWORD }),
  );
  write(ACCOUNTS_KEY, seeded);
  return seeded;
}

const saveStaffAccounts = (accounts) => write(ACCOUNTS_KEY, accounts);

// ---- Looking things up ----

/** Finds the gym and team record that an invitation token belongs to. */
function findInvite(token) {
  const clean = String(token ?? "").trim();
  if (!clean) return null;

  for (const owner of listAccounts()) {
    if (!owner.onboardingComplete) continue;
    const member = readGymState(owner).staff.find((item) => item.invite?.token === clean);
    if (member) return { owner, member };
  }
  return null;
}

/** Works out whether a login can be used right now, by checking the gym's record for that person. */
function evaluateAccount(account) {
  const owner = findAccountById(account.ownerId);
  if (!owner || !owner.onboardingComplete) return { status: "gone" };

  const state = readGymState(owner);
  const member = state.staff.find((item) => item.id === account.staffId);
  if (!member) return { status: "removed" };
  if (member.status === "suspended") return { status: "suspended" };
  if (member.status !== "active") return { status: "inactive" };
  return { status: "ok", owner, member, state };
}

/** A login still counts if its person is on the team. Leftovers from removed people do not. */
function isLive(account) {
  const { status } = evaluateAccount(account);
  return status === "ok" || status === "suspended";
}

/** What the rest of the app may know about the signed-in staff member. No password, no hash. */
function toStaffUser({ owner, member, state }) {
  return {
    id: member.id,
    ownerId: owner.id,
    name: member.name,
    email: member.email,
    phone: member.phone ?? "",
    role: member.role,
    roleLabel: roleLabel(member.role),
    permissions: getRolePermissions(state.rolePermissions)[member.role],
    gymName: owner.gymName,
    gymUsername: owner.gym?.username ?? "",
    joinedAt: member.joinedAt,
    photo: readStaffPhoto(member.id),
  };
}

function maskEmail(email) {
  const [local, domain = ""] = email.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}

function toLocalISODate(iso) {
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const newAuditId = () => `aud_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ---- Invitations ----

/**
 * What the invitation page shows before the person fills anything in.
 * The email is masked and the password never leaves this file: the person has to type their
 * own email, and acceptInvite checks it.
 */
export async function getInvitePreview(token) {
  await wait(450);

  const found = findInvite(token);
  if (!found) throw new StaffAuthError(INVITE_MESSAGES.invalid, "invalid");

  const { owner, member } = found;
  const state = inviteState(member);
  if (state !== "sent") throw new StaffAuthError(INVITE_MESSAGES[state] ?? INVITE_MESSAGES.invalid, state ?? "invalid");

  return {
    gymName: owner.gymName,
    name: member.name,
    emailHint: maskEmail(member.email),
    roleLabel: roleLabel(member.role),
    invitedBy: member.invite.invitedBy || owner.ownerName || owner.gymName,
    expiresOn: toLocalISODate(member.invite.expiresAt),
  };
}

/**
 * Creates the person's own login and marks the invitation as used.
 * The invitation is checked again here, so a link that was cancelled, replaced or used since
 * the page opened is refused. The check and the change happen in one save, so two quick
 * submits cannot both succeed.
 */
export async function acceptInvite(token, { name, phone, confirmEmail, password }) {
  await wait();

  const found = findInvite(token);
  if (!found) throw new StaffAuthError(INVITE_MESSAGES.invalid, "invalid");

  const { owner, member } = found;
  const state = inviteState(member);
  if (state !== "sent") throw new StaffAuthError(INVITE_MESSAGES[state] ?? INVITE_MESSAGES.invalid, state ?? "invalid");

  if (confirmEmail.trim().toLowerCase() !== member.email) {
    throw new StaffAuthError("That is not the email address this invitation was sent to.", "email_mismatch");
  }

  if (listAccounts().some((item) => item.email === member.email)) {
    throw new StaffAuthError("That email belongs to a gym owner account, so it cannot be used for staff.", "exists");
  }

  const accounts = loadStaffAccounts();
  const taken = accounts.find(
    (item) =>
      item.email === member.email && !(item.staffId === member.id && item.ownerId === owner.id) && isLive(item),
  );
  if (taken) {
    throw new StaffAuthError("An account with this email already exists. Sign in instead.", "exists");
  }

  const now = new Date().toISOString();
  const cleanName = name.trim();
  let accepted = false;

  writeGymState(owner, (current) => {
    const live = current.staff.find((item) => item.id === member.id);
    if (!live || inviteState(live) !== "sent") return current;
    accepted = true;

    return {
      ...current,
      staff: current.staff.map((item) =>
        item.id === member.id
          ? {
              ...item,
              name: cleanName,
              phone: phone.trim(),
              status: "active",
              joinedAt: now,
              lastActiveAt: now,
              invite: { ...item.invite, state: "used", usedAt: now },
            }
          : item,
      ),
      auditLog: [
        ...(current.auditLog ?? []),
        {
          id: newAuditId(),
          at: now,
          by: cleanName,
          action: "staff.joined",
          subjectId: member.id,
          summary: `${cleanName} accepted the invitation and created their account.`,
        },
      ],
    };
  });

  if (!accepted) throw new StaffAuthError(INVITE_MESSAGES.used, "used");

  // Replaces any leftover login for this person or this email from an earlier, closed invitation
  const rest = accounts.filter((item) => item.email !== member.email && item.staffId !== member.id);
  saveStaffAccounts([...rest, makeAccount({ staffId: member.id, ownerId: owner.id, email: member.email, password })]);

  return { name: cleanName, gymName: owner.gymName, roleLabel: roleLabel(member.role) };
}

// ---- Sessions ----

/**
 * Who is signed in as staff right now, checked against the gym's record.
 * status: "none" (nobody) | "ok" (with `user`) | "suspended" | "removed" | "inactive" | "gone".
 * It only reads. Ending a session that is no longer allowed is the caller's job (endStaffSession).
 */
export function resolveStaffSession() {
  const session = read(SESSION_KEY, null);
  if (!session?.staffId || !session?.ownerId) return { status: "none" };

  const account = loadStaffAccounts().find(
    (item) => item.staffId === session.staffId && item.ownerId === session.ownerId,
  );
  if (!account) return { status: "gone" };

  const result = evaluateAccount(account);
  if (result.status !== "ok") return { status: result.status };
  return { status: "ok", user: toStaffUser(result) };
}

/** Ends the staff session only. The owner's session is a different key and stays as it is. */
export function endStaffSession() {
  const session = read(SESSION_KEY, null);
  if (session?.staffId) endCurrentStaffSession(session.staffId);
  remove(SESSION_KEY);
}

/** Which gym the staff session belongs to, or null. Cheap: it does not check the person is still allowed in. */
export function getStaffSessionOwnerId() {
  return read(SESSION_KEY, null)?.ownerId ?? null;
}

export async function staffSignIn({ email, password }) {
  await wait(600);

  const cleanEmail = email.trim().toLowerCase();
  const account = loadStaffAccounts().find((item) => item.email === cleanEmail);

  // One message for "no such account" and "wrong password", so the screen never says which email exists
  if (!account || !sameHash(hashPassword(password, account.salt), account.hash)) {
    if (account) recordStaffFailedSignIn(account.staffId);
    throw new StaffAuthError("Email or password is incorrect.", "invalid_credentials");
  }

  // Only someone with the right password hears why they are blocked
  const result = evaluateAccount(account);
  if (result.status !== "ok") {
    throw new StaffAuthError(SIGN_IN_MESSAGES[result.status], result.status);
  }

  const now = new Date().toISOString();
  writeGymState(result.owner, (current) => ({
    ...current,
    staff: current.staff.map((item) => (item.id === account.staffId ? { ...item, lastActiveAt: now } : item)),
  }));

  write(SESSION_KEY, { staffId: account.staffId, ownerId: account.ownerId });
  recordStaffSignIn(account.staffId);

  const check = resolveStaffSession();
  if (check.status !== "ok") throw new StaffAuthError(SIGN_IN_MESSAGES.gone, "gone");
  return check.user;
}

export async function staffSignOut() {
  endStaffSession();
}

// ---- The signed-in staff member's own account ----

/** The person making this change, or an error if the session is no longer allowed. Never trusts an id from the screen. */
function requireStaffUser() {
  const result = resolveStaffSession();
  if (result.status !== "ok") throw new StaffAuthError(SIGN_IN_MESSAGES.gone, "gone");
  return result.user;
}

/**
 * Changes the signed-in person's own name, phone and photo. Email, role and gym are not
 * touched: only the owner changes those. The change is written to the gym's audit log.
 */
export async function updateStaffProfile({ name, phone, photo }) {
  await wait(400);
  const user = requireStaffUser();
  const owner = findAccountById(user.ownerId);

  const cleanName = name.trim();
  const cleanPhone = phone.trim();
  const cleanPhoto = photo ?? "";

  const changed = [];
  if (cleanName !== user.name) changed.push("name");
  if (cleanPhone !== user.phone) changed.push("phone");
  if (cleanPhoto !== user.photo) changed.push("photo");
  if (changed.length === 0) return;

  saveStaffPhoto(user.id, cleanPhoto);

  const now = new Date().toISOString();
  writeGymState(owner, (current) => ({
    ...current,
    staff: current.staff.map((item) =>
      item.id === user.id ? { ...item, name: cleanName, phone: cleanPhone } : item,
    ),
    auditLog: [
      ...(current.auditLog ?? []),
      {
        id: newAuditId(),
        at: now,
        by: cleanName,
        byId: user.id,
        byRole: user.roleLabel,
        action: "staff.updated",
        subjectId: user.id,
        summary: `${cleanName} updated their own profile (${changed.join(", ")}).`,
      },
    ],
  }));
}

/**
 * Changes the signed-in person's own password. The current password must be right.
 * Optionally ends their other sessions, which is the safe choice if someone else may know it.
 */
export async function changeStaffPassword({ currentPassword, newPassword, signOutOthers }) {
  await wait(500);
  const user = requireStaffUser();

  const accounts = loadStaffAccounts();
  const account = accounts.find((item) => item.staffId === user.id && item.ownerId === user.ownerId);
  if (!account || !sameHash(hashPassword(currentPassword, account.salt), account.hash)) {
    throw new StaffAuthError("Your current password is not correct.", "invalid_credentials", "currentPassword");
  }

  const salt = generateSalt();
  saveStaffAccounts(
    accounts.map((item) => (item === account ? { ...item, salt, hash: hashPassword(newPassword, salt) } : item)),
  );

  recordStaffPasswordChange(user.id);
  if (signOutOthers) endOtherStaffSessionsNow(user.id);
}

/** Used when a gym deletes its account: its staff logins go with it. */
export function removeStaffAccountsForGym(ownerId) {
  saveStaffAccounts(loadStaffAccounts().filter((item) => item.ownerId !== ownerId));
}

/** Always resolves, so the screen never reveals whether an email belongs to a staff account. */
export async function requestStaffPasswordReset() {
  await wait();
}

/**
 * Used by the demo reset: the demo gym's staff logins go back to the sample password, and a
 * staff session on the demo gym is ended. Logins that belong to real gyms are left alone.
 */
export function resetDemoStaffLogins() {
  const others = loadStaffAccounts().filter((account) => account.ownerId !== DEMO_OWNER_ID);
  const fresh = DEMO_STAFF_LOGINS.map((login) =>
    makeAccount({ staffId: login.staffId, ownerId: DEMO_OWNER_ID, email: login.email, password: DEMO_STAFF_PASSWORD }),
  );
  saveStaffAccounts([...fresh, ...others]);

  if (read(SESSION_KEY, null)?.ownerId === DEMO_OWNER_ID) remove(SESSION_KEY);
}