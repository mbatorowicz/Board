import type { NextRequest } from "next/server";

function trustProxy(): boolean {
  return process.env.TRUST_PROXY === "true";
}

function pickTrustedIp(headerList: Headers): string | null {
  const realIp = headerList.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const forwarded = headerList.get("x-forwarded-for");
  if (!forwarded) {
    return null;
  }

  const hops = forwarded
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return hops.length > 0 ? hops[hops.length - 1]! : null;
}

export function getClientIpFromRequest(request: NextRequest): string | null {
  if (!trustProxy()) {
    return null;
  }
  return pickTrustedIp(request.headers);
}

export function getClientIpFromHeaders(headerList: Headers): string | null {
  if (!trustProxy()) {
    return null;
  }
  return pickTrustedIp(headerList);
}

export function allowlistEnforcementEnabled(): boolean {
  return trustProxy();
}
