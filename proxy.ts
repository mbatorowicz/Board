import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAllowedIps } from "@/lib/allowlist";
import { copy } from "@/lib/copy";
import {
  isAdminPath,
  nextWithRequestContext,
} from "@/lib/request-context-middleware";
import {
  allowlistEnforcementEnabled,
  getClientIpFromRequest,
} from "@/lib/security/client-ip";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    value = (value << 8) + n;
  }
  return value >>> 0;
}

function matchesRule(ip: string, rule: string): boolean {
  if (!rule.includes("/")) return ip === rule;
  const [range, bitsRaw] = rule.split("/");
  const bits = Number(bitsRaw);
  const ipInt = ipv4ToInt(ip);
  const rangeInt = ipv4ToInt(range!);
  if (ipInt === null || rangeInt === null || !Number.isInteger(bits)) {
    return false;
  }
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

function isLocal(ip: string | null): boolean {
  return ip === "127.0.0.1" || ip === "::1" || ip === null;
}

function forbiddenResponse(): NextResponse {
  const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${copy.access.forbiddenTitle}</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}main{max-width:32rem;padding:2rem;text-align:center}h1{font-size:1.5rem;margin-bottom:.5rem}p{color:#94a3b8;line-height:1.6}</style></head><body><main><h1>${copy.access.forbiddenHeading}</h1><p>${copy.access.forbiddenBody}</p></main></body></html>`;
  return new NextResponse(html, {
    status: 403,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function allowRequest(request: NextRequest): NextResponse {
  return nextWithRequestContext(request, isAdminPath(request.nextUrl.pathname));
}

export async function proxy(request: NextRequest) {
  const allowed = await getAllowedIps();

  if (allowed.length === 0 || !allowlistEnforcementEnabled()) {
    return allowRequest(request);
  }

  const ip = getClientIpFromRequest(request);

  if (process.env.NODE_ENV !== "production" && isLocal(ip)) {
    return allowRequest(request);
  }

  if (ip && allowed.some((rule) => matchesRule(ip, rule))) {
    return allowRequest(request);
  }

  return forbiddenResponse();
}
