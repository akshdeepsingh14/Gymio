import { getMemberStatus } from "@/lib/membership";

export const REQUEST_TABS = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

export const REQUEST_STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

/**
 * Why an owner cannot approve this member right now, or null if they can.
 * `standing` comes from getMemberStatus. The service uses this too, so the
 * button and the rule can never disagree.
 */
export function getApprovalBlock(member, standing) {
  if (!member) return "This member no longer exists.";
  if (member.accessStatus === "inactive") return "This member is deactivated.";
  if (member.accessStatus === "suspended") return "Access is suspended. Lift the suspension first.";
  if (standing.status === "expired" && !standing.inGrace) {
    return "The membership and its grace period have ended. Record a renewal first.";
  }
  return null;
}

/** Joins each request with its member and plan, newest first. */
export function buildRequestRows({ accessRequests, members, plans }, today, rules) {
  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));
  const planById = Object.fromEntries(plans.map((p) => [p.id, p]));

  return accessRequests
    .map((request) => {
      const member = memberById[request.memberId] ?? null;
      const standing = member ? getMemberStatus(member, today, rules) : null;
      return {
        ...request,
        member,
        standing,
        name: member?.name ?? request.memberName,
        planName: member ? (planById[member.planId]?.name ?? "") : "",
        block: request.status === "pending" ? getApprovalBlock(member, standing) : null,
      };
    })
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

export function countByStatus(rows) {
  const counts = { pending: 0, approved: 0, rejected: 0, cancelled: 0, all: rows.length };
  for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1;
  return counts;
}

export function filterRequests(rows, { tab, query }) {
  const needle = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (tab !== "all" && row.status !== tab) return false;
    if (!needle) return true;
    return row.name.toLowerCase().includes(needle) || row.memberId.toLowerCase().includes(needle);
  });
}