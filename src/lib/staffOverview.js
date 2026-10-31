// Works out the staff dashboard from the gym's data. Every block is built only when the
// person's permissions allow it, so nothing they may not see is even calculated.

import { auditMeta, describeAudit } from "@/lib/auditLog";
import { addDays, todayISO } from "@/lib/dates";
import { getGymSettings } from "@/lib/gymSettings";
import { getMemberStatus } from "@/lib/membership";
import { hasPermission } from "@/lib/permissions";
import { isCounted, methodLabels } from "@/lib/payments";
import { isArchived } from "@/lib/updates";

export function buildStaffOverview({ db, gym, permissions, today = todayISO() }) {
  const can = (key) => hasPermission(permissions, key);
  const settings = getGymSettings(gym);
  const rules = { graceDays: settings.graceDays, reminderDays: settings.reminderDays };
  const currency = gym?.currency ?? "INR";
  const weekStart = addDays(today, -6);

  const overview = {
    settings,
    members: null,
    payments: null,
    requests: null,
    activity: null,
    // Gym updates are visible to every staff member
    announcements: db.announcements
      .filter((post) => !isArchived(post))
      .sort((a, b) => b.publishedOn.localeCompare(a.publishedOn))
      .slice(0, 3),
  };

  if (can("members.view")) {
    const states = db.members.map((member) => ({ member, ...getMemberStatus(member, today, rules) }));

    overview.members = {
      total: db.members.length,
      active: states.filter((s) => s.status === "active").length,
      expiringSoon: states.filter((s) => s.expiringSoon).length,
      inGrace: states.filter((s) => s.inGrace).length,
      joinedToday: db.members.filter((m) => m.joinedOn === today).length,
      joinedThisWeek: db.members.filter((m) => m.joinedOn >= weekStart && m.joinedOn <= today).length,
      renewals: states
        .filter((s) => (s.status === "active" && s.daysLeft <= 14) || s.inGrace)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .map((s) => ({
          id: s.member.id,
          name: s.member.name,
          expiresOn: s.member.expiresOn,
          daysLeft: s.daysLeft,
          inGrace: s.inGrace,
        })),
      recent: [...db.members]
        .sort((a, b) => b.joinedOn.localeCompare(a.joinedOn))
        .slice(0, 5)
        .map((m) => ({ id: m.id, name: m.name, joinedOn: m.joinedOn, locality: m.locality })),
    };
  }

  if (can("payments.view")) {
    const counted = db.payments.filter(isCounted); // voided payments never count
    const nameById = Object.fromEntries(db.members.map((m) => [m.id, m.name]));

    overview.payments = {
      today: counted.filter((p) => p.date === today).length,
      week: counted.filter((p) => p.date >= weekStart && p.date <= today).length,
      recent: [...counted]
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id, undefined, { numeric: true }))
        .slice(0, 5)
        .map((p) => ({
          ...p,
          memberName: nameById[p.memberId] ?? "Unknown member",
          methodLabel: methodLabels[p.method] ?? p.method,
        })),
    };
  }

  if (can("access.review")) {
    const pending = db.accessRequests
      .filter((request) => request.status === "pending")
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    overview.requests = { pending: pending.length, items: pending.slice(0, 5) };
  }

  // Activity is limited to the kinds this person can already work with.
  // Team changes, data exports and permission edits stay between the owner and the log.
  const showPayments = can("payments.view");
  const showAccess = can("access.review");
  if (showPayments || showAccess) {
    overview.activity = [...db.auditLog]
      .filter((entry) => {
        const { category } = auditMeta(entry.action);
        return (category === "payments" && showPayments) || (category === "access" && showAccess);
      })
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 6)
      .map((entry) => ({
        id: entry.id,
        at: entry.at,
        by: entry.by,
        label: auditMeta(entry.action).label,
        summary: describeAudit(entry, currency),
      }));
  }

  return overview;
}