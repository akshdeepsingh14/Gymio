import { cn } from "@/lib/utils";

/**
 * Tape-measure rule. The same ticks as the ruler under the hero dumbbell.
 * Drawn with two CSS gradients, so it costs one element, not sixty.
 * It takes the current text colour, so it works on black and white sections.
 */
export function Ruler({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-3 w-full border-b border-current text-foreground/60", className)}
      style={{
        backgroundImage:
          "linear-gradient(90deg, currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
        backgroundSize: "8px 6px, 40px 12px",
        backgroundPosition: "0 100%, 0 100%",
        backgroundRepeat: "repeat-x",
      }}
    />
  );
}