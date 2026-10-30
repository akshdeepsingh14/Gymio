// Access codes for the member portal.
//
// DEMO ONLY: a salted SHA-256 is fast to compute, which is fine for a localStorage demo
// but NOT for real credentials. The backend phase replaces this with a server-side
// slow hash plus rate limiting, and the code is only ever checked on the server.

import { sha256Hex } from "@/lib/sha256";

/** How long a new code stays valid, in days. Becomes an owner setting later. */
export const CREDENTIAL_VALID_DAYS = 7;

// 32 characters, so one random byte maps evenly with "& 31" (no bias).
// No 0, O, 1 or I, so a code read aloud or from a screenshot is hard to mix up.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 12;

function randomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}

/** "K7QM-4TXD-9HWB": 12 random characters, about 60 bits of randomness. */
export function generateAccessCode() {
  const chars = Array.from(randomBytes(CODE_LENGTH), (byte) => ALPHABET[byte & 31]);
  return [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8, 12)].map((group) => group.join("")).join("-");
}

/** Accepts "k7qm 4txd-9hwb" and "K7QM4TXD9HWB" alike. */
export const normalizeCode = (input = "") => input.toUpperCase().replace(/[^A-Z0-9]/g, "");

export const generateSalt = () =>
  Array.from(randomBytes(16), (byte) => byte.toString(16).padStart(2, "0")).join("");

export const hashCode = (code, salt) => sha256Hex(`${salt}:${normalizeCode(code)}`);

/** Phase 7 uses this. Compares every character so timing cannot hint at a near match. */
export function verifyCode(code, credential) {
  if (!credential) return false;
  const attempt = hashCode(code, credential.salt);
  if (attempt.length !== credential.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < attempt.length; i += 1) diff |= attempt.charCodeAt(i) ^ credential.hash.charCodeAt(i);
  return diff === 0;
}

/** "none" | "active" | "expired" | "revoked". `today` is a YYYY-MM-DD string. */
export function getCredentialState(credential, today) {
  if (!credential) return "none";
  if (credential.status === "revoked") return "revoked";
  if (credential.expiresOn < today) return "expired";
  return "active";
}