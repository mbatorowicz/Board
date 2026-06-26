"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { copy } from "@/lib/copy";
import { clientIpFromHeaders } from "@/lib/client-ip";
import { setFlash } from "@/lib/flash";
import { getSettings } from "@/lib/settings";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { RATE_LIMITS } from "@/lib/security/limits";
import { verifyUserCredentials, validateUserName } from "@/lib/users";
import {
  clearUserSessionCookie,
  createUserSessionToken,
  revokeUserSessionToken,
  setUserSessionCookie,
  USER_SESSION_COOKIE,
} from "@/lib/user-session";
import { cookies } from "next/headers";

export async function loginUserAction(formData: FormData): Promise<void> {
  const headerList = await headers();
  const ip = clientIpFromHeaders(headerList);
  const settings = await getSettings();

  const userKey =
    settings.userLoginMode === "select"
      ? String(formData.get("userId") ?? "").trim()
      : (validateUserName(String(formData.get("name") ?? ""))?.toLocaleLowerCase(
          "pl",
        ) ?? "");

  if (
    !checkRateLimit(
      rateLimitKey("userLogin", ip, userKey || "-"),
      RATE_LIMITS.userLogin.max,
      RATE_LIMITS.userLogin.windowMs,
    )
  ) {
    await setFlash({ kind: "error", message: copy.userSession.rateLimited });
    revalidatePath("/");
    return;
  }

  const pin = String(formData.get("pin") ?? "");
  let user = null;

  if (settings.userLoginMode === "select") {
    const userId = String(formData.get("userId") ?? "").trim();
    user = await verifyUserCredentials({ userId, pin });
  } else {
    const name = String(formData.get("name") ?? "");
    user = await verifyUserCredentials({ name, pin });
  }

  if (!user) {
    await setFlash({ kind: "error", message: copy.userSession.loginFailed });
    revalidatePath("/");
    return;
  }

  const host =
    headerList.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    headerList.get("host") ??
    "—";

  const token = await createUserSessionToken(user.id, { host });
  await setUserSessionCookie(token);

  revalidatePath("/");
}

export async function logoutUserAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_SESSION_COOKIE)?.value;
  await revokeUserSessionToken(token);
  await clearUserSessionCookie();
  revalidatePath("/");
}
