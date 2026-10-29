import { Navigate, Outlet, useLocation } from "react-router";

// TODO (auth phase): create this context, then uncomment the import and the line using it.
// import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute() {
  // const { user } = useAuth();
  const user = null; // placeholder until AuthContext exists
  const location = useLocation();

  if (!user) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  if (!user.onboardingComplete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}