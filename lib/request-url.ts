import type { NextRequest } from "next/server";

function firstHeaderValue(value: string | null): string | null {
  if (!value) {
    return null;
  }
  return value.split(",")[0]?.trim() ?? null;
}

/** Publiczny URL aplikacji — Host / X-Forwarded-* zamiast wewnętrznego request.url (127.0.0.1 w Dockerze). */
export function appUrl(request: NextRequest, pathname: string): URL {
  const url = new URL(pathname, request.url);
  const host =
    firstHeaderValue(request.headers.get("x-forwarded-host")) ??
    firstHeaderValue(request.headers.get("host"));

  if (host) {
    url.host = host;
  }

  const proto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  if (proto) {
    url.protocol = `${proto}:`;
  }

  return url;
}
