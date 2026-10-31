import { StatCard } from "@/components/dashboard/StatCard";
import { formatMoney } from "@/lib/format";

/**
 * Totals for whatever the filters currently show.
 * `showMoney` is false for staff without the revenue permission: they still see how many
 * payments there are, but no amounts.
 */
export function PaymentStats({ summary, currency, showMoney = true }) {
  if (!showMoney) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Payments" value={summary.count} hint="In the current view" />
        <StatCard
          label="Voided"
          value={summary.voidedCount}
          hint={summary.voidedCount > 0 ? "Not counted" : "None in this view"}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {/* Full width on phones so the two small cards below sit side by side */}
      <div className="col-span-2 lg:col-span-1 [&>*]:h-full">
        <StatCard label="Collected" value={formatMoney(summary.collected, currency)} hint="Recorded payments, voids excluded" />
      </div>
      <StatCard label="Payments" value={summary.count} hint="In the current view" />
      <StatCard
        label="Voided"
        value={summary.voidedCount}
        hint={summary.voidedCount > 0 ? `${formatMoney(summary.voidedAmount, currency)} not counted` : "None in this view"}
      />

      <div className="col-span-2 rounded-sm border border-border bg-card p-4 sm:p-5 lg:col-span-1">
        <p className="label-mono text-muted-foreground">By method</p>
        <dl className="mt-4 space-y-2.5">
          {summary.byMethod.map((method) => (
            <div key={method.value} className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="text-muted-foreground">
                {method.label} <span className="font-mono text-xs">({method.count})</span>
              </dt>
              <dd className="font-mono font-semibold">{formatMoney(method.amount, currency)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}