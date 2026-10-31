import { todayISO } from "@/lib/dates";
import { getGymSettings } from "@/lib/gymSettings";
import { duplicateMessage, findDuplicateMember } from "@/lib/memberDuplicates";
import { getPeriodEnd } from "@/lib/membership";
import { checkPaymentRules, formatReceiptNo, nextReceiptNumber } from "@/lib/payments";
import { appendAudit } from "@/services/auditService";
import { getDb, updateDb } from "@/services/mockDb";

import { getGymOwner, assertCan } from "@/services/actor";
import { ServiceError } from "@/services/errors";

import { actorRef } from "@/lib/attribution";

export { ServiceError };

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
export const currentSettings = () => getGymSettings(getGymOwner()?.gym);

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

/** Adds several audit entries in order. Call it inside updateDb, like appendAudit. */
const appendAll = (state, entries) =>
  entries.reduce((log, entry) => appendAudit({ auditLog: log }, entry), state.auditLog ?? []);

const EDITABLE_FIELDS = [
  ["name", "name"],
  ["email", "email"],
  ["phone", "phone"],
  ["locality", "locality"],
  ["notes", "notes"],
];

export async function createMember(input) {
  const actor = assertCan("members.manage", "Your role cannot add members.");
  const by = actorRef(actor);
  if (input.paymentMode === "paid") {
    assertCan("payments.record", "Your role cannot record payments, so a first payment cannot be taken here.");
  }

  await wait();
  const db = getDb();

  const plan = db.plans.find((p) => p.id === input.planId && p.status === "active");
  if (!plan) throw new ServiceError("Choose an active plan.", "planId");

  // The same person added twice would split their payments and history across two records
  const duplicate = findDuplicateMember(db.members, input);
  if (duplicate) throw new ServiceError(duplicateMessage(duplicate), duplicate.field);

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
    createdBy: by,
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
      status: "recorded", // entered by hand, not verified with a bank
      recordedBy: by,
      createdAt: new Date().toISOString(),
    };
  }

  const entries = [
    {
      action: "member.created",
      memberId: id,
      summary: `Added ${member.name} (${id}) on the ${plan.name} plan${paid ? "" : ", first payment pending"}.`,
    },
  ];
  if (payment) {
    entries.push({
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
  }

  updateDb((state) => ({
    ...state,
    members: [...state.members, member],
    payments: payment ? [...state.payments, payment] : state.payments,
    auditLog: appendAll(state, entries),
  }));

  return member;
}

export async function updateMember(id, input) {
  const actor = assertCan("members.manage", "Your role cannot edit members.");

  await wait();
  const current = getDb().members.find((m) => m.id === id);
  if (!current) throw new ServiceError("Member not found.");

  const patch = {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    locality: input.locality.trim(),
    notes: input.notes.trim(),
  };

  // Only field names go in the log, never the phone number or email themselves
  const changed = EDITABLE_FIELDS.filter(([key]) => (current[key] ?? "") !== patch[key]).map(([, label]) => label);
  if (changed.length === 0) return;

  const duplicate = findDuplicateMember(getDb().members, patch, id);
  if (duplicate) throw new ServiceError(duplicateMessage(duplicate), duplicate.field);

  updateDb((state) => ({
    ...state,
    members: state.members.map((m) =>
      m.id === id ? { ...m, ...patch, updatedBy: actorRef(actor), updatedAt: new Date().toISOString() } : m,
    ),
    auditLog: appendAudit(state, {
      action: "member.updated",
      memberId: id,
      summary: `Edited ${patch.name} (${id}): ${changed.join(", ")}.`,
    }),
  }));
}

/**
 * accessStatus: "active" | "inactive" | "suspended".
 * Deactivating also revokes any access code, so the member cannot get back in.
 */
export async function setAccessStatus(id, accessStatus) {
  const actor = assertCan("members.manage", "Your role cannot change member access.");

  await wait(250);
  const current = getDb().members.find((m) => m.id === id);
  if (!current) throw new ServiceError("Member not found.");
  if (current.accessStatus === accessStatus) return;

  const revokesCode = accessStatus === "inactive" && current.credential && current.credential.status !== "revoked";
  const summary = {
    suspended: `Suspended access for ${current.name} (${id}).`,
    inactive: `Deactivated ${current.name} (${id})${revokesCode ? ". Access code revoked." : "."}`,
    active:
      current.accessStatus === "suspended"
        ? `Lifted the suspension for ${current.name} (${id}).`
        : `Reactivated ${current.name} (${id}).`,
  }[accessStatus];

  updateDb((state) => ({
    ...state,
    members: state.members.map((m) => {
      if (m.id !== id) return m;
      const credential =
        accessStatus === "inactive" && m.credential ? { ...m.credential, status: "revoked" } : m.credential;
      return { ...m, accessStatus, credential, updatedBy: actorRef(actor), updatedAt: new Date().toISOString() };
    }),
    auditLog: appendAudit(state, {
      action: "member.status_changed",
      memberId: id,
      summary,
      before: { accessStatus: current.accessStatus },
      after: { accessStatus },
    }),
  }));
}