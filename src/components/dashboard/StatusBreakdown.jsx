import { Link } from "react-router";

import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

// The coloured bar is a quick read. The list below it carries the same numbers in words,
// so nothing depends on telling colours apart.
const STYLE = {
  active: "bg-success",
  expiring: "bg-warning",
  grace: "bg-destructive/60",
  expired: "bg-destructive",
  suspended: "bg-muted-foreground",
  inactive: "bg-border",
};

export function StatusBreakdown({ data }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-sm bg-muted" role="img" aria-label={`${total} members by status`}>
        {data
          .filter((item) => item.count > 0)
          .map((item) => (
            <span
              key={item.id}
              className={cn("h-full", STYLE[item.id])}
              style={{ width: `${(item.count / total) * 100}%` }}
            />
          ))}
      </div>

      <ul className="mt-5 grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {data.map((item) => (
          <li key={item.id}>
            <Link
              to="/app/members"
              className="flex min-h-10 items-center justify-between gap-3 border-b border-border text-sm outline-none transition-colors hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-center gap-2.5">
                <span className={cn("size-2.5 shrink-0 rounded-full", STYLE[item.id])} aria-hidden="true" />
                {item.label}
              </span>
              <span className="font-mono font-semibold tabular-nums">{formatNumber(item.count)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}