import {
  Bell,
  CalendarClock,
  CreditCard,
  Database,
  ReceiptText,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Users,
} from "lucide-react";

export const settingsNav = [
  { path: "appearance", label: "Appearance", icon: SlidersHorizontal },
  { path: "gym", label: "Gym details", icon: Store },
  { path: "membership", label: "Membership", icon: CalendarClock },
  { path: "payments", label: "Payments and receipts", icon: ReceiptText },
  { path: "notifications", label: "Notifications", icon: Bell },
  { path: "security", label: "Security", icon: ShieldCheck },
  { path: "staff", label: "Staff and permissions", icon: Users },
  { path: "billing", label: "Subscription and billing", icon: CreditCard },
  { path: "data", label: "Data and privacy", icon: Database },
];