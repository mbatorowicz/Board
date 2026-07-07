import type { QuickLink } from "@/lib/types";

export function linkFaviconUrl(link: Pick<QuickLink, "url" | "label">): string {
  const params = new URLSearchParams({
    url: link.url,
    label: link.label,
  });
  return `/api/link-favicon?${params.toString()}`;
}

export function linkLabelInitial(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "?";
  const first = [...trimmed][0];
  return first ? first.toUpperCase() : "?";
}
