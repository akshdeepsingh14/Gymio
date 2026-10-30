import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * A labelled on/off row. A real switch for assistive tech, and the description is read out with it.
 * `disabled` greys the row out when another setting makes it pointless.
 */
export function SwitchRow({ label, description, checked, onChange, disabled = false }) {
  const id = useId();

  return (
    <div className={cn("flex items-start justify-between gap-4", disabled && "opacity-50")}>
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-sm font-semibold">
          {label}
        </p>
        <p id={`${id}-description`} className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-description`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed",
          checked ? "border-foreground bg-foreground" : "border-border bg-secondary",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-4 rounded-full transition-transform motion-reduce:transition-none",
            checked ? "translate-x-5 bg-background" : "translate-x-0 bg-muted-foreground",
          )}
        />
      </button>
    </div>
  );
}