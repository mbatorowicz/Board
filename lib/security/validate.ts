import { LIMITS } from "@/lib/security/limits";

export function clampText(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:") {
      return true;
    }
    return (
      process.env.NODE_ENV !== "production" && parsed.protocol === "http:"
    );
  } catch {
    return false;
  }
}

const IPV4_PART = "(?:25[0-5]|2[0-4]\\d|1?\\d{1,2})";
const IPV4 = `${IPV4_PART}(?:\\.${IPV4_PART}){3}`;
const IPV4_EXACT = new RegExp(`^${IPV4}$`);

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "::1",
]);

function isPrivateIpv4(hostname: string): boolean {
  if (!IPV4_EXACT.test(hostname)) {
    return false;
  }
  const parts = hostname.split(".").map(Number);
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  if (parts[0] === 127) return true;
  return false;
}

function isBlockedLiteralIpv6(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (!lower.includes(":")) {
    return false;
  }
  if (lower === "::1" || lower === "::") {
    return true;
  }
  if (lower.startsWith("fe80:")) {
    return true;
  }
  if (lower.startsWith("fc") || lower.startsWith("fd")) {
    return true;
  }
  if (lower.startsWith("::ffff:")) {
    return isPrivateIpv4(lower.slice(7));
  }
  return false;
}

export function isSafeThumbTarget(url: string): boolean {
  if (!isSafeHttpUrl(url)) {
    return false;
  }
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(hostname)) {
      return false;
    }
    if (hostname.endsWith(".local") || hostname.endsWith(".internal")) {
      return false;
    }
    if (isPrivateIpv4(hostname)) {
      return false;
    }
    if (isBlockedLiteralIpv6(hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function validateAnnouncementInput(input: {
  title: string;
  body: string;
}): { title: string; body: string } | null {
  const title = clampText(input.title, LIMITS.title);
  const body = clampText(input.body, LIMITS.body);
  if (!isNonEmpty(title) || !isNonEmpty(body)) {
    return null;
  }
  return { title, body };
}

export function validateLinkInput(input: {
  label: string;
  url: string;
  description?: string;
}): { label: string; url: string; description?: string } | null {
  const label = clampText(input.label, LIMITS.linkLabel);
  const url = clampText(input.url, LIMITS.url);
  const description = input.description
    ? clampText(input.description, LIMITS.linkDescription)
    : undefined;

  if (!isNonEmpty(label) || !isSafeHttpUrl(url)) {
    return null;
  }

  return description ? { label, url, description } : { label, url };
}

export function validateAcknowledgmentName(name: string): string | null {
  const value = clampText(name, LIMITS.name);
  return isNonEmpty(value) ? value : null;
}

export function validateHeaderInput(input: {
  headerTitle: string;
  headerSubtitle: string;
}): { headerTitle: string; headerSubtitle: string } | null {
  const headerTitle = clampText(input.headerTitle, LIMITS.headerTitle);
  const headerSubtitle = clampText(input.headerSubtitle, LIMITS.headerSubtitle);
  if (!isNonEmpty(headerTitle)) {
    return null;
  }
  return { headerTitle, headerSubtitle };
}

export function sanitizeCertLink(link: string): string {
  return isSafeHttpUrl(link) ? link : "";
}
