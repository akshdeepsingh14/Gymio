// The audit trail for financial changes. Entries are only ever added, never
// edited or removed. DEMO ONLY: this lives in the browser, so anyone with
// dev tools can change it. In the backend phase the server writes the trail
// and nobody (not even the owner) can alter it.

import { getSessionUser } from "@/services/authService";

/**
 * Returns the audit log with one new entry added. Call it inside updateDb so
 * the change and its audit entry are saved together or not at all.
 *
 * entry: { action, paymentId, receiptNo, memberId, amount?, reason?, before?, after? }
 */
export function appendAudit(state, entry) {
  const user = getSessionUser();
  return [
    ...(state.auditLog ?? []),
    {
      id: `aud_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      by: user?.ownerName || user?.gymName || "Owner",
      ...entry,
    },
  ];
}