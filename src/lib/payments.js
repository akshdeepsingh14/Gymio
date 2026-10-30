import { paymentMethodOptions } from "@/data/options";

/** The most one payment can be. Matches the plan price limit. */
export const MAX_PAYMENT_AMOUNT = 1_000_000;

export const methodLabels = Object.fromEntries(paymentMethodOptions.map((option) => [option.value, option.label]));

/**
 * Payment status:
 *  recorded = entered by the owner. Gymio does not verify it with a bank or UPI provider.
 *  voided   = cancelled with a reason. Kept on file, never deleted, and left out of every total.
 */
export const isCounted = (payment) => payment.status !== "voided";

export const sumAmount = (payments) => payments.reduce((sum, payment) => sum + payment.amount, 0);

const idNumber = (payment) => Number(payment.id.replace("pay_", "")) || 0;

/** The member's payment that covers the furthest-ahead period. Voided payments are ignored. */
export function getLatestCounted(payments, memberId) {
  return payments
    .filter((payment) => payment.memberId === memberId && isCounted(payment))
    .reduce(
      (best, payment) =>
        !best || payment.periodEnd > best.periodEnd || (payment.periodEnd === best.periodEnd && idNumber(payment) > idNumber(best))
          ? payment
          : best,
      null,
    );
}

/** Audit entries for one payment, newest first. */
export const auditForPayment = (auditLog = [], paymentId) =>
  auditLog.filter((entry) => entry.paymentId === paymentId).sort((a, b) => b.at.localeCompare(a.at));
// ---- Receipt numbers ----
// A receipt number is the gym's prefix plus a counter padded to its digit count, e.g. RC-00042.
// The counter is never stored. It is worked out from the receipts that already exist, so a
// number can never be handed out twice, even if the owner sets "next number" too low.

/** The highest counter already used with this prefix (0 if none). Voided payments keep their number. */
export function highestReceiptNumber(payments, prefix) {
  let highest = 0;
  for (const payment of payments) {
    const receiptNo = payment.receiptNo ?? "";
    if (!receiptNo.startsWith(prefix)) continue;
    const rest = receiptNo.slice(prefix.length);
    if (/^\d+$/.test(rest)) highest = Math.max(highest, Number(rest));
  }
  return highest;
}

/** The counter the next receipt will get: the owner's "next number", or later if that is already taken. */
export const nextReceiptNumber = (payments, { receiptPrefix, receiptNext }) =>
  Math.max(receiptNext, highestReceiptNumber(payments, receiptPrefix) + 1);

export const formatReceiptNo = ({ receiptPrefix, receiptDigits }, number) =>
  `${receiptPrefix}${String(number).padStart(receiptDigits, "0")}`;

// ---- Payment rules ----

/** Methods the gym accepts, in their usual order, as { value, label } for a dropdown. */
export const enabledMethodOptions = (settings) =>
  paymentMethodOptions.filter((option) => settings.paymentMethods.includes(option.value));

export const REFERENCE_REQUIRED_MESSAGE = "Enter the transaction reference. Your settings require one for non-cash payments.";
export const NOTE_REQUIRED_MESSAGE = "Add a note explaining why the amount differs from the plan price.";

/**
 * Checks one new payment against the gym's rules. Returns { field, message } for the first
 * rule it breaks, or null. The forms and the services both call this, so they always agree.
 * `planPrice` may be left out when the amount is the plan price by definition.
 */
export function checkPaymentRules({ method, reference, amount, planPrice, note }, settings) {
  if (!settings.paymentMethods.includes(method)) {
    return { field: "method", message: "That payment method is switched off in Settings." };
  }
  if (settings.requireReference && method !== "cash" && !String(reference ?? "").trim()) {
    return { field: "reference", message: REFERENCE_REQUIRED_MESSAGE };
  }
  if (
    settings.requireNoteOnDifference &&
    planPrice !== undefined &&
    Number(amount) !== planPrice &&
    !String(note ?? "").trim()
  ) {
    return { field: "note", message: NOTE_REQUIRED_MESSAGE };
  }
  return null;
}
