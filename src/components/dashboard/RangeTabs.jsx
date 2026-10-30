import { RANGES } from "@/services/dashboardService";
import { cn } from "@/lib/utils";

export function RangeTabs({ value, onChange }) {
  return (
    <div role="group" aria-label="Date range" className="inline-flex rounded-sm border border-foreground p-0.5">
      {RANGES.map((range) => {
        const active = range.id === value;
        return (
          <button
            key={range.id}
            type="button"
            title={range.title}
            aria-pressed={active}
            onClick={() => onChange(range.id)}
            className={cn(
              "h-8 min-w-12 rounded-sm px-3 font-mono text-xs font-bold tracking-widest transition-colors",
              active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}