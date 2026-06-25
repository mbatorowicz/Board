import { cookies, headers } from "next/headers";
import { cookieSecure } from "@/lib/cookie-secure";

export type FlashKind = "error" | "notice" | "warning";

export type FlashMessage = {
  kind: FlashKind;
  message: string;
};

export const FLASH_COOKIE = "site_flash";
export const FLASH_HEADER = "x-site-flash";

/** Nagłówki HTTP to ByteString — polskie znaki w JSON wymagają kodowania. */
export function encodeFlashHeaderValue(raw: string): string {
  return encodeURIComponent(raw);
}

export function decodeFlashHeaderValue(raw: string): string {
  return decodeURIComponent(raw);
}

export function parseFlashMessage(raw: string | null | undefined): FlashMessage | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as FlashMessage;
    if (
      (parsed.kind === "error" ||
        parsed.kind === "notice" ||
        parsed.kind === "warning") &&
      typeof parsed.message === "string"
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export async function setFlash(message: FlashMessage): Promise<void> {
  const store = await cookies();
  store.set(FLASH_COOKIE, JSON.stringify(message), {
    httpOnly: true,
    sameSite: "strict",
    secure: cookieSecure(),
    path: "/",
    maxAge: 60,
  });
}

export async function readFlash(): Promise<FlashMessage | null> {
  const encoded = (await headers()).get(FLASH_HEADER);
  if (!encoded) {
    return null;
  }
  try {
    return parseFlashMessage(decodeFlashHeaderValue(encoded));
  } catch {
    return null;
  }
}

/** @deprecated Użyj readFlash — odczyt z nagłówka ustawianego w proxy. */
export async function consumeFlash(): Promise<FlashMessage | null> {
  return readFlash();
}
