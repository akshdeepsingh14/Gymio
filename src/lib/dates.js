// All dates in Gymio are plain "YYYY-MM-DD" strings (calendar days, no time).
// That avoids time-zone and daylight-saving bugs: a membership that expires on
// 2026-11-14 expires on that calendar day for everyone, wherever the browser is.

const pad = (n) => String(n).padStart(2, "0");

function parse(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function format(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Today's date in the browser's local calendar. */
export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(iso, days) {
  const date = parse(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return format(date);
}

/** Adds calendar months. Jan 31 + 1 month = Feb 28 (or 29), never Mar 3. */
export function addMonths(iso, months) {
  const date = parse(iso);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return format(date);
}

/** Whole days from b to a (a - b). Positive when a is later. */
export function diffDays(a, b) {
  return Math.round((parse(a) - parse(b)) / 86_400_000);
}

export const startOfMonth = (iso) => `${iso.slice(0, 8)}01`;

export function formatDate(iso) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parse(iso));
}

export function formatShortDate(iso) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(parse(iso));
}

export function formatMonth(iso) {
  return new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" }).format(parse(iso));
}