import type { QuickLink } from "@/lib/types";

export function normalizeLinkUrl(url: string): string {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${parsed.origin.toLowerCase()}${path}${parsed.search}${parsed.hash}`;
  } catch {
    return trimmed.toLowerCase();
  }
}

export function globalLinkUrls(links: QuickLink[]): Set<string> {
  return new Set(links.map((link) => normalizeLinkUrl(link.url)));
}

/** Zostawia tylko linki dodane na tym komputerze (nie kopie globalnych). */
export function filterDeviceOnlyLinks(
  deviceLinks: QuickLink[],
  globalLinks: QuickLink[],
): QuickLink[] {
  const globals = globalLinkUrls(globalLinks);
  return deviceLinks.filter(
    (link) => !globals.has(normalizeLinkUrl(link.url)),
  );
}

export function isDuplicateOfGlobalLink(
  url: string,
  globalLinks: QuickLink[],
): boolean {
  return globalLinkUrls(globalLinks).has(normalizeLinkUrl(url));
}
