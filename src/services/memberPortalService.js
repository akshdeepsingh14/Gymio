// What the member portal is allowed to see. Everything here is built from the
// signed-in member's own record: no other member's data is ever read into the result.
// DEMO ONLY: it runs in the browser. In the backend phase this is one protected
// endpoint that finds the member from the session cookie, never from an ID in the request.

import { getPortalContext } from "@/services/accessService";
import { addDays, diffDays, todayISO } from "@/lib/dates";
import { getGymSettings } from "@/lib/gymSettings";
import { getMemberStatus } from "@/lib/membership";
import { getLatestCounted, isCounted, methodLabels } from "@/lib/payments";
import { buildReceipt } from "@/lib/receipt";
import { isShownToMembers } from "@/lib/updates";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const firstName = (name) => name.trim().split(/\s+/)[0];

/**
 * Returns null when nobody is signed in. Otherwise `access` says what the member may do:
 *   "full"          membership is valid
 *   "grace"         expired, inside the grace period, gym allows full access (with a warning)
 *   "grace-limited" expired, inside the grace period, gym allows status and renewal info only
 *   "ended"         past the grace period: status and renewal instructions only
 *   "suspended"     the gym paused access: status only
 */
export async function loadPortal(delay = 350) {
  if (delay) await wait(delay);

  const context = getPortalContext();
  if (!context) return null;

  const { account, state, member } = context;
  const gym = account.gym ?? {};
  const { graceDays, reminderDays, graceAccess, memberTheme } = getGymSettings(gym);
  const today = todayISO();
  const info = getMemberStatus(member, today, { graceDays, reminderDays });

  const base = {
    gymName: account.gymName,
    gymInfo: {
      username: gym.username ?? "",
      address: [gym.address, gym.locality, gym.city].filter(Boolean).join(", "),
      phone: gym.phone ?? "",
      description: gym.description ?? "",
      website: gym.website ?? "",
      instagram: gym.instagram ?? "",
      hours: gym.hours ?? null,
    },
    firstName: firstName(member.name),
    memberId: member.id,
    standing: { status: info.status, inGrace: info.inGrace, expiringSoon: info.expiringSoon },
    defaultTheme: memberTheme,
  };

  if (info.status === "suspended") return { ...base, access: "suspended" };

  const graceEndsOn = addDays(member.expiresOn, graceDays);
  if (info.status === "expired" && !info.inGrace) {
    return { ...base, access: "ended", expiresOn: member.expiresOn, graceEndsOn };
  }

  // ---- Valid or in grace: only this member's own records ----
  const currency = gym.currency ?? "INR";
  const planById = Object.fromEntries(state.plans.map((p) => [p.id, p]));
  const ownPayments = state.payments.filter((p) => p.memberId === member.id && isCounted(p));

  const membership = {
    planName: planById[member.planId]?.name ?? "Membership",
    memberSince: member.joinedOn,
    periodStart: getLatestCounted(ownPayments, member.id)?.periodStart ?? member.joinedOn,
    expiresOn: member.expiresOn,
    daysLeft: info.daysLeft, // negative once expired
    graceEndsOn,
    graceDaysLeft: info.inGrace ? diffDays(graceEndsOn, today) : null,
    paymentPending: member.paymentStatus === "pending",
  };

  // The gym chose to limit the portal during grace: status and renewal info only
  if (info.inGrace && graceAccess === "limited") {
    return { ...base, access: "grace-limited", ...membership };
  }

  const payments = [...ownPayments]
    .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd) || b.date.localeCompare(a.date))
    .map((payment) => {
      const planName = planById[payment.planId]?.name ?? "Membership";
      const methodLabel = methodLabels[payment.method] ?? payment.method;
      return {
        id: payment.id,
        receiptNo: payment.receiptNo,
        planName,
        date: payment.date,
        periodStart: payment.periodStart,
        periodEnd: payment.periodEnd,
        amount: payment.amount,
        methodLabel,
        receipt: buildReceipt({
          payment: { ...payment, memberName: member.name, planName, methodLabel },
          gym,
          gymName: account.gymName,
          currency,
        }),
      };
    });

  const announcements = state.announcements
    .filter(isShownToMembers)
    .sort((a, b) => b.publishedOn.localeCompare(a.publishedOn))
    .slice(0, 10)
    .map(({ id, title, excerpt, publishedOn, createdBy }) => ({
      id,
      title,
      excerpt,
      publishedOn,
      postedBy: createdBy?.name ?? "",
    }));

  const photos = state.photos
    .filter(isShownToMembers)
    .sort((a, b) => (b.createdAt ?? b.addedOn).localeCompare(a.createdAt ?? a.addedOn))
    .map(({ id, caption, src }) => ({ id, caption, src }));

  return {
    ...base,
    access: info.status === "expired" ? "grace" : "full",
    currency,
    ...membership,
    payments,
    announcements,
    photos,
    // The member's own contact details only. Staff notes and the access code are never included.
    profile: {
      name: member.name,
      phone: member.phone ?? "",
      email: member.email ?? "",
      locality: member.locality ?? "",
    },
  };
}