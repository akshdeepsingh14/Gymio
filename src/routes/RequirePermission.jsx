import { Outlet } from "react-router";

import { AccessDenied } from "@/components/staff/AccessDenied";
import { usePermissions } from "@/hooks/usePermissions";

/**
 * Wraps staff routes. Pass `permission` for one key, or `any` for a list where one is enough.
 * The permission list is re-read on every page change (see StaffProtectedRoute), so a change
 * the owner makes applies the next time the staff member opens a page.
 */
export default function RequirePermission({ permission, any }) {
  const { can, canAny } = usePermissions();
  const allowed = any ? canAny(any) : can(permission);

  return allowed ? <Outlet /> : <AccessDenied />;
}