import dns from "node:dns/promises";
import net from "node:net";
import { isPrivateOrLocalIp } from "@/lib/security/ip-range";
import { isSafeThumbTarget } from "@/lib/security/validate";

export async function validateThumbTargetDns(hostname: string): Promise<boolean> {
  const host = hostname.toLowerCase();

  if (net.isIP(host)) {
    return !isPrivateOrLocalIp(host);
  }

  try {
    const results = await dns.lookup(host, { all: true, verbatim: true });
    if (results.length === 0) {
      return false;
    }
    for (const { address } of results) {
      if (isPrivateOrLocalIp(address)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function isSafeThumbTargetResolved(rawUrl: string): Promise<boolean> {
  if (!isSafeThumbTarget(rawUrl)) {
    return false;
  }
  try {
    const { hostname } = new URL(rawUrl);
    return validateThumbTargetDns(hostname);
  } catch {
    return false;
  }
}
