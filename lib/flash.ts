import { cookies } from "next/headers";
import { cookieSecure } from "@/lib/cookie-secure";

export type FlashKind = "error" | "notice" | "warning";

export type FlashMessage = {
  kind: FlashKind;
  message: string;
};

const FLASH_COOKIE = "site_flash";

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

export async function consumeFlash(): Promise<FlashMessage | null> {
  const store = await cookies();
  const raw = store.get(FLASH_COOKIE)?.value;
  if (!raw) {
    return null;
  }

  store.delete(FLASH_COOKIE);

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
