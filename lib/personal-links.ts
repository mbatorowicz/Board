import { copy } from "@/lib/copy";
import { createQuickLink } from "@/lib/quick-link";
import type { QuickLink, QuickLinkInput } from "@/lib/types";
import { LIMITS } from "@/lib/security/limits";
import { validateLinkInput } from "@/lib/security/validate";

export const PERSONAL_LINKS_STORAGE_KEY = "board-personal-links";

export type PersonalLinkError = "emptyLabel" | "invalidUrl" | "limitReached";

function isQuickLink(value: unknown): value is QuickLink {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.label === "string" &&
    typeof item.url === "string" &&
    (item.description === undefined || typeof item.description === "string")
  );
}

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

export function savePersonalLinks(links: QuickLink[]): void {
  localStorage.setItem(
    PERSONAL_LINKS_STORAGE_KEY,
    JSON.stringify(links.slice(0, LIMITS.personalLinksMax)),
  );
}

export function personalLinkErrorMessage(error: PersonalLinkError): string {
  switch (error) {
    case "emptyLabel":
      return copy.personalLinks.emptyLabel;
    case "invalidUrl":
      return copy.personalLinks.invalidUrl;
    case "limitReached":
      return copy.personalLinks.limitReached(LIMITS.personalLinksMax);
  }
}

export function addPersonalLink(
  links: QuickLink[],
  input: QuickLinkInput,
): { links: QuickLink[] } | { error: PersonalLinkError } {
  if (links.length >= LIMITS.personalLinksMax) {
    return { error: "limitReached" };
  }

  const validated = validateLinkInput(input);
  if (!validated) {
    if (!input.label.trim()) {
      return { error: "emptyLabel" };
    }
    return { error: "invalidUrl" };
  }

  return { links: [...links, createQuickLink(validated)] };
}

export function removePersonalLink(
  links: QuickLink[],
  id: string,
): QuickLink[] {
  return links.filter((link) => link.id !== id);
}
