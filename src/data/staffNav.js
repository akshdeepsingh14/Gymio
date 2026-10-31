import {
  KeyRound,
  LayoutDashboard,
  Megaphone,
  ReceiptText,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";

import { hasPermission } from "@/lib/permissions";

// An item with a `permission` is shown only to staff who have it. Overview, My access and
// Settings are open to every signed-in staff member.
export const staffNavGroups = [
  {
    label: "Work",
    items: [
      { to: "/staff", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/staff/members", label: "Members", icon: Users, permission: "members.view" },
      { to: "/staff/plans", label: "Plans", icon: Ticket, permission: "plans.manage" },
      { to: "/staff/payments", label: "Payments", icon: ReceiptText, permission: "payments.view" },
      {
        to: "/staff/access-requests",
        label: "Access requests",
        icon: KeyRound,
        permission: "access.review",
        countKey: "pendingRequests",
      },
      { to: "/staff/updates", label: "Gym updates", icon: Megaphone, permission: "updates.publish" },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/staff/my-access", label: "My access", icon: ShieldCheck },
      { to: "/staff/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const allStaffNavItems = staffNavGroups.flatMap((group) => group.items);

/** The groups this person can see. A group with nothing in it is dropped. */
export function visibleStaffNav(permissions) {
  return staffNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || hasPermission(permissions, item.permission)),
    }))
    .filter((group) => group.items.length > 0);
}