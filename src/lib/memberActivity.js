// The history shown on a member's detail sheet. It is read from the audit log, so there is
// one source of truth. Payment entries carry amounts, so only people who may see payments get them.

export function memberActivity(auditLog = [], memberId, { includePayments = false } = {}) {
  return auditLog
    .filter((entry) => {
      if (entry.memberId !== memberId) return false;
      if (entry.action.startsWith("payment.")) return includePayments;
      return entry.action.startsWith("member.") || entry.action.startsWith("access.");
    })
    .sort((a, b) => b.at.localeCompare(a.at));
}