"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  applyTheme,
  DEFAULT_THEME,
  persistTheme,
  readStoredTheme,
  subscribeTheme,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function commitTheme(next: Theme): void {
  applyTheme(next);
  persistTheme(next);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    readStoredTheme,
    () => DEFAULT_THEME,
  );

  const setTheme = useCallback((next: Theme) => {
    commitTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = readStoredTheme() === "dark" ? "light" : "dark";
    commitTheme(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
