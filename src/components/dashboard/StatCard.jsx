import { Link } from "react-router";
import { ArrowDown, ArrowUp, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

function Change({ value }) {
  if (value === null || value === undefined) return null;
  const up = value > 0;
  const down = value < 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono font-bold",
        up && "text-success",
        down && "text-destructive",
      )}
    >
      {up && <ArrowUp className="size-3" aria-hidden="true" />}
      {down && <ArrowDown className="size-3" aria-hidden="true" />}
      {Math.abs(value)}%
      <span className="sr-only">
        {up ? " increase" : down ? " decrease" : " no change"} compared with the previous period
      </span>
    </span>
  );
}

export function StatCard({ label, value, hint, to, change }) {
  const base = "group flex flex-col rounded-sm border border-border bg-card p-4 transition-colors sm:p-5";

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="label-mono text-muted-foreground">{label}</p>
        {to && (
          <ArrowUpRight
            className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden="true"
          />
        )}
      </div>
      <p className="mt-4 font-display text-[clamp(2rem,6vw,3.25rem)] font-extrabold leading-none tracking-tight">
        {value}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <Change value={change} />
        <span>{hint}</span>
      </div>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          base,
          "hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {content}
      </Link>
    );
  }
  return <div className={base}>{content}</div>;
}