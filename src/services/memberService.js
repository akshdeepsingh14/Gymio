import { todayISO } from "@/lib/dates";
import { getGymSettings } from "@/lib/gymSettings";
import { getPeriodEnd } from "@/lib/membership";
import { checkPaymentRules, formatReceiptNo, nextReceiptNumber } from "@/lib/payments";
import { appendAudit } from "@/services/auditService";
import { getSessionUser } from "@/services/authService";
import { getDb, updateDb } from "@/services/mockDb";

export class ServiceError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ServiceError";
    this.field = field;
  }
}

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));
export const pad = (value, width) => String(value).padStart(width, "0");

function nextMemberId(db) {
  const highest = db.members.reduce((max, member) => {
    const number = Number(member.id.split("-").pop());
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);
  return `${db.memberPrefix}-${pad(highest + 1, 4)}`;
}

export function nextPaymentNumber(db) {
  return (
    db.payments.reduce((max, payment) => Math.max(max, Number(payment.id.replace("pay_", "")) || 0), 0) + 1
  );
}

/** The signed-in gym's current rules. The backend will read these from the gym's record instead. */
export const currentSettings = () => getGymSettings(getSessionUser()?.gym);

/**
 * What a new payment takes from the gym's settings: its receipt number, and the tax details
 * as they are today. They are copied onto the payment, so changing Settings later never
 * rewrites a receipt that was already issued.
 */
export function newReceiptFields(db, settings) {
  let number = nextReceiptNumber(db.payments, settings);
  if (number >= 10 ** settings.receiptDigits) {
    throw new ServiceError("Receipt numbers have run out. Add a digit in Settings, Payments and receipts.");
  }

  // Two different prefixes could still build the same text, so make sure it is free
  const taken = new Set(db.payments.map((payment) => payment.receiptNo));
  while (taken.has(formatReceiptNo(settings, number))) number += 1;

  return {
    receiptNo: formatReceiptNo(settings, number),
    ...(settings.taxName && settings.taxNumber
      ? { taxName: settings.taxName, taxNumber: settings.taxNumber }
      : {}),
  };
}

export async function createMember(input) {
  await wait();
  const db = getDb();

  const plan = db.plans.find((p) => p.id === input.planId && p.status === "active");
  if (!plan) throw new ServiceError("Choose an active plan.", "planId");

  const id = nextMemberId(db);
  const expiresOn = getPeriodEnd(input.startsOn, plan.duration);
  const paid = input.paymentMode === "paid";

  // The first payment is the plan price, so only the method and reference rules can apply
  const settings = currentSettings();
  if (paid) {
    const broken = checkPaymentRules(
      { method: input.method, reference: input.reference, amount: plan.price, planPrice: plan.price, note: "" },
      settings,
    );
    if (broken) throw new ServiceError(broken.message, broken.field);
  }

  const member = {
    id,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    locality: input.locality.trim(),
    notes: input.notes.trim(),
    planId: plan.id,
    joinedOn: input.startsOn,
    expiresOn,
    accessStatus: "active",
    paymentStatus: paid ? "paid" : "pending",
    credential: null,
    createdAt: new Date().toISOString(),
  };

  let payment = null;
  if (paid) {
    const number = nextPaymentNumber(db);
    payment = {
      id: `pay_${number}`,
      ...newReceiptFields(db, settings),
      memberId: id,
      planId: plan.id,
      amount: plan.price,
      method: input.method,
      reference: input.method === "cash" ? "" : input.reference.trim(),
      date: todayISO(),
      periodStart: input.startsOn,
      periodEnd: expiresOn,
      status: "recorded", // entered by the owner, not verified with a bank
    };
  }

  updateDb((state) => ({
    ...state,
    members: [...state.members, member],
    payments: payment ? [...state.payments, payment] : state.payments,
    auditLog: payment
      ? appendAudit(state, {
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
        })
      : state.auditLog,
  }));

  return member;
}

export async function updateMember(id, input) {
  await wait();
  if (!getDb().members.some((m) => m.id === id)) throw new ServiceError("Member not found.");

  const patch = {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    locality: input.locality.trim(),
    notes: input.notes.trim(),
  };

  updateDb((state) => ({
    ...state,
    members: state.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
  }));
}

/**
 * accessStatus: "active" | "inactive" | "suspended".
 * Deactivating also revokes any access code, so the member cannot get back in.
 */
export async function setAccessStatus(id, accessStatus) {
  await wait(250);
  if (!getDb().members.some((m) => m.id === id)) throw new ServiceError("Member not found.");

  updateDb((state) => ({
    ...state,
    members: state.members.map((m) => {
      if (m.id !== id) return m;
      const credential =
        accessStatus === "inactive" && m.credential ? { ...m.credential, status: "revoked" } : m.credential;
      return { ...m, accessStatus, credential };
    }),
  }));
}