export const QUICK_LINKS_COLLAPSED_KEY = "quick-links-collapsed";

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
  } catch {
    /* ignore */
  }
}
