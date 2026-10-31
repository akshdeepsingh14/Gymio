// Labels and wording for the audit log shown in Settings > Data and privacy.
// Entries are written by the services (see auditService). This file only describes them.

import { formatMoney } from "@/lib/format";

export const AUDIT_FILTERS = [
  { id: "all", label: "All" },
  { id: "payments", label: "Payments" },
  { id: "members", label: "Members" },
  { id: "access", label: "Access" },
  { id: "staff", label: "Staff" },
  { id: "settings", label: "Settings" },
  { id: "data", label: "Data" },
];

const META = {
  "payment.recorded": { label: "Payment recorded", category: "payments", variant: "outline" },
  "payment.amended": { label: "Payment edited", category: "payments", variant: "secondary" },
  "payment.voided": { label: "Payment voided", category: "payments", variant: "destructive" },
  "member.created": { label: "Member added", category: "members", variant: "outline" },
  "member.updated": { label: "Member edited", category: "members", variant: "secondary" },
  "member.status_changed": { label: "Member access changed", category: "members", variant: "secondary" },
  "access.approved": { label: "Access approved", category: "access", variant: "outline" },
  "access.rejected": { label: "Access rejected", category: "access", variant: "destructive" },
  "access.revoked": { label: "Access revoked", category: "access", variant: "destructive" },
  "update.deleted": { label: "Announcement deleted", category: "other", variant: "destructive" },
  "photo.deleted": { label: "Photo deleted", category: "other", variant: "destructive" },
  "staff.invited": { label: "Staff invited", category: "staff", variant: "outline" },
  "staff.invite_resent": { label: "Invite resent", category: "staff", variant: "outline" },
  "staff.invite_cancelled": { label: "Invite cancelled", category: "staff", variant: "destructive" },
  "staff.joined": { label: "Staff joined", category: "staff", variant: "outline" },
  "staff.updated": { label: "Staff updated", category: "staff", variant: "secondary" },
  "staff.suspended": { label: "Staff suspended", category: "staff", variant: "destructive" },
  "staff.reactivated": { label: "Staff reactivated", category: "staff", variant: "outline" },
  "staff.removed": { label: "Staff removed", category: "staff", variant: "destructive" },
  "roles.updated": { label: "Permissions changed", category: "staff", variant: "secondary" },
  "settings.updated": { label: "Settings changed", category: "settings", variant: "secondary" },
  "profile.updated": { label: "Gym profile changed", category: "settings", variant: "secondary" },  
  "data.exported": { label: "Data exported", category: "data", variant: "outline" },
  "data.policy": { label: "Retention changed", category: "data", variant: "secondary" },
  "account.deletion_requested": { label: "Deletion requested", category: "data", variant: "destructive" },
  "account.deletion_cancelled": { label: "Deletion cancelled", category: "data", variant: "outline" },
};

/** Unknown actions still show up, under their raw name, and only in the All view. */
export const auditMeta = (action) => META[action] ?? { label: action, category: "other", variant: "outline" };

/** One plain sentence for an entry. New entries carry their own summary. Older ones are built from their fields. */
export function describeAudit(entry, currency = "INR") {
  if (entry.summary) return entry.summary;

  if (entry.action?.startsWith("payment.")) {
    const parts = [`${entry.receiptNo} for ${entry.memberId}`];
    if (typeof entry.amount === "number") parts.push(formatMoney(entry.amount, currency));
    const base = parts.join(", ");
    return entry.reason ? `${base}. Reason: ${entry.reason}` : base;
  }

  if (entry.action?.startsWith("access.")) {
    const base = `Request from ${entry.memberId}`;
    const extras = [entry.reason ? `Reason: ${entry.reason}` : "", entry.codeRevoked ? "Access code revoked" : ""].filter(Boolean);
    return extras.length > 0 ? `${base}. ${extras.join(". ")}` : base;
  }

  return "";
}

export function countByCategory(entries) {
  const counts = {};
  for (const entry of entries) {
    const { category } = auditMeta(entry.action);
    counts[category] = (counts[category] ?? 0) + 1;
  }
  return counts;
}