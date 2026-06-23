import type { SiteSettings } from "@/lib/types";
import { readJsonFile, writeJsonFile } from "@/lib/data-file";

const FILE = "settings.json";

const DEFAULT_SETTINGS: SiteSettings = {
  hiddenCertCategories: [],
};

function normalize(raw: unknown): SiteSettings {
  const value = (raw ?? {}) as Partial<SiteSettings>;
  const hidden = Array.isArray(value.hiddenCertCategories)
    ? value.hiddenCertCategories.filter(
        (item): item is string => typeof item === "string",
      )
    : [];
  return { hiddenCertCategories: hidden };
}

export async function getSettings(): Promise<SiteSettings> {
  const raw = await readJsonFile<unknown>(FILE);
  if (raw === null) {
    return { ...DEFAULT_SETTINGS };
  }
  return normalize(raw);
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  await writeJsonFile(FILE, normalize(settings));
}
