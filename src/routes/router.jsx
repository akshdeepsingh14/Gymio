import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";

import { Skeleton } from "@/components/ui/skeleton";

const LandingPage = lazy(() => import("@/pages/public/LandingPage"));
const ComingSoonPage = lazy(() => import("@/pages/ComingSoonPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

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
  {
    path: "/sign-in",
    element: loadPage(
      <ComingSoonPage
        title="Owner sign in"
        phase="Phase 3"
        description="The gym owner sign-in screen is built in the next phase."
      />
    ),
  },
  {
    path: "/sign-up",
    element: loadPage(
      <ComingSoonPage
        title="Create your gym"
        phase="Phase 3"
        description="Registration and gym onboarding are built in the next phase."
      />
    ),
  },
  {
    path: "/member",
    element: loadPage(
      <ComingSoonPage
        title="Member portal"
        phase="Phase 7"
        description="Members will sign in here with their gym username and private access code."
      />
    ),
  },
  {
    path: "/privacy",
    element: loadPage(
      <ComingSoonPage
        title="Privacy policy"
        phase="Phase 13"
        description="The privacy policy will be written before Gymio handles real member data."
      />
    ),
  },
  {
    path: "/terms",
    element: loadPage(
      <ComingSoonPage
        title="Terms of service"
        phase="Phase 13"
        description="Terms of service will be published before public launch."
      />
    ),
  },
  {
    path: "*",
    element: loadPage(<NotFoundPage />),
  },
]);