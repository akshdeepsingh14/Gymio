// Staff and role actions. Same pattern as planService: in the backend phase only the
// bodies of these functions change to API calls, and the server checks that the caller
// is the gym's owner before it does anything.

import { getRolePermissions, ROLES, ROLE_VALUES, roleLabel } from "@/lib/staff";
import { appendAudit } from "@/services/auditService";
import { getSessionUser } from "@/services/authService";
import { ServiceError } from "@/services/memberService";
import { getDb, updateDb } from "@/services/mockDb";

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

function findMember(id) {
  const member = getDb().staff.find((item) => item.id === id);
  if (!member) throw new ServiceError("Team member not found.");
  return member;
}

const changeMember = (state, id, patch) => state.staff.map((item) => (item.id === id ? { ...item, ...patch } : item));

export async function inviteStaff(input) {
  await wait();
  const db = getDb();

  if (!ROLE_VALUES.includes(input.role)) throw new ServiceError("Choose a role.", "role");

  const email = input.email.trim().toLowerCase();
  if (email === getSessionUser()?.email?.toLowerCase()) {
    throw new ServiceError("That is your own owner email. Use a different address for staff.", "email");
  }
  if (db.staff.some((item) => item.email === email)) {
    throw new ServiceError("This person is already on your team.", "email");
  }

  const member = {
    id: `staff_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    role: input.role,
    status: "invited",
    invitedAt: new Date().toISOString(),
    lastActiveAt: null,
  };

  updateDb((state) => ({
    ...state,
    staff: [...state.staff, member],
    auditLog: appendAudit(state, {
      action: "staff.invited",
      summary: `Invited ${member.name} as ${roleLabel(member.role)}.`,
    }),
  }));
  return member;
}

/** Name, phone and role. The email is the person's sign-in, so it stays as it is. */
export async function updateStaff(id, input) {
  await wait();
  const member = findMember(id);
  if (!ROLE_VALUES.includes(input.role)) throw new ServiceError("Choose a role.", "role");

  const patch = { name: input.name.trim(), phone: input.phone.trim(), role: input.role };
  if (patch.name === member.name && patch.phone === (member.phone ?? "") && patch.role === member.role) {
    throw new ServiceError("Nothing has changed.");
  }

  const summary =
    patch.role !== member.role
      ? `Changed ${patch.name}'s role from ${roleLabel(member.role)} to ${roleLabel(patch.role)}.`
      : `Updated ${patch.name}'s details.`;

  updateDb((state) => ({
    ...state,
    staff: changeMember(state, id, patch),
    auditLog: appendAudit(state, { action: "staff.updated", summary }),
  }));
}

/** status: "active" | "suspended". Only an active member can be suspended, and only a suspended one reactivated. */
export async function setStaffStatus(id, status) {
  await wait(250);
  const member = findMember(id);

  if (status === "suspended" && member.status !== "active") {
    throw new ServiceError("Only active team members can be suspended.");
  }
  if (status === "active" && member.status !== "suspended") {
    throw new ServiceError("Only suspended team members can be reactivated.");
  }
  if (status !== "suspended" && status !== "active") throw new ServiceError("Unknown status.");

  updateDb((state) => ({
    ...state,
    staff: changeMember(state, id, { status }),
    auditLog: appendAudit(state, {
      action: status === "suspended" ? "staff.suspended" : "staff.reactivated",
      summary: `${status === "suspended" ? "Suspended" : "Reactivated"} ${member.name}.`,
    }),
  }));
}

export async function resendInvite(id) {
  await wait(250);
  const member = findMember(id);
  if (member.status !== "invited") throw new ServiceError("This person has already joined.");

  updateDb((state) => ({
    ...state,
    staff: changeMember(state, id, { invitedAt: new Date().toISOString() }),
    auditLog: appendAudit(state, { action: "staff.invited", summary: `Sent ${member.name} a new invite.` }),
  }));
}

/** DEMO ONLY: stands in for the person opening their invite email and choosing a password. */
export async function simulateAcceptInvite(id) {
  await wait(250);
  const member = findMember(id);
  if (member.status !== "invited") throw new ServiceError("This person has already joined.");

  const now = new Date().toISOString();
  updateDb((state) => ({
    ...state,
    staff: changeMember(state, id, { status: "active", lastActiveAt: now }),
    auditLog: appendAudit(state, { action: "staff.joined", summary: `${member.name} accepted the invite (demo).` }),
  }));
}

export async function removeStaff(id) {
  await wait(250);
  const member = findMember(id);

  updateDb((state) => ({
    ...state,
    staff: state.staff.filter((item) => item.id !== id),
    auditLog: appendAudit(state, { action: "staff.removed", summary: `Removed ${member.name} from the team.` }),
  }));
}

/** `map` is { manager: [...], frontDesk: [...], trainer: [...] }. Cleaned the same way the server will clean it. */
export async function saveRolePermissions(map) {
  await wait();
  const before = getRolePermissions(getDb().rolePermissions);
  const next = getRolePermissions(map);

  const changed = ROLES.filter((role) => JSON.stringify(before[role.value]) !== JSON.stringify(next[role.value]));
  if (changed.length === 0) throw new ServiceError("Nothing has changed.");

  updateDb((state) => ({
    ...state,
    rolePermissions: next,
    auditLog: appendAudit(state, {
      action: "roles.updated",
      summary: `Changed permissions for ${changed.map((role) => role.label).join(", ")}.`,
    }),
  }));
}