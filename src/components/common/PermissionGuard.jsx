import { usePermissions } from "@/hooks/usePermissions";

/** Shows its children only when the staff member has the permission. For buttons and blocks inside a page. */
export function PermissionGuard({ permission, any, fallback = null, children }) {
  const { can, canAny } = usePermissions();
  const allowed = any ? canAny(any) : can(permission);
  return allowed ? children : fallback;
}