import { cn } from "@/lib/utils";

/** A row of toggle buttons where exactly one is selected. items: [{ id, label, count? }] */
export function SegmentedControl({ label, value, onChange, items }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div role="group" aria-label={label} className="inline-flex rounded-sm border border-foreground p-0.5">
        {items.map((item) => {
          const active = item.id === value;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(item.id)}
              className={cn(
                "flex h-8 items-center gap-2 rounded-sm px-3 font-mono text-xs font-bold tracking-widest uppercase transition-colors",
                active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              {item.count !== undefined && (
                <span className={cn("tabular-nums", active ? "text-background/70" : "text-muted-foreground")}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}