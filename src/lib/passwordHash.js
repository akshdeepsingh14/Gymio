// Salted password hashing for the demo, shared by the owner and staff logins.
// DEMO ONLY: a plain SHA-256 in the browser is not real security. The backend uses a slow password
// hash (argon2 or bcrypt), rate limiting and server-side sessions.

import { generateSalt } from "@/lib/credentials";
import { sha256Hex } from "@/lib/sha256";

export const hashPassword = (password, salt) => sha256Hex(`${salt}:${password}`);

/** Compares every character, so timing does not hint at a near match. */
export function sameHash(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** { salt, hash } for a new password. */
export function createPasswordRecord(password) {
  const salt = generateSalt();
  return { salt, hash: hashPassword(password, salt) };
}

/** True when `password` is the one this record was made from. */
export const passwordMatches = (record, password) =>
  Boolean(record?.salt) && sameHash(hashPassword(String(password ?? ""), record.salt), record.hash);