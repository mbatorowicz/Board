import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminPassword } from "@/lib/config";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import { createAdminSessionToken } from "@/lib/security/admin-session";
import { getClientIpFromRequest } from "@/lib/security/client-ip";
import { safeEqualString } from "@/lib/security/password";
import {
  ADMIN_PASSWORD_MAX,
  RATE_LIMITS,
  SESSION_TTL_SECONDS,
} from "@/lib/security/limits";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { CSRF_COOKIE, verifyCsrfToken } from "@/lib/security/csrf";
import { clampText } from "@/lib/security/validate";
import { cookieSecure } from "@/lib/cookie-secure";
import { appUrl } from "@/lib/request-url";

export async function POST(request: NextRequest) {
  const redirectUrl = appUrl(request, "/admin");
  const formData = await request.formData();
  const csrfCookie = (await cookies()).get(CSRF_COOKIE)?.value;

  if (
    !verifyCsrfToken(String(formData.get("csrf") ?? ""), csrfCookie)
  ) {
    redirectUrl.searchParams.set("error", "csrf");
    return NextResponse.redirect(redirectUrl);
  }

  const ip = getClientIpFromRequest(request);

  if (
    !checkRateLimit(
      rateLimitKey("login", ip),
      RATE_LIMITS.login.max,
      RATE_LIMITS.login.windowMs,
    )
  ) {
    redirectUrl.searchParams.set("error", "rate");
    return NextResponse.redirect(redirectUrl);
  }

  const provided = clampText(String(formData.get("password") ?? ""), ADMIN_PASSWORD_MAX);
  const password = getAdminPassword();

  if (!password || !safeEqualString(provided, password)) {
    redirectUrl.searchParams.set("error", "1");
    return NextResponse.redirect(redirectUrl);
  }

  const token = await createAdminSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: cookieSecure(),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return NextResponse.redirect(redirectUrl);
}
