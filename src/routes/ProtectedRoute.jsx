import { Navigate, Outlet, useLocation } from "react-router";

import { OwnerAreaDenied } from "@/components/staff/OwnerAreaDenied";
import { useAuth } from "@/hooks/useAuth";
import { useStaffAuth } from "@/hooks/useStaffAuth";

export default function ProtectedRoute() {
  const { user } = useAuth();
  const { user: staffUser } = useStaffAuth();
  const location = useLocation();

  if (!user) {
    // Signed in as staff but opening an owner address: say so, instead of sending them to the owner sign-in
    if (staffUser) return <OwnerAreaDenied />;
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  if (!user.onboardingComplete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (user.onboardingComplete && location.pathname === "/onboarding") {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}