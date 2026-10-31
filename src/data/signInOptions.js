import { Building2, Dumbbell, UserCog } from "lucide-react";

// The three ways into Gymio. Used by the landing page menu, the mobile menu and the footer.
export const signInOptions = [
  {
    key: "owner",
    label: "Gym owner",
    shortLabel: "Owner",
    description: "Run your gym: members, payments, staff and settings.",
    to: "/sign-in",
    icon: Building2,
  },
  {
    key: "staff",
    label: "Gym staff",
    shortLabel: "Staff",
    description: "Sign in with the account your gym owner invited you to.",
    to: "/staff/sign-in",
    icon: UserCog,
  },
  {
    key: "member",
    label: "Gym member",
    shortLabel: "Member",
    description: "See your membership, receipts and gym updates.",
    to: "/member",
    icon: Dumbbell,
  },
];