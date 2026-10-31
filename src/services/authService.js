// DEMO ONLY. This fakes a backend using localStorage.
// It is NOT secure: passwords are salted and hashed with plain SHA-256 inside the browser,
// which anyone with dev tools can attack offline.
// In the backend phase this whole file is replaced by real API calls
// (slow password hash, httpOnly sessions, server-side authorization).

import { RESERVED_USERNAMES } from "@/data/options";
import { parseGymSettingsPatch } from "@/lib/gymSettings";
import { createPasswordRecord, passwordMatches } from "@/lib/passwordHash";
import {
  endCurrentSession,
  endOtherSessionsNow,
  recordFailedSignIn,
  recordPasswordChange,
  recordSignIn,
} from "@/services/securityService";

const ACCOUNTS_KEY = "gymio-demo-accounts";
const SESSION_KEY = "gymio-demo-session";
const RESET_KEY = "gymio-demo-reset-email";

export const DEMO_CREDENTIALS = { email: "demo@gymio.app", password: "Demo@1234" };

const DEMO_ACCOUNT = {
  id: "owner_demo",
  email: DEMO_CREDENTIALS.email,
  ...createPasswordRecord(DEMO_CREDENTIALS.password),
  ownerName: "Arjun Mehta",
  gymName: "Ironforge Fitness",
  onboardingComplete: true,
  gym: {
    username: "ironforge-fitness",
    phone: "",
    city: "Pune",
    locality: "Kothrud",
    currency: "INR",
    timeZone: "Asia/Kolkata",
    graceDays: 10,
    reminderDays: 7,
  },
  createdAt: "2026-01-12T09:00:00.000Z",
};

export class AuthError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "AuthError";
    this.field = field;
  }
}

const wait = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));
const normalizeEmail = (email) => email.trim().toLowerCase();

function read(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be blocked (private mode). The demo just won't persist.
  }
}

// Accounts saved by an older version kept the password as plain text. Swap it for a salted hash.
function hashLegacyPassword(account) {
  if (typeof account.password !== "string") return account;
  const { password, ...rest } = account;
  return { ...rest, ...createPasswordRecord(password) };
}

function loadAccounts() {
  const stored = read(localStorage, ACCOUNTS_KEY, null);
  if (Array.isArray(stored) && stored.length > 0) {
    if (!stored.some((account) => typeof account.password === "string")) return stored;
    const upgraded = stored.map(hashLegacyPassword);
    write(localStorage, ACCOUNTS_KEY, upgraded);
    return upgraded;
  }
  write(localStorage, ACCOUNTS_KEY, [DEMO_ACCOUNT]);
  return [DEMO_ACCOUNT];
}

const STORAGE_FULL =
  "Your browser has no storage left, so this was not saved. Remove a large image such as a cover photo or a gallery photo, then try again.";

const isQuotaError = (error) =>
  error?.name === "QuotaExceededError" ||
  error?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
  error?.code === 22 ||
  error?.code === 1014;

// A full store must never end in a "saved" message. Storage that is merely blocked (private mode)
// still falls back to keeping the demo in memory, as before.
function saveAccounts(accounts) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (error) {
    if (isQuotaError(error)) throw new AuthError(STORAGE_FULL);
  }
}

// Where the sign-in is remembered. "Keep me signed in" uses localStorage, which survives closing
// the browser. Without it the session lives in sessionStorage and ends when the browser is closed.
const readSessionId = () => read(sessionStorage, SESSION_KEY, null) ?? read(localStorage, SESSION_KEY, null);

function clearSession() {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      storage.removeItem(SESSION_KEY);
    } catch {
      // Storage blocked: nothing to remove.
    }
  }
}

function startSession(id, remember) {
  clearSession();
  write(remember ? localStorage : sessionStorage, SESSION_KEY, id);
}

function toPublicUser(account) {
  if (!account) return null;
  const user = { ...account };
  delete user.password;
  delete user.salt;
  delete user.hash;
  return user;
}

export function getSessionUser() {
  const id = readSessionId();
  if (!id) return null;
  return toPublicUser(loadAccounts().find((a) => a.id === id));
}

export async function signIn({ email, password, remember = true }) {
  await wait();
  const known = loadAccounts().find((a) => a.email === normalizeEmail(email));
  const account = known && passwordMatches(known, password) ? known : null;

  if (!account) {
    // Logged against the real account, so its owner sees the attempt. The message stays generic:
    // never say which of the two was wrong.
    if (known) recordFailedSignIn(known.id);
    throw new AuthError("Email or password is incorrect.");
  }

  startSession(account.id, remember);
  recordSignIn(account.id);
  return toPublicUser(account);
}

export async function signUp({ gymName, email, password }) {
  await wait();
  const accounts = loadAccounts();
  const cleanEmail = normalizeEmail(email);

  if (accounts.some((a) => a.email === cleanEmail)) {
    throw new AuthError("An account with this email already exists.", "email");
  }

  const account = {
    id: `owner_${Date.now().toString(36)}`,
    email: cleanEmail,
    ...createPasswordRecord(password),
    ownerName: "",
    gymName: gymName.trim(),
    onboardingComplete: false,
    gym: null,
    createdAt: new Date().toISOString(),
  };

  saveAccounts([...accounts, account]);
  startSession(account.id, true);
  recordSignIn(account.id);
  return toPublicUser(account);
}

export async function signOut() {
  const ownerId = readSessionId();
  if (ownerId) endCurrentSession(ownerId);
  clearSession();
}

export async function checkUsername(username, ownerId) {
  await wait(350);
  const name = username.trim().toLowerCase();
  if (RESERVED_USERNAMES.includes(name)) return false;
  return !loadAccounts().some((a) => a.id !== ownerId && a.gym?.username === name);
}

export async function completeOnboarding(ownerId, data) {
  const available = await checkUsername(data.username, ownerId);
  if (!available) throw new AuthError("That username is already taken.", "username");

  const accounts = loadAccounts();
  const index = accounts.findIndex((a) => a.id === ownerId);
  if (index === -1) throw new AuthError("Your session expired. Please sign in again.");

  const { ownerName, ...gym } = data;
  accounts[index] = { ...accounts[index], ownerName, onboardingComplete: true, gym };
  saveAccounts(accounts);
  return toPublicUser(accounts[index]);
}

/**
 * Saves the Gym Profile form. `data` holds every profile field (see toProfileForm).
 * Email and username must stay unique across accounts.
 */
export async function updateProfile(ownerId, data) {
  await wait();

  const email = normalizeEmail(data.email);
  const username = data.username.trim().toLowerCase();
  const accounts = loadAccounts();
  const index = accounts.findIndex((a) => a.id === ownerId);
  if (index === -1) throw new AuthError("Your session expired. Please sign in again.");

  if (accounts.some((a) => a.id !== ownerId && a.email === email)) {
    throw new AuthError("An account with this email already exists.", "email");
  }

  const current = accounts[index];

  // The email is what you sign in with and where a password reset goes, so changing it needs the password.
  // Otherwise anyone at an unlocked computer could take the account over.
  if (email !== current.email && !passwordMatches(current, data.currentPassword)) {
    throw new AuthError("Enter your current password to change your email.", "currentPassword");
  }
  if (username !== current.gym?.username && !(await checkUsername(username, ownerId))) {
    throw new AuthError("That username is already taken.", "username");
  }

  accounts[index] = {
    ...current,
    email,
    gymName: data.gymName.trim(),
    ownerName: data.ownerName.trim(),
    ownerPhoto: data.ownerPhoto,
    gym: {
      ...current.gym, // keeps grace period, reminders and anything this form does not edit
      username,
      description: data.description,
      logo: data.logo,
      cover: data.cover,
      phone: data.phone,
      address: data.address,
      city: data.city,
      locality: data.locality,
      website: data.website,
      instagram: data.instagram,
      hours: data.hours,
      currency: data.currency,
      timeZone: data.timeZone,
    },
  };
  saveAccounts(accounts);
  return toPublicUser(accounts[index]);
}

/**
 * Saves gym-level rules from the Settings tabs (grace period, reminders, theme and so on).
 * `patch` holds only the settings that changed. parseGymSettingsPatch checks them and
 * drops anything that is not a known setting. In the backend phase the server repeats this check.
 */
export async function updateGymSettings(ownerId, patch) {
  await wait(450);

  const accounts = loadAccounts();
  const index = accounts.findIndex((a) => a.id === ownerId);
  if (index === -1) throw new AuthError("Your session expired. Please sign in again.");
  if (!accounts[index].gym) throw new AuthError("Finish setting up your gym first.");

  const parsed = parseGymSettingsPatch(patch, accounts[index].gym);
  if (parsed.error) throw new AuthError(parsed.error.message, parsed.error.field);

  accounts[index] = { ...accounts[index], gym: { ...accounts[index].gym, ...parsed.value } };
  saveAccounts(accounts);
  return toPublicUser(accounts[index]);
}

/**
 * Changes the password from Settings > Security. The current password must match.
 * With signOutOthers, every session except this one is ended too.
 */
export async function changePassword(ownerId, { currentPassword, newPassword, signOutOthers }) {
  await wait();

  const accounts = loadAccounts();
  const index = accounts.findIndex((a) => a.id === ownerId);
  if (index === -1) throw new AuthError("Your session expired. Please sign in again.");

  if (!passwordMatches(accounts[index], currentPassword)) {
    throw new AuthError("Your current password is incorrect.", "currentPassword");
  }
  if (newPassword === currentPassword) {
    throw new AuthError("The new password must be different from the current one.", "newPassword");
  }

  accounts[index] = { ...accounts[index], ...createPasswordRecord(newPassword) };
  saveAccounts(accounts);
  recordPasswordChange(ownerId);
  if (signOutOthers) endOtherSessionsNow(ownerId);
}

// ---- Password reset (demo: no email is sent) ----

export async function requestPasswordReset(email) {
  await wait();
  const exists = loadAccounts().some((a) => a.email === normalizeEmail(email));
  if (exists) write(sessionStorage, RESET_KEY, normalizeEmail(email));
  // Always resolve: the UI must not reveal whether an email is registered.
}

export const hasPendingReset = () => Boolean(read(sessionStorage, RESET_KEY, null));

export async function resetPassword(password) {
  await wait();
  const email = read(sessionStorage, RESET_KEY, null);
  if (!email) throw new AuthError("This reset link has expired. Request a new one.");

  const accounts = loadAccounts();
  const index = accounts.findIndex((a) => a.email === email);
  if (index === -1) throw new AuthError("This reset link has expired. Request a new one.");

  accounts[index] = { ...accounts[index], ...createPasswordRecord(password) };
  saveAccounts(accounts);
  recordPasswordChange(accounts[index].id);
  try {
    sessionStorage.removeItem(RESET_KEY);
  } catch {
    // ignore
  }
}

export const getSessionId = () => readSessionId();

// ---- Lookups used by the member portal (no owner session needed) ----

export function findAccountByUsername(username) {
  const name = username.trim().replace(/^@/, "").toLowerCase();
  if (!name) return null;
  return toPublicUser(loadAccounts().find((a) => a.onboardingComplete && a.gym?.username === name));
}

export function findAccountById(id) {
  return toPublicUser(loadAccounts().find((a) => a.id === id));
}

/** Every owner account, without passwords. Staff sign-in uses it to find which gym an invitation belongs to. */
export function listAccounts() {
  return loadAccounts().map(toPublicUser);
}

// ---- Used by Settings > Data and privacy ----

/** Checks the owner's password before a sensitive action. Resolves true or false. */
export async function verifyPassword(ownerId, password) {
  await wait(400);
  const account = loadAccounts().find((a) => a.id === ownerId);
  return passwordMatches(account, password);
}

/** Deletes the account record and ends its session. Only the privacy service calls this. */
export function removeAccount(ownerId) {
  saveAccounts(loadAccounts().filter((a) => a.id !== ownerId));
  clearSession();
}