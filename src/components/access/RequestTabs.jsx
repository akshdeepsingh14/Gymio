import { REQUEST_TABS } from "@/lib/accessRequests";
import { cn } from "@/lib/utils";

export function RequestTabs({ value, onChange, counts }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div role="group" aria-label="Request status" className="inline-flex rounded-sm border border-foreground p-0.5">
        {REQUEST_TABS.map((tab) => {
          const active = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex h-8 items-center gap-2 rounded-sm px-3 font-mono text-xs font-bold tracking-widest uppercase transition-colors",
                active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              <span className={cn("tabular-nums", active ? "text-background/70" : "text-muted-foreground")}>
                {counts[tab.id] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}