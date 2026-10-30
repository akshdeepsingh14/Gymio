import { Link } from "react-router";
import { Megaphone, ReceiptText, UserPlus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const actions = [
  { to: "/app/members?new=1", label: "Add member", icon: UserPlus, variant: "default" },
  { to: "/app/payments?new=1", label: "Record payment", icon: ReceiptText, variant: "outline" },
  { to: "/app/updates", label: "Publish update", icon: Megaphone, variant: "outline" },
];

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Quick actions" role="group">
      {actions.map(({ to, label, icon: Icon, variant }) => (
        <Link key={to} to={to} className={cn(buttonVariants({ variant }), "h-10 gap-2 px-4")}>
          <Icon aria-hidden="true" />
          {label}
        </Link>
      ))}
    </div>
  );
}