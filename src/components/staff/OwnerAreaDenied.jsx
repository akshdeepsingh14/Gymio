import { Link } from "react-router";
import { ShieldOff } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { cn } from "@/lib/utils";

/**
 * Shown when someone signed in as staff opens an owner address such as /app/settings/staff.
 * Staff never get the owner's pages, whatever their permissions are.
 */
export function OwnerAreaDenied() {
  const { user } = useStaffAuth();

  return (
    <main className="grid min-h-svh place-items-center px-4 py-10">
      <title>Owner area — Gymio</title>
      <meta name="robots" content="noindex" />
      <div role="alert" className="w-full max-w-lg">
        <EmptyState
          icon={ShieldOff}
          title="This area is for the gym owner"
          text={`You are signed in as ${user.name} (${user.roleLabel}). Gym settings, staff, billing and data are owner-only, so no staff role can open them.`}
          action={
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Link to="/staff" className={buttonVariants()}>
                Back to staff portal
              </Link>
              <Link to="/sign-in" className={cn(buttonVariants({ variant: "outline" }))}>
                Owner sign-in
              </Link>
            </div>
          }
        />
      </div>
    </main>
  );
}