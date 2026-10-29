import {
  CalendarClock,
  LayoutDashboard,
  Users,
  Wallet,
} from "lucide-react";

/* ------------------------------------------------------------------
   Sample data for the landing-page dashboard preview.
   Every name, amount and date here is made up.
   Dates are worked out from today, so the demo never looks out of date.

   Plan prices used throughout:
   Monthly ₹1,500 · Quarterly ₹4,000 · Half-yearly ₹7,200 · Yearly ₹12,500
------------------------------------------------------------------- */

const dayFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

function dateFromToday(offset) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

/** "29 Oct", worked out from today. Negative numbers are in the past. */
export const shortDate = (offset) => dayFormat.format(dateFromToday(offset));

/** "in 3 days", "today", "6 days ago" */
export function relativeDays(offset) {
  if (offset === 0) return "today";
  if (offset === 1) return "tomorrow";
  if (offset === -1) return "yesterday";
  return offset > 0 ? `in ${offset} days` : `${Math.abs(offset)} days ago`;
}

/** 4000 becomes "₹4,000" */
export const rupees = (amount) => `₹${amount.toLocaleString("en-IN")}`;

export const weekday = new Date().toLocaleDateString("en-IN", { weekday: "long" });

/* ------------------------------------------------------------------
   Gym and owner
------------------------------------------------------------------- */
export const gym = {
  name: "Pulse Athletic Club",
  slug: "pulse-athletic-club",
  owner: "Anjali Deshmukh",
  ownerFirstName: "Anjali",
  ownerInitials: "AD",
};

export const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "members", label: "Members", icon: Users },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "renewals", label: "Renewals", icon: CalendarClock },
];

/* ------------------------------------------------------------------
   Overview
------------------------------------------------------------------- */
export const kpis = [
  { label: "Active members", value: "312", note: "+18 this month" },
  { label: "Expiring soon", value: "9", note: "Next 7 days" },
  { label: "Collected today", value: "₹12.7K", note: "3 payments" },
  { label: "Awaiting approval", value: "3", note: "Access requests" },
];

// Revenue in lakh rupees. The last month is the one being shown.
export const revenue = {
  months: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
  values: [2.62, 2.48, 2.91, 3.05, 3.44, 3.86],
  total: "₹3.86L",
  change: "+12.2%",
};

export const attention = [
  { name: "Pooja Bhatt", note: "Plan ends in 2 days", tone: "warn" },
  { name: "Ritika Saxena", note: "In grace period, 5 days left", tone: "bad" },
  { name: "3 access requests", note: "Waiting for your approval", tone: "info" },
];

export const accessRequests = [
  { name: "Ishaan Bhalla", note: "Requested 3 hours ago" },
  { name: "Mehak Arora", note: "Requested yesterday" },
  { name: "Varun Pillai", note: "Requested 2 days ago" },
];

// Tailwind needs the full class names written out, so they live here as strings.
export const toneDot = {
  warn: "bg-warning",
  bad: "bg-destructive",
  info: "bg-foreground",
};

/* ------------------------------------------------------------------
   Members. `offset` is days from today until the plan ends.
------------------------------------------------------------------- */
const memberRows = [
  { id: "GYM-M-0143", name: "Karthik Subramanian", plan: "Quarterly", status: "active", offset: 71 },
  { id: "GYM-M-0156", name: "Pooja Bhatt", plan: "Monthly", status: "expiring", offset: 2 },
  { id: "GYM-M-0102", name: "Yash Chauhan", plan: "Quarterly", status: "expiring", offset: 6 },
  { id: "GYM-M-0074", name: "Ritika Saxena", plan: "Monthly", status: "grace", offset: -5 },
  { id: "GYM-M-0129", name: "Mohit Agarwal", plan: "Yearly", status: "active", offset: 187 },
  { id: "GYM-M-0165", name: "Tara Nambiar", plan: "Monthly", status: "active", offset: 11 },
  { id: "GYM-M-0138", name: "Aditya Kapoor", plan: "Quarterly", status: "active", offset: 23 },
  { id: "GYM-M-0091", name: "Lakshmi Venkat", plan: "Half-yearly", status: "active", offset: 118 },
  { id: "GYM-M-0058", name: "Gaurav Tiwari", plan: "Monthly", status: "expired", offset: -31 },
];

export const members = memberRows.map((member) => ({
  ...member,
  initials: member.name
    .split(" ")
    .map((part) => part[0])
    .join(""),
  expires: shortDate(member.offset),
  expiresNote: relativeDays(member.offset),
}));

export const statusMeta = {
  active: { label: "Active", dot: "bg-success" },
  expiring: { label: "Expiring", dot: "bg-warning" },
  grace: { label: "Grace period", dot: "bg-destructive" },
  expired: { label: "Expired", dot: "bg-muted-foreground" },
};

export const memberFilters = [
  { key: "all", label: "All", statuses: null },
  { key: "active", label: "Active", statuses: ["active"] },
  { key: "expiring", label: "Expiring", statuses: ["expiring"] },
  { key: "expired", label: "Expired", statuses: ["grace", "expired"] },
];

/* ------------------------------------------------------------------
   Payments
------------------------------------------------------------------- */
export const payments = [
  { id: "R-0522", member: "Aisha Siddiqui", plan: "Quarterly", amount: 4000, method: "UPI", when: "Today, 9:48 am" },
  { id: "R-0521", member: "Rohan Gupta", plan: "Monthly", amount: 1500, method: "Cash", when: "Today, 8:15 am" },
  { id: "R-0520", member: "Meghna Rao", plan: "Half-yearly", amount: 7200, method: "UPI", when: "Today, 6:50 am" },
  { id: "R-0519", member: "Siddharth Jain", plan: "Monthly", amount: 1500, method: "UPI", when: "Yesterday" },
  { id: "R-0518", member: "Preeti Shah", plan: "Yearly", amount: 12500, method: "Cash", when: "Yesterday" },
  { id: "R-0517", member: "Farhan Ali", plan: "Quarterly", amount: 4000, method: "UPI", when: "2 days ago" },
  { id: "R-0516", member: "Kavya Reddy", plan: "Monthly", amount: 1500, method: "UPI", when: "2 days ago" },
];

export const paymentSummary = [
  { label: "Today", value: "₹12.7K" },
  { label: "This week", value: "₹52.4K" },
  { label: "This month", value: "₹3.86L" },
];

export const methodSplit = { upi: 61, cash: 39 };

/* ------------------------------------------------------------------
   Member portal (phone) and gym feed (Android)
------------------------------------------------------------------- */
export const memberPass = {
  name: "Karthik Subramanian",
  id: "GYM-M-0143",
  plan: "Quarterly plan",
  daysLeft: 71,
  totalDays: 90,
  validUntil: `${shortDate(71)} ${dateFromToday(71).getFullYear()}`,
  history: [
    { label: "Quarterly plan", date: shortDate(-19), amount: 4000 },
    { label: "Quarterly plan", date: shortDate(-109), amount: 4000 },
    { label: "Monthly plan", date: shortDate(-139), amount: 1500 },
  ],
};

export const feedPosts = [
  { title: "Holiday hours", text: "Open 7 am to 1 pm on public holidays.", time: "3h ago" },
  { title: "New cardio zone", text: "Six treadmills and four bikes, now open.", time: "Yesterday" },
  { title: "Saturday Zumba batch", text: "Starts 8 am. First class is free.", time: "3 days ago" },
];

/* ------------------------------------------------------------------
   Captions under the devices, one set per tab
------------------------------------------------------------------- */
export const previewCaptions = {
  owner: [
    { label: "Revenue at a glance", text: "This month's collection and growth, the moment you sign in." },
    { label: "Members you can filter", text: "Find anyone by name, plan or expiry status." },
    { label: "Payments on record", text: "Every UPI and cash payment, with its receipt number." },
  ],
  member: [
    { label: "Their own pass", text: "Plan, validity and days left on any phone." },
    { label: "Receipts on demand", text: "Every payment they have made, any time." },
    { label: "The gym feed", text: "Timings, events and photos, straight to members." },
  ],
};