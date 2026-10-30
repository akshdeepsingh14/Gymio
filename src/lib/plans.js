// Helpers for plan durations and the plan form.
// A duration is stored as { unit: "days" | "months", value: number }.

export const DURATION_PRESETS = [
  { value: "weekly", label: "Weekly", duration: { unit: "days", value: 7 } },
  { value: "monthly", label: "Monthly", duration: { unit: "months", value: 1 } },
  { value: "quarterly", label: "Quarterly", duration: { unit: "months", value: 3 } },
  { value: "half-yearly", label: "Half-yearly", duration: { unit: "months", value: 6 } },
  { value: "yearly", label: "Yearly", duration: { unit: "months", value: 12 } },
];

export const durationTypeOptions = [
  ...DURATION_PRESETS.map(({ value, label }) => ({ value, label })),
  { value: "custom", label: "Custom" },
];

export const customUnitOptions = [
  { value: "days", label: "Days" },
  { value: "months", label: "Months" },
];

export const CUSTOM_LIMITS = { days: 730, months: 36 };

/** Form values -> stored duration. */
export function durationFromForm({ durationType, customValue, customUnit }) {
  const preset = DURATION_PRESETS.find((p) => p.value === durationType);
  if (preset) return { ...preset.duration };
  return { unit: customUnit, value: Number(customValue) };
}

/** Stored duration -> form values (used when editing). */
export function durationToForm(duration) {
  const preset = DURATION_PRESETS.find(
    (p) => p.duration.unit === duration.unit && p.duration.value === duration.value,
  );
  if (preset) return { durationType: preset.value, customValue: "", customUnit: "days" };
  return { durationType: "custom", customValue: String(duration.value), customUnit: duration.unit };
}

/** { unit: "months", value: 3 } -> "3 months" */
export function formatDuration({ unit, value }) {
  const noun = unit === "months" ? "month" : "day";
  return `${value} ${noun}${value === 1 ? "" : "s"}`;
}

/** Rough length in days, only used for sorting plans shortest to longest. */
export const approxDays = ({ unit, value }) => (unit === "months" ? value * 30 : value);

/** One benefit per line in the form, an array in storage. Blank and repeated lines are dropped. */
export function benefitsFromText(text = "") {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return [...new Set(lines)];
}

export const benefitsToText = (benefits = []) => benefits.join("\n");