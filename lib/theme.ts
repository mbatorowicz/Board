export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
export const DEFAULT_THEME: Theme = "dark";

export function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

export function readStoredTheme(): Theme {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(stored)) {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

const themeListeners = new Set<() => void>();

// Mechanizm dla useSyncExternalStore: nasłuch zmian motywu (inne karty przez
// zdarzenie `storage`, bieżąca karta przez ręczne powiadomienie w setTheme).
export function subscribeTheme(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  themeListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    themeListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function getThemeSnapshot(): Theme {
  return readStoredTheme();
}

export function getServerThemeSnapshot(): Theme {
  return DEFAULT_THEME;
}

export function setTheme(theme: Theme): void {
  applyTheme(theme);
  persistTheme(theme);
  for (const listener of themeListeners) {
    listener();
  }
}

export function themeInitScript(): string {
  return `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;
}
