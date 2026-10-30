// Sample data for the frontend phase. Generated from a fixed seed, so every
// reload gives the same gym. Dates are relative to today, so the dashboard
// never goes stale. Payments are generated FROM membership periods, so members,
// expiry dates and payments always agree with each other.

import { addDays, todayISO } from "@/lib/dates";
  import { makePlaceholder } from "@/lib/placeholderPhotos";
import { getPeriodEnd, getMemberStatus } from "@/lib/membership";

const TODAY = todayISO();

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261030);
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (list) => list[Math.floor(rand() * list.length)];

function weighted(entries) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rand() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return entries[entries.length - 1][0];
}

export const plans = [
  { id: "plan_weekly", name: "Weekly Pass", duration: { unit: "days", value: 7 }, price: 500, status: "active" },
  { id: "plan_monthly", name: "Monthly", duration: { unit: "months", value: 1 }, price: 1500, status: "active" },
  { id: "plan_quarterly", name: "Quarterly", duration: { unit: "months", value: 3 }, price: 4000, status: "active" },
  { id: "plan_half", name: "Half-yearly", duration: { unit: "months", value: 6 }, price: 7500, status: "active" },
  { id: "plan_yearly", name: "Yearly", duration: { unit: "months", value: 12 }, price: 13000, status: "active" },
];
const plansById = Object.fromEntries(plans.map((plan) => [plan.id, plan]));

const FIRST = ["Aarav", "Vihaan", "Rohan", "Kabir", "Arjun", "Ishaan", "Karan", "Dev", "Nikhil", "Rahul", "Siddharth", "Aditya", "Manav", "Yash", "Varun", "Ananya", "Diya", "Neha", "Priya", "Riya", "Sneha", "Kavya", "Meera", "Isha", "Pooja", "Tanvi", "Shruti", "Nisha", "Aditi", "Sanya"];
const LAST = ["Sharma", "Verma", "Patil", "Joshi", "Kulkarni", "Deshmukh", "Iyer", "Nair", "Reddy", "Gupta", "Mehta", "Shah", "Singh", "Kapoor", "Bose", "Menon", "Pawar", "Jadhav", "Rao", "Khan"];
const LOCALITIES = ["Kothrud", "Baner", "Aundh", "Wakad", "Hadapsar", "Viman Nagar", "Pashan"];

const MEMBER_COUNT = 56;
// A few members whose plan ended a few days ago, so the grace period shows up in the demo
const GRACE_DEMO_INDEXES = [7, 19, 33];
const usedNames = new Set();

function uniqueName() {
  for (let tries = 0; tries < 50; tries += 1) {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }
  return `${pick(FIRST)} ${pick(LAST)} ${usedNames.size}`;
}

function buildRaw() {
  const rawMembers = [];
  const rawPayments = [];

  for (let i = 0; i < MEMBER_COUNT; i += 1) {
    const forcedGrace = GRACE_DEMO_INDEXES.includes(i);
    const plan = forcedGrace
      ? plansById.plan_monthly
      : plansById[
          weighted([["plan_monthly", 52], ["plan_quarterly", 20], ["plan_half", 10], ["plan_yearly", 11], ["plan_weekly", 7]])
        ];
    const joinedOn = forcedGrace
      ? addDays(TODAY, -(30 + int(3, 8)))
      : addDays(TODAY, -(plan.id === "plan_weekly" ? int(3, 50) : int(3, 420)));

    // Walk forward period by period, exactly like real renewals would happen.
    let start = joinedOn;
    let end = joinedOn;
    for (let guard = 0; guard < 80; guard += 1) {
      end = getPeriodEnd(start, plan.duration);
      rawPayments.push({ memberIndex: i, plan, start, end });
      if (forcedGrace) break; // one period only, already ended
      if (end >= TODAY) break; // current period still running
      if (rand() > 0.94) break; // member did not renew
      const lateBy = rand() < 0.2 ? int(1, 9) : 0;
      const nextStart = addDays(end, 1 + lateBy);
      if (nextStart > TODAY) break; // renewal date has not arrived: lapsed
      start = nextStart;
    }

    rawMembers.push({
      name: uniqueName(),
      locality: pick(LOCALITIES),
      planId: plan.id,
      joinedOn,
      expiresOn: end,
      accessStatus: forcedGrace ? "active" : weighted([["active", 86], ["inactive", 9], ["suspended", 5]]),
    });
  }
  return { rawMembers, rawPayments };
}

function build() {
  const { rawMembers, rawPayments } = buildRaw();

  // Member IDs run in order of joining
  const order = rawMembers.map((m, index) => ({ m, index })).sort((a, b) => a.m.joinedOn.localeCompare(b.m.joinedOn));
  const idByOldIndex = {};
  const members = order.map(({ m, index }, position) => {
    const id = `IF-${String(position + 1).padStart(4, "0")}`;
    idByOldIndex[index] = id;
    return { id, ...m };
  });

  const payments = rawPayments
    .sort((a, b) => a.start.localeCompare(b.start) || a.memberIndex - b.memberIndex)
    .map((p, n) => {
      const method = weighted([["upi", 58], ["cash", 30], ["other", 12]]);
      return {
        id: `pay_${n + 1}`,
        receiptNo: `RC-${String(n + 1).padStart(5, "0")}`,
        memberId: idByOldIndex[p.memberIndex],
        planId: p.plan.id,
        amount: p.plan.price,
        method,
        reference: method === "cash" ? "" : `${method === "upi" ? "UPI" : "NEFT"}${int(100000000000, 999999999999)}`,
        date: p.start,
        periodStart: p.start,
        periodEnd: p.end,
        status: "recorded", // recorded by the owner, not independently verified
      };
    });

  // Pending access requests come from members who are currently in good standing
  const requesters = members
    .filter((m) => getMemberStatus(m, TODAY).status === "active")
    .slice(-12)
    .filter((_, i) => i % 4 === 0)
    .slice(0, 3);
  const minutesAgo = [10, 95, 60 * 20];
  const accessRequests = requesters.map((m, i) => ({
    id: `req_${i + 1}`,
    memberId: m.id,
    memberName: m.name,
    requestedAt: new Date(Date.now() - minutesAgo[i] * 60_000).toISOString(),
    status: "pending",
  }));

    const announcements = [
    { id: "ann_1", title: "Holiday hours this weekend", excerpt: "We open at 7 AM on Saturday and close at 2 PM. Sunday is closed.", publishedOn: addDays(TODAY, -1), visibility: "members", status: "published" },
    { id: "ann_2", title: "New morning HIIT batch", excerpt: "Classes start Monday at 6:30 AM. Slots are limited, ask at the desk.", publishedOn: addDays(TODAY, -6), visibility: "members", status: "published" },
    { id: "ann_3", title: "Treadmill servicing complete", excerpt: "All treadmills are back in service after maintenance.", publishedOn: addDays(TODAY, -12), visibility: "members", status: "published" },
  ];

  const photos = [
    { id: "photo_1", caption: "Free weights floor", src: makePlaceholder("Free weights floor", "#1f2937", "#4d7c0f"), visibility: "members", addedOn: addDays(TODAY, -20) },
    { id: "photo_2", caption: "Cardio zone", src: makePlaceholder("Cardio zone", "#172554", "#0e7490"), visibility: "members", addedOn: addDays(TODAY, -20) },
    { id: "photo_3", caption: "Stretching studio", src: makePlaceholder("Stretching studio", "#3b0764", "#be185d"), visibility: "members", addedOn: addDays(TODAY, -14) },
    { id: "photo_4", caption: "Reception", src: makePlaceholder("Reception", "#292524", "#b45309"), visibility: "members", addedOn: addDays(TODAY, -9) },
  ];

  return { plans, members, payments, accessRequests, announcements, photos };
}

export const mockDb = build();
export const paymentMethods = [
  { id: "upi", label: "UPI" },
  { id: "cash", label: "Cash" },
  { id: "other", label: "Other" },
];