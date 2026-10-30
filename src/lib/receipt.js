// Turns a payment row into the plain data a receipt needs.
// The on-screen receipt and the PDF both read from this, so they always match.

import { formatDate } from "@/lib/dates";
import { getGymSettings } from "@/lib/gymSettings";
import { isCounted, methodLabels } from "@/lib/payments";

export const VERIFICATION_NOTE =
  "Recorded manually by the gym. Gymio has not verified this payment with a bank or UPI provider.";

export function buildReceipt({ payment, gym, gymName, currency }) {
  return {
    receiptNo: payment.receiptNo,
    gymName,
    address: [gym?.address, gym?.locality, gym?.city].filter(Boolean).join(", "),
    phone: gym?.phone ?? "",
    memberName: payment.memberName ?? "Member",
    memberId: payment.memberId,
    planName: payment.planName || "Membership",
    paidOn: payment.date,
    periodStart: payment.periodStart,
    periodEnd: payment.periodEnd,
    amount: payment.amount,
    currency,
    methodLabel: payment.methodLabel ?? methodLabels[payment.method] ?? payment.method,
    reference: payment.reference ?? "",
    note: payment.note ?? "",
    voided: !isCounted(payment),
    voidReason: payment.voidReason ?? "",
    // The layout is the gym's current choice. The tax details belong to the payment: they were
    // copied onto it when it was recorded, so receipts from before tax was set up have none.
    layout: getGymSettings(gym).receiptLayout,
    taxName: payment.taxName ?? "",
    taxNumber: payment.taxNumber ?? "",
  };
}

/** "GSTIN: 27AAAAA0000A1Z5", or an empty string when the receipt has no tax details. */
export const receiptTaxLine = (receipt) =>
  receipt.taxName && receipt.taxNumber ? `${receipt.taxName}: ${receipt.taxNumber}` : "";

export const receiptPeriod = (receipt) =>
  `${formatDate(receipt.periodStart)} to ${formatDate(receipt.periodEnd)}`;