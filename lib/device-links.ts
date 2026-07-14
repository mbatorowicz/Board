import type { QuickLink, QuickLinkInput } from "@/lib/types";
import { readJsonFile, writeJsonFile } from "@/lib/data-file";
import { createQuickLink } from "@/lib/quick-link";
import { getQuickLinks } from "@/lib/links";
import { isQuickLink } from "@/lib/type-guards";
import { validateLinkInput } from "@/lib/security/validate";
import { LIMITS } from "@/lib/security/limits";
import { reorderLinksByIds } from "@/lib/reorder-links";

const FILE = "device-links.json";

interface DeviceLinksEntry {
  deviceId: string;
  links: QuickLink[];
  createdAt: string;
  lastSeenAt: string;
  lastHost?: string;
}

interface DeviceLinksStore {
  devices: Record<string, DeviceLinksEntry>;
}

async function readStore(): Promise<DeviceLinksStore> {
  const data = await readJsonFile<DeviceLinksStore>(FILE);
  if (data && typeof data === "object" && data.devices) {
    return data;
  }
  return { devices: {} };
}

async function writeStore(store: DeviceLinksStore): Promise<void> {
  await writeJsonFile(FILE, store);
}

function normalizeLinks(links: unknown): QuickLink[] {
  if (!Array.isArray(links)) {
    return [];
  }
  return links.filter(isQuickLink).slice(0, LIMITS.personalLinksMax);
}

async function seedLinks(): Promise<QuickLink[]> {
  const global = await getQuickLinks();
  return global.map((link) => ({ ...link, id: crypto.randomUUID() }));
}

export async function getOrInitDeviceLinks(
  deviceId: string,
  meta?: { host?: string },
): Promise<QuickLink[]> {
  const store = await readStore();
  const existing = store.devices[deviceId];

  if (existing) {
    const links = normalizeLinks(existing.links);
    if (process.env.NODE_ENV !== "development") {
      store.devices[deviceId] = {
        ...existing,
        links,
        lastSeenAt: new Date().toISOString(),
        ...(meta?.host ? { lastHost: meta.host.slice(0, 253) } : {}),
      };
      await writeStore(store);
    }
    return links;
  }

  const links = await seedLinks();
  const now = new Date().toISOString();
  store.devices[deviceId] = {
    deviceId,
    links,
    createdAt: now,
    lastSeenAt: now,
    ...(meta?.host ? { lastHost: meta.host.slice(0, 253) } : {}),
  };
  await writeStore(store);
  return links;
}

export async function saveDeviceLinks(
  deviceId: string,
  links: QuickLink[],
): Promise<boolean> {
  const store = await readStore();
  const existing = store.devices[deviceId];
  if (!existing) {
    return false;
  }

  store.devices[deviceId] = {
    ...existing,
    links: normalizeLinks(links),
    lastSeenAt: new Date().toISOString(),
  };
  await writeStore(store);
  return true;
}

export async function addDeviceLink(
  deviceId: string,
  input: QuickLinkInput,
): Promise<{ link: QuickLink } | { error: "limit" | "invalid" | "missing" }> {
  const validated = validateLinkInput(input);
  if (!validated) {
    return { error: "invalid" };
  }

  const links = await getOrInitDeviceLinks(deviceId);
  if (links.length >= LIMITS.personalLinksMax) {
    return { error: "limit" };
  }

  const link = createQuickLink(validated);
  const ok = await saveDeviceLinks(deviceId, [...links, link]);
  return ok ? { link } : { error: "missing" };
}

export async function removeDeviceLink(
  deviceId: string,
  linkId: string,
): Promise<boolean> {
  const links = await getOrInitDeviceLinks(deviceId);
  const next = links.filter((link) => link.id !== linkId);
  if (next.length === links.length) {
    return false;
  }
  return saveDeviceLinks(deviceId, next);
}

export async function reorderDeviceLinks(
  deviceId: string,
  orderedIds: string[],
): Promise<boolean> {
  const links = await getOrInitDeviceLinks(deviceId);
  const reordered = reorderLinksByIds(links, orderedIds);
  if (!reordered) {
    return false;
  }

  return saveDeviceLinks(deviceId, reordered);
}

export function formatDeviceLabel(deviceId: string, host?: string): string {
  const trimmedHost = host?.trim();
  if (trimmedHost && trimmedHost !== "—") {
    return trimmedHost;
  }
  return `Komputer ${deviceId.slice(0, 8)}`;
}
