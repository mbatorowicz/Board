import type { SiteSettings } from "@/lib/types";
import { readJsonFile, writeJsonFile } from "@/lib/data-file";
import { readCachedJson } from "@/lib/json-cache";
import { OFFICE_NAME } from "@/lib/config";
import { copy } from "@/lib/copy";
import { clampText } from "@/lib/security/validate";
import { LIMITS } from "@/lib/security/limits";

const FILE = "settings.json";

export function defaultHeaderTitle(): string {
  return OFFICE_NAME;
}

export function defaultHeaderSubtitle(): string {
  return copy.site.subtitle;
}

function defaultSettings(): SiteSettings {
  return {
    hiddenCertCategories: [],
    headerTitle: defaultHeaderTitle(),
    headerSubtitle: defaultHeaderSubtitle(),
    userLoginMode: "select",
  };
}

function normalize(raw: unknown): SiteSettings {
  const value = (raw ?? {}) as Partial<SiteSettings>;
  const hidden = Array.isArray(value.hiddenCertCategories)
    ? value.hiddenCertCategories
        .filter((item): item is string => typeof item === "string")
        .map((item) => clampText(item, LIMITS.certCategory))
        .filter(Boolean)
    : [];

  const headerTitle =
    typeof value.headerTitle === "string" && value.headerTitle.trim()
      ? clampText(value.headerTitle, LIMITS.headerTitle)
      : defaultHeaderTitle();

  const headerSubtitle =
    typeof value.headerSubtitle === "string"
      ? clampText(value.headerSubtitle, LIMITS.headerSubtitle)
      : defaultHeaderSubtitle();

  const userLoginMode =
    value.userLoginMode === "type" ? "type" : "select";

  return {
    hiddenCertCategories: hidden,
    headerTitle,
    headerSubtitle,
    userLoginMode,
  };
}

export async function getSettings(): Promise<SiteSettings> {
  return readCachedJson(FILE, async () => {
    const raw = await readJsonFile<unknown>(FILE);
    if (raw === null) {
      return defaultSettings();
    }
    return normalize(raw);
  });
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  await writeJsonFile(FILE, normalize(settings));
}
