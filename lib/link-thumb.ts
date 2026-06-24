import { LIMITS } from "@/lib/security/limits";
import { isSafeThumbTargetResolved } from "@/lib/security/thumb-target";
import type { ThumbSource } from "@/lib/link-thumb-cache";

const FETCH_TIMEOUT_MS = 5_000;
const MAX_REDIRECTS = 3;
const USER_AGENT = "urzad-homepage/1.0";

const ALLOWED_IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

type FetchedImage = { buffer: Buffer; mime: string };

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

async function extractMetaImageUrls(
  html: string,
  pageUrl: string,
): Promise<string[]> {
  const candidates: string[] = [];

  const patterns = [
    /<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/gi,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const resolved = await resolveMetaUrl(pageUrl, match[1] ?? "");
      if (resolved) {
        candidates.push(resolved);
      }
    }
  }

  return candidates;
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

export function buildPlaceholderSvg(label: string): Buffer {
  const initial = labelInitial(label);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e3a5f"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  <rect width="400" height="240" fill="url(#g)"/>
  <text x="200" y="138" text-anchor="middle" font-family="system-ui,sans-serif" font-size="96" font-weight="700" fill="rgba(255,255,255,0.9)">${initial.replace(/[<>&"']/g, "")}</text>
</svg>`;
  return Buffer.from(svg, "utf8");
}

async function resolveFromOgImage(pageUrl: string): Promise<FetchedImage | null> {
  const html = await fetchPageHtml(pageUrl);
  if (!html) {
    return null;
  }

  const candidates = await extractMetaImageUrls(html, pageUrl);
  for (const candidate of candidates) {
    const image = await fetchImage(candidate);
    if (image) {
      return image;
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
  const og = await resolveFromOgImage(url);
  if (og) {
    return { ...og, source: "og" };
  }

  const favicon = await resolveFromFavicon(url);
  if (favicon) {
    return { ...favicon, source: "favicon" };
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
