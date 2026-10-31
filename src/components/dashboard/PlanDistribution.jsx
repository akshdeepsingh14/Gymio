import { formatNumber } from "@/lib/format";

export function PlanDistribution({ data }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ul className="space-y-5">
      {data.map((item) => {
        const percent = total ? Math.round((item.count / total) * 100) : 0;
        return (
          <li key={item.id}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-semibold">{item.label}</span>
              <span className="shrink-0 font-mono text-sm">{formatNumber(item.count)}</span>
            </div>
            <div className="mt-2 h-2 bg-muted" aria-hidden="true">
              <div
                className="h-full bg-foreground transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="label-mono mt-1.5 text-muted-foreground">{percent}% of members</p>
          </li>
        );
      })}
    </ul>
  );
}