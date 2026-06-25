import type { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/user-session";

function firstHeaderValue(value: string | null): string | null {
  if (!value) {
    return null;
  }
  return value.split(",")[0]?.trim() ?? null;
}

export async function getRequestClientMeta(request: NextRequest): Promise<{
  host: string;
  userId?: string;
  userName?: string;
}> {
  const host =
    firstHeaderValue(request.headers.get("x-forwarded-host")) ??
    firstHeaderValue(request.headers.get("host")) ??
    "—";
  const user = await getUserFromRequest(request);
  return {
    host,
    ...(user ? { userId: user.userId, userName: user.userName } : {}),
  };
}

export function isLoggedPagePath(pathname: string): boolean {
  return pathname === "/" || pathname === "/admin";
}
