import { useMemo } from "react";

import { AuthContext } from "@/contexts/auth-context";
import { useStaffGym } from "@/hooks/useStaffGym";

/**
 * Inside the staff portal, the owner screens (Members, Plans, Payments) read their gym from
 * useAuth(). This hands them the staff member's own gym instead, so the screens are shared
 * and no owner session is ever used by mistake.
 */
export function StaffGymScope({ children }) {
  const { owner } = useStaffGym();
  const value = useMemo(() => ({ user: owner }), [owner]);

  if (!owner) return null;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}