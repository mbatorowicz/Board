import { readThumbCache, writeThumbCache } from "@/lib/link-thumb-cache";
import {
  placeholderThumbnail,
  resolveLinkThumbnail,
} from "@/lib/link-thumb";
import { clampText } from "@/lib/security/validate";
import { isSafeThumbTargetResolved } from "@/lib/security/thumb-target";
import { LIMITS, RATE_LIMITS } from "@/lib/security/limits";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { type NextRequest } from "next/server";

const CACHE_CONTROL =
  "public, max-age=86400, stale-while-revalidate=604800";

function thumbResponse(
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
    const fallback = placeholderThumbnail(label);
    return thumbResponse(fallback.buffer, fallback.mime);
  }

  if (
    !checkRateLimit(
      rateLimitKey("link-thumb"),
      RATE_LIMITS.linkThumb.max,
      RATE_LIMITS.linkThumb.windowMs,
    )
  ) {
    const fallback = placeholderThumbnail(label);
    return thumbResponse(fallback.buffer, fallback.mime);
  }

  if (!url || !(await isSafeThumbTargetResolved(url))) {
    return new Response("Nieprawidłowy adres URL.", { status: 400 });
  }

  const cached = await readThumbCache(url);
  if (cached) {
    return thumbResponse(cached.buffer, cached.entry.mime, cached.entry.fetchedAt);
  }

  try {
    const resolved = await resolveLinkThumbnail(url, label);
    const entry = await writeThumbCache(
      url,
      resolved.buffer,
      resolved.mime,
      resolved.source,
    );
    return thumbResponse(resolved.buffer, resolved.mime, entry.fetchedAt);
  } catch {
    const fallback = placeholderThumbnail(label);
    try {
      const entry = await writeThumbCache(
        url,
        fallback.buffer,
        fallback.mime,
        fallback.source,
      );
      return thumbResponse(fallback.buffer, fallback.mime, entry.fetchedAt);
    } catch {
      return thumbResponse(fallback.buffer, fallback.mime);
    }
  }
}
