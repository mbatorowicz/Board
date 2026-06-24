import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export type ThumbSource = "og" | "favicon" | "placeholder";

export type ThumbCacheEntry = {
  url: string;
  mime: string;
  source: ThumbSource;
  fetchedAt: number;
  ext: string;
};

const DATA_DIR = path.join(process.cwd(), ".data", "link-thumbs");
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

export function normalizeThumbUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = "";
  return parsed.toString();
}

export function thumbCacheKey(url: string): string {
  return crypto
    .createHash("sha256")
    .update(normalizeThumbUrl(url))
    .digest("hex");
}

function metaPath(hash: string): string {
  return path.join(DATA_DIR, `${hash}.json`);
}

function dataPath(hash: string, ext: string): string {
  return path.join(DATA_DIR, `${hash}.${ext}`);
}

export function mimeToExt(mime: string): string {
  return EXT_BY_MIME[mime] ?? "bin";
}

export async function readThumbCache(
  url: string,
): Promise<{ buffer: Buffer; entry: ThumbCacheEntry } | null> {
  const hash = thumbCacheKey(url);
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

export async function writeThumbCache(
  url: string,
  buffer: Buffer,
  mime: string,
  source: ThumbSource,
): Promise<ThumbCacheEntry> {
  const hash = thumbCacheKey(url);
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
