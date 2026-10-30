import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "@/hooks/useAuth";

/** Sign-in and sign-up pages. Signed-in owners get sent on to the app. */
export default function GuestRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (user) {
    const from = location.state?.from?.pathname;
    const target = !user.onboardingComplete
      ? "/onboarding"
      : from && from.startsWith("/app")
        ? from
        : "/app";
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}