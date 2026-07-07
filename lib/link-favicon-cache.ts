import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  mimeToExt,
  normalizeThumbUrl,
  type ThumbCacheEntry,
  type ThumbSource,
} from "@/lib/link-thumb-cache";

const DATA_DIR = path.join(process.cwd(), ".data", "link-favicons");
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function metaPath(hash: string): string {
  return path.join(DATA_DIR, `${hash}.json`);
}

function dataPath(hash: string, ext: string): string {
  return path.join(DATA_DIR, `${hash}.${ext}`);
}

export function faviconCacheKey(url: string): string {
  return crypto
    .createHash("sha256")
    .update(`favicon:${normalizeThumbUrl(url)}`)
    .digest("hex");
}

export async function readFaviconCache(
  url: string,
): Promise<{ buffer: Buffer; entry: ThumbCacheEntry } | null> {
  const hash = faviconCacheKey(url);
  let raw: string;
  try {
    raw = await fs.readFile(metaPath(hash), "utf8");
  } catch {
    return null;
  }

  let entry: ThumbCacheEntry;
  try {
    entry = JSON.parse(raw) as ThumbCacheEntry;
  } catch {
    return null;
  }

  if (Date.now() - entry.fetchedAt > TTL_MS) {
    return null;
  }

  try {
    const buffer = await fs.readFile(dataPath(hash, entry.ext));
    return { buffer, entry };
  } catch {
    return null;
  }
}

export async function writeFaviconCache(
  url: string,
  buffer: Buffer,
  mime: string,
  source: ThumbSource,
): Promise<ThumbCacheEntry> {
  const hash = faviconCacheKey(url);
  const ext = mimeToExt(mime);
  const entry: ThumbCacheEntry = {
    url: normalizeThumbUrl(url),
    mime,
    source,
    fetchedAt: Date.now(),
    ext,
  };

  await fs.mkdir(DATA_DIR, { recursive: true });

  const existing = await fs.readdir(DATA_DIR).catch(() => [] as string[]);
  for (const file of existing) {
    if (file.startsWith(`${hash}.`) && file !== `${hash}.${ext}` && file !== `${hash}.json`) {
      await fs.unlink(path.join(DATA_DIR, file)).catch(() => undefined);
    }
  }

  await fs.writeFile(dataPath(hash, ext), buffer);
  await fs.writeFile(metaPath(hash), JSON.stringify(entry));

  return entry;
}
