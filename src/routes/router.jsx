import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";

import { RouteError } from "@/components/common/RouteError";
import { Skeleton } from "@/components/ui/skeleton";
import GuestRoute from "@/routes/GuestRoute";
import ProtectedRoute from "@/routes/ProtectedRoute";
import StaffGuestRoute from "@/routes/StaffGuestRoute";
import StaffProtectedRoute from "@/routes/StaffProtectedRoute";
import { ownerRoute } from "@/routes/ownerRoutes";
import { staffRoute } from "@/routes/staffRoutes";

// Public pages
const LandingPage = lazy(() => import("@/pages/public/LandingPage"));
const PrivacyPage = lazy(() => import("@/pages/public/PrivacyPage"));
const TermsPage = lazy(() => import("@/pages/public/TermsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

// Owner authentication pages
const SignInPage = lazy(() => import("@/pages/auth/SignInPage"));
const SignUpPage = lazy(() => import("@/pages/auth/SignUpPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const OnboardingPage = lazy(() => import("@/pages/auth/OnboardingPage"));

// Staff portal pages
const StaffSignInPage = lazy(() => import("@/pages/staff/StaffSignInPage"));
const StaffAcceptInvitePage = lazy(() => import("@/pages/staff/StaffAcceptInvitePage"));
const StaffForgotPasswordPage = lazy(() => import("@/pages/staff/StaffForgotPasswordPage"));

// Member portal pages
const MemberEntryPage = lazy(() => import("@/pages/member/MemberEntryPage"));
const MemberHomePage = lazy(() => import("@/pages/member/MemberHomePage"));

// Lazy loading fallback
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

// Suspense wrapper for lazy-loaded pages
function loadPage(element) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

// Application router.
// One pathless root route holds everything, so a crash in any page lands on RouteError
// instead of React Router's default error screen.
export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      // Public landing page
      {
        path: "/",
        element: loadPage(<LandingPage />),
      },

      // Guest-only routes
      // Signed-in owners are redirected away
      {
        element: <GuestRoute />,
        children: [
          {
            path: "/sign-in",
            element: loadPage(<SignInPage />),
          },
          {
            path: "/sign-up",
            element: loadPage(<SignUpPage />),
          },
          {
            path: "/forgot-password",
            element: loadPage(<ForgotPasswordPage />),
          },
          {
            path: "/reset-password",
            element: loadPage(<ResetPasswordPage />),
          },
        ],
      },

      // Protected owner routes
      // Requires an authenticated owner session
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/onboarding",
            element: loadPage(<OnboardingPage />),
          },
          ownerRoute,
        ],
      },

      // Staff portal routes
      // Staff have their own session. An owner or member session never opens these pages.
      {
        element: <StaffGuestRoute />,
        children: [
          {
            path: "/staff/sign-in",
            element: loadPage(<StaffSignInPage />),
          },
          {
            path: "/staff/forgot-password",
            element: loadPage(<StaffForgotPasswordPage />),
          },
        ],
      },
      {
        // Open to anyone with a link, signed in or not
        path: "/staff/accept-invite",
        element: loadPage(<StaffAcceptInvitePage />),
      },
      {
        element: <StaffProtectedRoute />,
        children: [staffRoute],
      },

      // Member portal routes
      {
        path: "/member",
        element: loadPage(<MemberEntryPage />),
      },
      {
        path: "/member/home",
        element: loadPage(<MemberHomePage />),
      },

      // Legal pages
      {
        path: "/privacy",
        element: loadPage(<PrivacyPage />),
      },
      {
        path: "/terms",
        element: loadPage(<TermsPage />),
      },

      // 404 - Not Found
      {
        path: "*",
        element: loadPage(<NotFoundPage />),
      },
    ],
  },
]);