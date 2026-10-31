// Who is performing an action, and what they may do.
//
// DEMO ONLY. This runs in the browser, so it demonstrates the rules but cannot enforce them:
// anyone with dev tools can bypass it. The backend phase repeats every check on the server,
// using the session, never an id or role sent by the browser.
//
// A tab is either the owner portal (/app) or the staff portal (/staff). That decides whose
// session counts, so an owner tab and a staff tab can be open at the same time without mixing.

import { hasPermission } from "@/lib/permissions";
import { findAccountById, getSessionId, getSessionUser } from "@/services/authService";
import { ServiceError } from "@/services/errors";
import { setGymResolver } from "@/services/mockDb";
import { getStaffSessionOwnerId, resolveStaffSession } from "@/services/staffAuthService";

const inStaffPortal = () => typeof window !== "undefined" && /^\/staff(\/|$)/.test(window.location.pathname);

/** The gym owner's public account for whoever is acting. Staff get the owner of their own gym. */
export function getGymOwner() {
  if (inStaffPortal()) {
    const ownerId = getStaffSessionOwnerId();
    return ownerId ? findAccountById(ownerId) : null;
  }
  return getSessionUser();
}

/**
 * The person acting right now, checked against the gym's record, or null if nobody valid.
 * kind "owner": may do everything an owner can.
 * kind "staff": limited to the permissions of their role, read fresh from storage each time.
 */
export function getActor() {
  if (inStaffPortal()) {
    const result = resolveStaffSession();
    if (result.status !== "ok") return null;
    const { user } = result;
    return {
      kind: "staff",
      id: user.id,
      name: user.name,
      roleLabel: user.roleLabel,
      ownerId: user.ownerId,
      permissions: user.permissions,
    };
  }

  const owner = getSessionUser();
  if (!owner) return null;
  return {
    kind: "owner",
    id: owner.id,
    name: owner.ownerName || owner.gymName || "Owner",
    roleLabel: "Owner",
    ownerId: owner.id,
    permissions: null,
  };
}

export function requireActor() {
  const actor = getActor();
  if (!actor) throw new ServiceError("Your session has ended. Please sign in again.");
  return actor;
}

export const actorCan = (actor, permission) => actor.kind === "owner" || hasPermission(actor.permissions, permission);

/** Throws unless the current actor has the permission. Returns the actor so callers can use it. */
export function assertCan(permission, message = "Your role does not allow this action.") {
  const actor = requireActor();
  if (!actorCan(actor, permission)) throw new ServiceError(message);
  return actor;
}

/** For things that are never given to staff, whatever their permissions. */
export function assertOwner(message = "Only the gym owner can do this.") {
  const actor = requireActor();
  if (actor.kind !== "owner") throw new ServiceError(message);
  return actor;
}

// Tell the fake database which gym this tab works on. Owner tabs behave exactly as before.
setGymResolver({
  id: () => (inStaffPortal() ? getStaffSessionOwnerId() : getSessionId()),
  user: () => getGymOwner(),
});