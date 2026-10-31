// The gym side of the access flow: approving, rejecting or revoking a member's request.
//
// DEMO ONLY: this runs in the browser. In the backend phase the server checks that
// the signed-in owner (or staff member) belongs to this gym before it changes anything.

import { expireStale, getApprovalBlock, isStale } from "@/lib/accessRequests";
import { todayISO } from "@/lib/dates";
import { getGymSettings } from "@/lib/gymSettings";
import { getMemberStatus } from "@/lib/membership";
import { appendAudit } from "@/services/auditService";
import { assertCan, getGymOwner, requireActor } from "@/services/actor";
import { ServiceError } from "@/services/memberService";
import { getDb, updateDb } from "@/services/mockDb";

const wait = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

/** Closes requests that waited too long. Saves only when something changed. */
export function sweepExpiredRequests() {
  const db = getDb();
  const next = expireStale(db, Date.now());
  if (next !== db) updateDb(() => next);
}

/** Re-reads the request, because the member may have cancelled it while the team was looking. */
function findPending(requestId) {
  const request = getDb().accessRequests.find((r) => r.id === requestId);

  if (!request) throw new ServiceError("Request not found.");

  if (request.status === "expired" || isStale(request)) {
    sweepExpiredRequests();
    throw new ServiceError("This request expired. Ask the member to send a new one.");
  }
  if (request.status === "cancelled") throw new ServiceError("The member cancelled this request.");
  if (request.status !== "pending") throw new ServiceError("This request has already been decided.");

  return request;
}

function save(request, status, { reason = "", revokeCode = false } = {}) {
  const actor = requireActor();
  const at = new Date().toISOString();

  // A decision is stamped decided*, a later revoke is stamped revoked*, so both stay on the record
  const stamp =
    status === "revoked"
      ? { revokedAt: at, revokedBy: actor.name, revokedByRole: actor.roleLabel }
      : { decidedAt: at, decidedBy: actor.name, decidedByRole: actor.roleLabel };

  updateDb((state) => ({
    ...state,
    accessRequests: state.accessRequests.map((r) =>
      r.id === request.id ? { ...r, status, ...stamp, ...(reason ? { reason } : {}) } : r,
    ),
    members: revokeCode
      ? state.members.map((m) =>
          m.id === request.memberId && m.credential && m.credential.status !== "revoked"
            ? { ...m, credential: { ...m.credential, status: "revoked", revokedAt: at } }
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
  assertCan("access.review", "Your role cannot approve access requests.");

  await wait();

  const request = findPending(requestId);
  const member = getDb().members.find((m) => m.id === request.memberId) ?? null;

  const rules = { graceDays: getGymSettings(getGymOwner()?.gym).graceDays };
  const standing = member ? getMemberStatus(member, todayISO(), rules) : null;

  const block = getApprovalBlock(member, standing);
  if (block) throw new ServiceError(block);

  save(request, "approved");

  return { name: member.name };
}

export async function rejectRequest(requestId, { reason = "", revokeCode = false } = {}) {
  assertCan("access.review", "Your role cannot reject access requests.");

  if (revokeCode) {
    assertCan("members.manage", "Your role cannot revoke access codes.");
  }

  await wait();

  const request = findPending(requestId);

  save(request, "rejected", { reason: reason.trim(), revokeCode });
}

/**
 * Withdraws an approval. The member's portal session ends the next time their page loads.
 * Their access code is left alone: revoke or replace it from the member's own record.
 */
export async function revokeApproval(requestId) {
  assertCan("access.review", "Your role cannot revoke access.");

  await wait();

  const request = getDb().accessRequests.find((r) => r.id === requestId);
  if (!request) throw new ServiceError("Request not found.");
  if (request.status !== "approved") throw new ServiceError("Only an approved request can be revoked.");

  save(request, "revoked");
}