import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Outlined button that fills solid on hover.
 * Only transform and colour change, so it stays smooth on any device.
 */
export function InteractiveHoverButton({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        "group relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-sm border border-foreground bg-background px-6 py-2 text-center font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 origin-left scale-x-0 bg-foreground transition-transform duration-300 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
      />
      <span className="relative z-10 flex items-center gap-2.5 transition-colors duration-300 group-hover:text-background group-focus-visible:text-background motion-reduce:transition-none">
        {children}
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
        />
      </span>
    </button>
  );
}