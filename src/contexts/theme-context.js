import { createContext } from "react";

/**
 * @typedef {"light" | "dark" | "system"} Theme
 * @typedef {Object} ThemeContextValue
 * @property {Theme} theme - the user's stored preference
 * @property {"light" | "dark"} resolvedTheme - what is actually applied
 * @property {(theme: Theme) => void} setTheme - applies and saves the choice on this device
 * @property {(theme: Theme | null) => void} setFallbackTheme - applies a default without saving it.
 *   Ignored once this device has a saved choice. null goes back to the app default.
 */

/** @type {import("react").Context<ThemeContextValue | null>} */
export const ThemeContext = createContext(null);