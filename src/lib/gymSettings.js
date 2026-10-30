// Gym-level rules the owner can change in Settings. They live on the gym record
// (user.gym) next to the profile fields. Every screen reads them through
// getGymSettings(), so a missing or odd value always falls back to a safe default.

import { graceOptions, paymentMethodOptions, reminderOptions } from "@/data/options";
import { getMemberStatus } from "@/lib/membership";
import { DURATION_PRESETS, formatDuration } from "@/lib/plans";

const PRESET_VALUES = DURATION_PRESETS.map((preset) => preset.value);

export const GRACE_VALUES = graceOptions.map((option) => Number(option.value));
export const REMINDER_VALUES = reminderOptions.map((option) => Number(option.value));
export const GRACE_ACCESS_VALUES = ["full", "limited"];
export const MEMBER_THEME_VALUES = ["light", "dark", "system"];
export const NOTIFY_EVENT_VALUES = ["accessRequests", "expiry", "payments", "announcements"];
export const EMAIL_FREQUENCY_VALUES = ["instant", "daily", "weekly"];

export const PAYMENT_METHOD_VALUES = paymentMethodOptions.map((option) => option.value);
export const RECEIPT_LAYOUT_VALUES = ["compact", "detailed"];
export const RECEIPT_DIGIT_VALUES = [3, 4, 5, 6, 7, 8];
export const MAX_RECEIPT_NUMBER = 99_999_999;

const PREFIX_PATTERN = /^[A-Z0-9-]{1,8}$/;
const TAX_NUMBER_PATTERN = /^[A-Za-z0-9 ./-]*$/;
export const TAX_NAME_MAX = 20;
export const TAX_NUMBER_MAX = 30;

export const graceAccessOptions = [
  {
    value: "full",
    label: "Full access, with a warning",
    description: "Members in grace see everything in the portal, plus a reminder to renew.",
  },
  {
    value: "limited",
    label: "Status and renewal info only",
    description: "Members in grace see their status and how to renew. Payments, updates and photos return after renewal.",
  },
];

export const memberThemeOptions = [
  { value: "dark", label: "Dark", description: "The Gymio default." },
  { value: "light", label: "Light", description: "Bright background, dark text." },
  { value: "system", label: "Device setting", description: "Follows each member's phone or laptop." },
];

export const paymentMethodChoices = [
  { value: "upi", label: "UPI", description: "Recorded by you. Gymio does not verify it with a UPI provider." },
  { value: "cash", label: "Cash", description: "Paid in person. No transaction reference is kept." },
  { value: "other", label: "Other", description: "Card, bank transfer or anything else you accept." },
];

export const receiptDigitOptions = RECEIPT_DIGIT_VALUES.map((value) => ({
  value: String(value),
  label: `${value} digits`,
}));

export const receiptLayoutOptions = [
  {
    value: "detailed",
    label: "Detailed",
    description: "Address, phone and every payment detail on its own line.",
  },
  {
    value: "compact",
    label: "Compact",
    description: "The same facts on fewer lines. Good for printing small.",
  },
];

export const emailEventOptions = [
  { value: "accessRequests", label: "New access requests", description: "When a member asks to open their member area." },
  { value: "expiry", label: "Expiry reminders", description: "When memberships are about to expire." },
  { value: "payments", label: "Payment confirmations", description: "When a payment is recorded." },
  { value: "announcements", label: "Announcements", description: "When you publish an announcement." },
];

export const emailFrequencyOptions = [
  { value: "instant", label: "As it happens", description: "One email per event." },
  { value: "daily", label: "Daily summary", description: "Everything from the day in one email." },
  { value: "weekly", label: "Weekly summary", description: "Everything from the week in one email." },
];

export const planDurationChoices = DURATION_PRESETS.map(({ value, label, duration }) => ({
  value,
  label,
  description: `Each purchase covers ${formatDuration(duration)}.`,
}));

export const DEFAULT_GYM_SETTINGS = {
  graceDays: 10,
  reminderDays: 7,
  graceAccess: "full",
  planDurations: PRESET_VALUES,
  defaultDuration: "monthly",
  memberTheme: "dark",
  paymentMethods: PAYMENT_METHOD_VALUES,
  receiptPrefix: "RC-",
  receiptDigits: 5,
  receiptNext: 1,
  taxName: "",
  taxNumber: "",
  receiptLayout: "detailed",
  requireReference: false,
  requireNoteOnDifference: false,
  notifyInApp: true,
  notifyExpiry: true,
  notifyAccessRequests: true,
  notifyPayments: true,
  notifyAnnouncements: true,
  emailEnabled: false,
  emailEvents: ["accessRequests", "expiry"],
  emailFrequency: "daily",
};

const oneOf = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
const text = (value) => (typeof value === "string" ? value.trim() : "");

/** The gym's rules with every gap filled in. Safe to call with a gym that has never saved settings. */
export function getGymSettings(gym) {
  const source = gym ?? {};

  const offered = Array.isArray(source.planDurations)
    ? PRESET_VALUES.filter((value) => source.planDurations.includes(value))
    : [];
  const planDurations = offered.length > 0 ? offered : [...PRESET_VALUES];

  const fallbackDuration = planDurations.includes("monthly") ? "monthly" : planDurations[0];

  const methods = Array.isArray(source.paymentMethods)
    ? PAYMENT_METHOD_VALUES.filter((value) => source.paymentMethods.includes(value))
    : [];

  const prefix = text(source.receiptPrefix).toUpperCase();
  const digits = oneOf(Number(source.receiptDigits ?? DEFAULT_GYM_SETTINGS.receiptDigits), RECEIPT_DIGIT_VALUES, 5);
  const next = Number(source.receiptNext ?? DEFAULT_GYM_SETTINGS.receiptNext);
  const nextFits = Number.isInteger(next) && next >= 1 && next < 10 ** digits;

  // A tax name without a number (or the other way round) would print half a line, so show neither
  const taxName = text(source.taxName).slice(0, TAX_NAME_MAX);
  const taxNumber = text(source.taxNumber).slice(0, TAX_NUMBER_MAX);
  const hasTax = taxName !== "" && taxNumber !== "";

  return {
    graceDays: oneOf(Number(source.graceDays ?? DEFAULT_GYM_SETTINGS.graceDays), GRACE_VALUES, DEFAULT_GYM_SETTINGS.graceDays),
    reminderDays: oneOf(
      Number(source.reminderDays ?? DEFAULT_GYM_SETTINGS.reminderDays),
      REMINDER_VALUES,
      DEFAULT_GYM_SETTINGS.reminderDays,
    ),
    graceAccess: oneOf(source.graceAccess, GRACE_ACCESS_VALUES, "full"),
    planDurations,
    defaultDuration: planDurations.includes(source.defaultDuration) ? source.defaultDuration : fallbackDuration,
    memberTheme: oneOf(source.memberTheme, MEMBER_THEME_VALUES, "dark"),
    paymentMethods: methods.length > 0 ? methods : [...PAYMENT_METHOD_VALUES],
    receiptPrefix: PREFIX_PATTERN.test(prefix) ? prefix : DEFAULT_GYM_SETTINGS.receiptPrefix,
    receiptDigits: digits,
    receiptNext: nextFits ? next : DEFAULT_GYM_SETTINGS.receiptNext,
    taxName: hasTax ? taxName : "",
    taxNumber: hasTax ? taxNumber : "",
    receiptLayout: oneOf(source.receiptLayout, RECEIPT_LAYOUT_VALUES, "detailed"),
    requireReference: source.requireReference === true,
    requireNoteOnDifference: source.requireNoteOnDifference === true,
    // Notifications are on unless the owner turned them off. Email is off until the owner turns it on.
    notifyInApp: source.notifyInApp !== false,
    notifyExpiry: source.notifyExpiry !== false,
    notifyAccessRequests: source.notifyAccessRequests !== false,
    notifyPayments: source.notifyPayments !== false,
    notifyAnnouncements: source.notifyAnnouncements !== false,
    emailEnabled: source.emailEnabled === true,
    emailEvents: Array.isArray(source.emailEvents)
      ? NOTIFY_EVENT_VALUES.filter((value) => source.emailEvents.includes(value))
      : [...DEFAULT_GYM_SETTINGS.emailEvents],
    emailFrequency: oneOf(source.emailFrequency, EMAIL_FREQUENCY_VALUES, DEFAULT_GYM_SETTINGS.emailFrequency),
  };
}

const asBoolean = (input) => {
  if (typeof input !== "boolean") throw new Error("Choose on or off.");
  return input;
};

// One check per setting. Each returns the clean value or throws a message the owner can read.
const checks = {
  graceDays(input) {
    const days = Number(input);
    if (!GRACE_VALUES.includes(days)) throw new Error("Choose one of the listed grace periods.");
    return days;
  },
  reminderDays(input) {
    const days = Number(input);
    if (!REMINDER_VALUES.includes(days)) throw new Error("Choose one of the listed reminder times.");
    return days;
  },
  graceAccess(input) {
    if (!GRACE_ACCESS_VALUES.includes(input)) throw new Error("Choose what members in grace can do.");
    return input;
  },
  planDurations(input) {
    const list = Array.isArray(input) ? PRESET_VALUES.filter((value) => input.includes(value)) : [];
    if (list.length === 0) throw new Error("Keep at least one plan duration.");
    return list;
  },
  defaultDuration(input) {
    if (!PRESET_VALUES.includes(input)) throw new Error("Choose a default duration.");
    return input;
  },
  memberTheme(input) {
    if (!MEMBER_THEME_VALUES.includes(input)) throw new Error("Choose a theme.");
    return input;
  },
  paymentMethods(input) {
    const list = Array.isArray(input) ? PAYMENT_METHOD_VALUES.filter((value) => input.includes(value)) : [];
    if (list.length === 0) throw new Error("Keep at least one payment method on.");
    return list;
  },
  receiptPrefix(input) {
    const prefix = text(input).toUpperCase();
    if (!PREFIX_PATTERN.test(prefix)) throw new Error("Use 1 to 8 letters, numbers or hyphens.");
    return prefix;
  },
  receiptDigits(input) {
    const digits = Number(input);
    if (!RECEIPT_DIGIT_VALUES.includes(digits)) throw new Error("Choose between 3 and 8 digits.");
    return digits;
  },
  receiptNext(input) {
    const raw = String(input ?? "").trim();
    if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > MAX_RECEIPT_NUMBER) {
      throw new Error(`Enter a whole number from 1 to ${MAX_RECEIPT_NUMBER}.`);
    }
    return Number(raw);
  },
  taxName(input) {
    const name = text(input);
    if (name.length > TAX_NAME_MAX) throw new Error(`Keep the tax name under ${TAX_NAME_MAX + 1} characters.`);
    return name;
  },
  taxNumber(input) {
    const number = text(input);
    if (number.length > TAX_NUMBER_MAX) throw new Error(`Keep the tax number under ${TAX_NUMBER_MAX + 1} characters.`);
    if (!TAX_NUMBER_PATTERN.test(number)) throw new Error("Use only letters, numbers, spaces, dots, hyphens and slashes.");
    return number;
  },
  receiptLayout(input) {
    if (!RECEIPT_LAYOUT_VALUES.includes(input)) throw new Error("Choose a receipt layout.");
    return input;
  },
  requireReference(input) {
    if (typeof input !== "boolean") throw new Error("Choose on or off.");
    return input;
  },
  requireNoteOnDifference(input) {
    if (typeof input !== "boolean") throw new Error("Choose on or off.");
    return input;
  },
  notifyInApp: asBoolean,
  notifyExpiry: asBoolean,
  notifyAccessRequests: asBoolean,
  notifyPayments: asBoolean,
  notifyAnnouncements: asBoolean,
  emailEnabled: asBoolean,
  emailEvents(input) {
    if (!Array.isArray(input)) throw new Error("Choose which events to email about.");
    return NOTIFY_EVENT_VALUES.filter((value) => input.includes(value));
  },
  emailFrequency(input) {
    if (!EMAIL_FREQUENCY_VALUES.includes(input)) throw new Error("Choose how often to send emails.");
    return input;
  },
};

/**
 * Checks a settings change before it is saved. Unknown keys are ignored, so a screen
 * can never write something that is not a setting.
 * Returns { value } with the clean changes, or { error: { message, field } }.
 */
export function parseGymSettingsPatch(patch, currentGym) {
  const input = patch ?? {};
  const value = {};

  for (const key of Object.keys(checks)) {
    if (!(key in input)) continue;
    try {
      value[key] = checks[key](input[key]);
    } catch (error) {
      return { error: { message: error.message, field: key } };
    }
  }

  const merged = { ...getGymSettings(currentGym), ...value };
  if (!merged.planDurations.includes(merged.defaultDuration)) {
    return {
      error: { message: "The default duration must be one you offer.", field: "defaultDuration" },
    };
  }

  if (merged.receiptNext >= 10 ** merged.receiptDigits) {
    return {
      error: {
        message: `${merged.receiptDigits} digits only fit numbers up to ${10 ** merged.receiptDigits - 1}. Lower the next number or add digits.`,
        field: "receiptNext",
      },
    };
  }

  if (("taxName" in value || "taxNumber" in value) && Boolean(merged.taxName) !== Boolean(merged.taxNumber)) {
    return merged.taxName
      ? { error: { message: "Add the tax number, or clear the tax name.", field: "taxNumber" } }
      : { error: { message: "Add the tax name, or clear the tax number.", field: "taxName" } };
  }

  // Email on with nothing to email about would send nothing, so ask for one event
  if (("emailEnabled" in value || "emailEvents" in value) && merged.emailEnabled && merged.emailEvents.length === 0) {
    return { error: { message: "Pick at least one event to email about, or turn email off.", field: "emailEvents" } };
  }
  return { value };
}

/** How many members sit in each state under the given rules. Expiring soon is part of active. */
export function countStatuses(members, today, rules) {
  const counts = { active: 0, expiring: 0, grace: 0, expired: 0, suspended: 0, inactive: 0 };

  for (const member of members) {
    const info = getMemberStatus(member, today, rules);
    if (info.status === "active") counts.active += 1;
    if (info.expiringSoon) counts.expiring += 1;
    if (info.inGrace) counts.grace += 1;
    else if (info.status === "expired") counts.expired += 1;
    if (info.status === "suspended") counts.suspended += 1;
    if (info.status === "inactive") counts.inactive += 1;
  }
  return counts;
}

/** Plain-language meaning of each status, written from the gym's current rules. */
export function statusDefinitions({ graceDays, reminderDays, graceAccess }) {
  const noGrace = graceDays === 0;
  const graceText = noGrace
    ? "Switched off. A membership is expired as soon as its expiry date passes."
    : `The expiry date passed up to ${graceDays} days ago. They can still renew. ${
        graceAccess === "full"
          ? "The portal stays fully open, with a warning."
          : "The portal shows only their status and how to renew."
      }`;

  return [
    {
      key: "active",
      label: "Active",
      text: "Access is on and the membership has not passed its expiry date. Includes members who are expiring soon.",
    },
    {
      key: "expiring",
      label: "Expiring soon",
      text: `Active, with ${reminderDays} days or fewer left. The dashboard and Members list flag them so you can ask for a renewal.`,
    },
    { key: "grace", label: "In grace", text: graceText },
    {
      key: "expired",
      label: "Expired",
      text: noGrace
        ? "The expiry date has passed. The portal shows only their status and how to renew until you record a renewal."
        : `More than ${graceDays} days past expiry. The portal shows only their status and how to renew until you record a renewal.`,
    },
    {
      key: "suspended",
      label: "Suspended",
      text: "You paused access for now. Their membership dates keep running, and the portal shows only their status.",
    },
    {
      key: "inactive",
      label: "Inactive",
      text: "You deactivated the member, for example because they left. Their access code is revoked. Records and payment history stay.",
    },
  ];
}