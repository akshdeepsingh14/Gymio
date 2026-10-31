// Turns a settings or profile change into one plain sentence for the audit log.
// It only describes the change. services/settingsAuditService.js writes it.
//
// Tax details and the owner's email are logged as "changed", never with their values:
// the log is read by anyone who can open Data and privacy, and it is also exported.

import {
  emailEventOptions,
  emailFrequencyOptions,
  getGymSettings,
  graceAccessOptions,
  memberThemeOptions,
  paymentMethodChoices,
  planDurationChoices,
  receiptLayoutOptions,
} from "@/lib/gymSettings";

const labelOf = (options, value) => options.find((option) => option.value === value)?.label ?? String(value);
const listOf = (options) => (values) => (values.length === 0 ? "none" : values.map((value) => labelOf(options, value)).join(", "));
const onOff = (value) => (value ? "on" : "off");
const days = (value) => (value === 0 ? "off" : `${value} days`);

// label: what the owner sees in Settings. show: how a value reads in the sentence. hide: log "changed" only.
const FIELDS = {
  graceDays: { label: "grace period", show: days },
  reminderDays: { label: "expiry reminder", show: days },
  graceAccess: { label: "access during grace", show: (value) => labelOf(graceAccessOptions, value).toLowerCase() },
  planDurations: { label: "offered plan durations", show: listOf(planDurationChoices) },
  defaultDuration: { label: "default plan duration", show: (value) => labelOf(planDurationChoices, value) },
  memberTheme: { label: "member portal theme", show: (value) => labelOf(memberThemeOptions, value) },
  paymentMethods: { label: "accepted payment methods", show: listOf(paymentMethodChoices) },
  receiptPrefix: { label: "receipt prefix", show: String },
  receiptDigits: { label: "receipt digits", show: String },
  receiptNext: { label: "next receipt number", show: String },
  taxName: { label: "tax name", hide: true },
  taxNumber: { label: "tax number", hide: true },
  receiptLayout: { label: "receipt layout", show: (value) => labelOf(receiptLayoutOptions, value) },
  requireReference: { label: "required transaction reference", show: onOff },
  requireNoteOnDifference: { label: "required note on a different amount", show: onOff },
  notifyInApp: { label: "in-app notifications", show: onOff },
  notifyExpiry: { label: "expiry notifications", show: onOff },
  notifyAccessRequests: { label: "access request notifications", show: onOff },
  notifyPayments: { label: "payment notifications", show: onOff },
  notifyAnnouncements: { label: "announcement notifications", show: onOff },
  emailEnabled: { label: "email", show: onOff },
  emailEvents: { label: "email events", show: listOf(emailEventOptions) },
  emailFrequency: { label: "email frequency", show: (value) => labelOf(emailFrequencyOptions, value).toLowerCase() },
};

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** One sentence listing what changed between two gym records, or "" when no setting changed. */
export function describeSettingsChange(beforeGym, afterGym) {
  const before = getGymSettings(beforeGym);
  const after = getGymSettings(afterGym);

  const parts = Object.entries(FIELDS)
    .filter(([key]) => !same(before[key], after[key]))
    .map(([key, field]) =>
      field.hide ? `${field.label} changed` : `${field.label} from ${field.show(before[key])} to ${field.show(after[key])}`,
    );

  return parts.length === 0 ? "" : `Changed ${parts.join("; ")}.`;
}

const PROFILE_FIELDS = [
  ["gymName", "gym name"],
  ["description", "description"],
  ["logo", "logo"],
  ["cover", "cover image"],
  ["phone", "phone"],
  ["address", "address"],
  ["city", "city"],
  ["locality", "locality"],
  ["website", "website"],
  ["instagram", "Instagram"],
  ["hours", "opening hours"],
  ["currency", "currency"],
  ["timeZone", "time zone"],
];

/** One sentence for a Gym profile save, or "" when nothing changed. The username shows both values. */
export function describeProfileChange(beforeUser, afterUser) {
  const before = { ...(beforeUser?.gym ?? {}), gymName: beforeUser?.gymName };
  const after = { ...(afterUser?.gym ?? {}), gymName: afterUser?.gymName };

  const parts = [];
  if (before.username !== after.username) parts.push(`username from @${before.username} to @${after.username}`);
  for (const [key, label] of PROFILE_FIELDS) {
    if (!same(before[key] ?? "", after[key] ?? "")) parts.push(label);
  }
  if (beforeUser?.ownerName !== afterUser?.ownerName) parts.push("owner name");
  if ((beforeUser?.ownerPhoto ?? "") !== (afterUser?.ownerPhoto ?? "")) parts.push("owner photo");
  if (beforeUser?.email !== afterUser?.email) parts.push("sign-in email");

  return parts.length === 0 ? "" : `Updated the gym profile: ${parts.join(", ")}.`;
}