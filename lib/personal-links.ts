import type { QuickLink } from "@/lib/types";
import { LIMITS } from "@/lib/security/limits";
import { isQuickLink } from "@/lib/type-guards";

export const PERSONAL_LINKS_STORAGE_KEY = "board-personal-links";

export function parsePersonalLinks(raw: string | null): QuickLink[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isQuickLink).slice(0, LIMITS.personalLinksMax);
  } catch {
    return [];
  }
}

export function loadPersonalLinks(): QuickLink[] {
  if (typeof window === "undefined") return [];
  try {
    return parsePersonalLinks(localStorage.getItem(PERSONAL_LINKS_STORAGE_KEY));
  } catch {
    return [];
  }
}
