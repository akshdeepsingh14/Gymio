import { Navigate, Outlet, useLocation } from "react-router";

import { useStaffAuth } from "@/hooks/useStaffAuth";

const GUEST_PATHS = ["/staff/sign-in", "/staff/forgot-password", "/staff/accept-invite"];

/** Staff sign-in and password pages. Someone already signed in as staff is sent on to their area. */
export default function StaffGuestRoute() {
  const { user } = useStaffAuth();
  const location = useLocation();

  if (user) {
    const from = location.state?.from?.pathname;
    const target = from && from.startsWith("/staff") && !GUEST_PATHS.includes(from) ? from : "/staff";
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}