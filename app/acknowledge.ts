"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ACK_COOKIE, addAcknowledgment } from "@/lib/acknowledgments";
import { copy } from "@/lib/copy";
import { setFlash } from "@/lib/flash";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { RATE_LIMITS } from "@/lib/security/limits";
import { cookieSecure } from "@/lib/cookie-secure";
import { getCurrentUser } from "@/lib/user-session";

export async function acknowledgeAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    await setFlash({ kind: "error", message: copy.acknowledge.loginRequired });
    revalidatePath("/");
    return;
  }

  if (
    !checkRateLimit(
      rateLimitKey("acknowledge"),
      RATE_LIMITS.acknowledge.max,
      RATE_LIMITS.acknowledge.windowMs,
    )
  ) {
    await setFlash({ kind: "error", message: copy.acknowledge.rateLimited });
    revalidatePath("/");
    return;
  }

  const name = user.name;
  const createdAt = new Date().toISOString();
  const saved = await addAcknowledgment({ name });
  if (!saved) {
    await setFlash({ kind: "error", message: copy.acknowledge.saveFailed });
    revalidatePath("/");
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(ACK_COOKIE, JSON.stringify({ name, at: createdAt }), {
    httpOnly: true,
    sameSite: "strict",
    secure: cookieSecure(),
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });

  revalidatePath("/");
  revalidatePath("/admin");
}
