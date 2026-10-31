import { useState } from "react";
import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { FormAlert } from "@/components/common/FormFields";
import { Panel } from "@/components/common/Panel";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import {
  PendingRequests,
  RecentActivity,
  RecentAnnouncements,
  RecentMembers,
  RecentPayments,
  UpcomingRenewals,
} from "@/components/dashboard/DashboardLists";
import { GrowthChart } from "@/components/dashboard/GrowthChart";
import { MetricDefinitions } from "@/components/dashboard/MetricDefinitions";
import { MethodBreakdown } from "@/components/dashboard/MethodBreakdown";
import { PlanDistribution } from "@/components/dashboard/PlanDistribution";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RangeTabs } from "@/components/dashboard/RangeTabs";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBreakdown } from "@/components/dashboard/StatusBreakdown";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { formatMoney, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RANGES } from "@/services/dashboardService";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [range, setRange] = useState("30d");
  const reduceMotion = useReducedMotion();
  const { data, loading, error, retry } = useDashboard(range, user.gym);

  const currency = user.gym?.currency ?? "INR";
  const graceDays = user.gym?.graceDays ?? 10;
  const reminderDays = user.gym?.reminderDays ?? 7;
  const firstName = (user.ownerName || "").split(" ")[0];
  const rangeTitle = RANGES.find((r) => r.id === range)?.title ?? "";

  return (
    <>
      <title>Overview — Gymio</title>

      <PageHeader
        title="Overview"
        description={`${greeting()}${firstName ? `, ${firstName}` : ""}. Here is ${user.gymName} today.`}
        actions={<RangeTabs value={range} onChange={setRange} />}
      />

      <div className="mt-6">
        <QuickActions />
      </div>

      {error && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <FormAlert message={error} />
          </div>
          <Button variant="outline" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {!data ? (
        !error && <DashboardSkeleton />
      ) : (
        <div
          aria-busy={loading}
          className={cn("mt-8 space-y-6 transition-opacity duration-200", loading && "opacity-60")}
        >
          <SetupChecklist steps={data.setup} ownerId={user.id} />

          <section aria-label="Key figures" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              label="Total members"
              value={formatNumber(data.stats.totalMembers)}
              hint="On your roster"
              to="/app/members"
            />
            <StatCard
              label="Active"
              value={formatNumber(data.stats.activeMembers)}
              hint="Access on, membership valid"
              to="/app/members"
            />
            <StatCard
              label="Inactive"
              value={formatNumber(data.stats.inactiveMembers)}
              hint={`Deactivated · ${data.stats.suspendedMembers} suspended`}
              to="/app/members"
            />
            <StatCard
              label="Pending requests"
              value={formatNumber(data.stats.pendingRequests)}
              hint="Waiting for approval"
              to="/app/access-requests"
            />
            <StatCard
              label="Expiring soon"
              value={formatNumber(data.stats.expiringSoon)}
              hint={`Ending within ${reminderDays} days`}
              to="/app/members"
            />
            <StatCard
              label="Expired"
              value={formatNumber(data.stats.expiredMembers)}
              hint={`${data.stats.expiredInGrace} in ${graceDays}-day grace`}
              to="/app/members"
            />
            <StatCard
              label="Revenue"
              value={formatMoney(data.stats.revenue, currency)}
              change={data.stats.revenueChange}
              hint={rangeTitle}
              to="/app/payments"
            />
            <StatCard
              label="Payments received"
              value={formatNumber(data.stats.paymentsCount)}
              change={data.stats.paymentsChange}
              hint={rangeTitle}
              to="/app/payments"
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel
              title="Revenue"
              description={`${formatMoney(data.stats.revenue, currency)} · ${rangeTitle.toLowerCase()}`}
              className="xl:col-span-2"
            >
              {data.stats.revenue === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="No payments in this period"
                  text="Try a longer date range, or record a payment."
                />
              ) : (
                <RevenueChart data={data.series} currency={currency} reduceMotion={reduceMotion} />
              )}
            </Panel>

            <Panel title="Payment methods" description={rangeTitle}>
              {data.stats.paymentsCount === 0 ? (
                <EmptyState icon={BarChart3} title="No payments" text="Nothing to break down yet." />
              ) : (
                <MethodBreakdown data={data.methodBreakdown} currency={currency} />
              )}
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel
              title="Membership growth"
              description="Total members over time"
              className="xl:col-span-2"
            >
              <GrowthChart data={data.series} reduceMotion={reduceMotion} />
            </Panel>
            <UpcomingRenewals items={data.upcomingRenewals} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Member status" description="Every member counted once, as of today">
              {data.stats.totalMembers === 0 ? (
                <EmptyState icon={BarChart3} title="No members yet" text="Add a member to see the split." />
              ) : (
                <StatusBreakdown data={data.statusBreakdown} />
              )}
            </Panel>
            <Panel title="Members by plan" description="Who is on which membership plan">
              {data.planDistribution.length === 0 ? (
                <EmptyState icon={BarChart3} title="No members yet" text="Plans fill in as members are added." />
              ) : (
                <PlanDistribution data={data.planDistribution} />
              )}
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <RecentPayments items={data.recentPayments} currency={currency} />
            <PendingRequests items={data.pendingRequests} />
            <RecentMembers items={data.recentMembers} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <RecentActivity items={data.activity} />
            <RecentAnnouncements items={data.announcements} />
          </div>

          <MetricDefinitions graceDays={graceDays} reminderDays={reminderDays} />
        </div>
      )}
    </>
  );
}