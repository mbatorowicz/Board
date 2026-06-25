import { LIMITS } from "@/lib/security/limits";
import { isSafeThumbTargetResolved } from "@/lib/security/thumb-target";
import type { ThumbSource } from "@/lib/link-thumb-cache";

const FETCH_TIMEOUT_MS = 5_000;
const MAX_REDIRECTS = 3;
const USER_AGENT = "urzad-homepage/1.0";

const COVER_MIN_SHORT_SIDE = 128;
const COVER_MIN_LONG_SIDE = 200;

const EMBEDDABLE_ICON_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

const ALLOWED_IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

type FetchedImage = { buffer: Buffer; mime: string };
type ImageDimensions = { width: number; height: number };

function detectImageMime(buffer: Buffer): string | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  const head = buffer.toString("utf8", 0, Math.min(buffer.length, 256)).trim();
  if (head.startsWith("<svg") || head.includes("<svg")) {
    return "image/svg+xml";
  }

  if (buffer.length >= 4 && buffer[0] === 0 && buffer[1] === 0 && buffer[2] === 1 && buffer[3] === 0) {
    return "image/x-icon";
  }

  return null;
}

function readImageDimensions(buffer: Buffer): ImageDimensions | null {
  if (
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        return null;
      }
      const marker = buffer[offset + 1];
      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2;
        continue;
      }
      const segmentLength = buffer.readUInt16BE(offset + 2);
      if (segmentLength < 2) {
        return null;
      }
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + segmentLength;
    }
    return null;
  }

  if (
    buffer.length >= 30 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    const chunk = buffer.toString("ascii", 12, 16);
    if (chunk === "VP8X" && buffer.length >= 30) {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
    if (chunk === "VP8 " && buffer.length >= 30) {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
    if (chunk === "VP8L" && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }
  }

  return null;
}

function isLargeEnoughForCover(image: FetchedImage): boolean {
  const dims = readImageDimensions(image.buffer);
  if (!dims) {
    return true;
  }
  const shortSide = Math.min(dims.width, dims.height);
  const longSide = Math.max(dims.width, dims.height);
  return shortSide >= COVER_MIN_SHORT_SIDE && longSide >= COVER_MIN_LONG_SIDE;
}

function normalizeContentType(raw: string | null): string | null {
  if (!raw) return null;
  const mime = raw.split(";")[0]?.trim().toLowerCase();
  if (!mime || !ALLOWED_IMAGE_MIMES.has(mime)) {
    return null;
  }
  return mime;
}

async function readLimitedBody(
  response: Response,
  maxBytes: number,
): Promise<Buffer | null> {
  const reader = response.body?.getReader();
  if (!reader) {
    const buf = Buffer.from(await response.arrayBuffer());
    return buf.byteLength <= maxBytes ? buf : null;
  }

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

async function fetchWithRedirects(
  url: string,
  maxBytes: number,
  accept: string,
): Promise<Response | null> {
  let current = url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!(await isSafeThumbTargetResolved(current))) {
      return null;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(current, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "user-agent": USER_AGENT,
          accept,
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          return null;
        }
        current = new URL(location, current).toString();
        continue;
      }

      return response;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  return null;
}

async function fetchImage(url: string): Promise<FetchedImage | null> {
  const response = await fetchWithRedirects(
    url,
    LIMITS.linkThumbMaxBytes,
    "image/*,*/*;q=0.8",
  );
  if (!response || !response.ok) {
    return null;
  }

  const buffer = await readLimitedBody(response, LIMITS.linkThumbMaxBytes);
  if (!buffer || buffer.byteLength === 0) {
    return null;
  }

  const headerMime = normalizeContentType(response.headers.get("content-type"));
  const detected = detectImageMime(buffer);
  const mime = headerMime ?? detected;
  if (!mime) {
    return null;
  }

  return { buffer, mime };
}

async function resolveMetaUrl(
  baseUrl: string,
  raw: string,
): Promise<string | null> {
  try {
    const resolved = new URL(raw.trim(), baseUrl).toString();
    return (await isSafeThumbTargetResolved(resolved)) ? resolved : null;
  } catch {
    return null;
  }
}

function parseLinkTag(tag: string): { rel: string; href: string; sizes: string } | null {
  const relMatch = tag.match(/\brel=["']([^"']+)["']/i);
  const hrefMatch = tag.match(/\bhref=["']([^"']+)["']/i);
  if (!relMatch || !hrefMatch) {
    return null;
  }
  const sizesMatch = tag.match(/\bsizes=["']([^"']+)["']/i);
  return {
    rel: relMatch[1].toLowerCase(),
    href: hrefMatch[1],
    sizes: sizesMatch?.[1]?.toLowerCase() ?? "",
  };
}

function parseSizesValue(sizes: string): number {
  if (!sizes || sizes === "any") {
    return 0;
  }
  const match = sizes.match(/(\d+)\s*x\s*(\d+)/i);
  if (!match) {
    return 0;
  }
  return Math.max(Number(match[1]), Number(match[2]));
}

async function extractMetaImageUrls(
  html: string,
  pageUrl: string,
): Promise<string[]> {
  const candidates: string[] = [];
  const seen = new Set<string>();

  const patterns = [
    /<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/gi,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const resolved = await resolveMetaUrl(pageUrl, match[1] ?? "");
      if (resolved && !seen.has(resolved)) {
        seen.add(resolved);
        candidates.push(resolved);
      }
    }
  }

  return candidates;
}

async function extractAppleTouchIconUrls(
  html: string,
  pageUrl: string,
): Promise<string[]> {
  const ranked: { url: string; size: number }[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const parsed = parseLinkTag(match[0]);
    if (!parsed || !parsed.rel.includes("apple-touch-icon")) {
      continue;
    }
    const resolved = await resolveMetaUrl(pageUrl, parsed.href);
    if (!resolved || seen.has(resolved)) {
      continue;
    }
    seen.add(resolved);
    ranked.push({
      url: resolved,
      size: parseSizesValue(parsed.sizes) || 180,
    });
  }

  ranked.sort((a, b) => b.size - a.size);
  return ranked.map((item) => item.url);
}

async function extractSizedIconUrls(
  html: string,
  pageUrl: string,
): Promise<string[]> {
  const ranked: { url: string; size: number }[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const parsed = parseLinkTag(match[0]);
    if (!parsed) {
      continue;
    }
    const isIcon =
      parsed.rel === "icon" ||
      parsed.rel === "shortcut icon" ||
      parsed.rel.endsWith(" icon");
    if (!isIcon || parsed.rel.includes("apple-touch-icon")) {
      continue;
    }
    const resolved = await resolveMetaUrl(pageUrl, parsed.href);
    if (!resolved || seen.has(resolved)) {
      continue;
    }
    seen.add(resolved);
    ranked.push({
      url: resolved,
      size: parseSizesValue(parsed.sizes),
    });
  }

  ranked.sort((a, b) => b.size - a.size);
  return ranked.map((item) => item.url);
}

async function fetchPageHtml(url: string): Promise<string | null> {
  const response = await fetchWithRedirects(
    url,
    LIMITS.linkThumbHtmlMaxBytes,
    "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  );
  if (!response || !response.ok) {
    return null;
  }

  const buffer = await readLimitedBody(response, LIMITS.linkThumbHtmlMaxBytes);
  if (!buffer) {
    return null;
  }

  return buffer.toString("utf8");
}

function labelInitial(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "?";
  const first = [...trimmed][0];
  return first ? first.toUpperCase() : "?";
}

function escapeSvgText(value: string): string {
  return value.replace(/[<>&"']/g, "");
}

function iconDataUri(buffer: Buffer, mime: string): string | null {
  if (!EMBEDDABLE_ICON_MIMES.has(mime)) {
    return null;
  }
  const base64 = buffer.toString("base64");
  return `data:${mime};base64,${base64}`;
}

export function buildPlaceholderSvg(
  label: string,
  iconBuffer?: Buffer,
  iconMime?: string,
): Buffer {
  const iconHref =
    iconBuffer && iconMime ? iconDataUri(iconBuffer, iconMime) : null;

  const iconMarkup = iconHref
    ? `<image x="168" y="36" width="64" height="64" href="${iconHref}" preserveAspectRatio="xMidYMid meet"/>`
    : `<text x="200" y="138" text-anchor="middle" font-family="system-ui,sans-serif" font-size="96" font-weight="700" fill="rgba(255,255,255,0.9)">${escapeSvgText(labelInitial(label))}</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e3a5f"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  <rect width="400" height="240" fill="url(#g)"/>
  ${iconMarkup}
</svg>`;
  return Buffer.from(svg, "utf8");
}

async function resolveCoverFromCandidates(
  candidates: string[],
  source: Extract<ThumbSource, "og" | "meta-icon">,
): Promise<{ buffer: Buffer; mime: string; source: ThumbSource } | null> {
  for (const candidate of candidates) {
    const image = await fetchImage(candidate);
    if (image && isLargeEnoughForCover(image)) {
      return { ...image, source };
    }
  }
  return null;
}

async function resolveFromFavicon(pageUrl: string): Promise<FetchedImage | null> {
  let origin: string;
  try {
    origin = new URL(pageUrl).origin;
  } catch {
    return null;
  }

  const faviconUrl = `${origin}/favicon.ico`;
  const direct = await fetchImage(faviconUrl);
  if (direct) {
    return direct;
  }

  const googleUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(pageUrl).hostname)}&sz=128`;
  return fetchImage(googleUrl);
}

export async function resolveLinkThumbnail(
  url: string,
  label: string,
): Promise<{ buffer: Buffer; mime: string; source: ThumbSource }> {
  const html = await fetchPageHtml(url);

  if (html) {
    const ogCandidates = await extractMetaImageUrls(html, url);
    const ogCover = await resolveCoverFromCandidates(ogCandidates, "og");
    if (ogCover) {
      return ogCover;
    }

    const metaIconCandidates = [
      ...(await extractAppleTouchIconUrls(html, url)),
      ...(await extractSizedIconUrls(html, url)),
    ];
    const uniqueMetaIcons = [...new Set(metaIconCandidates)];
    const metaCover = await resolveCoverFromCandidates(uniqueMetaIcons, "meta-icon");
    if (metaCover) {
      return metaCover;
    }
  }

  const favicon = await resolveFromFavicon(url);
  if (favicon && EMBEDDABLE_ICON_MIMES.has(favicon.mime)) {
    return {
      buffer: buildPlaceholderSvg(label, favicon.buffer, favicon.mime),
      mime: "image/svg+xml",
      source: "icon",
    };
  }

  return {
    buffer: buildPlaceholderSvg(label),
    mime: "image/svg+xml",
    source: "placeholder",
  };
}

export function placeholderThumbnail(label: string): {
  buffer: Buffer;
  mime: string;
  source: ThumbSource;
} {
  return {
    buffer: buildPlaceholderSvg(label),
    mime: "image/svg+xml",
    source: "placeholder",
  };
}
