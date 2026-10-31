import { Bell, ShieldCheck, UserRound } from "lucide-react";

// The staff account area. Gym-wide settings stay with the owner, so none of them are listed here.
export const staffSettingsNav = [
  { path: "profile", label: "Profile", icon: UserRound },
  { path: "security", label: "Password and sessions", icon: ShieldCheck },
  { path: "notifications", label: "Notifications", icon: Bell },
];