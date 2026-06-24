import type { QuickLink } from "@/lib/types";

export function linkThumbUrl(link: Pick<QuickLink, "url" | "label">): string {
  const params = new URLSearchParams({
    url: link.url,
    label: link.label,
  });
  return `/api/link-thumb?${params.toString()}`;
}
