import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { ThemeContext } from "./theme-context";

// Must match the key used in index.html
const STORAGE_KEY = "gymio-theme";
const VALID_THEMES = ["light", "dark", "system"];
const THEME_COLORS = { dark: "#030303", light: "#ffffff" };

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

function getStoredTheme(fallback) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return VALID_THEMES.includes(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

/** Writes the theme to <html>. Safe to call repeatedly. */
function applyTheme(resolved) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[resolved]);
}

/**
 * Runs a theme change without lag.
 * - View Transitions: the browser crossfades two screenshots on the GPU.
 * - Fallback: transitions are switched off for two frames, so the swap is
 *   instant and nothing is ever half-animated.
 */
function runThemeChange(update) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (typeof document.startViewTransition === "function" && !reduceMotion) {
    document.startViewTransition(update);
    return;
  }

  const root = document.documentElement;
  root.classList.add("theme-switching");
  update();
  requestAnimationFrame(() =>
    requestAnimationFrame(() => root.classList.remove("theme-switching"))
  );
}

export function ThemeProvider({ children, defaultTheme = "dark" }) {
  const [theme, setThemeState] = useState(() => getStoredTheme(defaultTheme));
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  // Follow OS theme changes
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) =>
      setSystemTheme(event.matches ? "dark" : "light");
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  // Keep multiple tabs in sync
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;
      setThemeState(
        VALID_THEMES.includes(event.newValue) ? event.newValue : defaultTheme
      );
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [defaultTheme]);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  // Applies the theme before paint (first load, OS change, other tabs)
  useLayoutEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((nextTheme) => {
    if (!VALID_THEMES.includes(nextTheme)) return;

    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Storage may be blocked (private mode). The theme still applies for this session.
    }

    const nextResolved = nextTheme === "system" ? getSystemTheme() : nextTheme;
    const currentResolved = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";

    // Same look as before (for example dark to system-dark): nothing to animate
    if (nextResolved === currentResolved) {
      setThemeState(nextTheme);
      return;
    }

    // flushSync makes React finish the update inside the transition,
    // so the new screenshot already contains the new theme.
    runThemeChange(() => flushSync(() => setThemeState(nextTheme)));
  }, []);

  // A default that is applied but never saved. The member portal uses it for the gym's
  // default theme. Once this device has saved a choice, that choice always wins.
  const setFallbackTheme = useCallback(
    (nextTheme) => {
      try {
        if (localStorage.getItem(STORAGE_KEY)) return;
      } catch {
        // Storage blocked: nothing can be saved, so the fallback applies.
      }
      setThemeState(VALID_THEMES.includes(nextTheme) ? nextTheme : defaultTheme);
    },
    [defaultTheme]
  );

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, setFallbackTheme }),
    [theme, resolvedTheme, setTheme, setFallbackTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}