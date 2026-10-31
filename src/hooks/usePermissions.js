import { useMemo } from "react";
import { useLocation } from "react-router";

import { useStaffAuth } from "@/hooks/useStaffAuth";
import { hasAllPermissions, hasAnyPermission, hasPermission } from "@/lib/permissions";

const inStaffPortal = (pathname) => /^\/staff(\/|$)/.test(pathname);

/**
 * What the current person may do.
 * In the owner portal (/app) everything is allowed. In the staff portal (/staff) only what the
 * role's permission list says. `base` is the portal's root path, for building links.
 */
export function usePermissions() {
  const { pathname } = useLocation();
  const { user } = useStaffAuth();
  const staff = inStaffPortal(pathname);
  const permissions = user?.permissions;

  return useMemo(() => {
    if (!staff) {
      return {
        isOwner: true,
        base: "/app",
        permissions: null,
        can: () => true,
        canAny: () => true,
        canAll: () => true,
      };
    }
    const list = permissions ?? [];
    return {
      isOwner: false,
      base: "/staff",
      permissions: list,
      can: (key) => hasPermission(list, key),
      canAny: (keys) => hasAnyPermission(list, keys),
      canAll: (keys) => hasAllPermissions(list, keys),
    };
  }, [staff, permissions]);
}