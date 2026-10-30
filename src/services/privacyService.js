// Data and privacy actions: export log, retention setting and account deletion.
// DEMO ONLY: deleting an account here wipes this browser's copy. In the backend phase the
// server deletes the gym's records after the waiting period, and the owner's session ends.

import { addDays, todayISO } from "@/lib/dates";
import { DELETION_WAIT_DAYS, getDataPolicy, retentionLabel } from "@/lib/dataPrivacy";
import { appendAudit } from "@/services/auditService";
import { getSessionUser, removeAccount, verifyPassword } from "@/services/authService";
import { ServiceError } from "@/services/memberService";
import { clearGymData, getDb, updateDb } from "@/services/mockDb";

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

const DEMO_OWNER_ID = "owner_demo";

export const isDemoAccount = (user) => user?.id === DEMO_OWNER_ID;

function requireOwner() {
  const user = getSessionUser();
  if (!user) throw new ServiceError("Your session expired. Please sign in again.");
  return user;
}

const DEMO_BLOCKED = "The demo account can't be deleted. Create your own account to try this.";

/** Writes one line to the audit log after a file was downloaded. `summary` says what was exported. */
export function logExport(summary) {
  updateDb((state) => ({ ...state, auditLog: appendAudit(state, { action: "data.exported", summary }) }));
}

export async function saveDataPolicy(input) {
  await wait();
  const before = getDataPolicy(getDb().dataPolicy);
  const next = getDataPolicy(input);

  if (before.inactiveRetention === next.inactiveRetention) throw new ServiceError("Nothing has changed.");

  updateDb((state) => ({
    ...state,
    dataPolicy: next,
    auditLog: appendAudit(state, {
      action: "data.policy",
      summary: `Set the inactive member review period to: ${retentionLabel(next.inactiveRetention)}.`,
    }),
  }));
}

/** Schedules deletion. The gym keeps working until the owner deletes it or the wait is over. */
export async function requestDeletion({ gymName, password }) {
  const user = requireOwner();
  if (isDemoAccount(user)) throw new ServiceError(DEMO_BLOCKED);
  if (getDb().deletionRequest) throw new ServiceError("Deletion is already scheduled.");

  if (String(gymName ?? "").trim() !== user.gymName) {
    throw new ServiceError("Type the gym name exactly as shown.", "gymName");
  }
  if (!(await verifyPassword(user.id, password))) {
    throw new ServiceError("Your password is incorrect.", "password");
  }

  const request = { requestedAt: new Date().toISOString(), scheduledFor: addDays(todayISO(), DELETION_WAIT_DAYS) };
  updateDb((state) => ({
    ...state,
    deletionRequest: request,
    auditLog: appendAudit(state, {
      action: "account.deletion_requested",
      summary: `Asked to delete the account. Deletion is scheduled for ${request.scheduledFor}.`,
    }),
  }));
  return request;
}

export async function cancelDeletion() {
  await wait(250);
  if (!getDb().deletionRequest) throw new ServiceError("No deletion is scheduled.");

  updateDb((state) => ({
    ...state,
    deletionRequest: null,
    auditLog: appendAudit(state, { action: "account.deletion_cancelled", summary: "Cancelled the account deletion." }),
  }));
}

/** DEMO ONLY shortcut: deletes at once instead of waiting for the scheduled date. */
export async function deleteAccountNow() {
  await wait(600);
  const user = requireOwner();
  if (isDemoAccount(user)) throw new ServiceError(DEMO_BLOCKED);
  if (!getDb().deletionRequest) throw new ServiceError("Request deletion first.");

  removeAccount(user.id);
  clearGymData(user.id);
  try {
    // The security record and the current-session marker belong to the same account
    localStorage.removeItem(`gymio-security-${user.id}`);
    localStorage.removeItem("gymio-current-session");
  } catch {
    // Storage blocked: nothing more to remove.
  }
}