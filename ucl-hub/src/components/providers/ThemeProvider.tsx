"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";
export type AccentTheme = "red" | "blue" | "green" | "yellow" | "violet";

const STORAGE_KEY = "ucl-hub-theme";
const ACCENT_STORAGE_KEY = "ucl-hub-accent";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
  accent: AccentTheme;
  setAccent: (accent: AccentTheme) => void;
} | null>(null);

function readStoredTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function readStoredAccent(): AccentTheme {
  if (typeof document === "undefined") return "red";
  const accent = document.documentElement.dataset.accent;
  return accent === "blue" || accent === "green" || accent === "yellow" || accent === "violet" ? accent : "red";
}

/** Applies the "dark" class on <html> (set early by the inline script in the root layout) and lets any component toggle it. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const [accent, setAccent] = useState<AccentTheme>(readStoredAccent);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
    window.localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  }, [accent]);

  const value = useMemo(
    () => ({
      theme,
      toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      accent,
      setAccent,
    }),
    [accent, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>.");
  return ctx;
}

/** Source for the inline `<script>` that sets the theme class before hydration, avoiding a flash of the wrong theme. */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("${STORAGE_KEY}");
    var accent = localStorage.getItem("${ACCENT_STORAGE_KEY}");
    var dark = stored ? stored === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.dataset.accent = ["red", "blue", "green", "yellow", "violet"].indexOf(accent) >= 0 ? accent : "red";
  } catch (e) {}
})();
`;
