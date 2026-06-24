import net from "node:net";

function isPrivateOrLocalIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

function isPrivateOrLocalIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80:")) return true; // link-local /10
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local /7
  return false;
}

export function isPrivateOrLocalIp(ip: string): boolean {
  const normalized = ip.trim().toLowerCase();

  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice(7);
    if (net.isIPv4(mapped)) {
      return isPrivateOrLocalIpv4(mapped);
    }
  }

  if (net.isIPv4(normalized)) {
    return isPrivateOrLocalIpv4(normalized);
  }

  if (net.isIPv6(normalized)) {
    return isPrivateOrLocalIpv6(normalized);
  }

  return true;
}
