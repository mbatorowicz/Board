import type { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/user-session";
import { resolveRequestHost } from "@/lib/trusted-proxy";

export async function getRequestClientMeta(request: NextRequest): Promise<{
  host: string;
  userId?: string;
  userName?: string;
}> {
  const host = resolveRequestHost(request) ?? "—";
  const user = await getUserFromRequest(request);
  return {
    host,
    ...(user ? { userId: user.userId, userName: user.userName } : {}),
  };
}

export function isLoggedPagePath(pathname: string): boolean {
  return pathname === "/" || pathname === "/admin";
}
