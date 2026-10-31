import { Link } from "react-router";
import { ShieldOff } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { cn } from "@/lib/utils";

/** Shown instead of a page the signed-in staff member's role does not allow. */
export function AccessDenied() {
  const { user } = useStaffAuth();

  return (
    <div className="mx-auto max-w-lg py-10" role="alert">
      <title>No access — Gymio staff</title>
      <EmptyState
        icon={ShieldOff}
        title="Not available for your role"
        text={`${user.roleLabel} access does not include this page. If you need it, ask the gym owner to update your role's permissions.`}
        action={
          <Link to="/staff" className={cn(buttonVariants({ variant: "outline" }), "mt-2")}>
            Back to overview
          </Link>
        }
      />
    </div>
  );
}