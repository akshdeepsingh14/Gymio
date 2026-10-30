import { lazy, Suspense } from "react";
import { Navigate } from "react-router";

import { Skeleton } from "@/components/ui/skeleton";

const OwnerLayout = lazy(() => import("@/layouts/OwnerLayout"));
const SettingsLayout = lazy(() => import("@/layouts/SettingsLayout"));
const DashboardPage = lazy(() => import("@/pages/owner/DashboardPage"));
const MembersPage = lazy(() => import("@/pages/owner/MembersPage"));
const PlansPage = lazy(() => import("@/pages/owner/PlansPage"));
const PaymentsPage = lazy(() => import("@/pages/owner/PaymentsPage"));
const AccessRequestsPage = lazy(() => import("@/pages/owner/AccessRequestsPage"));
const UpdatesPage = lazy(() => import("@/pages/owner/UpdatesPage"));
const ProfilePage = lazy(() => import("@/pages/owner/ProfilePage"));
const AppearancePage = lazy(() => import("@/pages/owner/settings/AppearancePage"));
const GymDetailsPage = lazy(() => import("@/pages/owner/settings/GymDetailsPage"));
const MembershipSettingsPage = lazy(() => import("@/pages/owner/settings/MembershipSettingsPage"));
const PaymentsSettingsPage = lazy(() => import("@/pages/owner/settings/PaymentsSettingsPage"));
const NotificationsSettingsPage = lazy(() => import("@/pages/owner/settings/NotificationsSettingsPage"));
const SecuritySettingsPage = lazy(() => import("@/pages/owner/settings/SecuritySettingsPage"));
const StaffSettingsPage = lazy(() => import("@/pages/owner/settings/StaffSettingsPage"));
const BillingSettingsPage = lazy(() => import("@/pages/owner/settings/BillingSettingsPage"));
const DataSettingsPage = lazy(() => import("@/pages/owner/settings/DataSettingsPage"));

export const ownerRoute = {
  path: "/app",
  element: (
    <Suspense
      fallback={
        <div role="status" aria-label="Loading" className="p-6">
          <Skeleton className="h-10 w-48" />
        </div>
      }
    >
      <OwnerLayout />
    </Suspense>
  ),
  children: [
    { index: true, element: <DashboardPage /> },
    { path: "members", element: <MembersPage /> },
    { path: "plans", element: <PlansPage /> },
    { path: "payments", element: <PaymentsPage /> },
    { path: "access-requests", element: <AccessRequestsPage /> },
    { path: "updates", element: <UpdatesPage /> },
    { path: "profile", element: <ProfilePage /> },
    {
      path: "settings",
      element: <SettingsLayout />,
      children: [
        { index: true, element: <Navigate to="appearance" replace /> },
        { path: "appearance", element: <AppearancePage /> },
        { path: "gym", element: <GymDetailsPage /> },
        { path: "membership", element: <MembershipSettingsPage /> },
        { path: "payments", element: <PaymentsSettingsPage /> },
        { path: "notifications", element: <NotificationsSettingsPage /> },
        { path: "security", element: <SecuritySettingsPage /> },
        { path: "staff", element: <StaffSettingsPage /> },
        { path: "billing", element: <BillingSettingsPage /> },
        { path: "data", element: <DataSettingsPage /> },
      ],
    },
  ],
};