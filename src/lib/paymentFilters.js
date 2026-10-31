// Filtering, sorting and totals for the Payments page. Pure functions: rows go in, rows come out.

import { paymentMethodOptions } from "@/data/options";
import { addDays, startOfMonth } from "@/lib/dates";
import { isCounted, sumAmount } from "@/lib/payments";

export const DATE_RANGES = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "custom", label: "Custom range" },
];

export const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount_desc", label: "Amount: high to low" },
  { value: "amount_asc", label: "Amount: low to high" },
];

export const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "recorded", label: "Recorded" },
  { value: "voided", label: "Voided" },
];

export const DEFAULT_FILTERS = {
  query: "",
  range: "all",
  from: "",
  to: "",
  method: "all",
  status: "all",
  recordedBy: "all",
  sort: "newest",
};

/**
 * Who has recorded payments, as dropdown options. "Not recorded" covers sample payments that
 * were added before staff accounts existed.
 */
export function recorderOptions(payments) {
  const people = new Map();
  let anonymous = false;

  for (const payment of payments) {
    if (payment.recordedBy?.id) people.set(payment.recordedBy.id, payment.recordedBy);
    else anonymous = true;
  }

  const options = [...people.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((person) => ({ value: person.id, label: person.role ? `${person.name} · ${person.role}` : person.name }));
  if (anonymous) options.push({ value: "none", label: "Not recorded" });

  return [{ value: "all", label: "Anyone" }, ...options];
}

const idNumber = (payment) => Number(payment.id.replace("pay_", "")) || 0;

/** { from, to } as "YYYY-MM-DD" strings. An empty string means no limit on that side. */
export function resolveDateRange({ range, from, to }, today) {
  switch (range) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "month":
      return { from: startOfMonth(today), to: today };
    case "custom":
      return { from, to };
    default:
      return { from: "", to: "" };
  }
}

/** True when a custom range has both dates and the start is after the end. */
export const isBackwardsRange = ({ range, from, to }) => range === "custom" && Boolean(from && to && from > to);

export function filterPayments(rows, filters, today) {
  const query = filters.query.trim().toLowerCase();
  const { from, to } = resolveDateRange(filters, today);

  return rows.filter((row) => {
    if (filters.method !== "all" && row.method !== filters.method) return false;
    if (filters.status === "voided" && isCounted(row)) return false;
    if (filters.status === "recorded" && !isCounted(row)) return false;
    if (filters.recordedBy === "none" && row.recordedBy?.id) return false;
    if (filters.recordedBy !== "all" && filters.recordedBy !== "none" && row.recordedBy?.id !== filters.recordedBy) {
      return false;
    }
    if (from && row.date < from) return false;
    if (to && row.date > to) return false;
    if (query) {
      const haystack = [row.receiptNo, row.memberName, row.memberId, row.reference, row.note, row.recordedBy?.name];
      if (!haystack.some((value) => value && value.toLowerCase().includes(query))) return false;
    }
    return true;
  });
}

const sorters = {
  newest: (a, b) => b.date.localeCompare(a.date) || idNumber(b) - idNumber(a),
  oldest: (a, b) => a.date.localeCompare(b.date) || idNumber(a) - idNumber(b),
  amount_desc: (a, b) => b.amount - a.amount || idNumber(b) - idNumber(a),
  amount_asc: (a, b) => a.amount - b.amount || idNumber(b) - idNumber(a),
};

export const sortPayments = (rows, sort) => [...rows].sort(sorters[sort] ?? sorters.newest);

/** Totals for the rows on screen. Voided payments are counted separately and never add to revenue. */
export function summarize(rows) {
  const counted = rows.filter(isCounted);
  const voided = rows.filter((row) => !isCounted(row));

  return {
    collected: sumAmount(counted),
    count: counted.length,
    voidedCount: voided.length,
    voidedAmount: sumAmount(voided),
    byMethod: paymentMethodOptions.map((method) => {
      const matching = counted.filter((row) => row.method === method.value);
      return { value: method.value, label: method.label, amount: sumAmount(matching), count: matching.length };
    }),
  };
}