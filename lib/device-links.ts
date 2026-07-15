import type { QuickLink, QuickLinkInput } from "@/lib/types";
import { readJsonFile, writeJsonFile } from "@/lib/data-file";
import { createQuickLink } from "@/lib/quick-link";
import { getQuickLinks } from "@/lib/links";
import {
  filterDeviceOnlyLinks,
  isDuplicateOfGlobalLink,
  normalizeLinkUrl,
} from "@/lib/link-match";
import { isQuickLink } from "@/lib/type-guards";
import { validateLinkInput } from "@/lib/security/validate";
import { LIMITS, DEVICE_LAST_SEEN_THROTTLE_MS } from "@/lib/security/limits";
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

async function syncDeviceLinks(
  deviceId: string,
  stored: QuickLink[],
  globalLinks: QuickLink[],
): Promise<QuickLink[]> {
  const deviceOnly = normalizeLinks(
    filterDeviceOnlyLinks(stored, globalLinks),
  );

  if (
    deviceOnly.length !== stored.length ||
    deviceOnly.some((link, index) => link.id !== stored[index]?.id)
  ) {
    const store = await readStore();
    const existing = store.devices[deviceId];
    if (existing) {
      store.devices[deviceId] = {
        ...existing,
        links: deviceOnly,
      };
      await writeStore(store);
    }
  }

  return deviceOnly;
}

export async function getOrInitDeviceLinks(
  deviceId: string,
  meta?: { host?: string },
): Promise<QuickLink[]> {
  const globalLinks = await getQuickLinks();
  const store = await readStore();
  const existing = store.devices[deviceId];

  if (existing) {
    const links = await syncDeviceLinks(
      deviceId,
      normalizeLinks(existing.links),
      globalLinks,
    );
    const now = Date.now();
    const lastSeen = Date.parse(existing.lastSeenAt);
    const hostChanged =
      meta?.host && meta.host.slice(0, 253) !== existing.lastHost;
    const shouldTouch =
      process.env.NODE_ENV !== "development" &&
      (hostChanged ||
        !Number.isFinite(lastSeen) ||
        now - lastSeen >= DEVICE_LAST_SEEN_THROTTLE_MS);

    if (shouldTouch) {
      store.devices[deviceId] = {
        ...store.devices[deviceId]!,
        links,
        lastSeenAt: new Date().toISOString(),
        ...(meta?.host ? { lastHost: meta.host.slice(0, 253) } : {}),
      };
      await writeStore(store);
    }
    return links;
  }

  const now = new Date().toISOString();
  store.devices[deviceId] = {
    deviceId,
    links: [],
    createdAt: now,
    lastSeenAt: now,
    ...(meta?.host ? { lastHost: meta.host.slice(0, 253) } : {}),
  };
  await writeStore(store);
  return [];
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

  const globalLinks = await getQuickLinks();
  const deviceOnly = normalizeLinks(
    filterDeviceOnlyLinks(links, globalLinks),
  );

  store.devices[deviceId] = {
    ...existing,
    links: deviceOnly,
    lastSeenAt: new Date().toISOString(),
  };
  await writeStore(store);
  return true;
}

export async function addDeviceLink(
  deviceId: string,
  input: QuickLinkInput,
): Promise<
  { link: QuickLink } | { error: "limit" | "invalid" | "missing" | "duplicate" }
> {
  const validated = validateLinkInput(input);
  if (!validated) {
    return { error: "invalid" };
  }

  const globalLinks = await getQuickLinks();
  if (isDuplicateOfGlobalLink(validated.url, globalLinks)) {
    return { error: "duplicate" };
  }

  const links = await getOrInitDeviceLinks(deviceId);
  if (links.length >= LIMITS.personalLinksMax) {
    return { error: "limit" };
  }

  const normalized = normalizeLinkUrl(validated.url);
  if (links.some((link) => normalizeLinkUrl(link.url) === normalized)) {
    return { error: "duplicate" };
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
