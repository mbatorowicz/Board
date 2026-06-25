import { copy } from "@/lib/copy";

export type AdminTab =
  | "board"
  | "settings"
  | "users"
  | "stats";

export type BoardSection = "announcements" | "links" | "cert";

export const ADMIN_TABS: {
  id: AdminTab;
  label: string;
  fullAdminOnly: boolean;
}[] = [
  { id: "board", label: copy.admin.boardTab, fullAdminOnly: false },
  { id: "settings", label: copy.admin.settingsTab, fullAdminOnly: true },
  { id: "users", label: "Użytkownicy", fullAdminOnly: true },
  { id: "stats", label: "Statystyki", fullAdminOnly: true },
];

export const BOARD_SECTIONS: { id: BoardSection; label: string }[] = [
  { id: "announcements", label: copy.admin.boardAnnouncementsSubtab },
  { id: "links", label: copy.admin.boardLinksSubtab },
  { id: "cert", label: copy.admin.boardCertSubtab },
];

const LEGACY_TAB_MAP: Record<string, AdminTab> = {
  homepage: "board",
  announcements: "board",
  security: "settings",
};

export function resolveAdminTab(
  raw: string | undefined,
  fullAdmin: boolean,
  editorOnly: boolean,
): AdminTab {
  const allowed: AdminTab[] = fullAdmin
    ? ADMIN_TABS.map((tab) => tab.id)
    : editorOnly
      ? ["board"]
      : ["board"];

  const normalized = raw ? (LEGACY_TAB_MAP[raw] ?? raw) : undefined;

  if (normalized && allowed.includes(normalized as AdminTab)) {
    return normalized as AdminTab;
  }

  return "board";
}

export function resolveBoardSection(
  raw: string | undefined,
  options?: { editorOnly?: boolean; legacyAnnouncementsTab?: boolean },
): BoardSection {
  if (options?.editorOnly || options?.legacyAnnouncementsTab) {
    return "announcements";
  }
  if (raw === "cert") return "cert";
  if (raw === "links") return "links";
  if (raw === "announcements") return "announcements";
  return "announcements";
}

export function boardSectionsForRole(editorOnly: boolean): typeof BOARD_SECTIONS {
  if (editorOnly) {
    return BOARD_SECTIONS.filter((section) => section.id === "announcements");
  }
  return BOARD_SECTIONS;
}

export function adminTabHref(tab: AdminTab): string {
  return `/admin?tab=${tab}`;
}

export function boardTabHref(section: BoardSection): string {
  return `/admin?tab=board&section=${section}`;
}
