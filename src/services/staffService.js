
// Staff and role actions. Same pattern as planService: in the backend phase only the
// bodies of these functions change to API calls, and the server checks that the caller
// is the gym's owner before it does anything.
//
// Invitation rules live in lib/staff.js (availableActions). Every function here checks
// against that same list, so an action the screen does not offer is refused here too.

import {
  availableActions,
  displayStatus,
  getRolePermissions,
  inviteExpiry,
  PERMISSIONS,
  ROLES,
  ROLE_VALUES,
  roleLabel,
} from "@/lib/staff";
import { appendAudit } from "@/services/auditService";
import { getSessionUser } from "@/services/authService";
import { ServiceError } from "@/services/memberService";
import { getDb, updateDb } from "@/services/mockDb";
import { assertOwner } from "@/services/actor";

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

function findMember(id) {
  const member = getDb().staff.find((item) => item.id === id);
  if (!member) throw new ServiceError("Team member not found.");
  return member;
}

/** Refuses when `action` is not allowed for this person in their current state. */
function assertAllowed(member, action, message) {
  if (!availableActions(member).includes(action)) {
    throw new ServiceError(message);
  }
}

const changeMember = (state, id, patch) =>
  state.staff.map((item) => (item.id === id ? { ...item, ...patch } : item));

const changeInvite = (member, patch) => ({
  ...member.invite,
  ...patch,
});

/**
 * DEMO ONLY: a random string standing in for the invite link's secret.
 * Saved as plain text in this browser. The server will store only a hash of it.
 */
function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const ownerName = () => {
  const user = getSessionUser();
  return user?.ownerName || user?.gymName || "Owner";
};

function freshInvite(previousCount = 0) {
  const sentAt = new Date().toISOString();

  return {
    token: newToken(),
    state: "sent",
    sentAt,
    expiresAt: inviteExpiry(sentAt),
    sendCount: previousCount + 1,
    invitedBy: ownerName(),
    usedAt: null,
    cancelledAt: null,
  };
}

// Why a second invite to the same email is refused, in words that say what to do instead.
const DUPLICATE_MESSAGES = {
  active: "This person is already on your team.",
  suspended: "This person is already on your team, with access suspended.",
  pending: "This person already has a pending invite. Resend it from the team list.",
  expired: "Their earlier invite expired. Use Resend invite on their row.",
  cancelled: "You cancelled their earlier invite. Use Invite again on their row.",
};

export async function inviteStaff(input) {
  assertOwner("Only the gym owner can manage the team.");
  await wait();

  const db = getDb();

  if (!ROLE_VALUES.includes(input.role)) {
    throw new ServiceError("Choose a role.", "role");
  }

  const email = input.email.trim().toLowerCase();

  if (email === getSessionUser()?.email?.toLowerCase()) {
    throw new ServiceError(
      "That is your own owner email. Use a different address for staff.",
      "email"
    );
  }

  const existing = db.staff.find((item) => item.email === email);

  if (existing) {
    throw new ServiceError(DUPLICATE_MESSAGES[displayStatus(existing)], "email");
  }

  const invite = freshInvite();

  const member = {
    id: `staff_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    role: input.role,
    status: "invited",
    invitedAt: invite.sentAt,
    joinedAt: null,
    lastActiveAt: null,
    invite,
  };

  updateDb((state) => ({
    ...state,
    staff: [...state.staff, member],
    auditLog: appendAudit(state, {
      action: "staff.invited",
      subjectId: member.id,
      summary: `Invited ${member.name} as ${roleLabel(member.role)}.`,
    }),
  }));

  return member;
}

/** Name, phone and role. The email is the person's sign-in, so it stays as it is. */
export async function updateStaff(id, input) {
  assertOwner("Only the gym owner can manage the team.");
  await wait();

  const member = findMember(id);

  assertAllowed(
    member,
    "edit",
    "This invitation was cancelled. Invite them again to change their details."
  );

  if (!ROLE_VALUES.includes(input.role)) {
    throw new ServiceError("Choose a role.", "role");
  }

  const patch = {
    name: input.name.trim(),
    phone: input.phone.trim(),
    role: input.role,
  };

  if (
    patch.name === member.name &&
    patch.phone === (member.phone ?? "") &&
    patch.role === member.role
  ) {
    throw new ServiceError("Nothing has changed.");
  }

  const summary =
    patch.role !== member.role
      ? `Changed ${patch.name}'s role from ${roleLabel(member.role)} to ${roleLabel(patch.role)}.`
      : `Updated ${patch.name}'s details.`;

  updateDb((state) => ({
    ...state,
    staff: changeMember(state, id, patch),
    auditLog: appendAudit(state, {
      action: "staff.updated",
      subjectId: id,
      summary,
    }),
  }));
}

/** status: "active" | "suspended". Only an active member can be suspended, and only a suspended one reactivated. */
export async function setStaffStatus(id, status) {
  assertOwner("Only the gym owner can manage the team.");
  await wait(250);

  if (status !== "suspended" && status !== "active") {
    throw new ServiceError("Unknown status.");
  }

  const member = findMember(id);

  if (status === "suspended") {
    assertAllowed(member, "suspend", "Only active team members can be suspended.");
  } else {
    assertAllowed(member, "reactivate", "Only suspended team members can be reactivated.");
  }

  updateDb((state) => ({
    ...state,
    staff: changeMember(state, id, { status }),
    auditLog: appendAudit(state, {
      action: status === "suspended" ? "staff.suspended" : "staff.reactivated",
      subjectId: id,
      summary: `${status === "suspended" ? "Suspended" : "Reactivated"} ${member.name}.`,
    }),
  }));
}

/**
 * Sends a new invite. Works for a pending invite, an expired one, and (as "Invite again")
 * a cancelled one. The earlier link stops working because the token is replaced.
 */
export async function resendInvite(id) {
  assertOwner("Only the gym owner can manage the team.");
  await wait(250);

  const member = findMember(id);
  const cancelled = displayStatus(member) === "cancelled";

  assertAllowed(
    member,
    cancelled ? "reinvite" : "resend",
    "This person has already joined."
  );

  const invite = freshInvite(member.invite?.sendCount ?? 0);

  updateDb((state) => ({
    ...state,
    staff: changeMember(state, id, {
      status: "invited",
      invitedAt: invite.sentAt,
      invite,
    }),
    auditLog: appendAudit(state, {
      action: cancelled ? "staff.invited" : "staff.invite_resent",
      subjectId: id,
      summary: cancelled
        ? `Invited ${member.name} again as ${roleLabel(member.role)}.`
        : `Resent the invite to ${member.name}. The old link no longer works.`,
    }),
  }));
}

/** Withdraws an invite that has not been used. The record stays, marked cancelled, so there is a history. */
export async function cancelInvite(id) {
  assertOwner("Only the gym owner can manage the team.");
  await wait(250);

  const member = findMember(id);

  assertAllowed(member, "cancel", "Only a pending invite can be cancelled.");

  updateDb((state) => ({
    ...state,
    staff: changeMember(state, id, {
      invite: changeInvite(member, {
        state: "cancelled",
        cancelledAt: new Date().toISOString(),
      }),
    }),
    auditLog: appendAudit(state, {
      action: "staff.invite_cancelled",
      subjectId: id,
      summary: `Cancelled the invite to ${member.name}.`,
    }),
  }));
}

/**
 * DEMO ONLY: no email is sent, so the owner copies the link and shares it themselves.
 * The link opens the real invitation page. The token in it is the invite's secret.
 */
export function getInviteLink(id) {
  assertOwner("Only the gym owner can manage the team.");
  const member = findMember(id);

  assertAllowed(
    member,
    "copylink",
    "This invitation can no longer be shared. Send a new one first."
  );

  return `${window.location.origin}/staff/accept-invite?invite=${member.invite.token}`;
}

/** Takes someone off the team, or deletes a closed (expired or cancelled) invitation record. */
export async function removeStaff(id) {
  assertOwner("Only the gym owner can manage the team.");
  await wait(250);

  const member = findMember(id);
  const closed = ["expired", "cancelled"].includes(displayStatus(member));

  assertAllowed(
    member,
    closed ? "delete" : "remove",
    "Cancel a pending invite before removing it."
  );

  updateDb((state) => ({
    ...state,
    staff: state.staff.filter((item) => item.id !== id),
    auditLog: appendAudit(state, {
      action: "staff.removed",
      subjectId: id,
      summary: closed
        ? `Deleted the closed invitation record for ${member.name}.`
        : `Removed ${member.name} from the team.`,
    }),
  }));
}

const permissionLabel = (key) =>
  PERMISSIONS.find((permission) => permission.key === key)?.label ?? key;

/** `map` is { manager: [...], frontDesk: [...], trainer: [...] }. Cleaned the same way the server will clean it. */
export async function saveRolePermissions(map) {
  assertOwner("Only the gym owner can change role permissions.");
  await wait();

  const before = getRolePermissions(getDb().rolePermissions);
  const next = getRolePermissions(map);

  // Per role: which permissions were added and which were taken away, by name
  const changes = ROLES.map((role) => ({
    role: role.value,
    label: role.label,
    added: next[role.value].filter((key) => !before[role.value].includes(key)).map(permissionLabel),
    removed: before[role.value].filter((key) => !next[role.value].includes(key)).map(permissionLabel),
  })).filter((change) => change.added.length > 0 || change.removed.length > 0);

  if (changes.length === 0) {
    throw new ServiceError("Nothing has changed.");
  }

  const counts = changes
    .map((change) => {
      const parts = [];
      if (change.added.length > 0) parts.push(`+${change.added.length}`);
      if (change.removed.length > 0) parts.push(`−${change.removed.length}`);
      return `${change.label} (${parts.join(", ")})`;
    })
    .join(", ");

  updateDb((state) => ({
    ...state,
    rolePermissions: next,
    auditLog: appendAudit(state, {
      action: "roles.updated",
      summary: `Changed permissions for ${counts}.`,
      changes,
    }),
  }));
}
