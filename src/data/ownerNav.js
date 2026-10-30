import {
  Building2,
  KeyRound,
  LayoutDashboard,
  Megaphone,
  ReceiptText,
  Settings,
  Ticket,
  Users,
} from "lucide-react";

export const navGroups = [
  {
    label: "Manage",
    items: [
      { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/app/members", label: "Members", icon: Users },
      { to: "/app/plans", label: "Plans", icon: Ticket },
      { to: "/app/payments", label: "Payments", icon: ReceiptText },
      { to: "/app/access-requests", label: "Access requests", icon: KeyRound, countKey: "pendingRequests" },
      { to: "/app/updates", label: "Gym updates", icon: Megaphone },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/app/profile", label: "Gym profile", icon: Building2 },
      { to: "/app/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const allNavItems = navGroups.flatMap((group) => group.items);