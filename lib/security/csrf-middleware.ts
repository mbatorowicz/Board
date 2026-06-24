import { NextResponse, type NextRequest } from "next/server";
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

export function nextWithAdminCsrf(request: NextRequest): NextResponse {
  const existing = request.cookies.get(CSRF_COOKIE)?.value;
  const token = isValidCsrfToken(existing) ? existing : generateCsrfToken();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CSRF_HEADER, token);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (token !== existing) {
    response.cookies.set(CSRF_COOKIE, token, csrfCookieOptions());
  }

  return response;
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}
