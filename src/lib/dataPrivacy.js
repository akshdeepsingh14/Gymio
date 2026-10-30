// Rules for Settings > Data and privacy.

import { addMonths } from "@/lib/dates";

/** After a deletion request the owner has this many days to change their mind. */
export const DELETION_WAIT_DAYS = 7;

export const RETENTION_OPTIONS = [
  { value: "never", label: "Until I remove them", description: "Gymio never flags inactive members." },
  { value: "12", label: "12 months", description: "Flag inactive members 12 months after their last expiry date." },
  { value: "24", label: "24 months", description: "Flag inactive members 24 months after their last expiry date." },
  { value: "60", label: "5 years", description: "Flag inactive members 5 years after their last expiry date." },
];

export const DEFAULT_DATA_POLICY = { inactiveRetention: "never" };

const RETENTION_VALUES = RETENTION_OPTIONS.map((option) => option.value);

/** The policy with gaps filled in. Safe to call with anything. */
export function getDataPolicy(raw) {
  const value = raw && typeof raw === "object" ? raw.inactiveRetention : undefined;
  return { inactiveRetention: RETENTION_VALUES.includes(value) ? value : DEFAULT_DATA_POLICY.inactiveRetention };
}

export const retentionLabel = (value) => RETENTION_OPTIONS.find((option) => option.value === value)?.label ?? "";

/** Months for a retention value, or null when members are kept until the owner removes them. */
export const retentionMonths = (value) => (value === "never" ? null : Number(value));

/** Inactive members whose membership ended more than `months` ago. These are the ones to review. */
export function countPastRetention(members, today, months) {
  if (months === null) return 0;
  const cutoff = addMonths(today, -months);
  return members.filter((member) => member.accessStatus === "inactive" && member.expiresOn < cutoff).length;
}