import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const glyph =
  "absolute inset-0 m-auto size-3.5 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none";

/**
 * Switch-style theme toggle.
 * - The track shows both options (sun left, moon right).
 * - The thumb slides to the active side and carries the current icon.
 * - Exposed to assistive tech as a real switch ("Dark theme": on/off).
 */
export function ThemeToggle({ className }) {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const nextLabel = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark theme"
      title={nextLabel}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-8 w-[3.75rem] shrink-0 items-center rounded-full border border-border bg-secondary p-0.5",
        "transition-colors duration-300 hover:bg-accent motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {/* Track hints: the two available themes */}
      <Sun
        aria-hidden="true"
        className="absolute left-2 size-3.5 text-muted-foreground"
      />
      <Moon
        aria-hidden="true"
        className="absolute right-2 size-3.5 text-muted-foreground"
      />

      {/* Thumb */}
      <span
        aria-hidden="true"
        className={cn(
          "relative z-10 size-6 rounded-full bg-background text-foreground shadow-sm ring-1 ring-border",
          "translate-x-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.3,0.5,1)]",
          "dark:translate-x-[1.875rem] motion-reduce:transition-none",
        )}
      >
        <Sun
          className={cn(
            glyph,
            "rotate-0 scale-100 opacity-100 dark:-rotate-90 dark:scale-0 dark:opacity-0",
          )}
        />
        <Moon
          className={cn(
            glyph,
            "rotate-90 scale-0 opacity-0 dark:rotate-0 dark:scale-100 dark:opacity-100",
          )}
        />
      </span>
    </button>
  );
}