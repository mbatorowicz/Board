export const QUICK_LINKS_COLLAPSED_KEY = "quick-links-collapsed";

const collapsedListeners = new Set<() => void>();

function notifyCollapsedListeners(): void {
  collapsedListeners.forEach((listener) => listener());
}

export function subscribeQuickLinksCollapsed(callback: () => void): () => void {
  collapsedListeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === QUICK_LINKS_COLLAPSED_KEY) callback();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    collapsedListeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function readQuickLinksCollapsed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return localStorage.getItem(QUICK_LINKS_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function persistQuickLinksCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(QUICK_LINKS_COLLAPSED_KEY, collapsed ? "1" : "0");
    notifyCollapsedListeners();
  } catch {
    /* ignore */
  }
}
