import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import { revokeAdminSessionToken } from "@/lib/security/admin-session";
import { verifyCsrfFromRequest } from "@/lib/security/csrf";

export async function POST(request: NextRequest) {
  const redirectUrl = new URL("/admin", request.url);

  if (!(await verifyCsrfFromRequest(request))) {
    redirectUrl.searchParams.set("error", "csrf");
    return NextResponse.redirect(redirectUrl);
  }

  const cookieStore = await cookies();
  await revokeAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  cookieStore.delete(ADMIN_SESSION_COOKIE);

  return NextResponse.redirect(redirectUrl);
}
