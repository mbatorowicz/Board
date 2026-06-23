import type { QuickLink } from "@/lib/types";

export function createQuickLink(input: {
  label: string;
  url: string;
  description?: string;
}): QuickLink {
  return {
    id: crypto.randomUUID(),
    label: input.label,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
  };
}
