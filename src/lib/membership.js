import { addDays, addMonths, diffDays } from "@/lib/dates";

/**
 * Last valid day of a membership period (inclusive).
 * A monthly plan starting 1 Nov covers 1 Nov to 30 Nov.
 */
export function getPeriodEnd(start, duration) {
  const next =
    duration.unit === "months" ? addMonths(start, duration.value) : addDays(start, duration.value);
  return addDays(next, -1);
}

/**
 * One place that decides what state a member is in.
 *
 *  inactive  = owner deactivated the member (left the gym, etc.)
 *  suspended = owner temporarily blocked access
 *  expired   = membership ended (may still be inside the grace period)
 *  active    = access allowed and membership still valid
 */
export function getMemberStatus(member, today, { graceDays = 10, reminderDays = 7 } = {}) {
  const daysLeft = diffDays(member.expiresOn, today); // negative once expired

  let status = "active";
  if (member.accessStatus === "inactive") status = "inactive";
  else if (member.accessStatus === "suspended") status = "suspended";
  else if (daysLeft < 0) status = "expired";

  return {
    status,
    daysLeft,
    expiringSoon: status === "active" && daysLeft <= reminderDays,
    inGrace: status === "expired" && -daysLeft <= graceDays,
  };
}