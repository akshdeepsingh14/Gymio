import { lazy, Suspense } from "react";
import { Navigate } from "react-router";

import { Skeleton } from "@/components/ui/skeleton";
import { StaffGymScope } from "@/contexts/StaffGymScope";
import { staffSettingsNav } from "@/data/staffSettingsNav";
import RequirePermission from "@/routes/RequirePermission";

const StaffLayout = lazy(() => import("@/layouts/StaffLayout"));
const SettingsLayout = lazy(() => import("@/layouts/SettingsLayout"));
const StaffOverviewPage = lazy(() => import("@/pages/staff/StaffOverviewPage"));
const StaffAccessPage = lazy(() => import("@/pages/staff/StaffAccessPage"));
const StaffProfilePage = lazy(() => import("@/pages/staff/settings/StaffProfilePage"));
const StaffSecurityPage = lazy(() => import("@/pages/staff/settings/StaffSecurityPage"));
const StaffNotificationsPage = lazy(() => import("@/pages/staff/settings/StaffNotificationsPage"));

// The staff portal reuses the owner's screens. Their buttons and services check the role's permissions.
const MembersPage = lazy(() => import("@/pages/owner/MembersPage"));
const PlansPage = lazy(() => import("@/pages/owner/PlansPage"));
const PaymentsPage = lazy(() => import("@/pages/owner/PaymentsPage"));
const AccessRequestsPage = lazy(() => import("@/pages/owner/AccessRequestsPage"));
const UpdatesPage = lazy(() => import("@/pages/owner/UpdatesPage"));

// One guarded route: the permission decides whether the page opens at all.
const guarded = (permission, path, element) => ({
  element: <RequirePermission permission={permission} />,
  children: [{ path, element }],
});

export const staffRoute = {
  path: "/staff",
  element: (
    <Suspense
      fallback={
        <div role="status" aria-label="Loading" className="p-6">
          <Skeleton className="h-10 w-48" />
        </div>
      }
    >
      <StaffGymScope>
        <StaffLayout />
      </StaffGymScope>
    </Suspense>
  ),
  children: [
    { index: true, element: <StaffOverviewPage /> },
    guarded("members.view", "members", <MembersPage />),
    guarded("plans.manage", "plans", <PlansPage />),
    guarded("payments.view", "payments", <PaymentsPage />),
    guarded("access.review", "access-requests", <AccessRequestsPage />),
    guarded("updates.publish", "updates", <UpdatesPage />),
    { path: "my-access", element: <StaffAccessPage /> },
    {
      // Every staff member's own account. No permission needed, and nothing here touches gym settings.
      path: "settings",
      element: (
        <SettingsLayout
          nav={staffSettingsNav}
          description="Your own account. Gym-wide settings belong to the gym owner."
        />
      ),
      children: [
        { index: true, element: <Navigate to="profile" replace /> },
        { path: "profile", element: <StaffProfilePage /> },
        { path: "security", element: <StaffSecurityPage /> },
        { path: "notifications", element: <StaffNotificationsPage /> },
      ],
    },
  ],
};