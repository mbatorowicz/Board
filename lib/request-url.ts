import type { NextRequest } from "next/server";
import {
  resolveRequestHost,
  resolveRequestProtocol,
} from "@/lib/trusted-proxy";

export function appUrl(request: NextRequest, pathname: string): URL {
  const url = new URL(pathname, request.url);
  const host = resolveRequestHost(request);

  if (host) {
    url.host = host;
  }

  const proto = resolveRequestProtocol(request);
  if (proto) {
    url.protocol = `${proto}:`;
  }

  return url;
}
