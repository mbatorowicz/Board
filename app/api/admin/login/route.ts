import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminPassword } from "@/lib/config";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import { createAdminSessionToken } from "@/lib/security/admin-session";
import { safeEqualString } from "@/lib/security/password";
import { SESSION_TTL_SECONDS } from "@/lib/security/limits";
import { cookieSecure } from "@/lib/cookie-secure";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const provided = String(formData.get("password") ?? "");
  const password = getAdminPassword();
  const redirectUrl = new URL("/admin", request.url);

  if (!password || !safeEqualString(provided, password)) {
    redirectUrl.searchParams.set("error", "1");
    return NextResponse.redirect(redirectUrl);
  }

  const token = await createAdminSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return NextResponse.redirect(redirectUrl);
}
