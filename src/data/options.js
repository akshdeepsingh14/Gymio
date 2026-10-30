export const currencyOptions = [
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "AED", label: "UAE Dirham (AED)" },
];

export const timeZoneOptions = [
  { value: "Asia/Kolkata", label: "India (IST, UTC+5:30)" },
  { value: "Asia/Dubai", label: "Dubai (GST, UTC+4)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "America/New_York", label: "New York (ET)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

export const graceOptions = [
  { value: "0", label: "No grace period" },
  { value: "5", label: "5 days" },
  { value: "10", label: "10 days (recommended)" },
  { value: "15", label: "15 days" },
  { value: "30", label: "30 days" },
];

export const reminderOptions = [
  { value: "3", label: "3 days before expiry" },
  { value: "5", label: "5 days before expiry" },
  { value: "7", label: "7 days before expiry" },
  { value: "10", label: "10 days before expiry" },
  { value: "14", label: "14 days before expiry" },
];

// Usernames that would clash with app routes or look official
export const RESERVED_USERNAMES = [
  "admin", "api", "app", "gymio", "member", "members", "support",
  "sign-in", "sign-up", "login", "logout", "onboarding", "privacy", "terms", "www",
];


export const paymentMethodOptions = [
  { value: "upi", label: "UPI" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];