import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { formatMoney } from "@/lib/format";

const tick = { fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" };

export function RevenueChart({ data, currency, reduceMotion }) {
  const total = data.reduce((sum, point) => sum + point.revenue, 0);

  return (
    <div
      role="img"
      aria-label={`Bar chart of revenue. Total ${formatMoney(total, currency)} across ${data.length} periods.`}
      className="h-64 w-full sm:h-72"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={tick}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={tick}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value) => formatMoney(value, currency, { compact: true })}
          />
          <Tooltip
            cursor={{ fill: "var(--accent)" }}
            content={<ChartTooltip format={(value) => formatMoney(value, currency)} />}
          />
          <Bar
            dataKey="revenue"
            fill="var(--foreground)"
            radius={[1, 1, 0, 0]}
            maxBarSize={28}
            isAnimationActive={!reduceMotion}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}