import { Hex } from "@/components/ui/hex";
import { cn } from "@/lib/utils";

export function EmptyState({ icon: Icon, title, text, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 border border-dashed border-border px-6 py-10 text-center",
        className,
      )}
    >
      {Icon && (
        <Hex outline className="size-12">
          <Icon className="size-5" aria-hidden="true" />
        </Hex>
      )}
      <p className="font-display text-xl font-extrabold uppercase tracking-wide">{title}</p>
      {text && <p className="max-w-xs text-sm text-muted-foreground">{text}</p>}
      {action}
    </div>
  );
}