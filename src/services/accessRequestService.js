// The owner side of the access flow: approving or rejecting a member's request.
// DEMO ONLY: this runs in the browser. In the backend phase the server checks that
// the signed-in owner (or staff member) owns this gym before it changes anything.

import { getApprovalBlock } from "@/lib/accessRequests";
import { todayISO } from "@/lib/dates";
import { getMemberStatus } from "@/lib/membership";
import { appendAudit } from "@/services/auditService";
import { getSessionUser } from "@/services/authService";
import { ServiceError } from "@/services/memberService";
import { getDb, updateDb } from "@/services/mockDb";

const wait = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

/** Re-reads the request, because the member may have cancelled it while the owner was looking. */
function findPending(requestId) {
  const request = getDb().accessRequests.find((r) => r.id === requestId);
  if (!request) throw new ServiceError("Request not found.");
  if (request.status === "cancelled") throw new ServiceError("The member cancelled this request.");
  if (request.status !== "pending") throw new ServiceError("This request has already been decided.");
  return request;
}

function save(request, status, { reason = "", revokeCode = false } = {}) {
  const user = getSessionUser();
  const decidedAt = new Date().toISOString();
  const decidedBy = user?.ownerName || "Owner";

  updateDb((state) => ({
    ...state,
    accessRequests: state.accessRequests.map((r) =>
      r.id === request.id
        ? { ...r, status, decidedAt, decidedBy, ...(reason ? { reason } : {}) }
        : r,
    ),
    members: revokeCode
      ? state.members.map((m) =>
          m.id === request.memberId && m.credential && m.credential.status !== "revoked"
            ? { ...m, credential: { ...m.credential, status: "revoked", revokedAt: decidedAt } }
            : m,
        )
      : state.members,
    auditLog: appendAudit(state, {
      action: `access.${status}`,
      requestId: request.id,
      memberId: request.memberId,
      ...(reason ? { reason } : {}),
      ...(revokeCode ? { codeRevoked: true } : {}),
    }),
  }));
}

export async function approveRequest(requestId) {
  await wait();
  const request = findPending(requestId);

  const member = getDb().members.find((m) => m.id === request.memberId) ?? null;
  const rules = { graceDays: getSessionUser()?.gym?.graceDays ?? 10 };
  const standing = member ? getMemberStatus(member, todayISO(), rules) : null;

  const block = getApprovalBlock(member, standing);
  if (block) throw new ServiceError(block);

  save(request, "approved");
  return { name: member.name };
}

export async function rejectRequest(requestId, { reason = "", revokeCode = false } = {}) {
  await wait();
  const request = findPending(requestId);
  save(request, "rejected", { reason: reason.trim(), revokeCode });
}