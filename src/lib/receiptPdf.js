// Draws the receipt as an A4 PDF. jsPDF is imported only when the user clicks
// Download, so it never adds to the normal page load.

import { formatNumber } from "@/lib/format";
import { receiptPeriod, receiptTaxLine, VERIFICATION_NOTE } from "@/lib/receipt";
import { formatDate } from "@/lib/dates";

const MARGIN = 18;
const RIGHT = 210 - MARGIN;
const WIDTH = RIGHT - MARGIN;

// The built-in PDF fonts only cover Latin text, so anything else becomes "?".
function safe(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .replace(/₹/g, "Rs.")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, "?");
}

const money = (amount, currency) => `${currency === "INR" ? "Rs." : currency} ${formatNumber(amount)}`;
const lineHeight = (size) => size * 0.3528 * 1.3;

/** Writes text and returns how far down the page it used. */
function put(doc, value, x, y, { size = 10, bold = false, gray = 0, align = "left", maxWidth } = {}) {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(gray);
  const text = safe(value);
  const lines = maxWidth ? doc.splitTextToSize(text, maxWidth) : [text];
  doc.text(lines, x, y, { align });
  return lines.length * lineHeight(size);
}

function rule(doc, y, { weight = 0.2, gray = 0 } = {}) {
  doc.setDrawColor(gray);
  doc.setLineWidth(weight);
  doc.line(MARGIN, y, RIGHT, y);
}

export async function downloadReceiptPdf(receipt) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setProperties({ title: `Receipt ${receipt.receiptNo}`, creator: "Gymio" });

  // Compact keeps every fact but uses fewer lines and tighter spacing
  const compact = receipt.layout === "compact";
  const taxLine = receiptTaxLine(receipt);

  // Header: gym on the left, receipt number on the right
  let y = MARGIN + 4;
  put(doc, "RECEIPT", RIGHT, y, { size: 8, bold: true, gray: 110, align: "right" });
  put(doc, receipt.receiptNo, RIGHT, y + 7, { size: 15, bold: true, align: "right" });

  y += put(doc, receipt.gymName, MARGIN, y + 2, { size: 20, bold: true, maxWidth: 110 });
  if (compact) {
    const contact = [receipt.address, receipt.phone, taxLine].filter(Boolean).join(" · ");
    if (contact) y += put(doc, contact, MARGIN, y + 2, { size: 8.5, gray: 90, maxWidth: 110 });
  } else {
    if (receipt.address) y += put(doc, receipt.address, MARGIN, y + 2, { size: 9, gray: 90, maxWidth: 110 });
    if (receipt.phone) y += put(doc, receipt.phone, MARGIN, y + 1, { size: 9, gray: 90 });
    if (taxLine) y += put(doc, taxLine, MARGIN, y + 1, { size: 9, gray: 90, maxWidth: 110 });
  }

  y = Math.max(y, MARGIN + 16) + 6;
  rule(doc, y, { weight: 0.7 });
  y += 6;

  // Voided banner
  if (receipt.voided) {
    const reason = receipt.voidReason ? `Reason: ${receipt.voidReason}` : "";
    const reasonLines = reason ? doc.splitTextToSize(safe(reason), WIDTH - 8).length : 0;
    const boxHeight = 8 + lineHeight(9) * (1 + reasonLines);
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(MARGIN, y, WIDTH, boxHeight);
    put(doc, "VOIDED. This payment was cancelled and no longer counts.", MARGIN + 4, y + 6, {
      size: 9,
      bold: true,
    });
    if (reason) put(doc, reason, MARGIN + 4, y + 6 + lineHeight(9), { size: 9, maxWidth: WIDTH - 8 });
    y += boxHeight + 4;
  }

  // Detail rows
  const rows = compact
    ? [
        ["MEMBER", `${receipt.memberName} (${receipt.memberId})`],
        ["PLAN", receipt.planName],
        ["PERIOD", receiptPeriod(receipt)],
        ["PAID", [formatDate(receipt.paidOn), receipt.methodLabel, receipt.reference].filter(Boolean).join(" · ")],
        receipt.note && ["NOTE", receipt.note],
      ]
    : [
        ["MEMBER", receipt.memberName],
        ["MEMBER ID", receipt.memberId],
        ["PLAN", receipt.planName],
        ["PERIOD", receiptPeriod(receipt)],
        ["PAID ON", formatDate(receipt.paidOn)],
        ["METHOD", receipt.methodLabel],
        receipt.reference && ["REFERENCE", receipt.reference],
        receipt.note && ["NOTE", receipt.note],
      ];

  const valueSize = compact ? 10 : 11;
  const rowGap = compact ? 3 : 5;
  const valueX = MARGIN + 42;
  for (const [label, value] of rows.filter(Boolean)) {
    put(doc, label, MARGIN, y + 4, { size: 8, bold: true, gray: 110 });
    const used = put(doc, value, valueX, y + 4, { size: valueSize, maxWidth: RIGHT - valueX });
    y += Math.max(used, lineHeight(valueSize)) + rowGap;
    rule(doc, y - rowGap / 2, { gray: 215 });
  }

  // Amount
  y += compact ? 3 : 4;
  rule(doc, y, { weight: 0.7 });
  put(doc, "AMOUNT PAID", MARGIN, y + (compact ? 9 : 12), { size: 8, bold: true, gray: 110 });
  put(doc, money(receipt.amount, receipt.currency), RIGHT, y + (compact ? 10 : 13), {
    size: compact ? 18 : 22,
    bold: true,
    gray: receipt.voided ? 150 : 0,
    align: "right",
  });
  y += compact ? 15 : 20;
  rule(doc, y, { weight: 0.7 });
  y += 7;

  put(doc, receipt.voided ? "This receipt has been voided." : VERIFICATION_NOTE, MARGIN, y, {
    size: 9,
    gray: 90,
    maxWidth: WIDTH,
  });

  // Footer
  const made = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date());
  put(doc, `Generated by Gymio on ${made}`, MARGIN, 284, { size: 8, gray: 140 });
  put(doc, receipt.receiptNo, RIGHT, 284, { size: 8, gray: 140, align: "right" });

  doc.save(`${receipt.receiptNo}.pdf`);
}