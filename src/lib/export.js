// Turns the gym's records into CSV and JSON files the owner can download.
// Everything happens in the browser. Access codes (and their hashes) are never included.

import { todayISO } from "@/lib/dates";
import { auditMeta, describeAudit } from "@/lib/auditLog";
import { formatDuration } from "@/lib/plans";
import { methodLabels } from "@/lib/payments";

/**
 * One CSV cell. Quotes are doubled and the cell is wrapped when needed.
 * A text cell that starts with = @ (or + or - when it is not a plain number or phone)
 * could run as a formula when opened in a spreadsheet, so it gets a leading apostrophe.
 */
function cell(value) {
  if (value === null || value === undefined) return "";
  let text = String(value);

  if (typeof value === "string") {
    const formulaLike = /^[=@\t\r]/.test(text) || (/^[+-]/.test(text) && !/^[+-]?[\d\s().-]+$/.test(text));
    if (formulaLike) text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** columns: [{ label, get(row) }]. The byte-order mark makes Excel read accents and the rupee sign correctly. */
export function toCsv(columns, rows) {
  const header = columns.map((column) => cell(column.label)).join(",");
  const lines = rows.map((row) => columns.map((column) => cell(column.get(row))).join(","));
  return `\uFEFF${[header, ...lines].join("\r\n")}`;
}

export function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const exportFilename = (username, name, extension) => `${username || "gymio"}-${name}-${todayISO()}.${extension}`;

/** The four CSV files. Each has an id, a label, the columns and the rows. */
export function buildDatasets(db, currency = "INR") {
  const planName = (id) => db.plans.find((plan) => plan.id === id)?.name ?? "";
  const memberName = (id) => db.members.find((member) => member.id === id)?.name ?? "";
  const auditRows = [...db.auditLog].sort((a, b) => b.at.localeCompare(a.at));

  return [
    {
      id: "members",
      label: "Members",
      description: "Details, plan, dates and access status for every member.",
      rows: db.members,
      columns: [
        { label: "Member ID", get: (m) => m.id },
        { label: "Name", get: (m) => m.name },
        { label: "Email", get: (m) => m.email },
        { label: "Phone", get: (m) => m.phone },
        { label: "Locality", get: (m) => m.locality },
        { label: "Plan", get: (m) => planName(m.planId) },
        { label: "Joined", get: (m) => m.joinedOn },
        { label: "Expires", get: (m) => m.expiresOn },
        { label: "Access status", get: (m) => m.accessStatus },
        { label: "Payment status", get: (m) => m.paymentStatus },
        { label: "Notes", get: (m) => m.notes },
      ],
    },
    {
      id: "payments",
      label: "Payments",
      description: "Every recorded payment, including voided ones, with receipt numbers.",
      rows: db.payments,
      columns: [
        { label: "Receipt", get: (p) => p.receiptNo },
        { label: "Date", get: (p) => p.date },
        { label: "Member ID", get: (p) => p.memberId },
        { label: "Member", get: (p) => memberName(p.memberId) },
        { label: "Plan", get: (p) => planName(p.planId) },
        { label: `Amount (${currency})`, get: (p) => p.amount },
        { label: "Method", get: (p) => methodLabels[p.method] ?? p.method },
        { label: "Reference", get: (p) => p.reference },
        { label: "Period start", get: (p) => p.periodStart },
        { label: "Period end", get: (p) => p.periodEnd },
        { label: "Status", get: (p) => p.status },
        { label: "Void reason", get: (p) => p.voidReason },
        { label: "Note", get: (p) => p.note },
      ],
    },
    {
      id: "plans",
      label: "Membership plans",
      description: "Your plans, including archived ones.",
      rows: db.plans,
      columns: [
        { label: "Name", get: (p) => p.name },
        { label: "Duration", get: (p) => formatDuration(p.duration) },
        { label: `Price (${currency})`, get: (p) => p.price },
        { label: "Status", get: (p) => p.status },
        { label: "Description", get: (p) => p.description },
        { label: "Benefits", get: (p) => (p.benefits ?? []).join("; ") },
      ],
    },
    {
      id: "audit-log",
      label: "Audit log",
      description: "The record of financial, access, staff and data changes.",
      rows: auditRows,
      columns: [
        { label: "When", get: (e) => e.at },
        { label: "By", get: (e) => e.by },
        { label: "Action", get: (e) => auditMeta(e.action).label },
        { label: "Details", get: (e) => describeAudit(e, currency) },
      ],
    },
  ];
}

/** Everything in one JSON file. Access codes and photo image data are left out. */
export function buildFullExport(db, user) {
  const members = db.members.map((member) => {
    const copy = { ...member };
    delete copy.credential;
    return copy;
  });

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      gym: { name: user.gymName, username: user.gym?.username ?? "" },
      plans: db.plans,
      members,
      payments: db.payments,
      accessRequests: db.accessRequests,
      announcements: db.announcements,
      photos: db.photos.map(({ id, caption, visibility, addedOn }) => ({ id, caption, visibility, addedOn })),
      staff: db.staff.map(({ invite, ...person }) => ({
        ...person,
        invite: invite && { state: invite.state, sentAt: invite.sentAt, expiresAt: invite.expiresAt, sendCount: invite.sendCount },
      })),
      auditLog: db.auditLog,
    },
    null,
    2,
  );
}