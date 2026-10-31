// Sample team for the demo gym. Times are relative to now, so "last active" never goes stale.
//
// The six people cover every state the team screen can show: two active, one pending,
// one suspended, one whose invite expired and one whose invite the owner cancelled.

import { inviteExpiry } from "@/lib/staff";

const ago = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();
const DAY = 1440;

const OWNER = "Arjun Mehta";

/** Builds the invite object for a person. `state` is "sent", "used" or "cancelled". */
function invite(id, { state, sentDaysAgo, sendCount = 1, usedDaysAgo = null, cancelledDaysAgo = null }) {
  const sentAt = ago(sentDaysAgo * DAY);
  return {
    token: `demo-${id}`,
    state,
    sentAt,
    expiresAt: inviteExpiry(sentAt),
    sendCount,
    invitedBy: OWNER,
    usedAt: usedDaysAgo === null ? null : ago(usedDaysAgo * DAY),
    cancelledAt: cancelledDaysAgo === null ? null : ago(cancelledDaysAgo * DAY),
  };
}

export function createDemoStaff() {
  return [
    {
      id: "staff_demo_1",
      name: "Priya Nair",
      email: "priya.nair@example.com",
      phone: "98200 11122",
      role: "manager",
      status: "active",
      invitedAt: ago(40 * DAY),
      joinedAt: ago(39 * DAY),
      lastActiveAt: ago(95),
      invite: invite("staff_demo_1", { state: "used", sentDaysAgo: 40, usedDaysAgo: 39 }),
    },
    {
      id: "staff_demo_2",
      name: "Rohit Pawar",
      email: "rohit.pawar@example.com",
      phone: "",
      role: "frontDesk",
      status: "active",
      invitedAt: ago(25 * DAY),
      joinedAt: ago(25 * DAY),
      lastActiveAt: ago(20 * 60),
      invite: invite("staff_demo_2", { state: "used", sentDaysAgo: 25, usedDaysAgo: 25 }),
    },
    {
      id: "staff_demo_3",
      name: "Sana Khan",
      email: "sana.khan@example.com",
      phone: "",
      role: "trainer",
      status: "invited",
      invitedAt: ago(26 * 60),
      joinedAt: null,
      lastActiveAt: null,
      invite: invite("staff_demo_3", { state: "sent", sentDaysAgo: 26 / 24 }),
    },
    {
      id: "staff_demo_4",
      name: "Vikram Joshi",
      email: "vikram.joshi@example.com",
      phone: "",
      role: "trainer",
      status: "suspended",
      invitedAt: ago(60 * DAY),
      joinedAt: ago(58 * DAY),
      lastActiveAt: ago(20 * DAY),
      invite: invite("staff_demo_4", { state: "used", sentDaysAgo: 60, usedDaysAgo: 58 }),
    },
    {
      // Invited, resent once, and never opened. The second invite ran out two days ago.
      id: "staff_demo_5",
      name: "Neha Kulkarni",
      email: "neha.kulkarni@example.com",
      phone: "",
      role: "frontDesk",
      status: "invited",
      invitedAt: ago(9 * DAY),
      joinedAt: null,
      lastActiveAt: null,
      invite: invite("staff_demo_5", { state: "sent", sentDaysAgo: 9, sendCount: 2 }),
    },
    {
      id: "staff_demo_6",
      name: "Aman Verma",
      email: "aman.verma@example.com",
      phone: "",
      role: "trainer",
      status: "invited",
      invitedAt: ago(5 * DAY),
      joinedAt: null,
      lastActiveAt: null,
      invite: invite("staff_demo_6", { state: "cancelled", sentDaysAgo: 5, cancelledDaysAgo: 4 }),
    },
  ];
}

/**
 * History for the sample team, in the same shape the staff service writes.
 * `subjectId` is the team member the entry is about, which is how the details view
 * finds their activity.
 */
export function createDemoStaffAudit() {
  const entry = (n, subjectId, minutesAgo, action, summary) => ({
    id: `aud_seed_staff_${n}`,
    at: ago(minutesAgo),
    by: OWNER,
    action,
    subjectId,
    summary,
  });

  return [
    entry(1, "staff_demo_1", 40 * DAY, "staff.invited", "Invited Priya Nair as Manager."),
    entry(2, "staff_demo_1", 39 * DAY, "staff.joined", "Priya Nair accepted the invite (demo)."),
    entry(3, "staff_demo_2", 25 * DAY, "staff.invited", "Invited Rohit Pawar as Front desk."),
    entry(4, "staff_demo_2", 25 * DAY - 90, "staff.joined", "Rohit Pawar accepted the invite (demo)."),
    entry(5, "staff_demo_3", 26 * 60, "staff.invited", "Invited Sana Khan as Trainer."),
    entry(6, "staff_demo_4", 60 * DAY, "staff.invited", "Invited Vikram Joshi as Front desk."),
    entry(7, "staff_demo_4", 58 * DAY, "staff.joined", "Vikram Joshi accepted the invite (demo)."),
    entry(8, "staff_demo_4", 30 * DAY, "staff.updated", "Changed Vikram Joshi's role from Front desk to Trainer."),
    entry(9, "staff_demo_4", 20 * DAY, "staff.suspended", "Suspended Vikram Joshi."),
    entry(10, "staff_demo_5", 12 * DAY, "staff.invited", "Invited Neha Kulkarni as Front desk."),
    entry(11, "staff_demo_5", 9 * DAY, "staff.invite_resent", "Resent the invite to Neha Kulkarni. The old link no longer works."),
    entry(12, "staff_demo_6", 5 * DAY, "staff.invited", "Invited Aman Verma as Trainer."),
    entry(13, "staff_demo_6", 4 * DAY, "staff.invite_cancelled", "Cancelled the invite to Aman Verma."),
  ];
}