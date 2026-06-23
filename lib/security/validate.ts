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
const IPV4_CIDR = new RegExp(`^${IPV4}\\/(?:[0-9]|[1-2]\\d|3[0-2])$`);
const IPV4_EXACT = new RegExp(`^${IPV4}$`);

export function isValidAllowlistRule(rule: string): boolean {
  return IPV4_EXACT.test(rule) || IPV4_CIDR.test(rule);
}

export function parseAllowlistInput(raw: string): string[] {
  const trimmed = raw.slice(0, LIMITS.allowlistRaw);
  return trimmed
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
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

export function sanitizeCertLink(link: string): string {
  return isSafeHttpUrl(link) ? link : "";
}
