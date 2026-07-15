import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { isPrivateOrLocalIp } from "@/lib/security/ip-range";
import { isSafeThumbTarget } from "@/lib/security/validate";
import { validateThumbTargetDns } from "@/lib/security/thumb-target";

export type SafeFetchResponse = {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
};

async function resolvePinnedAddresses(hostname: string): Promise<string[]> {
  const host = hostname.toLowerCase();

  if (net.isIP(host)) {
    return isPrivateOrLocalIp(host) ? [] : [host];
  }

  if (!(await validateThumbTargetDns(host))) {
    return [];
  }

  const results = await dns.lookup(host, { all: true, verbatim: true });
  return results
    .map(({ address }) => address)
    .filter((address) => !isPrivateOrLocalIp(address));
}

function requestPinned(
  pinnedIp: string,
  url: URL,
  options: { accept: string; timeoutMs: number; maxBytes: number },
): Promise<SafeFetchResponse | null> {
  const isHttps = url.protocol === "https:";
  const transport = isHttps ? https : http;

  return new Promise((resolve) => {
    const maxBytes = options.maxBytes;
    const req = transport.request(
      {
        host: pinnedIp,
        port: url.port || (isHttps ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: {
          Host: url.hostname,
          Accept: options.accept,
          "User-Agent": "urzad-homepage/1.0",
        },
        servername: isHttps ? url.hostname : undefined,
        timeout: options.timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let total = 0;

        res.on("data", (chunk: Buffer) => {
          total += chunk.length;
          if (total <= maxBytes) {
            chunks.push(chunk);
          } else {
            res.destroy();
          }
        });

        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      },
    );

    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.on("error", () => resolve(null));
    req.end();
  });
}

export async function safeFetchUrl(
  rawUrl: string,
  options: {
    accept: string;
    timeoutMs: number;
    maxBytes: number;
    maxRedirects?: number;
  },
): Promise<SafeFetchResponse | null> {
  if (!isSafeThumbTarget(rawUrl)) {
    return null;
  }

  let current = rawUrl;
  const maxRedirects = options.maxRedirects ?? 3;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    let parsed: URL;
    try {
      parsed = new URL(current);
    } catch {
      return null;
    }

    if (!(await validateThumbTargetDns(parsed.hostname))) {
      return null;
    }

    const addresses = await resolvePinnedAddresses(parsed.hostname);
    if (addresses.length === 0) {
      return null;
    }

    let response: SafeFetchResponse | null = null;
    for (const address of addresses) {
      response = await requestPinned(address, parsed, {
        accept: options.accept,
        timeoutMs: options.timeoutMs,
        maxBytes: options.maxBytes,
      });
      if (response) {
        break;
      }
    }

    if (!response) {
      return null;
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.location;
      const next =
        typeof location === "string"
          ? location
          : Array.isArray(location)
            ? location[0]
            : null;
      if (!next) {
        return null;
      }
      current = new URL(next, current).toString();
      continue;
    }

    if (response.body.byteLength > options.maxBytes) {
      return null;
    }

    return response;
  }

  return null;
}
