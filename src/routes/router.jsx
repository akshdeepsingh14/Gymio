import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";

import { Skeleton } from "@/components/ui/skeleton";
import GuestRoute from "@/routes/GuestRoute";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { ownerRoute } from "@/routes/ownerRoutes";

const LandingPage = lazy(() => import("@/pages/public/LandingPage"));
const ComingSoonPage = lazy(() => import("@/pages/ComingSoonPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

const SignInPage = lazy(() => import("@/pages/auth/SignInPage"));
const SignUpPage = lazy(() => import("@/pages/auth/SignUpPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const OnboardingPage = lazy(() => import("@/pages/auth/OnboardingPage"));

const MemberEntryPage = lazy(() => import("@/pages/member/MemberEntryPage"));
const MemberHomePage = lazy(() => import("@/pages/member/MemberHomePage"));

function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="size-10" />
      </div>
      <Skeleton className="mt-16 h-24 w-3/4 sm:h-40" />
      <Skeleton className="h-5 w-full max-w-md" />
      <Skeleton className="h-12 w-40" />
    </div>
  );
}

function loadPage(element) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: loadPage(<LandingPage />),
  },

  // Public, but signed-in owners are redirected away
  {
    element: <GuestRoute />,
    children: [
      { path: "/sign-in", element: loadPage(<SignInPage />) },
      { path: "/sign-up", element: loadPage(<SignUpPage />) },
      { path: "/forgot-password", element: loadPage(<ForgotPasswordPage />) },
      { path: "/reset-password", element: loadPage(<ResetPasswordPage />) },
    ],
  },

  // Owner area: needs a session
  {
    element: <ProtectedRoute />,
    children: [{ path: "/onboarding", element: loadPage(<OnboardingPage />) }, ownerRoute],
  },

  // Member portal: its own sign-in, separate from the owner's
  { path: "/member", element: loadPage(<MemberEntryPage />) },
  { path: "/member/home", element: loadPage(<MemberHomePage />) },

  {
    path: "/privacy",
    element: loadPage(
      <ComingSoonPage
        title="Privacy policy"
        phase="Phase 13"
        description="The privacy policy will be written before Gymio handles real member data."
      />,
    ),
  },
  {
    path: "/terms",
    element: loadPage(
      <ComingSoonPage
        title="Terms of service"
        phase="Phase 13"
        description="Terms of service will be published before public launch."
      />,
    ),
  },
  {
    path: "*",
    element: loadPage(<NotFoundPage />),
  },
]);