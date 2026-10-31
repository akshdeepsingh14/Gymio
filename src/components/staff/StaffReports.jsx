import { useState } from "react";
import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { FormAlert } from "@/components/common/FormFields";
import { Panel } from "@/components/common/Panel";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { GrowthChart } from "@/components/dashboard/GrowthChart";
import { MethodBreakdown } from "@/components/dashboard/MethodBreakdown";
import { RangeTabs } from "@/components/dashboard/RangeTabs";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/useDashboard";
import { formatMoney, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RANGES } from "@/services/dashboardService";

export function StaffReports({ db, gym, currency, canViewPayments, reduceMotion }) {
  const [range, setRange] = useState("30d");
  const { data, loading, error, retry } = useDashboard(range, gym, db);
  const rangeTitle = RANGES.find((r) => r.id === range)?.title ?? "";
  const paymentsLink = canViewPayments ? "/staff/payments" : undefined;

  return (
    <section aria-labelledby="staff-reports-title" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="staff-reports-title" className="label-mono">
          Reports
        </h2>
        <RangeTabs value={range} onChange={setRange} />
      </div>

      {error && (
        <div className="flex flex-wrap items-center gap-3">
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
        <div aria-busy={loading} className={cn("space-y-6 transition-opacity duration-200", loading && "opacity-60")}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard
              label="Revenue"
              value={formatMoney(data.stats.revenue, currency)}
              change={data.stats.revenueChange}
              hint={rangeTitle}
              to={paymentsLink}
            />
            <StatCard
              label="Payments received"
              value={formatNumber(data.stats.paymentsCount)}
              change={data.stats.paymentsChange}
              hint={rangeTitle}
              to={paymentsLink}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel
              title="Revenue"
              description={`${formatMoney(data.stats.revenue, currency)} · ${rangeTitle.toLowerCase()}`}
              className="xl:col-span-2"
            >
              {data.stats.revenue === 0 ? (
                <EmptyState icon={BarChart3} title="No payments in this period" text="Try a longer date range." />
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

          <Panel title="Membership growth" description="Total members over time">
            <GrowthChart data={data.series} reduceMotion={reduceMotion} />
          </Panel>
        </div>
      )}
    </section>
  );
}