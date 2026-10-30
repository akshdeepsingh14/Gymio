// Payment actions for the Payments page. In the backend phase only the bodies
// of these functions change to API calls, and the server repeats every check.
//
// Money rules:
//  - A recorded payment is never deleted and its amount is never edited.
//  - A mistake is fixed by VOIDING the payment (with a reason) and recording a new one.
//  - Only the reference and note can be amended, and every change is written to the audit trail.

import { getLatestCounted, isCounted } from "@/lib/payments";
import { appendAudit } from "@/services/auditService";
import { ServiceError } from "@/services/memberService";
import { getDb, updateDb } from "@/services/mockDb";
import { collectPendingPayment, renewMember } from "@/services/renewalService";

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Records a payment for any member from the Payments page.
 * A member with an unpaid first period gets that period settled. Everyone else is renewed.
 */
export async function recordPayment(input) {
  const member = getDb().members.find((m) => m.id === input.memberId);
  if (!member) throw new ServiceError("Choose a member.", "memberId");

  return member.paymentStatus === "pending"
    ? collectPendingPayment(member.id, input)
    : renewMember(member.id, input);
}

/**
 * Cancels a payment and keeps it on file.
 * Only a member's newest payment can be voided, so their dates never end up in a gap.
 *  - If an earlier payment exists, the membership goes back to the end of that payment.
 *  - If this was their only payment, the dates stay and the period becomes unpaid again.
 */
export async function voidPayment(paymentId, input) {
  await wait();
  const db = getDb();

  const payment = db.payments.find((p) => p.id === paymentId);
  if (!payment) throw new ServiceError("Payment not found.");
  if (!isCounted(payment)) throw new ServiceError("This payment is already voided.");

  const reason = (input.reason ?? "").trim();
  if (reason.length < 5) throw new ServiceError("Give a reason of at least 5 characters.", "reason");
  if (reason.length > 200) throw new ServiceError("Keep the reason under 200 characters.", "reason");

  const latest = getLatestCounted(db.payments, payment.memberId);
  if (latest && latest.id !== payment.id) {
    throw new ServiceError(`Void ${latest.receiptNo} first. It is this member's newest payment.`);
  }

  const member = db.members.find((m) => m.id === payment.memberId);
  const previous = getLatestCounted(
    db.payments.filter((p) => p.id !== payment.id),
    payment.memberId,
  );

  let memberPatch = null;
  if (member) {
    memberPatch = previous
      ? { planId: previous.planId, expiresOn: previous.periodEnd, paymentStatus: "paid" }
      : { paymentStatus: "pending" };
  }

  const at = new Date().toISOString();
  updateDb((state) => ({
    ...state,
    payments: state.payments.map((p) =>
      p.id === paymentId ? { ...p, status: "voided", voidedAt: at, voidReason: reason } : p,
    ),
    members: memberPatch
      ? state.members.map((m) => (m.id === payment.memberId ? { ...m, ...memberPatch } : m))
      : state.members,
    auditLog: appendAudit(state, {
      action: "payment.voided",
      paymentId: payment.id,
      receiptNo: payment.receiptNo,
      memberId: payment.memberId,
      amount: payment.amount,
      reason,
      before: member ? { expiresOn: member.expiresOn, paymentStatus: member.paymentStatus } : null,
      after: memberPatch
        ? { expiresOn: memberPatch.expiresOn ?? member.expiresOn, paymentStatus: memberPatch.paymentStatus }
        : null,
    }),
  }));

  return {
    expiresOn: memberPatch ? (memberPatch.expiresOn ?? member.expiresOn) : null,
    unpaidAgain: memberPatch?.paymentStatus === "pending",
  };
}

/** Fixes a typo in the transaction reference or note. The amount, method and dates cannot be changed. */
export async function amendPayment(paymentId, input) {
  await wait();
  const payment = getDb().payments.find((p) => p.id === paymentId);
  if (!payment) throw new ServiceError("Payment not found.");
  if (!isCounted(payment)) throw new ServiceError("A voided payment cannot be changed.");

  const after = {
    reference: payment.method === "cash" ? "" : (input.reference ?? "").trim(),
    note: (input.note ?? "").trim(),
  };
  const before = { reference: payment.reference ?? "", note: payment.note ?? "" };

  if (before.reference === after.reference && before.note === after.note) {
    throw new ServiceError("Nothing has changed.");
  }

  const at = new Date().toISOString();
  updateDb((state) => ({
    ...state,
    payments: state.payments.map((p) => (p.id === paymentId ? { ...p, ...after, amendedAt: at } : p)),
    auditLog: appendAudit(state, {
      action: "payment.amended",
      paymentId: payment.id,
      receiptNo: payment.receiptNo,
      memberId: payment.memberId,
      amount: payment.amount,
      before,
      after,
    }),
  }));
}