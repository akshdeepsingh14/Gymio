import { cn } from "@/lib/utils";

/** A boxed message. tone: "warning" | "danger" | "neutral". */
export function PortalNotice({ icon: Icon, title, tone = "neutral", children }) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-4 border-2 p-4 sm:p-5",
        tone === "warning" && "border-warning",
        tone === "danger" && "border-destructive",
        tone === "neutral" && "border-border",
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "mt-0.5 size-5 shrink-0",
            tone === "warning" && "text-warning",
            tone === "danger" && "text-destructive",
          )}
          aria-hidden="true"
        />
      )}
      <div className="min-w-0 space-y-1.5 text-sm">
        <p className="font-semibold">{title}</p>
        <div className="leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}