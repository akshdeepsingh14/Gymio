// The only file the dashboard talks to for data. In the backend phase the body
// of getDashboard() becomes one API request. The page does not change.

import { addDays, addMonths, diffDays, formatMonth, formatShortDate, startOfMonth, todayISO } from "@/lib/dates";
import { auditMeta, describeAudit } from "@/lib/auditLog";
import { getMemberStatus } from "@/lib/membership";
import { isCounted } from "@/lib/payments";
import { isOnTeam } from "@/lib/staff";
import { paymentMethods } from "@/data/mock/seed";
import { getDb } from "@/services/mockDb";

export const RANGES = [
  { id: "7d", label: "7D", title: "Last 7 days" },
  { id: "30d", label: "30D", title: "Last 30 days" },
  { id: "mtd", label: "MTD", title: "This month" },
  { id: "13w", label: "13W", title: "Last 13 weeks" },
  { id: "12m", label: "12M", title: "Last 12 months" },
];

const methodLabels = Object.fromEntries(paymentMethods.map((m) => [m.id, m.label]));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function resolveRange(id, today) {
  let start;
  let granularity = "day";

  if (id === "7d") start = addDays(today, -6);
  else if (id === "30d") start = addDays(today, -29);
  else if (id === "mtd") start = startOfMonth(today);
  else if (id === "13w") {
    start = addDays(today, -90);
    granularity = "week";
  } else {
    start = startOfMonth(addMonths(today, -11));
    granularity = "month";
  }

  const length = diffDays(today, start) + 1;
  const prevStart = id === "12m" ? addMonths(start, -12) : addDays(start, -length);
  return { start, granularity, prev: { start: prevStart, end: addDays(start, -1) } };
}

function buildBuckets(start, today, granularity) {
  const buckets = [];
  let cursor = start;
  while (cursor <= today) {
    const next =
      granularity === "day" ? addDays(cursor, 1) : granularity === "week" ? addDays(cursor, 7) : addMonths(cursor, 1);
    const last = addDays(next, -1);
    buckets.push({
      start: cursor,
      end: last > today ? today : last,
      label: granularity === "month" ? formatMonth(cursor) : formatShortDate(cursor),
    });
    cursor = next;
  }
  return buckets;
}

const sumAmount = (payments) => payments.reduce((sum, p) => sum + p.amount, 0);
const inRange = (payments, start, end) => payments.filter((p) => p.date >= start && p.date <= end);

function percentChange(current, previous) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** `delay` imitates a network request. The hook passes 0 for quiet refreshes after the data changes. */
export async function getDashboard({ range = "30d", gym, delay = 450, db }) {
  if (delay) await wait(delay);

  const today = todayISO();
  const rules = { graceDays: gym?.graceDays ?? 10, reminderDays: gym?.reminderDays ?? 7 };
  const { members, plans, staff, photos, auditLog, accessRequests, announcements, payments: allPayments } = db ?? getDb();
  const payments = allPayments.filter(isCounted); // voided payments never count as revenue
  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));

  // ---- Member states ----
  const states = members.map((member) => ({ member, ...getMemberStatus(member, today, rules) }));
  const count = (test) => states.filter(test).length;
  const pending = accessRequests.filter((r) => r.status === "pending");

  // ---- Period figures ----
  const { start, granularity, prev } = resolveRange(range, today);
  const current = inRange(payments, start, today);
  const previous = inRange(payments, prev.start, prev.end);

  // Only compare with the previous period when we actually have data for all of it
  const dataStart = payments.reduce((min, p) => (p.date < min ? p.date : min), today);
  const canCompare = prev.start >= dataStart;

  const revenue = sumAmount(current);
  const prevRevenue = sumAmount(previous);

  const stats = {
    totalMembers: members.length,
    activeMembers: count((s) => s.status === "active"),
    inactiveMembers: count((s) => s.status === "inactive"),
    suspendedMembers: count((s) => s.status === "suspended"),
    pendingRequests: pending.length,
    expiringSoon: count((s) => s.expiringSoon),
    expiredMembers: count((s) => s.status === "expired"),
    expiredInGrace: count((s) => s.inGrace),
    revenue,
    revenueChange: canCompare ? percentChange(revenue, prevRevenue) : null,
    paymentsCount: current.length,
    paymentsChange: canCompare ? percentChange(current.length, previous.length) : null,
  };

  // ---- Charts ----
  const buckets = buildBuckets(start, today, granularity);
  const series = buckets.map((bucket) => ({
    label: bucket.label,
    revenue: sumAmount(inRange(payments, bucket.start, bucket.end)),
    members: members.filter((m) => m.joinedOn <= bucket.end).length,
  }));

  const methodBreakdown = paymentMethods
    .map((method) => {
      const rows = current.filter((p) => p.method === method.id);
      return { id: method.id, label: method.label, amount: sumAmount(rows), count: rows.length };
    })
    .sort((a, b) => b.amount - a.amount);

  // ---- Member status split. Every member lands in exactly one group, so the parts add up to the total. ----
  const statusBreakdown = [
    { id: "active", label: "Active", count: count((s) => s.status === "active" && !s.expiringSoon) },
    { id: "expiring", label: "Expiring soon", count: count((s) => s.expiringSoon) },
    { id: "grace", label: "In grace period", count: count((s) => s.inGrace) },
    { id: "expired", label: "Expired", count: count((s) => s.status === "expired" && !s.inGrace) },
    { id: "suspended", label: "Suspended", count: count((s) => s.status === "suspended") },
    { id: "inactive", label: "Inactive", count: count((s) => s.status === "inactive") },
  ];

  // ---- Members per plan ----
  const planNames = Object.fromEntries(plans.map((plan) => [plan.id, plan.name]));
  const perPlan = {};
  for (const member of members) perPlan[member.planId] = (perPlan[member.planId] ?? 0) + 1;
  const planDistribution = Object.entries(perPlan)
    .map(([id, total]) => ({ id, label: planNames[id] ?? "Unknown plan", count: total }))
    .sort((a, b) => b.count - a.count);

  // ---- Latest entries from the audit log: payments, access decisions, staff and data changes ----
  const currency = gym?.currency ?? "INR";
  const activity = [...auditLog]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6)
    .map((entry) => ({
      id: entry.id,
      at: entry.at,
      by: entry.by,
      label: auditMeta(entry.action).label,
      summary: describeAudit(entry, currency),
    }));

  // ---- Getting-started checklist ----
  const setup = [
    { id: "members", label: "Add your first member", done: members.length > 0, to: "/app/members?new=1" },
    { id: "payments", label: "Record a payment", done: allPayments.length > 0, to: "/app/payments?new=1" },
    { id: "profile", label: "Complete your gym profile", done: Boolean(gym?.logo || gym?.description || gym?.address), to: "/app/profile" },
    { id: "staff", label: "Invite a team member", done: staff.some((member) => isOnTeam(member)), to: "/app/settings/staff" },
    { id: "updates", label: "Publish a gym update", done: announcements.length > 0 || photos.length > 0, to: "/app/updates" },
  ];

  // ---- Lists ----
  const upcomingRenewals = states
    .filter((s) => (s.status === "active" && s.daysLeft <= 14) || s.inGrace)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .map((s) => ({
      id: s.member.id,
      name: s.member.name,
      expiresOn: s.member.expiresOn,
      daysLeft: s.daysLeft,
      inGrace: s.inGrace,
    }));

  const recentPayments = [...payments]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id, undefined, { numeric: true }))
    .slice(0, 6)
    .map((p) => ({
      ...p,
      memberName: memberById[p.memberId]?.name ?? "Unknown member",
      methodLabel: methodLabels[p.method] ?? p.method,
    }));

  const recentMembers = [...members]
    .sort((a, b) => b.joinedOn.localeCompare(a.joinedOn))
    .slice(0, 5)
    .map((m) => ({ id: m.id, name: m.name, joinedOn: m.joinedOn, locality: m.locality }));

  return {
    today,
    stats,
    series,
    granularity,
    methodBreakdown,
    statusBreakdown,
    planDistribution,
    activity,
    setup,
    upcomingRenewals,
    recentPayments,
    recentMembers,
    pendingRequests: pending,
    announcements: announcements
      .filter((post) => post.status !== "archived")
      .sort((a, b) => b.publishedOn.localeCompare(a.publishedOn))
      .slice(0, 3),
  };
}