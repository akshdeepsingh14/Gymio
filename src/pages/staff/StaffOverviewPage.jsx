import { useMemo } from "react";
import { Lock } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  StaffActivity,
  StaffAnnouncements,
  StaffQuickActions,
  StaffRecentMembers,
  StaffRecentPayments,
  StaffRenewals,
  StaffRequests,
} from "@/components/staff/StaffOverviewPanels";
import { StaffReports } from "@/components/staff/StaffReports";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/usePermissions";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { useStaffGym } from "@/hooks/useStaffGym";
import { formatNumber } from "@/lib/format";
import { buildStaffOverview } from "@/lib/staffOverview";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function StaffOverviewPage() {
  const { user } = useStaffAuth();
  const { can } = usePermissions();
  const { db, gym } = useStaffGym();
  const reduceMotion = useReducedMotion();

  const overview = useMemo(
    () => buildStaffOverview({ db, gym, permissions: user.permissions }),
    [db, gym, user.permissions],
  );

  const currency = gym?.currency ?? "INR";
  const firstName = user.name.trim().split(/\s+/)[0];
  const { members, payments, requests, activity, announcements, settings } = overview;
  const canReports = can("reports.view");
  const hasWork = Boolean(members || payments || requests || canReports);

  const panels = [
    members && <StaffRenewals key="renewals" items={members.renewals} />,
    requests && <StaffRequests key="requests" items={requests.items} />,
    payments && <StaffRecentPayments key="payments" items={payments.recent} currency={currency} />,
    members && <StaffRecentMembers key="recent" items={members.recent} />,
    activity && <StaffActivity key="activity" items={activity} />,
    <StaffAnnouncements key="announcements" items={announcements} canManage={can("updates.publish")} />,
  ].filter(Boolean);

  return (
    <>
      <title>{`Overview — ${user.gymName} — Gymio staff`}</title>

      <PageHeader
        title="Overview"
        description={`${greeting()}, ${firstName}. You are signed in to ${user.gymName}.`}
        actions={<Badge variant="secondary">{user.roleLabel}</Badge>}
      />

      <div className="mt-6">
        <StaffQuickActions can={can} />
      </div>

      {!hasWork && (
        <div className="mt-8">
          <EmptyState
            icon={Lock}
            title="Your role has no work screens yet"
            text="You can read gym updates below. Ask the gym owner to add permissions for your role if you need more."
          />
        </div>
      )}

      {(members || payments || requests) && (
        <section aria-label="Key figures" className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {members && (
            <>
              <StatCard
                label="Active members"
                value={formatNumber(members.active)}
                hint={`${formatNumber(members.total)} on the roster`}
                to="/staff/members"
              />
              <StatCard
                label="Expiring soon"
                value={formatNumber(members.expiringSoon)}
                hint={`Ending within ${settings.reminderDays} days`}
                to="/staff/members"
              />
              <StatCard
                label="In grace period"
                value={formatNumber(members.inGrace)}
                hint={`${settings.graceDays}-day grace after expiry`}
                to="/staff/members"
              />
              <StatCard
                label="Joined this week"
                value={formatNumber(members.joinedThisWeek)}
                hint={`${formatNumber(members.joinedToday)} today`}
                to="/staff/members"
              />
            </>
          )}
          {payments && (
            <StatCard
              label="Payments today"
              value={formatNumber(payments.today)}
              hint={`${formatNumber(payments.week)} in the last 7 days`}
              to="/staff/payments"
            />
          )}
          {requests && (
            <StatCard
              label="Pending requests"
              value={formatNumber(requests.pending)}
              hint="Waiting for approval"
              to="/staff/access-requests"
            />
          )}
        </section>
      )}

      {canReports && (
        <div className="mt-8">
          <StaffReports
            db={db}
            gym={gym}
            currency={currency}
            canViewPayments={can("payments.view")}
            reduceMotion={reduceMotion}
          />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">{panels}</div>
    </>
  );
}