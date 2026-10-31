
// Creating and revoking member access codes. The plain code is returned to the
// caller once and is never stored. Only its salted hash is saved.
// In the backend phase this becomes an API call and the server does all of this.

import { CREDENTIAL_VALID_DAYS, generateAccessCode, generateSalt, hashCode } from "@/lib/credentials";
import { addDays, todayISO } from "@/lib/dates";
import { ServiceError } from "@/services/memberService";
import { assertCan } from "@/services/actor";
import { getDb, updateDb } from "@/services/mockDb";

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

/** Creates a new code. Any earlier code for this member stops working immediately. */
export async function issueCredential(memberId) {
  assertCan("members.manage", "Your role cannot manage access codes.");

  await wait();
  const member = getDb().members.find((m) => m.id === memberId);
  if (!member) throw new ServiceError("Member not found.");
  if (member.accessStatus === "inactive") {
    throw new ServiceError("Reactivate this member before creating an access code.");
  }
  if (member.accessStatus === "suspended") {
    throw new ServiceError("Lift the suspension before creating an access code.");
  }

  const code = generateAccessCode();
  const salt = generateSalt();
  const credential = {
    salt,
    hash: hashCode(code, salt),
    status: "active",
    issuedAt: new Date().toISOString(),
    expiresOn: addDays(todayISO(), CREDENTIAL_VALID_DAYS),
  };

  updateDb((state) => ({
    ...state,
    members: state.members.map((m) => (m.id === memberId ? { ...m, credential } : m)),
  }));

  return { code, expiresOn: credential.expiresOn };
}

export async function revokeCredential(memberId) {
  assertCan("members.manage", "Your role cannot manage access codes.");

  await wait(250);
  const member = getDb().members.find((m) => m.id === memberId);
  if (!member) throw new ServiceError("Member not found.");
  if (!member.credential || member.credential.status === "revoked") {
    throw new ServiceError("This member has no active access code.");
  }

  updateDb((state) => ({
    ...state,
    members: state.members.map((m) =>
      m.id === memberId
        ? { ...m, credential: { ...m.credential, status: "revoked", revokedAt: new Date().toISOString() } }
        : m,
    ),
  }));
}
