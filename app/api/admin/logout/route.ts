import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import { revokeAdminSessionToken } from "@/lib/security/admin-session";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  await revokeAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  cookieStore.delete(ADMIN_SESSION_COOKIE);

  return NextResponse.redirect(new URL("/admin", request.url));
}
