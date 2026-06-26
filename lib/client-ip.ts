function firstHeaderValue(value: string | null): string | null {
  if (!value) {
    return null;
  }
  return value.split(",")[0]?.trim() ?? null;
}

/** Adres klienta z nagłówków proxy (pierwszy X-Forwarded-For lub X-Real-IP). */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = firstHeaderValue(headers.get("x-forwarded-for"));
  if (forwarded) {
    return forwarded.slice(0, 45);
  }
  const realIp = firstHeaderValue(headers.get("x-real-ip"));
  if (realIp) {
    return realIp.slice(0, 45);
  }
  return "unknown";
}
