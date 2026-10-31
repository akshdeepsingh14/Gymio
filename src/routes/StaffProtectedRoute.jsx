import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";

import { useStaffAuth } from "@/hooks/useStaffAuth";

/** Pages only a signed-in staff member can open. Owner and member sessions do not count. */
export default function StaffProtectedRoute() {
  const { user, refresh } = useStaffAuth();
  const location = useLocation();

  // Check the session against the gym's record on every page change, not only at sign-in
  useEffect(() => {
    refresh();
  }, [location.pathname, refresh]);

  if (!user) {
    return <Navigate to="/staff/sign-in" replace state={{ from: location }} />;
  }

  return <Outlet />;
}