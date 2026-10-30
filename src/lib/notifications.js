// Builds the owner's notifications from the gym's data. Nothing is stored: every item is
// worked out from members, payments, requests and posts each time, so the toggles in
// Settings > Notifications take effect straight away and a stale notification can never
// outlive the thing it was about. In the backend phase the server does this and sends email.

import { formatMoney, timeAgo } from "@/lib/format";
import { getMemberStatus } from "@/lib/membership";
import { isCounted } from "@/lib/payments";
import { isArchived } from "@/lib/updates";

const DAY_MS = 86_400_000;
const RECENT_MS = 3 * DAY_MS; // payments and posts stay in the bell for 3 days
const MAX_REQUESTS = 5;
const MAX_PAYMENTS = 3;
const MAX_POSTS = 2;

const METHOD_TEXT = { upi: "UPI", cash: "cash", other: "another method" };

const byNewest = (a, b) => b.at.localeCompare(a.at);

// Seed data only has a calendar date, newer records also carry the exact time
const happenedAt = (record, dateField) => record.createdAt ?? `${record[dateField]}T00:00:00`;

const isRecent = (iso, now) => {
  const age = now - new Date(iso).getTime();
  return age >= 0 && age <= RECENT_MS;
};

const whenText = (daysLeft) => {
  if (daysLeft === 0) return "today";
  if (daysLeft === 1) return "tomorrow";
  return `in ${daysLeft} days`;
};

function accessRequestItems(requests, now) {
  return requests
    .filter((request) => request.status === "pending")
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
    .slice(0, MAX_REQUESTS)
    .map((request) => ({
      id: `req-${request.id}`,
      title: "New access request",
      text: `${request.memberName} asked to open their member area.`,
      time: timeAgo(request.requestedAt, now),
      to: "/app/access-requests",
    }));
}

/** One item for all members inside the reminder window, so a busy week is not 20 separate alerts. */
function expiryItems(members, today, rules) {
  const expiring = members
    .map((member) => ({ member, info: getMemberStatus(member, today, rules) }))
    .filter(({ info }) => info.expiringSoon)
    .sort((a, b) => a.info.daysLeft - b.info.daysLeft);

  if (expiring.length === 0) return [];

  const [first] = expiring;
  const text =
    expiring.length === 1
      ? `${first.member.name} expires ${whenText(first.info.daysLeft)}.`
      : `${expiring.length} memberships expire within ${rules.reminderDays} days. First up: ${first.member.name}, ${whenText(first.info.daysLeft)}.`;

  return [
    {
      id: `expiry-${today}-${expiring.length}`,
      title: expiring.length === 1 ? "Membership expiring" : "Memberships expiring",
      text,
      time: "Today",
      to: "/app/members",
    },
  ];
}

function paymentItems(payments, members, currency, now) {
  const nameById = new Map(members.map((member) => [member.id, member.name]));

  return payments
    .filter(isCounted)
    .map((payment) => ({ payment, at: happenedAt(payment, "date") }))
    .filter(({ at }) => isRecent(at, now))
    .sort(byNewest)
    .slice(0, MAX_PAYMENTS)
    .map(({ payment, at }) => ({
      id: `pay-${payment.id}`,
      title: "Payment recorded",
      text: `${formatMoney(payment.amount, currency)} via ${METHOD_TEXT[payment.method] ?? "another method"} from ${
        nameById.get(payment.memberId) ?? "a member"
      }. Receipt ${payment.receiptNo}.`,
      time: timeAgo(at, now),
      to: "/app/payments",
    }));
}

function announcementItems(posts, now) {
  return posts
    .filter((post) => !isArchived(post))
    .map((post) => ({ post, at: happenedAt(post, "publishedOn") }))
    .filter(({ at }) => isRecent(at, now))
    .sort(byNewest)
    .slice(0, MAX_POSTS)
    .map(({ post, at }) => ({
      id: `post-${post.id}`,
      title: "Announcement published",
      text: `"${post.title}" is ${post.visibility === "members" ? "visible to members" : "hidden from members"}.`,
      time: timeAgo(at, now),
      to: "/app/updates",
    }));
}

/**
 * The notifications to show in the header bell, most urgent kind first.
 *  - db: the gym's data (members, payments, accessRequests, announcements)
 *  - settings: from getGymSettings. The toggles decide which kinds are created at all,
 *    and reminderDays decides who counts as expiring soon.
 * Returns [] when in-app notifications are off.
 */
export function buildNotifications({ db, settings, today, currency = "INR", now = Date.now() }) {
  if (!settings.notifyInApp) return [];

  const rules = { graceDays: settings.graceDays, reminderDays: settings.reminderDays };

  return [
    ...(settings.notifyAccessRequests ? accessRequestItems(db.accessRequests, now) : []),
    ...(settings.notifyExpiry ? expiryItems(db.members, today, rules) : []),
    ...(settings.notifyPayments ? paymentItems(db.payments, db.members, currency, now) : []),
    ...(settings.notifyAnnouncements ? announcementItems(db.announcements, now) : []),
  ];
}