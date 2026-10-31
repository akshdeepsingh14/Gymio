import { Link } from "react-router";

import { usePermissions } from "@/hooks/usePermissions";

/** "Create a plan first" that points at the right portal, or tells staff who cannot manage plans what to do. */
export function CreatePlanLink() {
  const { can, base } = usePermissions();

  if (!can("plans.manage")) return <span>Ask the gym owner to create one.</span>;

  return (
    <Link to={`${base}/plans`} className="font-semibold text-foreground underline underline-offset-4">
      Create a plan first.
    </Link>
  );
}