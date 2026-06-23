"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ACK_COOKIE, addAcknowledgment } from "@/lib/acknowledgments";
import { getClientIpFromHeaders } from "@/lib/security/client-ip";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { RATE_LIMITS } from "@/lib/security/limits";
import { validateAcknowledgmentName } from "@/lib/security/validate";

export async function acknowledgeAction(formData: FormData): Promise<void> {
  const headerList = await headers();
  const ip = getClientIpFromHeaders(headerList);

  if (
    !checkRateLimit(
      rateLimitKey("acknowledge", ip),
      RATE_LIMITS.acknowledge.max,
      RATE_LIMITS.acknowledge.windowMs,
    )
  ) {
    return;
  }

  const name = validateAcknowledgmentName(String(formData.get("name") ?? ""));
  if (!name) {
    return;
  }

  const createdAt = new Date().toISOString();

  await addAcknowledgment({ name, ip: ip ?? undefined });

  const cookieStore = await cookies();
  cookieStore.set(ACK_COOKIE, JSON.stringify({ name, at: createdAt }), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });

  revalidatePath("/");
  revalidatePath("/admin");
}
