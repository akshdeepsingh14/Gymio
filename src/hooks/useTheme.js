import { useContext } from "react";
import { ThemeContext } from "@/contexts/theme-context";

/**
 * Access the current theme and its setter.
 * @returns {import("@/contexts/theme-context").ThemeContextValue}
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return context;
}