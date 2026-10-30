import { addDays, diffDays } from "@/lib/dates";
import { getPeriodEnd } from "@/lib/membership";

/** A membership that already runs further ahead than this cannot be renewed again. */
export const MAX_RENEWAL_LEAD_DAYS = 365;

/**
 * Works out the period a renewal would cover.
 *  - Still valid (or ends today): starts the day after the current period ends.
 *  - Already expired: starts today.
 * The renewal sheet and renewalService both call this, so the preview
 * always matches what is saved.
 */
export function getRenewalPeriod(member, plan, today) {
  const daysLeft = diffDays(member.expiresOn, today);
  const start = daysLeft >= 0 ? addDays(member.expiresOn, 1) : today;
  return { start, end: getPeriodEnd(start, plan.duration), daysLeft, lapsed: daysLeft < 0 };
}

export function describeDaysLeft(daysLeft) {
  if (daysLeft === 0) return "Ends today";
  if (daysLeft > 0) return `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
  const ago = Math.abs(daysLeft);
  return `Ended ${ago} ${ago === 1 ? "day" : "days"} ago`;
}