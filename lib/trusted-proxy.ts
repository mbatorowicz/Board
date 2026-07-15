import type { NextRequest } from "next/server";

function firstHeaderValue(value: string | null): string | null {
  if (!value) {
    return null;
  }
  return value.split(",")[0]?.trim() ?? null;
}

export function isTrustProxyEnabled(): boolean {
  return process.env.TRUST_PROXY === "true";
}

export function clientIpFromRequest(request: NextRequest): string {
  if (isTrustProxyEnabled()) {
    const forwarded = firstHeaderValue(request.headers.get("x-forwarded-for"));
    if (forwarded) {
      return forwarded.slice(0, 45);
    }
    const realIp = firstHeaderValue(request.headers.get("x-real-ip"));
    if (realIp) {
      return realIp.slice(0, 45);
    }
  }

  const direct = request.headers.get("x-real-ip") ?? request.headers.get("cf-connecting-ip");
  if (direct && !isTrustProxyEnabled()) {
    return direct.slice(0, 45);
  }

  return "unknown";
}

export function clientIpFromHeaders(headers: Headers): string {
  if (isTrustProxyEnabled()) {
    const forwarded = firstHeaderValue(headers.get("x-forwarded-for"));
    if (forwarded) {
      return forwarded.slice(0, 45);
    }
    const realIp = firstHeaderValue(headers.get("x-real-ip"));
    if (realIp) {
      return realIp.slice(0, 45);
    }
  }
  return "unknown";
}

function allowedHosts(): Set<string> | null {
  const raw =
    process.env.ALLOWED_HOSTS ??
    (process.env.BOARD_PUBLIC_URL
      ? (() => {
          try {
            return new URL(process.env.BOARD_PUBLIC_URL!).host;
          } catch {
            return "";
          }
        })()
      : "");

  const hosts = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return hosts.length > 0 ? new Set(hosts) : null;
}

export function resolveRequestHost(request: NextRequest): string | null {
  const host =
    (isTrustProxyEnabled()
      ? firstHeaderValue(request.headers.get("x-forwarded-host"))
      : null) ?? firstHeaderValue(request.headers.get("host"));

  if (!host) {
    return null;
  }

  const normalized = host.toLowerCase();
  const allowed = allowedHosts();
  if (allowed && !allowed.has(normalized)) {
    return firstHeaderValue(request.headers.get("host"));
  }

  return host;
}

export function resolveRequestProtocol(request: NextRequest): string | null {
  if (!isTrustProxyEnabled()) {
    return null;
  }
  return firstHeaderValue(request.headers.get("x-forwarded-proto"));
}
