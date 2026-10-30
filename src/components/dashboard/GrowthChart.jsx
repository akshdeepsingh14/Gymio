import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { formatNumber } from "@/lib/format";

const tick = { fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" };

export function GrowthChart({ data, reduceMotion }) {
  const first = data[0]?.members ?? 0;
  const last = data[data.length - 1]?.members ?? 0;

  return (
    <div
      role="img"
      aria-label={`Line chart of total members, from ${first} to ${last}.`}
      className="h-64 w-full sm:h-72"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
            width={40}
            allowDecimals={false}
                        domain={[(min) => Math.max(0, min - 2), (max) => max + 2]}
          />
          <Tooltip
            cursor={{ stroke: "var(--foreground)", strokeDasharray: "3 3" }}
            content={<ChartTooltip format={(value) => `${formatNumber(value)} members`} />}
          />
          <Area
            type="monotone"
            dataKey="members"
            stroke="var(--foreground)"
            strokeWidth={2}
            fill="var(--foreground)"
            fillOpacity={0.08}
            dot={false}
            activeDot={{ r: 4, fill: "var(--foreground)", stroke: "var(--background)", strokeWidth: 2 }}
            isAnimationActive={!reduceMotion}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}