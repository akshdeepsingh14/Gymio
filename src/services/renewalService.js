
// Renewals and pending-payment collection. In the backend phase these become
// API calls, and the server repeats every check below. Never trust the browser.
//
// Both functions take an optional `amount`, `date` and `note`. Leave them out
// and the plan price and today's date are used, which is what the Renew sheet does.

import { addDays, todayISO } from "@/lib/dates";
import { checkPaymentRules, isCounted, MAX_PAYMENT_AMOUNT } from "@/lib/payments";
import { getRenewalPeriod, MAX_RENEWAL_LEAD_DAYS } from "@/lib/renewal";
import { appendAudit } from "@/services/auditService";
import { currentSettings, newReceiptFields, nextPaymentNumber, ServiceError } from "@/services/memberService";
import { actorRef } from "@/lib/attribution";
import { assertCan, getActor } from "@/services/actor";
import { getDb, updateDb } from "@/services/mockDb";

const wait = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));
const DUPLICATE_WINDOW_MS = 15_000;

/**
 * Reads and checks the optional amount, date and note, then the gym's payment rules
 * (enabled methods, required reference, note when the amount differs from the plan price).
 * Throws a ServiceError tied to the field.
 */
function readPaymentDetails(input, plan, today, settings) {
  const paidOn = input.date || today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidOn) || addDays(paidOn, 0) !== paidOn) {
    throw new ServiceError("Choose a valid payment date.", "date");
  }
  if (paidOn > today) throw new ServiceError("The payment date cannot be in the future.", "date");

  const text = input.amount === undefined || input.amount === null ? "" : String(input.amount).trim();
  const amount = text === "" ? plan.price : /^\d+$/.test(text) ? Number(text) : NaN;
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_PAYMENT_AMOUNT) {
    throw new ServiceError(`Enter a whole amount between 1 and ${MAX_PAYMENT_AMOUNT}.`, "amount");
  }

  const note = (input.note ?? "").trim();

  const broken = checkPaymentRules(
    { method: input.method, reference: input.reference, amount, planPrice: plan.price, note },
    settings,
  );
  if (broken) throw new ServiceError(broken.message, broken.field);

  return { paidOn, amount, note };
}

function buildPayment(db, { member, plan, input, details, settings, periodStart, periodEnd }) {
  const number = nextPaymentNumber(db);
  return {
    id: `pay_${number}`,
    ...newReceiptFields(db, settings),
    memberId: member.id,
    planId: plan.id,
    amount: details.amount,
    method: input.method,
    reference: input.method === "cash" ? "" : (input.reference ?? "").trim(),
    note: details.note,
    date: details.paidOn,
    periodStart,
    periodEnd,
    status: "recorded", // entered by hand, not verified with a bank
    recordedBy: actorRef(getActor()),
    createdAt: new Date().toISOString(),
  };
}

const recordedEntry = (payment) => ({
  action: "payment.recorded",
  paymentId: payment.id,
  receiptNo: payment.receiptNo,
  memberId: payment.memberId,
  amount: payment.amount,
  after: {
    method: payment.method,
    reference: payment.reference,
    periodStart: payment.periodStart,
    periodEnd: payment.periodEnd,
  },
});

export async function renewMember(memberId, input) {
  assertCan("payments.record", "Your role cannot record payments, so it cannot renew memberships.");

  await wait();
  const db = getDb();

  const member = db.members.find((m) => m.id === memberId);
  if (!member) throw new ServiceError("Member not found.");
  if (member.accessStatus === "inactive") throw new ServiceError("Reactivate this member before renewing.");
  if (member.paymentStatus === "pending") throw new ServiceError("Collect the pending payment before renewing.");

  const plan = db.plans.find((p) => p.id === input.planId && p.status === "active");
  if (!plan) throw new ServiceError("Choose an active plan.", "planId");

  const settings = currentSettings();
  const today = todayISO();
  const details = readPaymentDetails(input, plan, today, settings);

  // Voided payments do not count: fixing a mistake right after voiding must be possible
  const now = Date.now();
  const justRecorded = db.payments.some(
    (p) =>
      p.memberId === memberId &&
      isCounted(p) &&
      p.createdAt &&
      now - new Date(p.createdAt).getTime() < DUPLICATE_WINDOW_MS,
  );
  if (justRecorded) {
    throw new ServiceError("A payment for this member was just recorded. Check their history before trying again.");
  }

  // The payment date decides where a lapsed membership restarts
  const period = getRenewalPeriod(member, plan, details.paidOn);
  if (period.daysLeft > MAX_RENEWAL_LEAD_DAYS) {
    throw new ServiceError("This membership already runs for more than a year. No renewal is needed yet.");
  }

  const payment = buildPayment(db, {
    member,
    plan,
    input,
    details,
    settings,
    periodStart: period.start,
    periodEnd: period.end,
  });

  updateDb((state) => ({
    ...state,
    members: state.members.map((m) =>
      m.id === memberId
        ? {
            ...m,
            planId: plan.id,
            expiresOn: period.end,
            paymentStatus: "paid",
            updatedBy: actorRef(getActor()),
            updatedAt: payment.createdAt,
          }
        : m,
    ),
    payments: [...state.payments, payment],
    auditLog: appendAudit(state, recordedEntry(payment)),
  }));

  return { payment, start: period.start, end: period.end };
}

/** Settles an unpaid first period. The membership dates do not change. */
export async function collectPendingPayment(memberId, input) {
  assertCan("payments.record", "Your role cannot record payments.");

  await wait();
  const db = getDb();

  const member = db.members.find((m) => m.id === memberId);
  if (!member) throw new ServiceError("Member not found.");
  if (member.paymentStatus !== "pending") throw new ServiceError("This member has no pending payment.");

  const plan = db.plans.find((p) => p.id === member.planId);
  if (!plan) throw new ServiceError("The member's plan no longer exists.");

  const settings = currentSettings();
  const details = readPaymentDetails(input, plan, todayISO(), settings);

  const payment = buildPayment(db, {
    member,
    plan,
    input,
    details,
    settings,
    periodStart: member.joinedOn,
    periodEnd: member.expiresOn,
  });

  updateDb((state) => ({
    ...state,
    members: state.members.map((m) =>
      m.id === memberId
        ? { ...m, paymentStatus: "paid", updatedBy: actorRef(getActor()), updatedAt: payment.createdAt }
        : m,
    ),
    payments: [...state.payments, payment],
    auditLog: appendAudit(state, recordedEntry(payment)),
  }));

  return { payment, start: payment.periodStart, end: payment.periodEnd };
}
