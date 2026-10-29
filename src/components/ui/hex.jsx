import { cn } from "@/lib/utils";

const HEX = "[clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]";

/**
 * Hexagon, the shape of the dumbbell plates in the hero and logo.
 * Solid by default. Pass `outline` for a hollow one.
 * Colours follow the section tone, so it flips on black and white sections.
 */
export function Hex({ outline = false, className, children, ...props }) {
  if (outline) {
    return (
      <span
        className={cn(
          "relative grid shrink-0 place-items-center bg-foreground",
          HEX,
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "absolute inset-[1.5px] grid place-items-center bg-background text-foreground",
            HEX
          )}
        >
          {children}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center bg-foreground text-background",
        HEX,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}