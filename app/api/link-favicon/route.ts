import { readFaviconCache, writeFaviconCache } from "@/lib/link-favicon-cache";
import {
  placeholderFavicon,
  resolveLinkFavicon,
} from "@/lib/link-thumb";
import { clampText } from "@/lib/security/validate";
import { isSafeThumbTargetResolved } from "@/lib/security/thumb-target";
import { LIMITS, RATE_LIMITS } from "@/lib/security/limits";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { type NextRequest } from "next/server";
import { clientIpFromRequest } from "@/lib/trusted-proxy";

const CACHE_CONTROL =
  "public, max-age=86400, stale-while-revalidate=604800";

function faviconResponse(
  buffer: Buffer,
  mime: string,
  fetchedAt?: number,
): Response {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mime,
      "Cache-Control": CACHE_CONTROL,
      ...(fetchedAt
        ? { "Last-Modified": new Date(fetchedAt).toUTCString() }
        : {}),
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url") ?? "";
  const url = clampText(rawUrl, LIMITS.url);
  const label = clampText(searchParams.get("label") ?? "?", LIMITS.linkLabel);

  if (process.env.LINK_THUMBS === "placeholder") {
    const fallback = placeholderFavicon(label);
    return faviconResponse(fallback.buffer, fallback.mime);
  }

  if (
    !checkRateLimit(
      rateLimitKey("link-favicon", clientIpFromRequest(request)),
      RATE_LIMITS.linkThumb.max,
      RATE_LIMITS.linkThumb.windowMs,
    )
  ) {
    const fallback = placeholderFavicon(label);
    return faviconResponse(fallback.buffer, fallback.mime);
  }

  if (!url || !(await isSafeThumbTargetResolved(url))) {
    return new Response("Nieprawidłowy adres URL.", { status: 400 });
  }

  const cached = await readFaviconCache(url);
  if (cached) {
    return faviconResponse(cached.buffer, cached.entry.mime, cached.entry.fetchedAt);
  }

  try {
    const resolved = await resolveLinkFavicon(url, label);
    const entry = await writeFaviconCache(
      url,
      resolved.buffer,
      resolved.mime,
      resolved.source,
    );
    return faviconResponse(resolved.buffer, resolved.mime, entry.fetchedAt);
  } catch {
    const fallback = placeholderFavicon(label);
    try {
      const entry = await writeFaviconCache(
        url,
        fallback.buffer,
        fallback.mime,
        fallback.source,
      );
      return faviconResponse(fallback.buffer, fallback.mime, entry.fetchedAt);
    } catch {
      return faviconResponse(fallback.buffer, fallback.mime);
    }
  }
}
