import { createContext } from "react";

/**
 * @typedef {"light" | "dark" | "system"} Theme
 * @typedef {Object} ThemeContextValue
 * @property {Theme} theme - the user's stored preference
 * @property {"light" | "dark"} resolvedTheme - what is actually applied
 * @property {(theme: Theme) => void} setTheme
 */

/** @type {import("react").Context<ThemeContextValue | null>} */
export const ThemeContext = createContext(null);