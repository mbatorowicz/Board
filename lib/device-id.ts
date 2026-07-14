import { cookies, headers } from "next/headers";
import { cookieSecure } from "@/lib/cookie-secure";

export const DEVICE_ID_COOKIE = "device_id";
export const DEVICE_ID_HEADER = "x-device-id";
export const DEVICE_ID_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 5;

const DEVICE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidDeviceId(value: string | undefined | null): value is string {
  return typeof value === "string" && DEVICE_ID_PATTERN.test(value);
}

export function generateDeviceId(): string {
  return crypto.randomUUID();
}

export function deviceIdCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: cookieSecure(),
    path: "/",
    maxAge: DEVICE_ID_MAX_AGE_SECONDS,
  };
}

export async function getDeviceId(): Promise<string | null> {
  const headerStore = await headers();
  const fromHeader = headerStore.get(DEVICE_ID_HEADER);
  if (isValidDeviceId(fromHeader)) {
    return fromHeader;
  }

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(DEVICE_ID_COOKIE)?.value;
  return isValidDeviceId(fromCookie) ? fromCookie : null;
}
