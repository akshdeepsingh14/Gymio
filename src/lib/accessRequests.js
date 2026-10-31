import { getMemberStatus } from "@/lib/membership";

/** A request nobody answers for this long is closed, so old requests cannot be approved by accident. */
export const REQUEST_VALID_HOURS = 48;

export const REQUEST_TABS = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "closed", label: "Closed" },
  { id: "all", label: "All" },
];

// "Closed" gathers the requests that ended without a decision on this screen: the member
// cancelled, nobody answered in time, or an approval was withdrawn later.
export const CLOSED_STATUSES = ["cancelled", "expired", "revoked"];

export const REQUEST_STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
  revoked: "Revoked",
};

/**
 * Why a request cannot be approved for this member right now, or null if it can.
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

export const isStale = (request, now = Date.now()) =>
  request.status === "pending" && now - new Date(request.requestedAt).getTime() > REQUEST_VALID_HOURS * 3_600_000;

/** Returns the same state object when nothing is stale, so callers can skip saving. */
export function expireStale(state, now = Date.now()) {
  if (!state.accessRequests.some((request) => isStale(request, now))) return state;

  const at = new Date(now).toISOString();
  return {
    ...state,
    accessRequests: state.accessRequests.map((request) =>
      isStale(request, now)
        ? { ...request, status: "expired", decidedAt: at, decidedBy: "Gymio", decidedByRole: "No answer in time" }
        : request,
    ),
  };
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
  const counts = { pending: 0, approved: 0, rejected: 0, cancelled: 0, expired: 0, revoked: 0, closed: 0, all: rows.length };
  for (const row of rows) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
    if (CLOSED_STATUSES.includes(row.status)) counts.closed += 1;
  }
  return counts;
}

export function filterRequests(rows, { tab, query }) {
  const needle = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (tab === "closed" ? !CLOSED_STATUSES.includes(row.status) : tab !== "all" && row.status !== tab) return false;
    if (!needle) return true;
    return row.name.toLowerCase().includes(needle) || row.memberId.toLowerCase().includes(needle);
  });
}