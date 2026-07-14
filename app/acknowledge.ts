"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ACK_COOKIE, addAcknowledgment } from "@/lib/acknowledgments";
import { copy } from "@/lib/copy";
import { setFlash } from "@/lib/flash";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { RATE_LIMITS } from "@/lib/security/limits";
import { cookieSecure } from "@/lib/cookie-secure";
import { getDeviceId } from "@/lib/device-id";
import {
  formatDeviceLabel,
  getOrInitDeviceLinks,
} from "@/lib/device-links";

export async function acknowledgeAction(): Promise<void> {
  const deviceId = await getDeviceId();
  if (!deviceId) {
    await setFlash({ kind: "error", message: copy.acknowledge.saveFailed });
    revalidatePath("/");
    return;
  }

  if (
    !checkRateLimit(
      rateLimitKey("acknowledge", deviceId),
      RATE_LIMITS.acknowledge.max,
      RATE_LIMITS.acknowledge.windowMs,
    )
  ) {
    await setFlash({ kind: "error", message: copy.acknowledge.rateLimited });
    revalidatePath("/");
    return;
  }

  const headerStore = await headers();
  const host = headerStore.get("host") ?? undefined;
  await getOrInitDeviceLinks(deviceId, { host });
  const label = formatDeviceLabel(deviceId, host);
  const createdAt = new Date().toISOString();

  const saved = await addAcknowledgment({ name: label, deviceId });
  if (!saved) {
    await setFlash({ kind: "error", message: copy.acknowledge.saveFailed });
    revalidatePath("/");
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(
    ACK_COOKIE,
    JSON.stringify({ deviceId, name: label, at: createdAt }),
    {
      httpOnly: true,
      sameSite: "strict",
      secure: cookieSecure(),
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
    },
  );

  revalidatePath("/");
  revalidatePath("/admin");
}
