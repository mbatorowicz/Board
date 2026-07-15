import type { QuickLink, UserRole, AnnouncementAttachment } from "@/lib/types";

export function isUserRole(value: unknown): value is UserRole {
  return value === "reader" || value === "editor" || value === "admin";
}

export function isAnnouncementAttachment(
  value: unknown,
): value is AnnouncementAttachment {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.filename === "string" &&
    typeof item.mime === "string" &&
    typeof item.size === "number"
  );
}

export function isQuickLink(value: unknown): value is QuickLink {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.label === "string" &&
    typeof item.url === "string" &&
    (item.description === undefined || typeof item.description === "string")
  );
}
