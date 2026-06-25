import { NextResponse, type NextRequest } from "next/server";
import { FLASH_COOKIE, FLASH_HEADER } from "@/lib/flash";
import { CSRF_COOKIE, CSRF_HEADER, isValidCsrfToken } from "@/lib/security/csrf";

function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function csrfCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: 60 * 60 * 8,
  };
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function nextWithRequestContext(
  request: NextRequest,
  adminCsrf: boolean,
): NextResponse {
  const requestHeaders = new Headers(request.headers);

  const flashRaw = request.cookies.get(FLASH_COOKIE)?.value;
  if (flashRaw) {
    requestHeaders.set(FLASH_HEADER, flashRaw);
  }

  let csrfToken: string | undefined;
  if (adminCsrf) {
    const existing = request.cookies.get(CSRF_COOKIE)?.value;
    csrfToken = isValidCsrfToken(existing) ? existing : generateCsrfToken();
    requestHeaders.set(CSRF_HEADER, csrfToken);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (flashRaw) {
    response.cookies.delete(FLASH_COOKIE);
  }

  if (adminCsrf && csrfToken) {
    const existing = request.cookies.get(CSRF_COOKIE)?.value;
    if (csrfToken !== existing) {
      response.cookies.set(CSRF_COOKIE, csrfToken, csrfCookieOptions());
    }
  }

  return response;
}
